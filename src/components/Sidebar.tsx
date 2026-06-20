"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/Logo";

export function Sidebar({ open = false }: { open?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className={"side" + (open ? " open" : "")}>
      <div className="brand">
        <div
          className="logo"
          style={{
            background: "#0a141a",
            border: "1px solid var(--line2)",
            boxShadow: "0 0 16px rgba(6,219,253,.25)",
          }}
        >
          <Logo size={20} />
        </div>
        <div>
          <div className="brand-name">
            Clip<b>Max</b>
          </div>
          <div className="brand-sub">Mass Distribution</div>
        </div>
      </div>

      <nav className="nav">
        {NAV.map((sec) => (
          <div key={sec.section}>
            <div className="nav-sec">{sec.section}</div>
            {sec.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={"nav-i" + (active ? " on" : "")}
                >
                  <Icon name={item.icon} />
                  {item.label}
                  {item.badge && <span className="badge">{item.badge}</span>}
                  {item.dot && <span className="dot" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="ws">
        <div className="ws-av">HU</div>
        <div style={{ flex: 1 }}>
          <div className="ws-name">HunterUncut</div>
          <div className="ws-tag">Pro · White Label</div>
        </div>
      </div>
    </aside>
  );
}
