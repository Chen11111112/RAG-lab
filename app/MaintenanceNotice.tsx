"use client";

import { useEffect, useState } from "react";

const CONTACT_URL = "https://hyc.eshachem.com/";
const SCREENSHOTS_URL =
  "https://drive.google.com/drive/folders/15BuXjY_2SWghTG1chvAPTBy83PU56GGV?usp=sharing";

export default function MaintenanceNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      role="presentation"
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(18, 32, 24, 0.48)" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="maintenance-title"
        className="chat-rise relative w-full max-w-lg rounded-2xl border p-6 shadow-xl sm:p-8"
        style={{
          background: "var(--chat-surface)",
          borderColor: "var(--chat-border)",
          backdropFilter: "blur(16px)",
        }}
      >
        <p
          className="mb-2 text-[0.65rem] font-semibold tracking-[0.22em] uppercase"
          style={{ color: "var(--chat-accent)" }}
        >
          系統公告
        </p>
        <h2
          id="maintenance-title"
          className="text-2xl tracking-tight"
          style={{
            fontFamily: "var(--font-display), sans-serif",
            fontWeight: 700,
            color: "var(--chat-ink)",
          }}
        >
          後端服務暫停
        </h2>
        <div
          className="mt-4 space-y-3 text-sm leading-relaxed"
          style={{ color: "var(--chat-muted)" }}
        >
          <p>
            因伺服器維護與資源配置考量，目前暫未開啟後端服務。本站現僅供前端內容瀏覽與展示，登入後之資料儲存、新聞更新及
            AI 對話等互動功能暫時無法使用。
          </p>
          <p>若有特殊需求，想進一步體驗完整功能，歡迎與陳泓毓聯繫。</p>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-white transition"
            style={{ background: "var(--chat-accent)" }}
          >
            聯繫陳泓毓
          </a>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition"
            style={{
              borderColor: "var(--chat-border)",
              color: "var(--chat-ink)",
              background: "rgba(255, 255, 255, 0.7)",
            }}
          >
            我知道了
          </button>
          <a
            href={SCREENSHOTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border px-4 py-2.5 text-center text-sm font-semibold transition"
            style={{
              borderColor: "var(--chat-border)",
              color: "var(--chat-ink)",
              background: "rgba(255, 255, 255, 0.7)",
            }}
          >
            瀏覽實際操作截圖
          </a>
        </div>
      </div>
    </div>
  );
}
