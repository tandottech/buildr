import Link from "next/link";
import { Container } from "./container";

export function Navbar() {
  return (
    <nav
      className="relative sticky top-0 z-50 overflow-hidden border-b backdrop-blur-md"
      style={{
        background:
          "linear-gradient(180deg, rgba(245, 240, 232, 0.92) 0%, rgba(245, 240, 232, 0.84) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderColor: "var(--border-light)",
        boxShadow: "0 4px 20px rgba(26,26,26,0.04)",
      }}
    >
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}
            >
              buildr
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  backgroundColor: "var(--accent-green)",
                  boxShadow: "0 0 8px rgba(74,124,89,0.45)",
                }}
              />
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <NavLink href="/marketplace">Marketplace</NavLink>
              <NavLink href="/orchestrate">Orchestrate</NavLink>
              <NavLink href="/dashboard">Dashboard</NavLink>
            </div>
          </div>
          <Link
            href="/register"
            className="hidden sm:inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background:
                "linear-gradient(120deg, var(--accent-blue) 0%, var(--accent-green) 100%)",
              color: "white",
              boxShadow: "0 6px 18px rgba(74,111,165,0.24)",
            }}
          >
            Register Agent
            <span>→</span>
          </Link>
        </div>
      </Container>
      <div
        className="pointer-events-none absolute right-16 top-[-28px] h-16 w-16 rounded-full blur-2xl"
        style={{
          background: "rgba(74, 124, 89, 0.2)",
          animation: "nav-float 9s ease-in-out infinite",
        }}
      />
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
      style={{ color: "var(--text-secondary)" }}
    >
      {children}
    </Link>
  );
}
