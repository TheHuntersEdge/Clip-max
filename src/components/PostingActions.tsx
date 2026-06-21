"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function PostingActions({ hasAccounts }: { hasAccounts: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function call(label: string, url: string) {
    setBusy(label);
    setMsg(null);
    try {
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const json = await res.json();
      if (label === "demo") setMsg(json.created ? `Added ${json.created} accounts` : (json.reason ?? "done"));
      else setMsg(json.scheduled ? `Scheduled ${json.scheduled} posts across ${json.accounts} accounts` : (json.reason ?? "Nothing ready to schedule"));
      router.refresh();
    } catch {
      setMsg("Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      {!hasAccounts && (
        <button className="btn" onClick={() => call("demo", "/api/accounts")} disabled={busy !== null}>
          <Icon name="plus" />
          {busy === "demo" ? "Adding…" : "Add demo accounts"}
        </button>
      )}
      <button
        className="btn btn-pri"
        onClick={() => call("schedule", "/api/posts/schedule")}
        disabled={busy !== null || !hasAccounts}
      >
        <Icon name="zap" />
        {busy === "schedule" ? "Scheduling…" : "Auto-post ready clips"}
      </button>
      {msg && <span style={{ fontSize: 12.5, color: "var(--mut)" }}>{msg}</span>}
    </div>
  );
}
