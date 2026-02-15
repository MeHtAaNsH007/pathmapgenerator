"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = 'https://jtbyrnlbbxnjyipxajmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0YnlybmxiYnhuanlpcHhham10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTExMzMsImV4cCI6MjA4NjU2NzEzM30.xBKQ0Q2t54E93Ra_SEvi9cPp-1WtwvYmQU-ByWTydwQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const SAVED_ROADMAPS_KEY = "progath_saved_roadmaps";

type Phase = {
  phase_number: number;
  title: string;
  key_objective: string;
  estimated_weeks: number;
  resource_link?: string;
  technical_requirement?: string;
  videos?: { title: string; url: string }[];
  articles?: { title: string; url: string }[];
};

type UserContext = {
  level?: string;
  goal?: string;
};

type ChatMessage = {
  role: "ai" | "user";
  text: string;
};

type SavedRoadmap = {
  id: string;
  topic: string;
  userContext: UserContext;
  phases: Phase[];
  savedAt: string;
};

type ViewMode = "roadmap" | "newgen" | "analytics";

type TopicProgress = {
  topic_id: string;
  totalPhases: number;
  completedPhases: number;
  percent: number;
};

type SRType = {
  new (): {
    continuous: boolean;
    interimResults: boolean;
    onresult: (e: { results: Array<{ [index: number]: { transcript: string } }> }) => void;
    onerror: (e: unknown) => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
  };
};

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [phases, setPhases] = useState<Phase[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [fetching, setFetching] = useState(false);
  const [chatStep, setChatStep] = useState<0 | 1 | "done">(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: "What is your current level? (Beginner / Intermediate / Advanced)",
    },
  ]);
  const [userContext, setUserContext] = useState<UserContext>({});
  const [goalInput, setGoalInput] = useState("");
  const [completed, setCompleted] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmap[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("roadmap");
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [quickStartLabel, setQuickStartLabel] = useState<string | null>(null);

  // Gemini chat state
  const [geminiMessages, setGeminiMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: "Hi! I'm your learning coach powered by Progath. Ask me about roadmaps, concepts, or your next steps. How can I help?",
    },
  ]);
  const [geminiInput, setGeminiInput] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [sessionEndsAt, setSessionEndsAt] = useState<number | null>(null);
  const [remainingSecs, setRemainingSecs] = useState<number>(0);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState<{
    topicProgress: TopicProgress[];
    overallPercent: number;
    totalPhasesDone: number;
    totalPhasesPossible: number;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const loadSavedRoadmaps = useCallback(() => {
    try {
      const raw = localStorage.getItem(SAVED_ROADMAPS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedRoadmap[];
        setSavedRoadmaps(Array.isArray(parsed) ? parsed : []);
      } else {
        setSavedRoadmaps([]);
      }
    } catch {
      setSavedRoadmaps([]);
    }
  }, []);

  useEffect(() => {
    loadSavedRoadmaps();
  }, [loadSavedRoadmaps]);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      alert(String((err as Error).message ?? err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let t = "";
    try {
      const saved = localStorage.getItem("progath_topic");
      const qs = localStorage.getItem("progath_quickstart");
      if (qs) setQuickStartLabel(qs);
      if (saved) t = saved;
    } catch {}
    setTopic(t || "Your Topic");
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!topic || chatStep !== "done") return;
      setFetching(true);
      setMessages((prev) => [...prev, { role: "ai", text: "Researching..." }]);
      try {
        const res = await fetch("/api/generate-path", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, userContext }),
        });
        const data = await res.json();
        if (data?.phases) setPhases(data.phases as Phase[]);
        try {
          const u = await supabase.auth.getUser();
          const userId = u?.data?.user?.id;
          if (userId) {
            const { data: prog } = await supabase
              .from("user_progress")
              .select("phase_number,is_completed")
              .eq("user_id", userId)
              .eq("topic_id", topic);
            if (Array.isArray(prog)) {
              const map: Record<number, boolean> = {};
              for (const r of prog) {
                if (typeof r.phase_number === "number") {
                  map[r.phase_number] = !!r.is_completed;
                }
              }
              setCompleted(map);
            }
          }
        } catch {}
      } catch {
        alert("Failed to load plan");
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [topic, chatStep, userContext]);

  const handleSelectLevel = (level: string) => {
    setUserContext((uc) => ({ ...uc, level }));
    setMessages((prev) => [
      ...prev,
      { role: "user", text: level },
      { role: "ai", text: "What is your ultimate goal with this topic?" },
    ]);
    setChatStep(1);
  };

  const handleSubmitGoal = () => {
    const g = goalInput.trim();
    if (!g) return;
    setUserContext((uc) => ({ ...uc, goal: g }));
    setMessages((prev) => [...prev, { role: "user", text: g }]);
    setGoalInput("");
    setChatStep("done");
  };

  const handleDirectOption = () => {
    setUserContext({ level: "Intermediate", goal: "Learn and master the topic" });
    setMessages((prev) => [
      ...prev,
      { role: "user", text: "Intermediate" },
      { role: "user", text: "Learn and master the topic" },
      { role: "ai", text: "Researching..." },
    ]);
    setGoalInput("");
    setChatStep("done");
  };

  const handleBack = () => {
    setPhases([]);
    setExpanded({});
    setCompleted({});
    setMessages([
      {
        role: "ai",
        text: "What is your current level? (Beginner / Intermediate / Advanced)",
      },
    ]);
    setUserContext({});
    setGoalInput("");
    setChatStep(0);
  };

  const handleSaveRoadmap = () => {
    if (phases.length === 0) return;
    setSavingRoadmap(true);
    try {
      const entry: SavedRoadmap = {
        id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        topic,
        userContext,
        phases,
        savedAt: new Date().toISOString(),
      };
      const next = [entry, ...savedRoadmaps].slice(0, 50);
      localStorage.setItem(SAVED_ROADMAPS_KEY, JSON.stringify(next));
      setSavedRoadmaps(next);
    } finally {
      setSavingRoadmap(false);
    }
  };

  const handleLoadSavedRoadmap = async (saved: SavedRoadmap) => {
    setTopic(saved.topic);
    setPhases(saved.phases);
    setUserContext(saved.userContext || {});
    setChatStep("done");
    setExpanded({});
    setViewMode("roadmap");
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userId) {
        const { data: prog } = await supabase
          .from("user_progress")
          .select("phase_number,is_completed")
          .eq("user_id", userId)
          .eq("topic_id", saved.topic);
        if (Array.isArray(prog)) {
          const map: Record<number, boolean> = {};
          for (const r of prog) {
            if (typeof r.phase_number === "number")
              map[r.phase_number] = !!r.is_completed;
          }
          setCompleted(map);
        }
      }
    } catch {
      setCompleted({});
    }
  };

  const handleCompletePhase = async (phaseNumber: number) => {
    if (completed[phaseNumber]) return;
    const u = await supabase.auth.getUser();
    const userId = u?.data?.user?.id;
    if (!userId) {
      alert("Please sign in again");
      return;
    }
    setSaving((s) => ({ ...s, [phaseNumber]: true }));
    try {
      const { error } = await supabase.from("user_progress").upsert({
        user_id: userId,
        topic_id: topic,
        phase_number: phaseNumber,
        is_completed: true,
      });
      if (error) {
        alert(error.message);
      } else {
        setCompleted((c) => ({ ...c, [phaseNumber]: true }));
      }
    } catch (e) {
      alert(String((e as Error).message ?? e));
    } finally {
      setSaving((s) => ({ ...s, [phaseNumber]: false }));
    }
  };

  const sendGeminiMessage = async () => {
    const text = geminiInput.trim();
    if (!text || geminiLoading) return;
    setGeminiInput("");
    const userMsg: ChatMessage = { role: "user", text };
    setGeminiMessages((prev) => [...prev, userMsg]);
    if (window?.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setGeminiLoading(true);
    try {
      const res = await fetch("/api/chat-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...geminiMessages, userMsg].map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });
      const data = await res.json();
      if (data?.text) {
        setGeminiMessages((prev) => [...prev, { role: "ai", text: data.text }]);
        if (voiceActive && window?.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(String(data.text));
          window.speechSynthesis.speak(u);
        }
      } else {
        setGeminiMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: data?.error || "Sorry, I couldn't get a response. Check GEMINI_API_KEY in .env.local",
          },
        ]);
      }
    } catch {
      setGeminiMessages((prev) => [
        ...prev,
        { role: "ai", text: "Network error. Please try again." },
      ]);
    } finally {
      setGeminiLoading(false);
    }
  };

  const startVoiceGemini = () => {
    if (voiceActive) return;
    setVoiceActive(true);
    const now = Date.now();
    const end = now + 30 * 60 * 1000;
    setSessionEndsAt(end);
    setRemainingSecs(Math.ceil((end - now) / 1000));
    const w = typeof window !== "undefined" ? (window as unknown as { SpeechRecognition?: SRType; webkitSpeechRecognition?: SRType }) : null;
    const SR = w && (w.SpeechRecognition || w.webkitSpeechRecognition);
    if (SR) {
      const recog = new SR();
      recog.continuous = true;
      recog.interimResults = false;
      recog.onresult = (e: { results: Array<{ [index: number]: { transcript: string } }> }) => {
        const last = e.results?.[e.results.length - 1];
        const r = last && last[0] && last[0].transcript;
        const text = typeof r === "string" ? r.trim() : "";
        if (!text) return;
        setGeminiInput(text);
        sendGeminiMessage();
      };
      recog.onerror = () => {};
      recog.onend = () => {
        if (voiceActive) {
          try {
            recog.start();
          } catch {}
        }
      };
      try {
        recog.start();
      } catch {}
      recognitionRef.current = { stop: () => recog.stop() };
    }
  };

  const stopVoiceGemini = () => {
    setVoiceActive(false);
    setSessionEndsAt(null);
    setRemainingSecs(0);
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    if (window?.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    if (!voiceActive || !sessionEndsAt) return;
    const id = setInterval(() => {
      const now = Date.now();
      const rem = Math.max(0, Math.ceil((sessionEndsAt - now) / 1000));
      setRemainingSecs(rem);
      if (rem <= 0) {
        stopVoiceGemini();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [voiceActive, sessionEndsAt]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const u = await supabase.auth.getUser();
      const userId = u?.data?.user?.id;
      if (!userId) {
        setAnalytics({
          topicProgress: [],
          overallPercent: 0,
          totalPhasesDone: 0,
          totalPhasesPossible: 0,
        });
        return;
      }
      const { data: prog } = await supabase
        .from("user_progress")
        .select("topic_id,phase_number,is_completed")
        .eq("user_id", userId)
        .eq("is_completed", true);
      const byTopic: Record<string, Set<number>> = {};
      if (Array.isArray(prog)) {
        for (const r of prog) {
          const tid = String(r.topic_id ?? "");
          if (!tid) continue;
          if (!byTopic[tid]) byTopic[tid] = new Set();
          if (typeof r.phase_number === "number") byTopic[tid].add(r.phase_number);
        }
      }
      const topicProgress: TopicProgress[] = Object.entries(byTopic).map(
        ([topic_id, completedSet]) => {
          const completedPhases = completedSet.size;
          const totalPhases = 5;
          return {
            topic_id,
            totalPhases,
            completedPhases,
            percent: Math.round((completedPhases / totalPhases) * 100),
          };
        }
      );
      const totalPhasesDone = topicProgress.reduce(
        (s, t) => s + t.completedPhases,
        0
      );
      const totalPhasesPossible = topicProgress.length * 5 || 1;
      setAnalytics({
        topicProgress,
        overallPercent: Math.round(
          (totalPhasesDone / totalPhasesPossible) * 100
        ),
        totalPhasesDone,
        totalPhasesPossible,
      });
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === "analytics") loadAnalytics();
  }, [viewMode, loadAnalytics]);

  const completedCount = Object.values(completed).filter(Boolean).length;
  const totalPhases = phases.length || 5;
  const roadmapProgressPercent =
    totalPhases > 0 ? Math.round((completedCount / totalPhases) * 100) : 0;

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-zinc-800 flex flex-col bg-zinc-950/80">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
            Dashboard
          </h2>
        </div>
        <nav className="p-2 flex-1 overflow-auto">
          <button
            onClick={() => setViewMode("roadmap")}
            className={`w-full text-left px-4 py-3 rounded-xl mb-1 flex items-center gap-3 transition-colors ${
              viewMode === "roadmap"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                : "text-zinc-300 hover:bg-zinc-800/50"
            }`}
          >
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            Roadmap
          </button>
          <div className="mt-3 mb-1 px-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Saved Roadmaps
            </p>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {savedRoadmaps.length === 0 ? (
              <p className="px-4 py-2 text-zinc-500 text-sm">None saved yet</p>
            ) : (
              savedRoadmaps.map((saved) => (
                <button
                  key={saved.id}
                  onClick={() => handleLoadSavedRoadmap(saved)}
                  className="w-full text-left px-4 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white truncate"
                  title={saved.topic}
                >
                  {saved.topic}
                </button>
              ))
            )}
          </div>
          <button
            onClick={() => {
              setViewMode("newgen");
              setGeminiMessages([
                {
                  role: "ai",
                  text: "Hi! I'm your learning coach powered by Progath. Ask me about roadmaps, concepts, or your next steps. How can I help?",
                },
              ]);
            }}
            className={`w-full text-left px-4 py-3 rounded-xl mt-3 flex items-center gap-3 transition-colors ${
              viewMode === "newgen"
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40"
                : "text-zinc-300 hover:bg-zinc-800/50"
            }`}
          >
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            New Generation (AI)
          </button>
          <button
            onClick={() => setViewMode("analytics")}
            className={`w-full text-left px-4 py-3 rounded-xl mt-1 flex items-center gap-3 transition-colors ${
              viewMode === "analytics"
                ? "bg-amber-600/20 text-amber-400 border border-amber-500/40"
                : "text-zinc-300 hover:bg-zinc-800/50"
            }`}
          >
            <svg
              className="w-5 h-5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Analytics
          </button>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleSignOut}
            disabled={loading}
            className={`w-full px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              loading
                ? "bg-zinc-700 cursor-not-allowed"
                : "bg-white text-black hover:bg-zinc-200"
            }`}
          >
            {loading ? "Signing Out..." : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        {viewMode === "newgen" && (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-2 text-emerald-400">
              AI Learning Coach (Progath)
            </h1>
            <p className="text-zinc-400 text-sm mb-6">
              Ask for roadmaps, concepts, or help with your learning path.
            </p>
            <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 flex flex-col h-[calc(100vh-12rem)]">
              <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => (voiceActive ? stopVoiceGemini() : startVoiceGemini())}
                    className={`px-3 py-1.5 rounded-xl border ${voiceActive ? "border-emerald-500 text-emerald-400" : "border-zinc-700 text-zinc-400"} hover:border-emerald-400 hover:text-emerald-400 transition-colors`}
                  >
                    {voiceActive ? "Voice On" : "Voice Off"}
                  </button>
                  {voiceActive && (
                    <span className="text-xs text-zinc-400">
                      {Math.floor(remainingSecs / 60)}:{String(remainingSecs % 60).padStart(2, "0")}
                    </span>
                  )}
                </div>
                {quickStartLabel && (
                  <span className="inline-flex items-center gap-1 text-green-500 text-xs font-semibold">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Quick Start
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {geminiMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2 rounded-2xl ${
                        m.role === "user"
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-800 text-zinc-200"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {geminiLoading && (
                  <div className="flex justify-start">
                    <div className="px-4 py-2 rounded-2xl bg-zinc-800 text-zinc-400">
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-zinc-800 flex gap-2">
                <input
                  type="text"
                  value={geminiInput}
                  onChange={(e) => setGeminiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendGeminiMessage()}
                  placeholder="Ask about roadmaps, concepts, next steps..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={sendGeminiMessage}
                  disabled={geminiLoading || !geminiInput.trim()}
                  className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {viewMode === "analytics" && (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-2 text-amber-400">
              Learning Analytics
            </h1>
            <p className="text-zinc-400 text-sm mb-6">
              Your progress and performance across roadmaps.
            </p>
            {analyticsLoading ? (
              <div className="text-zinc-400">Loading analytics...</div>
            ) : analytics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-zinc-800 rounded-2xl p-6 bg-zinc-900/40">
                    <p className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-1">
                      Overall learning
                    </p>
                    <p className="text-4xl font-black text-white">
                      {analytics.overallPercent}%
                    </p>
                    <p className="text-zinc-400 text-sm mt-1">
                      {analytics.totalPhasesDone} of {analytics.totalPhasesPossible} phases completed
                    </p>
                    <div className="mt-3 h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${analytics.overallPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="border border-zinc-800 rounded-2xl p-6 bg-zinc-900/40">
                    <p className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-1">
                      Performance
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {analytics.topicProgress.length} topic
                      {analytics.topicProgress.length !== 1 ? "s" : ""} with progress
                    </p>
                  </div>
                </div>
                <div className="border border-zinc-800 rounded-2xl p-6 bg-zinc-900/40">
                  <p className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-4">
                    Progress by topic (graph)
                  </p>
                  {analytics.topicProgress.length === 0 ? (
                    <p className="text-zinc-500">
                      Complete phases in a roadmap to see analytics here.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {analytics.topicProgress.map((t) => (
                        <div key={t.topic_id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-white font-medium truncate max-w-[70%]">
                              {t.topic_id}
                            </span>
                            <span className="text-amber-400 font-bold">
                              {t.percent}%
                            </span>
                          </div>
                          <div className="h-4 bg-zinc-800 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-lg transition-all duration-500"
                              style={{ width: `${t.percent}%` }}
                            />
                          </div>
                          <p className="text-zinc-500 text-xs mt-0.5">
                            {t.completedPhases} / {t.totalPhases} phases
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-zinc-500">Could not load analytics.</div>
            )}
          </div>
        )}

        {viewMode === "roadmap" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {chatStep === "done" && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-500/40 text-blue-400 hover:border-blue-400 hover:bg-blue-500/10 transition-colors"
                    aria-label="Back to Dashboard"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M15 18l-6-6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Back
                  </button>
                )}
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Construction Plan for:{" "}
                  <span className="text-blue-400">{topic}</span>
                </h1>
                {quickStartLabel && (
                  <span className="inline-flex items-center gap-1 text-green-500 text-xs font-semibold">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Quick Start
                  </span>
                )}
              </div>
            </div>

            {chatStep !== "done" && (
              <div className="mb-6 border border-zinc-800 rounded-2xl p-4 bg-zinc-900/40">
                <div className="flex flex-wrap gap-2 items-center mb-4">
                  <span className="text-zinc-500 text-sm">Or get a roadmap directly:</span>
                  <button
                    onClick={handleDirectOption}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors"
                  >
                    Use default & get roadmap
                  </button>
                </div>
                <div className="space-y-3 mb-4">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`max-w-xl ${m.role === "ai" ? "text-left" : "ml-auto text-right"}`}
                    >
                      <div
                        className={`inline-block px-4 py-2 rounded-2xl ${
                          m.role === "ai"
                            ? "bg-zinc-800 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                {chatStep === 0 && (
                  <div className="flex flex-wrap gap-2">
                    {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => handleSelectLevel(lvl)}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                )}
                {chatStep === 1 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      placeholder="e.g., build a SaaS, pass an exam..."
                      className="flex-1 bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                    />
                    <button
                      onClick={handleSubmitGoal}
                      className="px-4 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>
            )}

            {chatStep === "done" && (
              <div className="border border-zinc-800 rounded-2xl p-4 bg-zinc-900/40">
                {fetching ? (
                  <div className="text-zinc-400 text-sm">Researching...</div>
                ) : phases.length === 0 ? (
                  <div className="text-zinc-400 text-sm">No phases available</div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 text-sm">
                          This roadmap: {completedCount}/{totalPhases} phases ({roadmapProgressPercent}%)
                        </span>
                        <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{
                              width: `${roadmapProgressPercent}%`,
                            }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleSaveRoadmap}
                        disabled={savingRoadmap}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-60"
                      >
                        {savingRoadmap ? "Saving..." : "Save roadmap"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {phases.map((p) => {
                        const isOpen = !!expanded[p.phase_number];
                        return (
                          <div
                            key={p.phase_number}
                            onClick={() =>
                              setExpanded((prev) => ({
                                ...prev,
                                [p.phase_number]: !prev[p.phase_number],
                              }))
                            }
                            className={`cursor-pointer rounded-xl border ${
                              completed[p.phase_number]
                                ? "border-green-500"
                                : isOpen
                                  ? "border-blue-500"
                                  : "border-zinc-800"
                            } bg-zinc-950/60 p-4 hover:border-blue-400 transition-colors`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                                Phase {p.phase_number}
                              </div>
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  completed[p.phase_number]
                                    ? "bg-green-500"
                                    : isOpen
                                      ? "bg-blue-500"
                                      : "bg-zinc-600"
                                }`}
                              />
                            </div>
                            <div className="mt-2 text-lg font-semibold text-white">
                              {p.title}
                            </div>
                            {isOpen && (
                              <div className="mt-3 space-y-3 text-sm text-zinc-300">
                                <div>{p.key_objective}</div>
                                <div className="text-zinc-400">
                                  Estimated Weeks: {p.estimated_weeks}
                                </div>
                                {p.technical_requirement && (
                                  <div className="text-zinc-400">
                                    Technical Requirement:{" "}
                                    {p.technical_requirement}
                                  </div>
                                )}
                                {p.resource_link && (
                                  <div>
                                    <a
                                      href={p.resource_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:underline"
                                    >
                                      Open Resource
                                    </a>
                                  </div>
                                )}
                                {(p.videos?.length || p.articles?.length) && (
                                  <div className="pt-2 border-t border-zinc-800">
                                    <div className="text-zinc-400 font-semibold mb-1">
                                      Resources
                                    </div>
                                    <div className="space-y-1">
                                      {p.videos?.map((v, idx) => (
                                        <div
                                          key={`v-${idx}`}
                                          className="flex items-center gap-2"
                                        >
                                          <span
                                            aria-hidden
                                            className="text-red-500"
                                          >
                                            ▶
                                          </span>
                                          <a
                                            href={v.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:underline"
                                          >
                                            {v.title}
                                          </a>
                                        </div>
                                      ))}
                                      {p.articles?.map((a, idx) => (
                                        <div
                                          key={`a-${idx}`}
                                          className="flex items-center gap-2"
                                        >
                                          <span
                                            aria-hidden
                                            className="text-zinc-400"
                                          >
                                            📘
                                          </span>
                                          <a
                                            href={a.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:underline"
                                          >
                                            {a.title}
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCompletePhase(p.phase_number);
                                    }}
                                    disabled={
                                      !!completed[p.phase_number] ||
                                      !!saving[p.phase_number]
                                    }
                                    className={`mt-2 px-4 py-2 rounded-xl font-semibold transition-colors ${
                                      completed[p.phase_number]
                                        ? "bg-green-600 cursor-not-allowed"
                                        : "bg-white text-black hover:bg-zinc-200"
                                    }`}
                                  >
                                    {completed[p.phase_number]
                                      ? "Completed ✓"
                                      : saving[p.phase_number]
                                        ? "Saving..."
                                        : "Complete Phase"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
