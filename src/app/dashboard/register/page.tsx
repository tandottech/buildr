"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "summarization",
    price_per_call: "",
    endpoint: "",
    locus_wallet_address: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price_per_call: parseFloat(form.price_per_call),
        }),
      });

      if (res.ok) {
        const agent = await res.json();
        router.push(`/dashboard/agent/${agent.id}`);
      } else {
        setError("Could not register your agent. Please check inputs and try again.");
      }
    } catch (err) {
      console.error("Failed to register agent:", err);
      setError("Network error while registering. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div
        className="relative overflow-hidden rounded-2xl border px-6 py-7 sm:px-8"
        style={{
          background:
            "radial-gradient(120% 120% at 0% 0%, rgba(74, 111, 165, 0.14), transparent 55%), radial-gradient(120% 130% at 100% 100%, rgba(74, 124, 89, 0.12), transparent 55%), var(--bg-primary)",
          borderColor: "var(--border-light)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          Marketplace Listing
        </p>
        <h1 className="text-page-title mb-3" style={{ color: "var(--text-primary)" }}>
          Register an Agent
        </h1>
        <p className="text-body max-w-2xl" style={{ color: "var(--text-secondary)" }}>
          Publish your AI agent profile, define pricing, and receive payments through your Locus wallet.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div
          className="xl:col-span-2 rounded-2xl border p-6 sm:p-8"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.06) 40%, var(--bg-primary) 100%)",
            borderColor: "var(--border-light)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="mb-7 flex items-center justify-between">
            <div>
              <h2 className="text-card-title" style={{ color: "var(--text-primary)" }}>
                Agent Details
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
                Complete all required fields to list your agent.
              </p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-light)",
              }}
            >
              {form.name.trim() ? "In progress" : "Draft"}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Input
              label="Agent Name"
              placeholder="e.g., SummarizeBot"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <Textarea
              label="Description"
              placeholder="What does your agent do?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />

            <div className="w-full">
              <label className="mb-2 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg bg-transparent px-0 py-3 text-body outline-none transition-all"
                style={{
                  borderBottom: "1px solid var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              >
                {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Price per Call"
              type="number"
              step="0.001"
              min="0.001"
              placeholder="0.005"
              prefix="$"
              suffix="USDC"
              value={form.price_per_call}
              onChange={(e) => setForm({ ...form, price_per_call: e.target.value })}
              required
            />

            <Input
              label="API Endpoint URL"
              placeholder="/api/agents/my-agent/execute"
              value={form.endpoint}
              onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
              required
            />

            <Input
              label="Locus Wallet Address"
              placeholder="locus_wallet_..."
              value={form.locus_wallet_address}
              onChange={(e) => setForm({ ...form, locus_wallet_address: e.target.value })}
              required
            />

            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  border: "1px solid rgba(165,74,74,0.35)",
                  backgroundColor: "rgba(165,74,74,0.1)",
                  color: "var(--accent-red)",
                }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              arrow
              disabled={loading}
              className="w-full shadow-md"
            >
              {loading ? "Registering..." : "Register Agent"}
            </Button>
          </form>
        </div>

        <aside className="space-y-4">
          <div
            className="rounded-2xl border p-5"
            style={{
              backgroundColor: "var(--bg-primary)",
              borderColor: "var(--border-light)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-tertiary)" }}>
              Quick Checklist
            </h3>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li>Use a clear, brandable agent name.</li>
              <li>Explain your output quality in description.</li>
              <li>Set realistic USDC pricing for first users.</li>
              <li>Verify endpoint latency and reliability.</li>
              <li>Double-check wallet address before submit.</li>
            </ul>
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{
              background:
                "linear-gradient(150deg, rgba(74,111,165,0.12) 0%, rgba(74,124,89,0.12) 100%), var(--bg-primary)",
              borderColor: "var(--border-light)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3 className="text-card-title mb-2" style={{ color: "var(--text-primary)" }}>
              Submission Preview
            </h3>
            <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>
              A quick summary of what gets listed publicly.
            </p>
            <div className="space-y-2 text-sm">
              <p style={{ color: "var(--text-primary)" }}>
                <strong>Name:</strong> {form.name.trim() || "Unnamed Agent"}
              </p>
              <p style={{ color: "var(--text-primary)" }}>
                <strong>Category:</strong> {form.category}
              </p>
              <p style={{ color: "var(--text-primary)" }}>
                <strong>Price:</strong> {form.price_per_call ? `$${form.price_per_call} USDC` : "Not set"}
              </p>
              <p className="truncate" style={{ color: "var(--text-primary)" }}>
                <strong>Endpoint:</strong> {form.endpoint || "Not set"}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
