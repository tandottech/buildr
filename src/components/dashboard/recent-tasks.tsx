import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/ui/price-tag";

interface TaskRow {
  id: string;
  user_input: string;
  status: string;
  sub_task_count: number;
  total_cost: number;
  created_at: string;
  completed_at: string | null;
}

function statusVariant(status: string): "green" | "blue" | "amber" | "red" | "default" {
  switch (status) {
    case "completed":
      return "green";
    case "executing":
    case "hiring":
    case "assembling":
      return "blue";
    case "decomposing":
      return "amber";
    case "failed":
      return "red";
    default:
      return "default";
  }
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return "in progress";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  return `${min}m ${remSec}s`;
}

export function RecentTasks({ tasks }: { tasks: TaskRow[] }) {
  if (tasks.length === 0) {
    return (
      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h3 className="text-card-title mb-4" style={{ color: "var(--text-primary)" }}>
          Recent Tasks
        </h3>
        <p className="py-8 text-center text-body" style={{ color: "var(--text-tertiary)" }}>
          No tasks have been orchestrated yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border p-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, transparent 50%), var(--bg-primary)",
        border: "1px solid var(--border-light)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-card-title" style={{ color: "var(--text-primary)" }}>
          Recent Tasks
        </h3>
        <span className="text-caption" style={{ color: "var(--text-tertiary)" }}>
          Orchestration history
        </span>
      </div>

      <div className="overflow-x-auto">
        <div
          className="mb-2 grid min-w-[760px] gap-4 rounded-lg px-4 py-2"
          style={{
            gridTemplateColumns: "2fr 110px 90px 110px 110px",
            backgroundColor: "var(--bg-tertiary)",
          }}
        >
          <span className="text-caption font-medium" style={{ color: "var(--text-tertiary)" }}>
            Task
          </span>
          <span className="text-caption font-medium" style={{ color: "var(--text-tertiary)" }}>
            Status
          </span>
          <span className="text-caption font-medium text-center" style={{ color: "var(--text-tertiary)" }}>
            Sub-tasks
          </span>
          <span className="text-caption font-medium text-right" style={{ color: "var(--text-tertiary)" }}>
            Cost
          </span>
          <span className="text-caption font-medium text-right" style={{ color: "var(--text-tertiary)" }}>
            Duration
          </span>
        </div>

        <div className="min-w-[760px] space-y-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="grid items-center gap-4 rounded-lg px-4 py-3 transition-all duration-200 hover:translate-x-0.5"
            style={{
              gridTemplateColumns: "2fr 110px 90px 110px 110px",
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid transparent",
            }}
          >
            <p
              className="truncate text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
              title={task.user_input}
            >
              {task.user_input}
            </p>
            <div>
              <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
            </div>
            <span
              className="text-center text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {task.sub_task_count}
            </span>
            <div className="text-right">
              <PriceTag amount={task.total_cost} size="sm" />
            </div>
            <span
              className="text-right text-caption"
              style={{ color: "var(--text-tertiary)" }}
            >
              {formatDuration(task.created_at, task.completed_at)}
            </span>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
