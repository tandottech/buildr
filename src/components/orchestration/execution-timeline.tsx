"use client";

import { OrchestrationEvent } from "@/lib/schema";
import { AgentHireEvent } from "./agent-hire-event";
import { NegotiationLog } from "./negotiation-log";
import { ResultPanel } from "./result-panel";
import { Badge } from "@/components/ui/badge";

/* Color map for icon backgrounds by event type */
function getIconStyle(eventType: string, status?: string): React.CSSProperties {
  switch (eventType) {
    case "decomposition":
      return { backgroundColor: "var(--accent-blue)", color: "#fff" };
    case "discovery":
      return { backgroundColor: "var(--accent-blue-light)", color: "var(--accent-blue)" };
    case "negotiation":
      return { backgroundColor: "var(--accent-amber)", color: "#fff" };
    case "payment":
      return { backgroundColor: "var(--accent-green)", color: "#fff" };
    case "execution":
      return status === "completed"
        ? { backgroundColor: "var(--accent-green)", color: "#fff" }
        : { backgroundColor: "var(--accent-amber)", color: "#fff" };
    case "assembly":
      return { backgroundColor: "var(--accent-blue)", color: "#fff" };
    case "completion":
      return { backgroundColor: "var(--accent-green)", color: "#fff" };
    case "error":
      return { backgroundColor: "var(--accent-red)", color: "#fff" };
    default:
      return { backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" };
  }
}

export function ExecutionTimeline({ events }: { events: OrchestrationEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-20">
        {/* Dashed circle with arrow illustration */}
        <div
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            border: "2px dashed var(--border-medium)",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-tertiary)" }}
        >
          Submit a task to begin
        </p>
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          Watch agents get discovered, hired, and paid in real-time
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {events.map((event, i) => (
        <TimelineEvent
          key={i}
          event={event}
          isLast={i === events.length - 1}
        />
      ))}
    </div>
  );
}

function TimelineEvent({
  event,
  isLast,
}: {
  event: OrchestrationEvent;
  isLast: boolean;
}) {
  const time = new Date(event.timestamp).toLocaleTimeString();
  const status = event.type === "execution" ? (event.data.status as string) : undefined;
  const iconStyle = getIconStyle(event.type, status);

  switch (event.type) {
    case "decomposition":
      return (
        <EventCard icon="◧" iconStyle={iconStyle} time={time} isLast={isLast}>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Task decomposed into {event.data.count as number} sub-tasks
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(event.data.sub_tasks as { category: string; description: string }[])?.map(
              (st, i) => (
                <Badge key={i} variant="blue">
                  {st.category}
                </Badge>
              )
            )}
          </div>
        </EventCard>
      );

    case "discovery":
      return (
        <EventCard icon="◉" iconStyle={iconStyle} time={time} isLast={isLast}>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Searching for{" "}
            <span className="font-medium">{event.data.category as string}</span>{" "}
            agents...
          </p>
        </EventCard>
      );

    case "negotiation":
      return (
        <EventCard icon="⇄" iconStyle={iconStyle} time={time} isLast={isLast}>
          <AgentHireEvent
            agentName={event.data.agent_name as string}
            category={event.data.category as string}
            askingPrice={event.data.asking_price as number}
            finalPrice={event.data.final_price as number}
            savingsPercent={event.data.savings_percent as number}
            txId=""
          />
          {Array.isArray(event.data.steps) && (
            <div className="mt-3">
              <NegotiationLog
                steps={
                  event.data.steps as {
                    round: number;
                    buyer_offer: number;
                    seller_counter: number;
                    accepted: boolean;
                  }[]
                }
                agentName={event.data.agent_name as string}
              />
            </div>
          )}
        </EventCard>
      );

    case "payment": {
      const txHash = event.data.tx_hash as string | null | undefined;
      const basescanUrl = event.data.basescan_url as string | null | undefined;
      const truncatedHash = txHash
        ? `${txHash.slice(0, 10)}...${txHash.slice(-6)}`
        : null;
      const isConfirmed = Boolean(txHash && basescanUrl);
      return (
        <EventCard
          icon="$"
          iconStyle={iconStyle}
          time={time}
          isLast={isLast}
          celebrate={isConfirmed}
        >
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            Paid{" "}
            <span className="font-medium">{event.data.agent_name as string}</span>{" "}
            <span className="font-mono" style={{ color: "var(--accent-amber)" }}>
              ${(event.data.amount as number).toFixed(4)} USDC
            </span>{" "}
            via Locus
          </p>
          <p
            className="mt-1 font-mono text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            tx: {event.data.locus_tx_id as string}
          </p>
          {isConfirmed && truncatedHash && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className="font-mono text-xs"
                style={{ color: "var(--accent-green)" }}
              >
                {truncatedHash}
              </span>
              <a
                href={basescanUrl as string}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: "var(--accent-green-light)",
                  color: "var(--accent-green)",
                  border: "1px solid var(--accent-green)",
                }}
              >
                View on Basescan &#x2197;
              </a>
            </div>
          )}
        </EventCard>
      );
    }

    case "execution": {
      const execStatus = event.data.status as string;
      return (
        <EventCard
          icon={execStatus === "completed" ? "✓" : "⚙"}
          iconStyle={iconStyle}
          time={time}
          isLast={isLast}
        >
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            {execStatus === "completed" ? (
              <>
                <span className="font-medium">
                  {event.data.agent_name as string}
                </span>{" "}
                delivered result
              </>
            ) : (
              <>
                <span className="font-medium">
                  {event.data.agent_name as string}
                </span>{" "}
                is working...
              </>
            )}
          </p>
          {execStatus === "completed" && typeof event.data.result === "string" && (
            <details className="mt-2">
              <summary
                className="cursor-pointer text-xs"
                style={{ color: "var(--accent-blue)" }}
              >
                View output
              </summary>
              <div
                className="mt-2 rounded-lg p-3 text-xs whitespace-pre-wrap"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                {event.data.result as string}
              </div>
            </details>
          )}
        </EventCard>
      );
    }

    case "assembly":
      return (
        <EventCard icon="▦" iconStyle={iconStyle} time={time} isLast={isLast}>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Assembling final result from {event.data.results_count as number}{" "}
            agents...
          </p>
        </EventCard>
      );

    case "completion":
      return (
        <ResultPanel
          totalCost={event.data.total_cost as number}
          agentsHired={event.data.agents_hired as number}
          finalResult={event.data.final_result as string}
        />
      );

    case "error":
      return (
        <EventCard icon="✕" iconStyle={iconStyle} time={time} isLast={isLast}>
          <p className="text-sm" style={{ color: "var(--accent-red)" }}>
            Error: {event.data.message as string}
          </p>
        </EventCard>
      );

    default:
      return null;
  }
}

function EventCard({
  icon,
  iconStyle,
  time,
  isLast,
  celebrate,
  children,
}: {
  icon: string;
  iconStyle: React.CSSProperties;
  time: string;
  isLast: boolean;
  celebrate?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`animate-fade-in relative flex gap-3 pb-5 ${celebrate ? "payment-celebrate" : ""}`}
    >
      {/* Vertical connecting line */}
      {!isLast && (
        <div
          className="absolute left-4 top-9"
          style={{
            width: 1,
            bottom: 0,
            backgroundColor: "var(--border-light)",
          }}
        />
      )}
      {/* Icon circle — 32px */}
      <div
        className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        style={{ ...iconStyle, width: 32, height: 32 }}
      >
        {icon}
      </div>
      <div className="flex-1 pt-0.5">
        <p className="mb-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {time}
        </p>
        {children}
      </div>
    </div>
  );
}

// Injected once at module load on the client so the celebrate animation
// keyframes are always available to the timeline.
if (typeof window !== "undefined") {
  const STYLE_ID = "buildr-payment-celebrate-styles";
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .payment-celebrate {
        border-radius: 8px;
        animation: paymentGlow 2s ease-out 1;
      }
      @keyframes paymentGlow {
        0% {
          box-shadow: 0 0 0 0 rgba(74, 124, 89, 0);
          background-color: rgba(74, 124, 89, 0);
        }
        20% {
          box-shadow: 0 0 16px 2px rgba(74, 124, 89, 0.45);
          background-color: rgba(232, 240, 235, 0.6);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(74, 124, 89, 0);
          background-color: rgba(74, 124, 89, 0);
        }
      }
    `;
    document.head.appendChild(style);
  }
}
