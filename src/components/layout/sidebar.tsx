"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { WalletWidget } from "./wallet-widget";

/* ── Icon components (18×18 SVG) ──────────────────────────────── */

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10.5" y="1" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="10.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function StorefrontIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 8V15.5C2 15.776 2.224 16 2.5 16H15.5C15.776 16 16 15.776 16 15.5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M1 5L3 2H15L17 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 5C1 6.105 1.895 7 3 7C4.105 7 5 6.105 5 5C5 6.105 5.895 7 7 7C8.105 7 9 6.105 9 5C9 6.105 9.895 7 11 7C12.105 7 13 6.105 13 5C13 6.105 13.895 7 15 7C16.105 7 17 6.105 17 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 16V12C7 11.448 7.448 11 8 11H10C10.552 11 11 11.448 11 12V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.5 6L12 9L7.5 12V6Z" fill="currentColor" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 5V9L12 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 6V12M6 9H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Navigation data ──────────────────────────────────────────── */

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType;
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "MAIN",
    items: [
      { label: "Overview", href: "/dashboard", icon: GridIcon },
      { label: "Marketplace", href: "/dashboard/marketplace", icon: StorefrontIcon },
      { label: "Orchestrate", href: "/dashboard/orchestrate", icon: PlayCircleIcon },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { label: "History", href: "/dashboard/history", icon: ClockIcon },
      { label: "Register Agent", href: "/dashboard/register", icon: PlusCircleIcon },
    ],
  },
];

/* ── Sidebar ──────────────────────────────────────────────────── */

export function Sidebar() {
  const pathname = usePathname();
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="overflow-hidden"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 260,
        height: "100vh",
        background:
          "radial-gradient(140% 110% at 0% 0%, rgba(74, 111, 165, 0.18) 0%, transparent 45%), linear-gradient(180deg, #1F2A37 0%, #18212D 100%)",
        color: "var(--text-on-dark)",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
        borderRight: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "inset -1px 0 0 rgba(255,255,255,0.04)",
      }}
    >
      <div
        className="pointer-events-none absolute -top-10 -left-8 h-32 w-32 rounded-full blur-2xl"
        style={{
          background: "rgba(74, 111, 165, 0.28)",
          animation: "sidebar-float-a 9s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-20 -right-10 h-28 w-28 rounded-full blur-2xl"
        style={{
          background: "rgba(74, 124, 89, 0.24)",
          animation: "sidebar-float-b 11s ease-in-out infinite",
        }}
      />
      {/* Brand */}
      <div style={{ padding: "28px 24px 36px", position: "relative", zIndex: 1 }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--text-on-dark)",
            textDecoration: "none",
          }}
        >
          buildr
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "var(--accent-green)",
              boxShadow: "0 0 10px rgba(74,124,89,0.7)",
              flexShrink: 0,
            }}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 24, position: "relative", zIndex: 1 }}>
        {SECTIONS.map((section) => (
          <div key={section.title}>
            {/* Section label */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "rgba(245,240,232,0.44)",
                padding: "0 16px",
                marginBottom: 8,
                textTransform: "uppercase" as const,
              }}
            >
              {section.title}
            </div>

            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              {section.items.map((item) => {
                const active = isActive(item.href);
                const hovered = hoveredHref === item.href;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onMouseEnter={() => setHoveredHref(item.href)}
                      onMouseLeave={() => setHoveredHref(null)}
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 16px",
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: active ? 500 : 400,
                        color: active
                          ? "var(--text-on-dark)"
                          : hovered
                            ? "rgba(245,240,232,0.85)"
                            : "rgba(245,240,232,0.66)",
                        background: active
                          ? "linear-gradient(90deg, rgba(74,111,165,0.25) 0%, rgba(74,124,89,0.2) 100%)"
                          : hovered
                            ? "rgba(255,255,255,0.04)"
                            : "transparent",
                        border: active
                          ? "1px solid rgba(74,111,165,0.45)"
                          : "1px solid transparent",
                        textDecoration: "none",
                        transform: hovered ? "translateX(2px)" : "translateX(0)",
                        transition: "all 240ms cubic-bezier(0.22, 1, 0.36, 1)",
                        overflow: "hidden",
                      }}
                    >
                      {/* Active accent bar */}
                      {active && (
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 3,
                            height: 20,
                            borderRadius: 2,
                            backgroundColor: "var(--accent-green)",
                            boxShadow: "0 0 8px rgba(74,124,89,0.7)",
                          }}
                        />
                      )}
                      <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                        <Icon />
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: "16px 16px 20px" }}>
        <WalletWidget />

        {/* Powered by */}
        <div
          style={{
            fontSize: 11,
            color: "rgba(245,240,232,0.36)",
            textAlign: "center",
            letterSpacing: "0.02em",
            marginTop: 14,
          }}
        >
          Powered by Locus
        </div>
      </div>
    </aside>
  );
}

