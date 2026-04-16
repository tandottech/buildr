"use client";

import { usePathname } from "next/navigation";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Overview",
    subtitle: "Real-time platform analytics",
  },
  "/dashboard/marketplace": {
    title: "Marketplace",
    subtitle: "50 autonomous AI agents",
  },
  "/dashboard/orchestrate": {
    title: "Orchestrate",
    subtitle: "Submit tasks and watch agents work",
  },
  "/dashboard/history": {
    title: "History",
    subtitle: "Past orchestration runs",
  },
  "/dashboard/register": {
    title: "Register",
    subtitle: "Add your agent to the marketplace",
  },
  "/dashboard/playground": {
    title: "Agent Playground",
    subtitle: "View agent outputs and payment details",
  },
};

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="5.5" stroke="#525252" strokeWidth="1.5" />
      <path d="M11 11L14 14" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function DashboardTopbar() {
  const pathname = usePathname();

  const isAgentDetail = pathname.startsWith("/dashboard/agent/");
  const isPlayground = pathname.startsWith("/dashboard/playground/");
  const meta = isAgentDetail
    ? { title: "Agent Detail", subtitle: "Performance and transaction history" }
    : isPlayground
      ? { title: "Agent Playground", subtitle: "View agent outputs and payment details" }
      : PAGE_META[pathname] ?? { title: "Dashboard", subtitle: "" };

  return (
    <div
      className="relative overflow-hidden backdrop-blur-sm"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 72,
        padding: "12px 40px",
        borderBottom: "1px solid rgba(224, 218, 208, 0.8)",
        background:
          "linear-gradient(180deg, rgba(245, 240, 232, 0.95) 0%, rgba(245, 240, 232, 0.88) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -left-8 -top-10 h-20 w-20 rounded-full blur-2xl"
        style={{
          background: "rgba(74, 111, 165, 0.18)",
          animation: "nav-float 7s ease-in-out infinite",
        }}
      />
      {/* Left — title + subtitle */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, position: "relative", zIndex: 1 }}>
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: "var(--accent-green)",
              boxShadow: "0 0 8px rgba(74,124,89,0.45)",
            }}
          />
          <span
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              fontWeight: 600,
            }}
          >
            Dashboard
          </span>
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.2,
          }}
        >
          {meta.title}
        </h1>
        {meta.subtitle && (
          <span
            style={{
              fontSize: 13,
              color: "var(--text-tertiary)",
              lineHeight: 1.2,
            }}
          >
            {meta.subtitle}
          </span>
        )}
      </div>

      {/* Right — search pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: 240,
          height: 40,
          padding: "0 14px",
          borderRadius: 9999,
          background:
            "linear-gradient(180deg, rgba(237, 232, 220, 0.9) 0%, rgba(229, 223, 209, 0.75) 100%)",
          border: "1px solid var(--border-light)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
          cursor: "default",
          transition: "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 240ms ease",
          animation: "nav-float 8s ease-in-out infinite",
        }}
      >
        <SearchIcon />
        <span
          style={{
            fontSize: 13,
            color: "var(--text-tertiary)",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          Search agents...
        </span>
      </div>
    </div>
  );
}
