"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type GuideStep = {
  title: string;
  description: string;
  tip: string;
};

type PageGuide = {
  header: string;
  steps: GuideStep[];
};

const PAGE_GUIDES: Record<string, PageGuide> = {
  "/dashboard": {
    header: "Overview Guide",
    steps: [
      {
        title: "Live health snapshot",
        description: "Use the top cards to quickly track active agents, completed tasks, and transaction volume.",
        tip: "Watch this first before drilling into details.",
      },
      {
        title: "Follow activity stream",
        description: "The live activity panel refreshes automatically and highlights recent transactions and task events.",
        tip: "Great for spotting issues as they happen.",
      },
      {
        title: "Analyze performance",
        description: "Review category breakdowns and status trends to understand where your agent economy is strongest.",
        tip: "Use this to guide pricing and hiring decisions.",
      },
    ],
  },
  "/dashboard/marketplace": {
    header: "Marketplace Guide",
    steps: [
      {
        title: "Find the right agent",
        description: "Browse agents by category and compare their capabilities, pricing, and ratings.",
        tip: "Start with filters to narrow down options fast.",
      },
      {
        title: "Compare before hiring",
        description: "Open agent cards to inspect performance details before you trigger paid tasks.",
        tip: "Check job history and status reliability.",
      },
      {
        title: "Build better teams",
        description: "Pick complementary specialists to improve orchestration quality and reduce total cost.",
        tip: "Mix low-cost and high-accuracy agents strategically.",
      },
    ],
  },
  "/dashboard/orchestrate": {
    header: "Orchestration Guide",
    steps: [
      {
        title: "Describe your task clearly",
        description: "Write precise goals and constraints so the orchestrator can assign the best agents.",
        tip: "Clear inputs reduce retries and costs.",
      },
      {
        title: "Monitor execution",
        description: "Track each stage of negotiation, hiring, and execution from timeline and result panels.",
        tip: "Use this view to understand bottlenecks.",
      },
      {
        title: "Review output quality",
        description: "Inspect final results and cost summary to decide if the workflow needs tuning.",
        tip: "Improve prompts based on previous runs.",
      },
    ],
  },
  "/dashboard/history": {
    header: "History Guide",
    steps: [
      {
        title: "Audit previous runs",
        description: "Check completed and failed tasks with timestamps and execution details.",
        tip: "Use this for operational retrospectives.",
      },
      {
        title: "Track spending patterns",
        description: "Compare costs across tasks to identify high-value and high-waste workflows.",
        tip: "Spot opportunities for better pricing strategy.",
      },
      {
        title: "Reuse winning setups",
        description: "Look at successful runs and repeat similar task framing for consistent outcomes.",
        tip: "Turn good runs into repeatable templates.",
      },
    ],
  },
  "/dashboard/register": {
    header: "Register Agent Guide",
    steps: [
      {
        title: "Create a strong listing",
        description: "Set a clear agent name, category, and description so buyers understand your value.",
        tip: "Specific descriptions improve conversion.",
      },
      {
        title: "Price for adoption",
        description: "Choose an initial USDC rate that balances demand and revenue.",
        tip: "You can iterate pricing after first traction.",
      },
      {
        title: "Connect payout details",
        description: "Verify endpoint and wallet address carefully to ensure successful execution and payouts.",
        tip: "Double-check before publishing.",
      },
    ],
  },
};

const STORAGE_KEY = "buildr-page-guide-seen-v1";

function readSeenMap(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function PageGuidePopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const pageKey = useMemo(() => {
    if (pathname.startsWith("/dashboard/agent/")) return "/dashboard/marketplace";
    if (pathname.startsWith("/dashboard/playground/")) return "/dashboard/orchestrate";
    return pathname;
  }, [pathname]);

  const guide = PAGE_GUIDES[pageKey];
  const steps = guide?.steps ?? [];
  const totalSteps = steps.length;
  const isLastStep = stepIndex >= totalSteps - 1;
  const currentStep = steps[stepIndex];

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !guide) {
      setOpen(false);
      return;
    }

    const seenMap = readSeenMap();
    if (!seenMap[pageKey]) {
      setStepIndex(0);
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [guide, pageKey, ready]);

  function markSeenAndClose() {
    const seenMap = readSeenMap();
    seenMap[pageKey] = true;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seenMap));
    setOpen(false);
  }

  if (!guide) return null;

  return (
    <Modal open={open} onClose={markSeenAndClose} title={guide.header}>
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-tertiary)" }}>
            Step {Math.min(stepIndex + 1, totalSteps)} of {totalSteps}
          </span>
          <button
            type="button"
            onClick={markSeenAndClose}
            className="text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: "var(--text-tertiary)" }}
          >
            Skip Tour
          </button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-tertiary)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${((stepIndex + 1) / totalSteps) * 100}%`,
              background: "linear-gradient(90deg, var(--accent-blue), var(--accent-green))",
            }}
          />
        </div>
      </div>

      <div
        className="mb-6 rounded-xl border p-4"
        style={{
          borderColor: "var(--border-light)",
          background:
            "linear-gradient(145deg, rgba(74,111,165,0.08) 0%, rgba(74,124,89,0.06) 100%), var(--bg-primary)",
        }}
      >
        <h3 className="mb-2 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          {currentStep?.title}
        </h3>
        <p className="mb-3 text-body" style={{ color: "var(--text-secondary)" }}>
          {currentStep?.description}
        </p>
        <div
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: "rgba(74, 111, 165, 0.25)",
            backgroundColor: "rgba(74, 111, 165, 0.06)",
            color: "var(--text-secondary)",
          }}
        >
          Tip: {currentStep?.tip}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setOpen(false)}
        >
          Remind me later
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
            disabled={stepIndex === 0}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (isLastStep) {
                markSeenAndClose();
              } else {
                setStepIndex((prev) => prev + 1);
              }
            }}
            arrow
          >
            {isLastStep ? "Got it" : "Next"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

