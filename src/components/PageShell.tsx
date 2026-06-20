import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";

/**
 * Phase 0 page shell. Renders the standard page header plus an
 * empty-state placeholder so each route is real and navigable while
 * the feature is still to be built.
 */
export function PageShell({
  title,
  description,
  icon = "bolt",
  action,
}: {
  title: string;
  description: string;
  icon?: IconName;
  action?: ReactNode;
}) {
  return (
    <div className="wrap">
      <div className="ph ph-row">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {action}
      </div>

      <div className="card">
        <div className="empty">
          <Icon name={icon} />
          <h3>{title} — coming together</h3>
          <div style={{ fontSize: 13, maxWidth: 420, margin: "0 auto" }}>
            This page is scaffolded and wired into the app shell. The real{" "}
            {title.toLowerCase()} experience lands in a later build phase.
          </div>
        </div>
      </div>
    </div>
  );
}
