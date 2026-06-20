"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";

type Clip = {
  start: number;
  end: number;
  title: string;
  caption: string;
  reason: string;
  score: number;
};

type JobResult = {
  clips: Clip[];
  meta: {
    wordCount: number;
    durationSec: number;
    usage: { inputTokens: number; outputTokens: number };
  };
};

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const EXAMPLES = [
  "https://dpgr.am/spacewalk.wav",
];

export default function OperatorPage() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [clipCount, setClipCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobResult | null>(null);

  async function run() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/clip-job", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim(), title: title.trim() || undefined, clipCount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 880 }}>
      <div style={{ textAlign: "center", marginBottom: 32, paddingTop: 24 }}>
        <span className="tag tag-cy" style={{ marginBottom: 18 }}>
          <span
            style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)", display: "inline-block" }}
          />
          AI Operator
        </span>
        <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1.05, marginTop: 14 }}>
          What do you want to <span className="gradient-text">clip</span> today?
        </h1>
        <p style={{ color: "var(--mut)", fontSize: 15, marginTop: 14, maxWidth: 540, margin: "14px auto 0" }}>
          Drop a link to any audio or video. ClipMax transcribes it, finds the best moments with AI, and ranks
          them as ready-to-cut shorts.
        </p>
      </div>

      <div className="card" style={{ borderColor: "var(--line2)" }}>
        <label className="lbl-f">Media URL (audio or video)</label>
        <input
          className="inp"
          placeholder="https://…/stream.mp4"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && run()}
          style={{ marginBottom: 14 }}
        />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label className="lbl-f">Title (optional)</label>
            <input
              className="inp"
              placeholder="Cold Calling Live + Q&A"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label className="lbl-f">Clips</label>
            <input
              className="inp"
              type="number"
              min={1}
              max={30}
              value={clipCount}
              onChange={(e) => setClipCount(Math.max(1, Math.min(30, +e.target.value || 1)))}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <span style={{ fontSize: 12, color: "var(--mut2)" }}>
            {loading ? "Transcribing + scoring… this can take a moment." : "Transcript → AI scoring → ranked clips."}
          </span>
          <button className="btn btn-pri" onClick={run} disabled={loading || !url.trim()}>
            {loading ? "Working…" : "Find clips"}
            <Icon name={loading ? "refresh" : "zap"} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 16 }}>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            className="btn btn-sm btn-gho"
            style={{ borderColor: "var(--line)" }}
            onClick={() => setUrl(ex)}
          >
            Try a sample
          </button>
        ))}
      </div>

      {error && (
        <div
          className="card"
          style={{ marginTop: 20, borderColor: "rgba(232,93,82,.3)", background: "rgba(232,93,82,.06)" }}
        >
          <div style={{ color: "var(--bad)", fontSize: 13.5, fontWeight: 600 }}>Couldn’t make clips</div>
          <div style={{ color: "var(--mut)", fontSize: 13, marginTop: 6, wordBreak: "break-word" }}>{error}</div>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 28 }}>
          <div className="card-h">
            <div>
              <div className="card-t">
                {result.clips.length} clip{result.clips.length === 1 ? "" : "s"} found
              </div>
              <div className="card-d">
                {result.meta.wordCount.toLocaleString()} words · {fmt(result.meta.durationSec)} of audio
              </div>
            </div>
            <Icon name="film" style={{ width: 18, color: "var(--cyan)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {result.clips.map((c, i) => (
              <div key={i} className="card" style={{ padding: 16, display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 12,
                    background: "linear-gradient(160deg,#13242c,#0a141a)",
                    border: "1px solid var(--line2)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <span className="mono" style={{ fontSize: 18, fontWeight: 800, color: "var(--cyan)" }}>
                    {c.score}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{c.title}</span>
                    <span className="tag tag-cy">{c.caption}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--mut)", marginTop: 6 }}>
                    {fmt(c.start)} → {fmt(c.end)} · {Math.round(c.end - c.start)}s
                  </div>
                  <div style={{ fontSize: 13, color: "var(--mut)", marginTop: 8, lineHeight: 1.5 }}>{c.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
