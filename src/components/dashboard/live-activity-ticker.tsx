"use client";

import { useEffect, useState, useRef } from "react";

interface ActivityTransaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  task_description: string | null;
  buyer_name: string | null;
  seller_name: string | null;
}

interface ActivityTask {
  id: string;
  user_input: string;
  status: string;
  total_cost: number;
  created_at: string;
}

interface ActivityEvent {
  id: string;
  type: "transaction" | "task";
  icon: string;
  description: string;
  timestamp: string;
  sortKey: number;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function buildEvents(
  transactions: ActivityTransaction[],
  tasks: ActivityTask[]
): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const tx of transactions) {
    const buyer = tx.buyer_name || "Orchestrator";
    const seller = tx.seller_name || "Agent";
    const amount = `$${tx.amount.toFixed(4)}`;
    let description: string;

    if (tx.status === "completed" || tx.status === "paid") {
      description = `${buyer} paid ${seller} ${amount} USDC`;
    } else if (tx.status === "pending") {
      description = `${buyer} → ${seller} ${amount} USDC (pending)`;
    } else if (tx.status === "failed") {
      description = `${buyer} → ${seller} ${amount} USDC (failed)`;
    } else {
      description = `${buyer} → ${seller} ${amount} USDC`;
    }

    events.push({
      id: `tx-${tx.id}`,
      type: "transaction",
      icon: "$",
      description,
      timestamp: tx.created_at,
      sortKey: new Date(tx.created_at).getTime(),
    });
  }

  for (const task of tasks) {
    const input =
      task.user_input.length > 60
        ? task.user_input.slice(0, 57) + "..."
        : task.user_input;
    let icon: string;
    let description: string;

    if (task.status === "completed") {
      icon = "\u2713";
      description = `Task completed: "${input}"`;
      if (task.total_cost > 0) {
        description += ` ($${task.total_cost.toFixed(4)})`;
      }
    } else if (task.status === "decomposing" || task.status === "running") {
      icon = "\u25B6";
      description = `Task ${task.status}: "${input}"`;
    } else if (task.status === "failed") {
      icon = "\u2717";
      description = `Task failed: "${input}"`;
    } else {
      icon = "\u25CB";
      description = `Task ${task.status}: "${input}"`;
    }

    events.push({
      id: `task-${task.id}`,
      type: "task",
      icon,
      description,
      timestamp: task.created_at,
      sortKey: new Date(task.created_at).getTime(),
    });
  }

  events.sort((a, b) => b.sortKey - a.sortKey);
  return events;
}

export function LiveActivityTicker() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [prevIds, setPrevIds] = useState<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch("/api/activity");
        if (!res.ok) return;
        const data = await res.json();
        const built = buildEvents(data.transactions ?? [], data.tasks ?? []);

        setEvents((prev) => {
          const oldIds = new Set(prev.map((e) => e.id));
          const incoming = new Set(built.map((e) => e.id));
          const fresh = new Set<string>();
          for (const id of incoming) {
            if (!oldIds.has(id)) fresh.add(id);
          }
          setPrevIds(oldIds);
          setNewIds(fresh);
          return built;
        });
      } catch {
        // silently ignore fetch errors
      }
    }

    fetchActivity();
    intervalRef.current = setInterval(fetchActivity, 15_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Clear animation class after transition
  useEffect(() => {
    if (newIds.size === 0) return;
    const timer = setTimeout(() => setNewIds(new Set()), 500);
    return () => clearTimeout(timer);
  }, [newIds]);

  const isEmpty = events.length === 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{
        background:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, transparent 60%), var(--bg-primary)",
        border: "1px solid var(--border-light)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl"
        style={{ backgroundColor: "rgba(74, 124, 89, 0.16)" }}
      />
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "var(--accent-green)",
            boxShadow: "0 0 6px var(--accent-green)",
            animation: "pulse-dot 2s ease-in-out infinite",
          }}
        />
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Live Activity
        </h3>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          auto-refreshes every 15s
        </span>
      </div>

      {/* Feed */}
      <div
        style={{
          maxHeight: 148,
          overflowY: "auto",
          scrollbarWidth: "thin",
        }}
      >
        {isEmpty ? (
          <p className="py-4 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            No activity yet. Run a task or trigger a transaction to see events here.
          </p>
        ) : (
          <div className="space-y-1">
            {events.map((event) => {
              const isNew = newIds.has(event.id) && prevIds.size > 0;
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300 hover:translate-x-0.5"
                  style={{
                    backgroundColor: isNew
                      ? "var(--bg-tertiary)"
                      : "var(--bg-secondary)",
                    transition: "background-color 0.5s ease",
                    animation: isNew ? "slide-down 0.35s ease-out" : undefined,
                  }}
                >
                  {/* Icon */}
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor:
                        event.type === "transaction"
                          ? "var(--accent-green)"
                          : "var(--accent-amber)",
                      color: "#fff",
                    }}
                  >
                    {event.icon}
                  </span>

                  {/* Description */}
                  <span
                    className="min-w-0 flex-1 truncate text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {event.description}
                  </span>

                  {/* Timestamp */}
                  <span
                    className="flex-shrink-0 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {timeAgo(event.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Keyframes injected via style tag */}
      <style jsx global>{`
        @keyframes pulse-dot {
          0%,
          100% {
            opacity: 1;
            box-shadow: 0 0 6px var(--accent-green);
          }
          50% {
            opacity: 0.5;
            box-shadow: 0 0 12px var(--accent-green);
          }
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
