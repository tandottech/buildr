"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";

interface WalletData {
  balance: number;
  currency: string;
  wallet_address: string;
  chain: string;
  basescan_url: string;
}

function truncateAddress(addr: string): string {
  if (!addr) return "";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function BaseDiamond() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <circle cx="5" cy="5" r="5" fill="#0052FF" />
    </svg>
  );
}

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="#34D399"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="2 6 5 9 10 3" />
      </svg>
    );
  }
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <path d="M2 8.5V2.5C2 1.948 2.448 1.5 3 1.5H8" />
    </svg>
  );
}

export function WalletWidget() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch("/api/locus/wallet", { cache: "no-store" });
      const data = (await res.json()) as WalletData;
      setWallet(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    const id = setInterval(fetchWallet, 30_000);
    return () => clearInterval(id);
  }, [fetchWallet]);

  const handleCopy = useCallback(() => {
    if (!wallet?.wallet_address) return;
    navigator.clipboard.writeText(wallet.wallet_address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [wallet]);

  const hasBalance = wallet !== null && wallet.balance > 0;
  const balanceStr =
    wallet !== null ? wallet.balance.toFixed(2) : loading ? "" : "0.00";

  return (
    <>
      <div
        style={{
          backgroundColor: "#1A1A1A",
          borderRadius: 12,
          padding: "14px 14px 12px",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        {/* Header: Chain + status dot */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 10,
              fontWeight: 600,
              color: "#8C8C8C",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <BaseDiamond />
            Base
          </span>
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: wallet !== null ? "#34D399" : "#525252",
              boxShadow:
                wallet !== null ? "0 0 6px rgba(52,211,153,0.5)" : "none",
            }}
          />
        </div>

        {/* Address row */}
        <button
          type="button"
          onClick={handleCopy}
          disabled={!wallet?.wallet_address}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "none",
            color: "#9A9A9A",
            padding: 0,
            cursor: wallet?.wallet_address ? "pointer" : "default",
            marginBottom: 8,
            fontSize: 11,
            fontFamily: "var(--font-mono, monospace)",
            letterSpacing: "0.01em",
          }}
          aria-label="Copy wallet address"
        >
          <span>
            {wallet?.wallet_address
              ? truncateAddress(wallet.wallet_address)
              : "—"}
          </span>
          <CopyIcon copied={copied} />
        </button>

        {/* Big balance */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              fontFeatureSettings: "'tnum'",
            }}
          >
            ${balanceStr || "0.00"}
          </span>
          {hasBalance && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#34D399",
              }}
            >
              &#x2191;
            </span>
          )}
          <span style={{ fontSize: 11, color: "#6B6B6B", marginLeft: 2 }}>
            USDC
          </span>
        </div>

        {/* Basescan link */}
        {wallet?.basescan_url && (
          <a
            href={wallet.basescan_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              fontSize: 10,
              color: "#6B8AFD",
              textDecoration: "none",
              letterSpacing: "0.02em",
              marginBottom: 10,
            }}
          >
            View on Basescan &#x2197;
          </a>
        )}

        {/* Request credits button */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={{
            width: "100%",
            marginTop: 4,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.04)",
            color: "#E0E0E0",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            transition: "background-color 150ms, color 150ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(255,255,255,0.04)";
            (e.currentTarget as HTMLButtonElement).style.color = "#E0E0E0";
          }}
        >
          + Request Credits
        </button>
      </div>

      <CreditsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchWallet}
      />
    </>
  );
}

/* ── Credits request modal ────────────────────────────────────── */

function CreditsModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(10);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    { ok: true; message: string } | { ok: false; message: string } | null
  >(null);

  useEffect(() => {
    if (!open) {
      setAmount(10);
      setReason("");
      setResult(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!reason.trim() || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/locus/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim(), amount }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({
          ok: true,
          message: `Request submitted for ${amount} USDC. Reviewers will follow up soon.`,
        });
        onSuccess();
      } else {
        setResult({
          ok: false,
          message: data.error || "Request failed. Please try again.",
        });
      }
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setSubmitting(false);
    }
  }, [reason, amount, submitting, onSuccess]);

  return (
    <Modal open={open} onClose={onClose} title="Request USDC Credits">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Request additional USDC credits from the Locus team. Tell them why
          you need them and how much.
        </p>

        {/* Amount slider */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <label
              htmlFor="credit-amount"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Amount
            </label>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--accent-green)",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              ${amount} USDC
            </span>
          </div>
          <input
            id="credit-amount"
            type="range"
            min={5}
            max={50}
            step={5}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent-green)" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: "var(--text-muted)",
              marginTop: 4,
            }}
          >
            <span>$5</span>
            <span>$50</span>
          </div>
        </div>

        {/* Reason */}
        <div>
          <label
            htmlFor="credit-reason"
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 8,
            }}
          >
            Reason
          </label>
          <textarea
            id="credit-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us what you're building and why you need these credits..."
            rows={4}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--border-light)",
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
              fontSize: 13,
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>

        {/* Result banner */}
        {result && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              backgroundColor: result.ok
                ? "var(--accent-green-light)"
                : "var(--accent-red-light)",
              color: result.ok ? "var(--accent-green)" : "var(--accent-red)",
              border: `1px solid ${result.ok ? "var(--accent-green)" : "var(--accent-red)"}`,
            }}
          >
            {result.message}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "1px solid var(--border-light)",
              backgroundColor: "transparent",
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!reason.trim() || submitting || result?.ok === true}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "none",
              backgroundColor:
                !reason.trim() || submitting || result?.ok === true
                  ? "var(--bg-tertiary)"
                  : "var(--accent-green)",
              color:
                !reason.trim() || submitting || result?.ok === true
                  ? "var(--text-muted)"
                  : "#FFFFFF",
              fontSize: 13,
              fontWeight: 600,
              cursor:
                !reason.trim() || submitting || result?.ok === true
                  ? "default"
                  : "pointer",
            }}
          >
            {submitting
              ? "Submitting..."
              : result?.ok
                ? "Submitted"
                : "Submit Request"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
