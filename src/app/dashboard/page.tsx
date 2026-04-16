import { EconomyStats } from "@/components/dashboard/economy-stats";
import { LiveActivityTicker } from "@/components/dashboard/live-activity-ticker";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { AgentStatusOverview } from "@/components/dashboard/agent-status-overview";
import { AgentLeaderboard } from "@/components/dashboard/agent-leaderboard";
import { TransactionFeed } from "@/components/dashboard/transaction-feed";
import { RecentTasks } from "@/components/dashboard/recent-tasks";
import { getDb } from "@/lib/db";
import { Agent } from "@/lib/schema";

export const dynamic = "force-dynamic";

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="mb-6 mt-3 flex items-center gap-3">
      <div
        className="flex-1"
        style={{
          height: 1,
          background: "linear-gradient(90deg, var(--border-light), transparent)",
        }}
      />
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </p>
      <div
        className="flex-1"
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--border-light))",
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const db = getDb();
  const now = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // --- Row 1: Stat cards ---
  const totalAgents = (
    db.prepare("SELECT COUNT(*) as count FROM agents").get() as { count: number }
  ).count;
  const onlineAgents = (
    db.prepare("SELECT COUNT(*) as count FROM agents WHERE status = 'online'").get() as {
      count: number;
    }
  ).count;
  const totalTransacted = (
    db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions").get() as {
      total: number;
    }
  ).total;
  const tasksCompleted = (
    db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get() as {
      count: number;
    }
  ).count;
  const avgCost = (
    db
      .prepare(
        "SELECT COALESCE(AVG(total_cost), 0) as avg FROM tasks WHERE status = 'completed'"
      )
      .get() as { avg: number }
  ).avg;
  const totalCategories = (
    db.prepare("SELECT COUNT(DISTINCT category) as count FROM agents").get() as {
      count: number;
    }
  ).count;

  // --- Row 2: Category breakdown ---
  const categories = db
    .prepare(
      `SELECT category, COUNT(*) as agent_count, COALESCE(SUM(total_earned), 0) as total_earned
       FROM agents GROUP BY category ORDER BY total_earned DESC`
    )
    .all() as { category: string; agent_count: number; total_earned: number }[];

  // --- Row 2: Agent status counts ---
  const statusRows = db
    .prepare("SELECT status, COUNT(*) as count FROM agents GROUP BY status")
    .all() as { status: string; count: number }[];
  const statusCounts = { online: 0, offline: 0, busy: 0 };
  for (const row of statusRows) {
    if (row.status === "online") statusCounts.online = row.count;
    else if (row.status === "offline") statusCounts.offline = row.count;
    else if (row.status === "busy") statusCounts.busy = row.count;
  }

  // --- Row 3: Top earners ---
  const topAgents = db
    .prepare("SELECT * FROM agents ORDER BY total_earned DESC LIMIT 15")
    .all() as Agent[];

  // --- Row 3: Recent transactions ---
  const transactions = db
    .prepare(
      `SELECT t.id, t.amount, t.status, t.created_at, t.negotiated_from, t.negotiated_to, t.task_description,
        buyer.name as buyer_name, seller.name as seller_name
       FROM transactions t
       LEFT JOIN agents buyer ON t.buyer_agent_id = buyer.id
       LEFT JOIN agents seller ON t.seller_agent_id = seller.id
       ORDER BY t.created_at DESC LIMIT 20`
    )
    .all() as {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    negotiated_from: number | null;
    negotiated_to: number | null;
    task_description: string | null;
    buyer_name: string;
    seller_name: string;
  }[];

  // --- Row 4: Recent tasks ---
  const recentTasks = db
    .prepare(
      "SELECT id, user_input, status, sub_tasks, total_cost, created_at, completed_at FROM tasks ORDER BY created_at DESC LIMIT 15"
    )
    .all() as {
    id: string;
    user_input: string;
    status: string;
    sub_tasks: string | null;
    total_cost: number;
    created_at: string;
    completed_at: string | null;
  }[];

  const taskRows = recentTasks.map((t) => {
    let subTaskCount = 0;
    if (t.sub_tasks) {
      try {
        const parsed = JSON.parse(t.sub_tasks);
        subTaskCount = Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        subTaskCount = 0;
      }
    }
    return {
      id: t.id,
      user_input: t.user_input,
      status: t.status,
      sub_task_count: subTaskCount,
      total_cost: t.total_cost,
      created_at: t.created_at,
      completed_at: t.completed_at,
    };
  });

  return (
    <div className="space-y-8 pb-4">
      <section
        className="relative overflow-hidden rounded-2xl border px-6 py-7 sm:px-8"
        style={{
          background:
            "radial-gradient(140% 120% at 10% 0%, rgba(74, 111, 165, 0.14), transparent 55%), radial-gradient(130% 130% at 100% 100%, rgba(74, 124, 89, 0.12), transparent 50%), var(--bg-primary)",
          borderColor: "var(--border-light)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-60 blur-2xl" style={{ backgroundColor: "var(--accent-blue-light)" }} />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full opacity-60 blur-2xl" style={{ backgroundColor: "var(--accent-green-light)" }} />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-tertiary)" }}>
              Command Center
            </p>
            <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>
              Overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>
              Monitor agent utilization, transaction flow, and orchestration performance in real time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: "var(--border-light)", color: "var(--text-secondary)", backgroundColor: "var(--bg-secondary)" }}>
              {onlineAgents}/{totalAgents} online
            </span>
            <span className="rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: "var(--border-light)", color: "var(--text-secondary)", backgroundColor: "var(--bg-secondary)" }}>
              {tasksCompleted} tasks completed
            </span>
            <span className="rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: "var(--border-light)", color: "var(--text-secondary)", backgroundColor: "var(--bg-secondary)" }}>
              Updated {now}
            </span>
          </div>
        </div>
      </section>

      {/* Row 1: 6 Stat Cards */}
      <div className="animate-fade-in">
        <EconomyStats
          stats={{
            totalAgents,
            onlineAgents,
            totalTransacted,
            tasksCompleted,
            avgCost,
            totalCategories,
          }}
        />
      </div>

      {/* Live Activity Ticker (full width) */}
      <div className="animate-fade-in">
        <LiveActivityTicker />
      </div>

      {/* Analytics section */}
      <SectionDivider label="Analytics" />

      {/* Category Breakdown (2/3) + Agent Status (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CategoryBreakdown categories={categories} />
        </div>
        <div>
          <AgentStatusOverview counts={statusCounts} />
        </div>
      </div>

      {/* Activity section */}
      <SectionDivider label="Activity" />

      {/* Top Earners (1/2) + Recent Transactions (1/2) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AgentLeaderboard agents={topAgents} />
        <TransactionFeed transactions={transactions} />
      </div>

      {/* History section */}
      <SectionDivider label="History" />

      {/* Recent Tasks (full width) */}
      <RecentTasks tasks={taskRows} />
    </div>
  );
}
