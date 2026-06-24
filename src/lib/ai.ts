import type { GoogleGenAI } from "@google/genai";
import type { Proposal } from "../types";
import { ROLE_LABELS } from "../constants";

/**
 * Optional Gemini-powered assistance. Every feature degrades gracefully when
 * no API key is configured — `isAIEnabled()` gates the UI affordances.
 *
 * Set `VITE_GEMINI_API_KEY` in `.env.local` to enable.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const MODEL = "gemini-2.5-flash";

let client: GoogleGenAI | null = null;

export function isAIEnabled(): boolean {
  return Boolean(API_KEY);
}

async function getClient(): Promise<GoogleGenAI> {
  if (!API_KEY)
    throw new Error("AI is not configured. Set VITE_GEMINI_API_KEY.");
  if (!client) {
    // Lazy-load the SDK so it's excluded from the initial bundle.
    const { GoogleGenAI } = await import("@google/genai");
    client = new GoogleGenAI({ apiKey: API_KEY });
  }
  return client;
}

async function generate(prompt: string): Promise<string> {
  const ai = await getClient();
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });
  return (res.text ?? "").trim();
}

/** Build a compact text description of a proposal for prompting. */
function describeProposal(p: Proposal): string {
  const services = (p.services ?? []).join(", ") || "none";
  const roles: string[] = [];
  const collect = (obj: any) => {
    if (!obj || typeof obj !== "object") return;
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "number" && v > 0) {
        roles.push(`${ROLE_LABELS[k] ?? k}: ${v}`);
      } else if (v && typeof v === "object" && "qty" in (v as any)) {
        const qty = (v as any).qty;
        if (qty > 0) roles.push(`${ROLE_LABELS[k] ?? k}: ${qty}`);
      }
    }
  };
  collect(p.housekeeping);
  collect(p.security);
  collect(p.mep);
  collect(p.horticulture);
  collect(p.coaches);

  return [
    `Site: ${p.siteName} (${p.unitType})`,
    `Location: ${p.location}`,
    `Area: ${p.overallSqft ?? 0} sq.ft (clubhouse ${p.clubhouseSqft ?? 0} sq.ft)`,
    `Services: ${services}`,
    roles.length
      ? `Manpower — ${roles.join("; ")}`
      : "Manpower — not specified",
    `Tenure: ${p.tenureValue ?? "?"} ${p.tenureUnit ?? ""}`,
    `ESI & PF: ${p.esiPf ?? "?"}`,
    `Current quotation value: ₹${p.quotationValue ?? 0}`,
  ].join("\n");
}

export async function summarizeProposal(p: Proposal): Promise<string> {
  return generate(
    `You are a facilities-management sales analyst. Write a concise 3-4 sentence executive summary of this proposal for an internal pipeline review. Be specific and professional.\n\n${describeProposal(
      p,
    )}`,
  );
}

export async function draftClientEmail(p: Proposal): Promise<string> {
  return generate(
    `Write a warm, professional follow-up email to the client for the facilities-management proposal below. Keep it under 180 words, reference the services and the quoted value, and include a clear call to action. Output only the email body (no subject line).\n\n${describeProposal(
      p,
    )}`,
  );
}
