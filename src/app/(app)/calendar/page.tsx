import { prisma } from "@/lib/prisma";
import { findNavItem } from "@/lib/nav";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const meta = findNavItem("/calendar")!;

const PLATFORM: Record<string, { name: string; color: string }> = {
  TIKTOK: { name: "TikTok", color: "#25F4EE" },
  INSTAGRAM: { name: "Instagram", color: "#E1306C" },
  YOUTUBE: { name: "YouTube", color: "#FF0000" },
  FACEBOOK: { name: "Facebook", color: "#1877F2" },
};

function when(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type Metrics = { views?: number; url?: string } | null;

export default async function CalendarPage() {
  const posts = await prisma.post.findMany({
    orderBy: [{ scheduledAt: "asc" }],
    take: 100,
    include: {
      account: { select: { platform: true, handle: true } },
      clip: { select: { title: true, caption: true } },
    },
  });

  const scheduled = posts.filter((p) => p.status === "SCHEDULED");
  const posted = posts.filter((p) => p.status === "POSTED");

  function row(p: (typeof posts)[number]) {
    const plat = PLATFORM[p.account.platform] ?? { name: p.account.platform, color: "#888" };
    const m = p.metrics as Metrics;
    return (
      <div
        key={p.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "13px 0",
          borderTop: "1px solid var(--line)",
        }}
      >
        <span className="plat" style={{ flexShrink: 0 }}>
          <span className="pd" style={{ background: plat.color }} />
          {plat.name}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13.5,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {p.clip.title ?? "Clip"}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--mut)", marginTop: 2 }}>
            {p.account.handle} · {p.status === "POSTED" ? "posted" : "scheduled"} {when(p.status === "POSTED" ? p.postedAt : p.scheduledAt)}
          </div>
        </div>
        {p.status === "POSTED" ? (
          <span className="mono" style={{ fontSize: 12.5, color: "var(--cyan)", fontWeight: 700 }}>
            {m?.views != null ? `${m.views.toLocaleString()} views` : "posted"}
          </span>
        ) : (
          <span className="tag tag-cy">Scheduled</span>
        )}
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="ph">
        <h1>{meta.title}</h1>
        <p>{meta.description}</p>
      </div>

      {posts.length === 0 ? (
        <div className="card">
          <div className="empty">
            <Icon name="cal" />
            <h3>Nothing scheduled yet</h3>
            <div style={{ fontSize: 13 }}>
              Add accounts and hit <b>Auto-post ready clips</b> on the Accounts page — your posting
              schedule shows up here.
            </div>
          </div>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
          <div className="card">
            <div className="card-h">
              <div className="card-t">Upcoming</div>
              <span className="tag tag-cy">{scheduled.length}</span>
            </div>
            {scheduled.length ? scheduled.map(row) : <div style={{ fontSize: 13, color: "var(--mut2)" }}>All caught up.</div>}
          </div>
          <div className="card">
            <div className="card-h">
              <div className="card-t">Posted</div>
              <span className="tag tag-good">{posted.length}</span>
            </div>
            {posted.length ? posted.map(row) : <div style={{ fontSize: 13, color: "var(--mut2)" }}>Nothing posted yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
