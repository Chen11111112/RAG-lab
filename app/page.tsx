import Link from "next/link";

export default function Home() {
  return (
    <main className="relative overflow-hidden px-4 py-16 sm:px-8 sm:py-24">
      <div
        aria-hidden
        className="shell-grid pointer-events-none absolute inset-0 opacity-[0.28]"
      />

      <div className="relative mx-auto flex max-w-2xl flex-col items-start gap-8">
        <div className="chat-rise">
          <p
            className="mb-3 text-[0.7rem] font-semibold tracking-[0.22em] uppercase"
            style={{ color: "var(--chat-accent)" }}
          >
            HyC · LangChain RAG
          </p>
          <h1
            className="text-5xl leading-[0.95] tracking-tight sm:text-6xl"
            style={{
              fontFamily: "var(--font-display), sans-serif",
              fontWeight: 800,
              color: "var(--chat-ink)",
            }}
          >
            HyC
          </h1>
          <p
            className="mt-5 max-w-md text-lg leading-relaxed"
            style={{ color: "var(--chat-muted)" }}
          >
            Sprint 工作手冊助理——用檢索增強生成，只依文件內容回答。
          </p>
        </div>

        <div className="chat-rise-delay flex flex-wrap items-center gap-3">
          <Link
            href="/ai-chat"
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition"
            style={{ background: "var(--chat-accent)" }}
          >
            開啟助理
          </Link>
          <Link
            href="https://app.notion.com/p/Sprint-37c9def5443d8164a3eec659ec0884ee"
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition"
            style={{ background: "var(--chat-accent)" }}
          >
            Sprint 工作手冊
          </Link>
          <Link
            href="https://github.com/Chen11111112/RAG-lab.git"
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition"
            style={{ background: "var(--chat-accent)" }}
          >
            GitHub
          </Link>
          <br/>
          <span
            className="text-sm"
            style={{ color: "var(--chat-muted)" }}
          >
            本專案為結合 NVIDIA NIM · Supabase · LangChain 並透過Next.js全端框架實作RAG。
          </span>
        </div>

        <p
          className="chat-rise-delay-2 text-sm"
          style={{ color: "var(--chat-muted)" }}
        >
          Harry · feature/langchain-rag
        </p>
      </div>
    </main>
  );
}
