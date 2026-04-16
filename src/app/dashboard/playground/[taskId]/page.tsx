"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PriceTag } from "@/components/ui/price-tag";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_COLORS } from "@/lib/constants";

interface SubTask {
  id: string;
  description: string;
  category: string;
  status: string;
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  result?: string;
}

interface TaskTransaction {
  id: string;
  amount: number;
  status: string;
  locus_tx_id: string;
  tx_hash: string | null;
  seller_name: string;
  task_description: string;
  created_at: string;
}

interface TaskData {
  id: string;
  user_input: string;
  status: string;
  sub_tasks: string;
  final_result: string;
  total_cost: number;
  created_at: string;
  completed_at: string | null;
  transactions: TaskTransaction[];
}

const STATUS_BADGE: Record<string, "green" | "red" | "blue" | "amber" | "default"> = {
  completed: "green",
  failed: "red",
  executing: "blue",
  pending: "default",
  assigned: "amber",
  paid: "green",
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateId(id: string): string {
  if (!id) return "---";
  if (id.length <= 16) return id;
  return id.slice(0, 8) + "..." + id.slice(-6);
}

function truncateHash(hash: string): string {
  if (!hash) return "";
  if (hash.length <= 14) return hash;
  return hash.slice(0, 8) + "..." + hash.slice(-4);
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", gap: 24 }}>
      <div style={{ flex: "0 0 65%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: 24,
                borderRadius: 12,
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Skeleton width="120px" height="20px" />
                <Skeleton width="80px" height="24px" />
                <Skeleton width="60px" height="24px" />
              </div>
              <Skeleton height="14px" width="90%" />
              <div style={{ marginTop: 12 }}>
                <Skeleton height="80px" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: "0 0 35%" }}>
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-light)",
          }}
        >
          <Skeleton height="16px" width="60%" />
          <div style={{ marginTop: 12 }}>
            <Skeleton height="60px" />
          </div>
          <div style={{ marginTop: 16 }}>
            <Skeleton height="16px" width="40%" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlaygroundPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  const router = useRouter();
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}`)
      .then((res) => res.json())
      .then((data) => {
        setTask(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [taskId]);

  const subTasks: SubTask[] = (() => {
    if (!task?.sub_tasks) return [];
    try {
      return JSON.parse(task.sub_tasks);
    } catch {
      return [];
    }
  })();

  const handleCopyAll = useCallback(() => {
    if (!task) return;
    const parts: string[] = [];
    for (const st of subTasks) {
      if (st.result) {
        parts.push(`## ${st.assigned_agent_name || "Agent"}\n\n${st.result}`);
      }
    }
    if (task.final_result) {
      parts.push(`## Final Result\n\n${task.final_result}`);
    }
    navigator.clipboard.writeText(parts.join("\n\n---\n\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [task, subTasks]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!task) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "64px 24px",
          color: "var(--text-tertiary)",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>&#x26A0;</div>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
          Task not found
        </div>
        <div style={{ fontSize: 14, marginBottom: 20 }}>
          The task may have been deleted or the ID is invalid.
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/history")}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            backgroundColor: "var(--accent-blue)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          View History
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      {/* Left panel — 65% */}
      <div style={{ flex: "0 0 65%", minWidth: 0 }}>
        {/* Agent outputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {subTasks
            .filter((st) => st.result)
            .map((st, i) => {
              const catColor = CATEGORY_COLORS[st.category] || {
                bg: "var(--bg-tertiary)",
                text: "var(--text-secondary)",
              };
              return (
                <div
                  key={st.id || i}
                  style={{
                    borderRadius: 12,
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-light)",
                    overflow: "hidden",
                  }}
                >
                  {/* Card header */}
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid var(--border-light)",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {st.assigned_agent_name || "Agent"}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "2px 10px",
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: catColor.bg,
                        color: catColor.text,
                      }}
                    >
                      {st.category}
                    </span>
                    <Badge variant={STATUS_BADGE[st.status] || "default"}>
                      {st.status}
                    </Badge>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: "16px 20px" }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        marginBottom: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {st.description}
                    </div>
                    <Markdown content={st.result || ""} />
                  </div>
                </div>
              );
            })}
        </div>

        {/* Final assembled result */}
        {task.final_result && (
          <div
            style={{
              marginTop: 24,
              borderRadius: 12,
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--accent-green)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--accent-green)",
                background:
                  "linear-gradient(135deg, var(--accent-green-light) 0%, rgba(74,124,89,0.08) 100%)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: "var(--accent-green)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  ✓
                </div>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--accent-green)",
                  }}
                >
                  Final Assembled Result
                </span>
              </div>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <Markdown content={task.final_result} />
            </div>
          </div>
        )}
      </div>

      {/* Right panel — 35%, sticky */}
      <div
        style={{
          flex: "0 0 35%",
          position: "sticky",
          top: 80,
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Task Info card */}
        <div
          style={{
            borderRadius: 12,
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-light)",
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-tertiary)",
              marginBottom: 10,
            }}
          >
            Task
          </div>
          <div
            style={{
              fontSize: 14,
              color: "var(--text-primary)",
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            {task.user_input}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Badge variant={STATUS_BADGE[task.status] || "default"}>
              {task.status}
            </Badge>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Created</span>
              <span style={{ color: "var(--text-secondary)" }}>
                {formatTimestamp(task.created_at)}
              </span>
            </div>
            {task.completed_at && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Completed</span>
                <span style={{ color: "var(--text-secondary)" }}>
                  {formatTimestamp(task.completed_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Breakdown card */}
        <div
          style={{
            borderRadius: 12,
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-light)",
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-tertiary)",
              marginBottom: 14,
            }}
          >
            Payment Breakdown
          </div>

          {task.transactions && task.transactions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {task.transactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--text-primary)",
                      }}
                    >
                      {tx.seller_name}
                    </span>
                    <PriceTag amount={tx.amount} size="sm" />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <Badge
                      variant={
                        tx.status === "completed" || tx.status === "paid"
                          ? "green"
                          : tx.status === "failed"
                            ? "red"
                            : "amber"
                      }
                    >
                      {tx.status}
                    </Badge>
                    {tx.locus_tx_id && (
                      <span
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: 11,
                          color: "var(--text-muted)",
                        }}
                      >
                        {truncateId(tx.locus_tx_id)}
                      </span>
                    )}
                  </div>
                  {/* On-chain tx_hash row */}
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: "1px dashed var(--border-light)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                      fontSize: 11,
                    }}
                  >
                    {tx.tx_hash ? (
                      <>
                        <span
                          style={{
                            fontFamily: "var(--font-mono, monospace)",
                            color: "var(--accent-green)",
                            fontWeight: 500,
                          }}
                          title={tx.tx_hash}
                        >
                          {truncateHash(tx.tx_hash)}
                        </span>
                        <a
                          href={`https://basescan.org/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            padding: "2px 8px",
                            borderRadius: 9999,
                            backgroundColor: "var(--accent-green-light)",
                            color: "var(--accent-green)",
                            border: "1px solid var(--accent-green)",
                            fontWeight: 500,
                            textDecoration: "none",
                            fontSize: 10,
                          }}
                        >
                          View on Basescan &#x2197;
                        </a>
                      </>
                    ) : (
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontStyle: "italic",
                        }}
                      >
                        Confirming on-chain...
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Divider */}
              <div
                style={{
                  borderTop: "1px solid var(--border-light)",
                  margin: "4px 0",
                }}
              />

              {/* Total row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 0",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Total
                </span>
                <PriceTag amount={task.total_cost} size="md" />
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                All payments via Locus in USDC on Base
              </div>
            </div>
          ) : (
            <div
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "12px 0",
              }}
            >
              No transactions recorded
            </div>
          )}
        </div>

        {/* Actions card */}
        <div
          style={{
            borderRadius: 12,
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-light)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={handleCopyAll}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 8,
              backgroundColor: copied ? "var(--accent-green-light)" : "var(--bg-secondary)",
              border: `1px solid ${copied ? "var(--accent-green)" : "var(--border-light)"}`,
              color: copied ? "var(--accent-green)" : "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {copied ? "✓ Copied!" : "Copy All Results"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/orchestrate")}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 8,
              backgroundColor: "var(--accent-blue)",
              border: "none",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Run Again
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/history")}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 8,
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-light)",
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            View History
          </button>
        </div>
      </div>
    </div>
  );
}
