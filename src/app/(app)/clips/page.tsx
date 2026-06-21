import { prisma } from "@/lib/prisma";
import { findNavItem } from "@/lib/nav";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const meta = findNavItem("/clips")!;

const STATUS_TAG: Record<string, [string, string]> = {
  READY: ["tag-mut", "Ready"],
  RENDERING: ["tag-warn", "Rendering"],
  SCHEDULED: ["tag-cy", "Scheduled"],
  POSTED: ["tag-good", "Posted"],
  PENDING: ["tag-mut", "Pending"],
  FAILED: ["tag-bad", "Failed"],
};

function dur(start: number, end: number): string {
  const s = Math.max(0, Math.round(end - start));
  return `0:${s.toString().padStart(2, "0")}`;
}

export default async function ClipsPage() {
  // Note: never select `data` (the mp4 bytes) into a list query.
  const clips = await prisma.clip.findMany({
    orderBy: [{ createdAt: "desc" }, { score: "desc" }],
    take: 60,
    select: {
      id: true,
      title: true,
      caption: true,
      score: true,
      start: true,
      end: true,
      status: true,
      renderUrl: true,
      stream: { select: { title: true } },
    },
  });

  return (
    <div className="wrap">
      <div className="ph ph-row">
        <div>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
      </div>

      {clips.length === 0 ? (
        <div className="card">
          <div className="empty">
            <Icon name="film" />
            <h3>No clips yet</h3>
            <div style={{ fontSize: 13, maxWidth: 440, margin: "0 auto" }}>
              Run a job from the AI Operator (or POST a VOD URL to{" "}
              <span className="mono" style={{ color: "var(--cyan)" }}>/api/jobs</span>) and your
              AI-cut clips will appear here.
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 18 }}>
            {[
              ["film", "Total clips", clips.length],
              ["bolt", "Ready", clips.filter((c) => c.status === "READY").length],
              ["mega", "Posted", clips.filter((c) => c.status === "POSTED").length],
            ].map(([ic, label, val], i) => (
              <div className="stat" key={i}>
                <div className="lbl">
                  <Icon name={ic as string} />
                  {label}
                </div>
                <div className="val">{val as number}</div>
              </div>
            ))}
          </div>

          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}
          >
            {clips.map((c) => (
              <div className="clip" key={c.id}>
                <div className="clip-thumb" style={{ overflow: "hidden" }}>
                  {c.renderUrl ? (
                    <video
                      src={c.renderUrl}
                      controls
                      preload="metadata"
                      playsInline
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        background: "#0a141a",
                      }}
                    />
                  ) : (
                    <div style={{ color: "var(--mut2)", fontSize: 12 }}>rendering…</div>
                  )}
                  {typeof c.score === "number" && (
                    <span className="clip-score" style={{ zIndex: 2 }}>
                      {c.score}
                    </span>
                  )}
                  <span className="clip-dur" style={{ top: 10, bottom: "auto", zIndex: 2 }}>
                    {dur(c.start, c.end)}
                  </span>
                </div>
                <div className="clip-body">
                  <div className="clip-title">{c.title ?? "Untitled clip"}</div>
                  <div className="clip-meta" style={{ justifyContent: "space-between" }}>
                    {(() => {
                      const [cls, lbl] = STATUS_TAG[c.status] ?? ["tag-mut", c.status];
                      return <span className={"tag " + cls}>{lbl}</span>;
                    })()}
                    {c.caption && (
                      <span className="tag tag-cy" style={{ maxWidth: 130, overflow: "hidden" }}>
                        {c.caption}
                      </span>
                    )}
                  </div>
                  {c.stream?.title && (
                    <div style={{ fontSize: 11, color: "var(--mut2)", marginTop: 8 }}>
                      from {c.stream.title}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
