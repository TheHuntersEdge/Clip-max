"use client";

import { usePathname } from "next/navigation";
import { findNavItem } from "@/lib/nav";
import { Icon } from "@/components/icons";

export function Topbar() {
  const pathname = usePathname();
  const current = findNavItem(pathname);
  const title = current?.title ?? "Dashboard";

  return (
    <header className="top">
      <div className="crumb">
        ClipMax <span style={{ color: "var(--mut2)" }}>/</span> <b>{title}</b>
      </div>
      <div className="top-r">
        <span className="live-pill">
          <span className="b" />1 stream live
        </span>
        <button className="btn btn-sm" aria-label="Search">
          <Icon name="search" />
        </button>
      </div>
    </header>
  );
}
