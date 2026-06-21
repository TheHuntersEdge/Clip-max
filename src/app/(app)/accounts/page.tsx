import { prisma } from "@/lib/prisma";
import { findNavItem } from "@/lib/nav";
import { Icon } from "@/components/icons";
import { PostingActions } from "@/components/PostingActions";

export const dynamic = "force-dynamic";

const meta = findNavItem("/accounts")!;

const PLATFORM: Record<string, { name: string; color: string }> = {
  TIKTOK: { name: "TikTok", color: "#25F4EE" },
  INSTAGRAM: { name: "Instagram", color: "#E1306C" },
  YOUTUBE: { name: "YouTube", color: "#FF0000" },
  FACEBOOK: { name: "Facebook", color: "#1877F2" },
};

const HEALTH_TAG: Record<string, [string, string]> = {
  HEALTHY: ["tag-good", "Healthy"],
  WARN: ["tag-warn", "Needs attention"],
  BANNED: ["tag-bad", "Banned"],
};

function fmt(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
}

export default async function AccountsPage() {
  const accounts = await prisma.socialAccount.findMany({ orderBy: { createdAt: "asc" } });
  const healthy = accounts.filter((a) => a.health === "HEALTHY").length;

  return (
    <div className="wrap">
      <div className="ph ph-row">
        <div>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
        <PostingActions hasAccounts={accounts.length > 0} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 22 }}>
        {[
          ["Total accounts", accounts.length],
          ["Healthy", healthy],
          ["Needs attention", accounts.length - healthy],
        ].map(([l, v], i) => (
          <div className="stat" key={i}>
            <div className="lbl">{l}</div>
            <div className="val">{v as number}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-h">
          <div className="card-t">Connected accounts</div>
        </div>
        {accounts.length === 0 ? (
          <div className="empty">
            <Icon name="users" />
            <h3>No accounts connected</h3>
            <div style={{ fontSize: 13 }}>
              Add a few demo accounts to see the posting pipeline fan clips out across them.
            </div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Account</th>
                <th>Platform</th>
                <th>Followers</th>
                <th>Source</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => {
                const p = PLATFORM[a.platform] ?? { name: a.platform, color: "#888" };
                const [cls, lbl] = HEALTH_TAG[a.health] ?? ["tag-mut", a.health];
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.handle}</td>
                    <td>
                      <span className="plat">
                        <span className="pd" style={{ background: p.color }} />
                        {p.name}
                      </span>
                    </td>
                    <td className="mono">{fmt(a.followers)}</td>
                    <td>
                      <span className={"tag " + (a.source === "PURCHASED" ? "tag-cy" : "tag-mut")}>
                        {a.source === "PURCHASED" ? "Marketplace" : "Connected"}
                      </span>
                    </td>
                    <td>
                      <span className={"tag " + cls}>{lbl}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
