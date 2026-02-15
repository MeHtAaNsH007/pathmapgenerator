import { NextResponse } from "next/server";

type Link = { title: string; url: string };

function uniqByUrl(items: Link[]) {
  const seen = new Set<string>();
  const out: Link[] = [];
  for (const it of items) {
    const u = it.url;
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(it);
  }
  return out;
}

async function ddgSearch(query: string) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`;
    const res = await fetch(url, { method: "GET" });
    const data = await res.json();
    const links: Link[] = [];
    const rt = Array.isArray(data?.RelatedTopics) ? data.RelatedTopics : [];
    for (const t of rt) {
      if (t && typeof t === "object") {
        if (t.Text && t.FirstURL) {
          links.push({ title: String(t.Text), url: String(t.FirstURL) });
        }
        if (Array.isArray(t.Topics)) {
          for (const s of t.Topics) {
            if (s && s.Text && s.FirstURL) {
              links.push({ title: String(s.Text), url: String(s.FirstURL) });
            }
          }
        }
      }
    }
    return uniqByUrl(links).slice(0, 10);
  } catch {
    return [] as Link[];
  }
}

function preferCreators(links: Link[]) {
  const preferred = ["freecodecamp", "harvard", "cs50", "mit", "opencourseware", "ocw.mit.edu"];
  const score = (u: string) => {
    const l = u.toLowerCase();
    return preferred.some((p) => l.includes(p)) ? 1 : 0;
  };
  return [...links].sort((a, b) => score(b.url) - score(a.url));
}

async function searchYouTube(topic: string, phase: string) {
  const q = `site:youtube.com ${topic} ${phase} tutorial 2026`;
  const raw = await ddgSearch(q);
  const yt = raw.filter((l) => /youtube\.com/.test(l.url));
  const sorted = preferCreators(yt);
  return sorted.slice(0, 3);
}

async function searchDocs(topic: string) {
  const t = topic.toLowerCase();
  const seeds: Link[] = [];
  if (t.includes("python")) {
    seeds.push(
      { title: "Python Official Docs", url: "https://docs.python.org/3/" },
      { title: "FastAPI Docs", url: "https://fastapi.tiangolo.com/" },
      { title: "Pydantic Docs", url: "https://docs.pydantic.dev/" }
    );
  } else if (t.includes("javascript") || t.includes("web") || t.includes("frontend")) {
    seeds.push(
      { title: "MDN Web Docs", url: "https://developer.mozilla.org/" },
      { title: "React Docs", url: "https://react.dev/" },
      { title: "Next.js Docs", url: "https://nextjs.org/docs" }
    );
  } else if (t.includes("data") || t.includes("machine learning") || t.includes("ai")) {
    seeds.push(
      { title: "PyTorch Docs", url: "https://pytorch.org/docs/stable/" },
      { title: "scikit-learn Docs", url: "https://scikit-learn.org/stable/" },
      { title: "Pandas Docs", url: "https://pandas.pydata.org/docs/" }
    );
  } else if (t.includes("engineering")) {
    seeds.push(
      { title: "MIT OCW Engineering", url: "https://ocw.mit.edu/courses/find-by-topic/#engineering" },
      { title: "ASME Standards", url: "https://www.asme.org/codes-standards" }
    );
  }
  const extra = await ddgSearch(`official documentation for ${topic} 2026`);
  const filtered = extra.filter((l) =>
    /(docs|developer|\.org|\.edu|mozilla|python|react|nextjs|pytorch|scikit|pandas|ocw|mit|harvard|cs50)/i.test(l.url)
  );
  return uniqByUrl([...seeds, ...filtered]).slice(0, 3);
}

function techRequirementFor(topic: string) {
  const t = topic.toLowerCase();
  if (t.includes("python")) return "Python 3.12, FastAPI, Pydantic, Poetry, PyTest";
  if (t.includes("javascript") || t.includes("web") || t.includes("frontend")) return "TypeScript, Next.js 14+, React 19, Vite, ESLint";
  if (t.includes("data") || t.includes("machine learning") || t.includes("ai")) return "Python 3.12, Pandas, PyTorch, scikit-learn, Weights & Biases";
  if (t.includes("finance")) return "Excel 365, Python with Pandas, yfinance, SQL (PostgreSQL)";
  if (t.includes("art") || t.includes("design")) return "Adobe Creative Cloud (Illustrator, Photoshop), Figma, Procreate";
  if (t.includes("engineering")) return "AutoCAD/SolidWorks, MATLAB, Git, basic FEA tools";
  return `Identify current tools and best practices for ${topic} in 2026`;
}

export async function POST(request: Request) {
  try {
    const { topic, userContext } = await request.json();
    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
    }
    const t = topic.trim();
    const level = userContext?.level ? String(userContext.level) : "";
    const goal = userContext?.goal ? String(userContext.goal) : "";
    const ctxText = [level, goal].filter(Boolean).join(", ");
    const q1 = `Latest industry roadmap for ${t} ${ctxText ? `(${ctxText})` : ""} 2026`;
    const q2 = `University syllabus for ${t} 2026 ${ctxText}`;
    const [links1, links2] = await Promise.all([ddgSearch(q1), ddgSearch(q2)]);
    const links = uniqByUrl([...links1, ...links2]);
    const fallback = `https://www.google.com/search?q=${encodeURIComponent(q1)}`;
    const pick = (i: number) => links[i]?.url || fallback;
    const req = techRequirementFor(t);
    const docs = await searchDocs(t);
    const phases = await Promise.all(
      [1, 2, 3, 4, 5].map(async (n) => {
        const titles = ["Foundation", "Fundamentals", "Applied Practice", "Projects", "Mastery & Review"];
        const title = titles[n - 1];
        const yt = await searchYouTube(t, title);
        const vids = yt.map((v) => ({ title: v.title, url: v.url }));
        const articles = docs.map((d) => ({ title: d.title, url: d.url }));
        const objectiveByPhase = [
          `Understand the core principles of ${t}.`,
          `Learn essential tools, vocabulary, and techniques in ${t}.`,
          `Apply ${t} fundamentals through structured exercises and mini-tasks.`,
          `Build scoped projects demonstrating ${t} skills with modern methodologies.`,
          `Refine, document, and showcase ${t} with best practices and iteration.`,
        ][n - 1];
        return {
          phase_number: n,
          title,
          key_objective: objectiveByPhase,
          estimated_weeks: [1, 2, 3, 2, 1][n - 1],
          resource_link: pick(n - 1),
          technical_requirement: req,
          videos: vids,
          articles,
        };
      })
    );
    return NextResponse.json({ topic: t, phases });
  } catch {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}
