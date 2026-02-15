import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a helpful learning coach. Answer every question the learner asks about roadmaps, career, learning path, or any doubt. Be clear and helpful. Do not refuse.`;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured. Add GEMINI_API_KEY to .env.local" },
      { status: 503 }
    );
  }

  let messages: { role: string; text: string }[] = [];
  try {
    const body = await request.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (messages.length === 0) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  const last = messages[messages.length - 1];
  if (last?.role !== "user") {
    return NextResponse.json({ error: "Last message must be from user" }, { status: 400 });
  }

  const userText = typeof last.text === "string" ? last.text.trim() : String(last.text || "").trim();
  if (!userText) {
    return NextResponse.json({ error: "Message text is required" }, { status: 400 });
  }

  // Build prompt: system + conversation history + latest user message (minimal format for max compatibility)
  const conversationLines: string[] = [];
  for (const m of messages) {
    const role = m.role === "user" ? "User" : "Assistant";
    const t = typeof m.text === "string" ? m.text : String(m.text);
    if (t.trim()) conversationLines.push(`${role}: ${t}`);
  }
  const fullPrompt = conversationLines.length > 0
    ? conversationLines.join("\n\n") + "\n\nAssistant:"
    : userText;

  // Minimal request: single prompt in contents (no multi-turn roles to avoid API format issues)
  const requestBody = {
    contents: [
      {
        parts: [{ text: fullPrompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  // gemini-2.5-flash works with current API; 1.5-flash is deprecated/removed
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  let res: Response;
  let data: Record<string, unknown> = {};

  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    const raw = await res.text();
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      data = { _raw: raw.slice(0, 500) };
    }
  } catch (networkError) {
    console.error("Gemini fetch failed:", networkError);
    return NextResponse.json(
      { error: "Network error. Check your connection and try again." },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const err = data?.error as { message?: string; status?: string } | undefined;
    const errMsg = err?.message ?? err?.status ?? "Unknown error";
    console.error("Gemini API HTTP error:", res.status, errMsg);
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again in a moment." },
      { status: 502 }
    );
  }

  const candidates = data?.candidates as Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }> | undefined;
  const promptFeedback = data?.promptFeedback as { blockReason?: string } | undefined;

  if (promptFeedback?.blockReason) {
    console.error("Gemini blocked:", promptFeedback.blockReason);
    return NextResponse.json(
      { error: "Your question could not be processed. Try rephrasing it." },
      { status: 400 }
    );
  }

  const first = candidates?.[0];
  let text: string | undefined = first?.content?.parts?.[0]?.text;
  if (typeof text !== "string" && first?.content?.parts?.[0] && typeof (first.content.parts[0] as Record<string, unknown>).text === "string") {
    text = (first.content.parts[0] as Record<string, unknown>).text as string;
  }
  const finishReason = first?.finishReason;

  if (finishReason && finishReason !== "STOP" && finishReason !== "END_TURN") {
    console.error("Gemini finish reason:", finishReason);
    return NextResponse.json(
      { error: "The response was cut off. Try asking in a shorter way." },
      { status: 502 }
    );
  }

  const out = typeof text === "string" ? text.trim() : "";
  if (!out) {
    console.error("Gemini empty response:", JSON.stringify(data).slice(0, 300));
    return NextResponse.json(
      { error: "No reply was generated. Please try asking differently." },
      { status: 502 }
    );
  }

  return NextResponse.json({ text: out });
}
