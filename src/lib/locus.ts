const LOCUS_BASE_URL = "https://beta-api.paywithlocus.com/api";
const BASESCAN_TX_URL = "https://basescan.org/tx/";
const BASESCAN_ADDR_URL = "https://basescan.org/address/";

interface LocusResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface BalanceData {
  wallet_address: string;
  chain: string;
  usdc_balance: string;
  allowance: number | null;
  max_transaction_size: number | null;
}

interface SendData {
  transaction_id: string;
  queue_job_id: string;
  status: string;
  from_address: string;
  to_address: string;
  amount: number;
  token: string;
  approval_url?: string;
}

interface TransactionData {
  id: string;
  created_at: string;
  status: string;
  amount_usdc: string;
  memo: string;
  to_address: string;
  to_ens_name: string | null;
  recipient_email: string | null;
  category: string;
  tx_hash: string | null;
  tokens: Array<{
    amount: string;
    symbol: string;
    address: string;
    decimals: number;
    usdValue: number;
    amountRaw: string;
    amountFormatted: string;
  }>;
}

export interface WalletBalance {
  balance: number;
  currency: string;
  wallet_address: string;
  chain: string;
  basescan_url: string;
}

export async function getWalletBalance(apiKey: string): Promise<WalletBalance> {
  try {
    const res = await fetch(`${LOCUS_BASE_URL}/pay/balance`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[Locus] Balance check failed:", res.status, err);
      return { balance: 0, currency: "USDC", wallet_address: "", chain: "base", basescan_url: "" };
    }
    const json: LocusResponse<BalanceData> = await res.json();
    if (!json.success || !json.data) {
      return { balance: 0, currency: "USDC", wallet_address: "", chain: "base", basescan_url: "" };
    }
    const addr = json.data.wallet_address || "";
    return {
      balance: parseFloat(json.data.usdc_balance) || 0,
      currency: "USDC",
      wallet_address: addr,
      chain: json.data.chain || "base",
      basescan_url: addr ? `${BASESCAN_ADDR_URL}${addr}` : "",
    };
  } catch (err) {
    console.error("[Locus] Balance error:", err);
    return { balance: 0, currency: "USDC", wallet_address: "", chain: "base", basescan_url: "" };
  }
}

export interface TransferResult {
  success: boolean;
  tx_id: string;
  status: string;
  tx_hash: string | null;
  basescan_url: string | null;
  approval_url?: string;
  error?: string;
}

export async function transfer(
  apiKey: string,
  toAddress: string,
  amount: number,
  memo: string
): Promise<TransferResult> {
  try {
    const res = await fetch(`${LOCUS_BASE_URL}/pay/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to_address: toAddress,
        amount,
        memo,
      }),
    });

    const json: LocusResponse<SendData> = await res.json();

    if (!res.ok || !json.success || !json.data) {
      console.error("[Locus] Transfer failed:", res.status, json);
      return {
        success: false,
        tx_id: `failed_${crypto.randomUUID().slice(0, 8)}`,
        status: "failed",
        tx_hash: null,
        basescan_url: null,
        error: json.message || json.error || `HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      tx_id: json.data.transaction_id,
      status: json.data.status || "QUEUED",
      tx_hash: null, // tx_hash arrives after confirmation — fetch with getTransaction
      basescan_url: null,
      approval_url: json.data.approval_url,
    };
  } catch (err) {
    console.error("[Locus] Transfer error:", err);
    return {
      success: false,
      tx_id: `error_${crypto.randomUUID().slice(0, 8)}`,
      status: "error",
      tx_hash: null,
      basescan_url: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function getTransactions(apiKey: string, limit = 50): Promise<TransactionData[]> {
  try {
    const res = await fetch(`${LOCUS_BASE_URL}/pay/transactions?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return [];
    const json: LocusResponse<{ transactions: TransactionData[] }> = await res.json();
    return json.data?.transactions || [];
  } catch {
    return [];
  }
}

export async function getTransaction(apiKey: string, txId: string): Promise<TransactionData | null> {
  try {
    const res = await fetch(`${LOCUS_BASE_URL}/pay/transactions/${txId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    const json: LocusResponse<TransactionData> = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export function getBasescanTxUrl(txHash: string): string {
  return `${BASESCAN_TX_URL}${txHash}`;
}

export function getBasescanAddrUrl(address: string): string {
  return `${BASESCAN_ADDR_URL}${address}`;
}

export async function checkoutPreflight(apiKey: string, sessionId: string) {
  try {
    const res = await fetch(`${LOCUS_BASE_URL}/checkout/agent/preflight/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function payCheckout(apiKey: string, sessionId: string, payerEmail?: string) {
  try {
    const res = await fetch(`${LOCUS_BASE_URL}/checkout/agent/pay/${sessionId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payerEmail ? { payerEmail } : {}),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      console.error("[Locus] Checkout pay failed:", res.status, json);
      return null;
    }
    return json.data || null;
  } catch (err) {
    console.error("[Locus] Checkout error:", err);
    return null;
  }
}

export async function getCheckoutPaymentStatus(apiKey: string, txId: string) {
  try {
    const res = await fetch(`${LOCUS_BASE_URL}/checkout/agent/payments/${txId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function requestCredits(apiKey: string, reason: string, amountUsdc: number) {
  try {
    const res = await fetch(`${LOCUS_BASE_URL}/gift-code-requests`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason, requestedAmountUsdc: amountUsdc }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.message || json.error || `HTTP ${res.status}` };
    }
    return { success: true, data: json.data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function getCreditRequests(apiKey: string) {
  try {
    const res = await fetch(`${LOCUS_BASE_URL}/gift-code-requests/mine`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}
