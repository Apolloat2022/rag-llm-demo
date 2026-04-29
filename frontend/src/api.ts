import type { ChatResponse, UploadResponse } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function uploadPolicy(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function sendMessage(
  sessionId: string,
  message: string
): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function checkHealth(): Promise<{ status: string; vector_count: number }> {
  const res = await fetch(`${BASE}/api/health`);
  return res.json();
}
