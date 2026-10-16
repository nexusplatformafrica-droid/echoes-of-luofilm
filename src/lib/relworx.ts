import { cachedSetting } from "./app-settings";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  countryByCurrency,
  countryFromPhone,
  formatAmount,
  isValidFor,
  normalizeFor,
} from "./countries";

export type PaymentSettings = { backend_url?: string };

export const DEFAULT_PAYMENT_BACKEND = "https://function-bun-production-ab6c.up.railway.app";

/** Older Railway deployments that must never be used again. */
const RETIRED_BACKENDS = [
  "function-bun-production-e268",
  "function-bun-production-038e6",
  "function-bun-production-8264",
  "function-bun-production-9a7c",
];

export function paymentBackend() {
  const saved = cachedSetting<PaymentSettings>("payment", {});
  const url = (saved.backend_url || "").trim().replace(/\/+$/, "");
  if (!url || RETIRED_BACKENDS.some((r) => url.includes(r))) return DEFAULT_PAYMENT_BACKEND;
  return url;
}

export const CURRENCY_CODE = "UGX";
export const CURRENCY_LABEL = "UG SHS";
export const formatMoney = (n: number, currency = CURRENCY_CODE) =>
  currency === "UGX"
    ? `${CURRENCY_LABEL} ${Number(n || 0).toLocaleString("en-UG", { maximumFractionDigits: 0 })}`
    : formatAmount(Number(n || 0), currency);

/** Normalises a number, auto-detecting the country when possible. */
export function normalizeMsisdn(input: string) {
  const digits = (input ?? "").replace(/[^0-9]/g, "");
  const detected = countryFromPhone(digits);
  return normalizeFor(input, detected ?? DEFAULT_COUNTRY);
}

export const isValidMsisdn = (v: string) => {
  const detected = countryFromPhone((v ?? "").replace(/[^0-9]/g, ""));
  if (detected) return isValidFor(v, detected);
  return isValidFor(v, DEFAULT_COUNTRY);
};


export type DepositInput = {
  msisdn: string;
  amount: number;
  currency?: string;
  reference: string;
  description?: string;
  /** PawaPay provider code the customer confirmed (e.g. MTN_MOMO_UGA). */
  provider?: string | undefined;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
async function railway(method: "GET" | "POST", path: string, body?: unknown): Promise<any> {
  const res = await fetch(`${paymentBackend()}${path}`, {
    method,
    headers: { "content-type": "application/json", accept: "application/json" },
    body: body === undefined ? null : JSON.stringify(body),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false)
    throw new Error(String(json?.error ?? json?.message ?? `Payment server error ${res.status}`));
  return json;
}

/** Mobile money through Relworx via the Railway payments backend. */
export const relworx = {
  deposit: (input: DepositInput): Promise<any> =>
    railway("POST", "/api/deposit", {
      msisdn: normalizeMsisdn(input.msisdn),
      amount: input.amount,
      currency: input.currency ?? CURRENCY_CODE,
      reference: input.reference,
      description: input.description ?? "MOVIE MAX subscription",
    }),
  withdraw: (input: DepositInput): Promise<any> =>
    railway("POST", "/api/withdraw", {
      msisdn: normalizeMsisdn(input.msisdn),
      amount: input.amount,
      currency: input.currency ?? CURRENCY_CODE,
      reference: input.reference,
      description: input.description ?? "MOVIE MAX payout",
    }),
  requestStatus: (id: string, _kind: "deposits" | "payouts" = "deposits"): Promise<any> =>
    railway("GET", `/api/request-status?internal_reference=${encodeURIComponent(id)}`),
};

const SUCCESS = /^(success|successful|completed|complete|paid)$/i;
const FAILED = /^(failed|failure|cancelled|canceled|declined|error|rejected|expired)$/i;

export function readStatus(payload: any): {
  status: "pending" | "success" | "failed";
  message: string;
} {
  const raw =
    payload?.status ??
    payload?.data?.status ??
    payload?.request?.status ??
    payload?.transaction?.status ??
    payload?.request_status;
  const message = String(
    payload?.message ?? payload?.data?.message ?? payload?.request?.message ?? "",
  );
  if (typeof raw === "string") {
    if (SUCCESS.test(raw)) return { status: "success", message: message || "Payment received" };
    if (FAILED.test(raw)) return { status: "failed", message: message || "Payment failed" };
  }
  if (raw == null && payload?.success === false)
    return { status: "failed", message: message || "Payment failed" };
  return { status: "pending", message: message || "Waiting for confirmation" };
}

export type RelworxTx = {
  id: string;
  reference: string;
  internal_reference: string | null;
  msisdn: string | null;
  amount: number;
  currency: string;
  status: string;
  kind: string;
  created_at: string;
};

const pickArray = (payload: any): any[] => {
  for (const v of [
    payload?.transactions,
    payload?.data?.transactions,
    payload?.data,
    payload?.results,
    payload,
  ])
    if (Array.isArray(v)) return v;
  return [];
};

/** Mobile money transactions from the app ledger (PawaPay has no list endpoint). */
export async function listRelworxTransactions(): Promise<RelworxTx[]> {
  const { fdb } = await import("./fdb");
  const { data } = await fdb.from("luo_transactions").select("*");
  const rows = pickArray(data).filter((r) => r?.internal_reference && (r?.method === "mobile_money" || r?.kind === "withdraw"));
  return rows
    .map((r, i) => {
      const raw = String(r?.status ?? "pending");
      const status = SUCCESS.test(raw) ? "success" : FAILED.test(raw) ? "failed" : raw.toLowerCase();
      return {
        id: String(r?.id ?? `pp-${i}`),
        reference: String(r?.reference ?? "—"),
        internal_reference: r?.internal_reference ? String(r.internal_reference) : null,
        msisdn: r?.msisdn ? String(r.msisdn) : null,
        amount: Number(r?.amount ?? 0) || 0,
        currency: String(r?.currency ?? CURRENCY_CODE),
        status,
        kind: String(r?.kind ?? "payment"),
        created_at: String(r?.created_at ?? new Date().toISOString()),
      };
    })
    .sort((x, y) => (x.created_at < y.created_at ? 1 : -1));
}

export type WithdrawResult = {
  reference: string;
  internal_reference: string | null;
  status: "pending" | "success" | "failed";
  message: string;
  currency: string;
  msisdn: string;
};

/**
 * Sends money out of the Relworx wallet to a mobile money number and waits a
 * short while for the provider to confirm it, so the admin sees a real result
 * instead of a "request created" placeholder.
 */
export async function sendWithdrawal(input: {
  phone: string;
  amount: number;
  currency?: string;
  description?: string;
}): Promise<WithdrawResult> {
  const target =
    countryFromPhone(input.phone) ??
    (input.currency ? countryByCurrency(input.currency) : DEFAULT_COUNTRY);
  const msisdn = normalizeFor(input.phone, target);
  if (!isValidFor(msisdn, target))
    throw new Error(`Enter a valid ${target.name} mobile money number`);
  const amount = Math.round(Number(input.amount));
  if (!amount || amount <= 0) throw new Error("Enter a valid amount");
  if (amount < target.min)
    throw new Error(`${target.currency} minimum payout is ${target.min.toLocaleString()}`);
  if (amount > target.max)
    throw new Error(`${target.currency} maximum payout is ${target.max.toLocaleString()}`);

  const reference = `LUO-WD-${Date.now()}`;
  const res = await relworx.withdraw({
    msisdn,
    amount,
    currency: target.currency,
    reference,
    description: input.description || "MOVIE MAX payout",
  });

  const internal = res?.internal_reference ?? res?.data?.internal_reference ?? null;
  if (!internal) {
    const first = readStatus(res);
    if (first.status === "failed") throw new Error(first.message || "The payout was rejected");
    return {
      reference,
      internal_reference: null,
      status: first.status,
      message: first.message,
      currency: target.currency,
      msisdn,
    };
  }

  // Poll for up to ~30s; anything still pending stays pending in the ledger.
  let last = readStatus(res);
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      last = readStatus(await relworx.requestStatus(String(internal), "payouts"));
    } catch {
      continue;
    }
    if (last.status !== "pending") break;
  }
  return {
    reference,
    internal_reference: String(internal),
    status: last.status,
    message:
      last.message ||
      (last.status === "success" ? "Payout sent" : "Payout is still being processed"),
    currency: target.currency,
    msisdn,
  };
}

export type CurrencyBalance = { currency: string; country: string; flag: string; balance: number | null };

/** Live Relworx wallet balance for a currency; null when unreachable. */
export async function walletBalance(currency = CURRENCY_CODE): Promise<number | null> {
  try {
    const r = await railway("GET", `/api/wallet/balance?currency=${encodeURIComponent(currency)}`);
    const n = Number(r?.balance ?? r?.data?.balance);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Live balance for every supported country wallet. */
export async function allWalletBalances(): Promise<CurrencyBalance[]> {
  return Promise.all(
    COUNTRIES.map(async (c) => ({ currency: c.currency, country: c.name, flag: c.flag, balance: await walletBalance(c.currency) })),
  );
}
