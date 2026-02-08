import { useState, useCallback, useRef, useEffect } from "react";

// Floating particle component
function Particles() {
  const particles = Array.from({ length: 15 }, (_, i) => {
    const size = Math.random() * 6 + 3;
    const left = Math.random() * 100;
    const duration = Math.random() * 15 + 15;
    const delay = Math.random() * 10;
    const colors = [
      "rgba(255, 183, 197, 0.4)",
      "rgba(123, 154, 216, 0.35)",
      "rgba(200, 180, 255, 0.3)",
      "rgba(255, 210, 220, 0.35)",
      "rgba(170, 200, 255, 0.3)",
    ];
    const color = colors[i % colors.length];

    return (
      <div
        key={i}
        className="particle"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}%`,
          background: color,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  });

  return <>{particles}</>;
}

// Copy icon SVG
function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg className="copy-icon" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
    );
  }
  return (
    <svg className="copy-icon" viewBox="0 0 24 24">
      <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" />
    </svg>
  );
}

// Download icon SVG with gradient
function DownloadIcon() {
  return (
    <svg
      style={{
        width: "20px",
        height: "20px",
        marginRight: "8px",
        position: "relative",
        zIndex: 2,
      }}
      viewBox="0 0 24 24"
    >
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#5A76A8", stopOpacity: 1 }} />
          <stop
            offset="100%"
            style={{ stopColor: "#4A5F8C", stopOpacity: 1 }}
          />
        </linearGradient>
      </defs>
      <path
        fill="url(#iconGradient)"
        d="M19,9H15V3H9V9H5L12,16L19,9M5,18V20H19V18H5Z"
      />
    </svg>
  );
}

// Small download icon for history
function SmallDownloadIcon() {
  return (
    <svg
      style={{ width: "16px", height: "16px", fill: "#cbd5e0" }}
      viewBox="0 0 24 24"
    >
      <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
    </svg>
  );
}

// Password item component
function PasswordItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch((err) => {
        console.error("复制失败:", err);
      });
  }, [value]);

  return (
    <div
      className={`pass-item ${copied ? "copied" : ""}`}
      onClick={handleCopy}
    >
      <div className="tooltip">已复制 ✓</div>
      <span className="pass-label">{label}</span>
      <div className="pass-value-row">
        <span className="pass-code">{value}</span>
        <CopyIcon copied={copied} />
      </div>
    </div>
  );
}

// History versions data
const historyVersions = [
  {
    version: "v1.2.3 (Stable)",
    url: "https://wwbed.lanzoul.com/b01884b8tg",
  },
  {
    version: "v1.2.2",
    url: "https://wwbed.lanzoul.com/b0188387xa",
  },
];

export function App() {
  const [isHovering, setIsHovering] = useState(false);

  // Add a subtle mouse-follow glow effect
  const containerRef = useRef<HTMLDivElement>(null);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        // 使用 requestAnimationFrame 节流
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        
        rafRef.current = requestAnimationFrame(() => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setGlowPos({ x, y });
          }
        });
      }
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener("mousemove", handleMouseMove);
      return () => {
        el.removeEventListener("mousemove", handleMouseMove);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }
  }, []);

  return (
    <>
      {/* Decorative background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Background layers */}
      <div className="bg-pattern" />
      <div className="bg-pickup" />

      {/* Floating particles */}
      <Particles />

      {/* Main content */}
      <div className="main-layout">
        <div
          ref={containerRef}
          className="container-card"
          style={{
            background: isHovering
              ? `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(255,200,215,0.12) 0%, rgba(245,248,255,0.62) 50%)`
              : undefined,
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Title */}
          <h1 className="main-title">渡幕 (Trans-Jimaku)</h1>
          <div className="subtitle">同人音声沉浸式 AI 翻校工具</div>

          {/* Download card */}
          <div className="download-card">
            <span className="version-tag">
              <span>最新公测版</span>
            </span>

            <div className="version-info">
              <span className="version-title">v1.2.5</span>
              <span className="version-date">更新于 2026-02-06</span>
            </div>

            <div className="password-grid">
              <PasswordItem label="访问密码" value="大家翻" />
              <PasswordItem label="解压密码" value="新妻ひより" />
            </div>

            <a
              href="https://wwbed.lanzoul.com/b01884k1ed"
              className="download-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <DownloadIcon />
              <span>立即下载 v1.2.5</span>
            </a>
          </div>

          {/* History versions */}
          <div className="history-section">
            <div className="history-title-text">历史版本 / BACKUP</div>

            <div className="history-list">
              {historyVersions.map((item) => (
                <a
                  key={item.version}
                  href={item.url}
                  className="history-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{item.version}</span>
                  <SmallDownloadIcon />
                </a>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <a
              href="https://afdian.com/a/yuuriyakuki"
              target="_blank"
              rel="noopener noreferrer"
            >
              ⚡ 爱发电
            </a>
            <span style={{ color: "#CBD5E0" }}>|</span>
            <a
              href="https://space.bilibili.com/3546921813674876"
              target="_blank"
              rel="noopener noreferrer"
            >
              📺 Bilibili
            </a>
            <div className="copyright">© 2026 幽离译归</div>
          </div>
        </div>
      </div>
    </>
  );
}
