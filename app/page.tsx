import Link from "next/link";

export default function Home() {
  return (
    <main className="relative overflow-hidden px-4 py-16 sm:px-8 sm:py-24">
      <div
        aria-hidden
        className="shell-grid pointer-events-none absolute inset-0 opacity-[0.28]"
      />

      <div className="relative mx-auto flex w-full max-w-2xl flex-col items-start gap-8">
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
            Scrum 助理——用檢索增強生成，只依文件內容回答。
          </p>
          <span
            className="text-sm"
            style={{ color: "var(--chat-muted)" }}
          >
            本專案為結合 LiteLLM · PostgreSQL · LangChain 並透過 Next.js 全端框架實作 RAG。
          </span>
        </div>

        <div className="chat-rise-delay flex flex-wrap items-center gap-3">
          <Link
            href="/ai-chat"
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition"
            style={{ background: "var(--chat-accent)" }}
          >
            開始提問
          </Link>
          <Link
            href="https://hyc.eshachem.com/course/"
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition"
            style={{ background: "var(--chat-accent)" }}
          >
            專案管理與系統規劃文件
          </Link>
          <Link
            href="https://github.com/Chen11111112/RAG-lab.git"
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition"
            style={{ background: "var(--chat-accent)" }}
          >
            GitHub
          </Link>
          <Link
            href="https://hackmd.io/@HyC-1029/r1I7wY7Efg"
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition"
            style={{ background: "var(--chat-accent)" }}
          >
            技術文件
          </Link>
          <br/>
          
          <span
            className="text-sm"
            style={{ color: "var(--chat-muted)" }}
          >
            Scrum 是當今敏捷方法論 (Agile Methodology) 中最受歡迎且被廣泛應用的漸進式產品開發框架。
            Scrum 的本質是一個輕量級的框架 (Lightweight Framework),它不提供死板的指令,
            而是通過一組簡單的核心角色、儀式和工件,協助團隊在面對複雜和不確定的專案環境時,能夠進行高效的自 我管理、持續交付與快速適應。
          </span>

          <p
          className="chat-rise-delay-2 text-sm"
          style={{ color: "var(--chat-muted)" }}
        >
          
        </p>

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
