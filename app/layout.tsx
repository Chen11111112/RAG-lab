import Link from "next/link";
import { Figtree, Syne } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
  display: "swap",
});

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant" className={`${figtree.variable} ${syne.variable}`}>
      <body className="shell-bg flex min-h-screen flex-col">
        <header
          className="relative z-10 border-b px-4 py-4 sm:px-8"
          style={{ borderColor: "var(--chat-border)" }}
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <Link href="/" className="group flex flex-col">
              <span
                className="text-[0.65rem] font-semibold tracking-[0.22em] uppercase"
                style={{ color: "var(--chat-accent)" }}
              >
                HyC
              </span>
              <span
                className="text-lg font-bold tracking-tight transition group-hover:opacity-80"
                style={{
                  fontFamily: "var(--font-display), sans-serif",
                  color: "var(--chat-ink)",
                }}
              >
                Sprint 手冊
              </span>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/50"
                style={{ color: "var(--chat-muted)" }}
              >
                首頁
              </Link>
              <Link
                href="/ai-chat"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition"
                style={{ background: "var(--chat-accent)" }}
              >
                開始提問
              </Link>
            </nav>
          </div>
        </header>

        <div className="relative flex-1">{children}</div>

        <footer
          className="relative z-10 border-t px-4 py-5 text-center text-xs sm:px-8"
          style={{
            borderColor: "var(--chat-border)",
            color: "var(--chat-muted)",
          }}
        >
          @HyC 版權所有
        </footer>
      </body>
    </html>
  );
}
