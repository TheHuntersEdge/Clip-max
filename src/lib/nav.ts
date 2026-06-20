import type { IconName } from "@/components/icons";

export type NavItem = {
  key: string;
  href: string;
  label: string;
  icon: IconName;
  title: string;
  description: string;
  badge?: string;
  dot?: boolean;
};

export type NavSection = {
  section: string;
  items: NavItem[];
};

/**
 * Single source of truth for the sidebar + page shells.
 * Mirrors the section grouping and ordering of the ClipMax prototype.
 */
export const NAV: NavSection[] = [
  {
    section: "Create",
    items: [
      {
        key: "dashboard",
        href: "/dashboard",
        label: "Dashboard",
        icon: "grid",
        title: "Dashboard",
        description:
          "Your clipping machine at a glance. Connect a source, and ClipMax turns every stream into clips across every account — on autopilot.",
      },
      {
        key: "sources",
        href: "/sources",
        label: "Sources",
        icon: "stream",
        dot: true,
        title: "Sources",
        description:
          "Connect a channel once. ClipMax watches for every stream, and the second you go offline it pulls the VOD and starts clipping.",
      },
      {
        key: "clips",
        href: "/clips",
        label: "Clips",
        icon: "film",
        badge: "12",
        title: "Clips",
        description:
          "Every clip ClipMax cut, scored, and queued. Approve in bulk, tweak a caption, or let autopilot post them all.",
      },
      {
        key: "operator",
        href: "/operator",
        label: "AI Operator",
        icon: "bot",
        title: "AI Operator",
        description:
          "Tell the Operator a job in plain English. It drafts the work, you confirm, it runs the bulk job.",
      },
    ],
  },
  {
    section: "Distribute",
    items: [
      {
        key: "campaigns",
        href: "/campaigns",
        label: "Campaigns",
        icon: "flow",
        title: "Campaigns",
        description:
          "Posting drives that decide where clips go and how fast. The default sends every new clip to every account.",
      },
      {
        key: "calendar",
        href: "/calendar",
        label: "Calendar",
        icon: "cal",
        title: "Content Calendar",
        description:
          "Every scheduled and posted clip across your accounts, at a glance.",
      },
      {
        key: "accounts",
        href: "/accounts",
        label: "Accounts",
        icon: "users",
        title: "Accounts",
        description:
          "Every account your clips post to. Connect your own, or grab more from the marketplace — they all feed the same pipeline.",
      },
      {
        key: "marketplace",
        href: "/marketplace",
        label: "Marketplace",
        icon: "cart",
        badge: "New",
        title: "Account Marketplace",
        description:
          "Buy aged, warmed accounts and they auto-connect straight into your clipping pipeline — posting within minutes.",
      },
    ],
  },
  {
    section: "Measure & Manage",
    items: [
      {
        key: "analytics",
        href: "/analytics",
        label: "Analytics",
        icon: "chart",
        title: "Analytics",
        description: "How your clips perform across every account, last 30 days.",
      },
      {
        key: "inbox",
        href: "/inbox",
        label: "Inbox",
        icon: "inbox",
        title: "Inbox",
        description: "Comments and DMs from your clips, in one place.",
      },
      {
        key: "integrations",
        href: "/integrations",
        label: "Integrations",
        icon: "plug",
        title: "Integrations",
        description: "The services that power your clipping pipeline.",
      },
      {
        key: "team",
        href: "/team",
        label: "Team",
        icon: "users",
        title: "Team",
        description: "Invite teammates to collaborate in this workspace.",
      },
      {
        key: "white-label",
        href: "/white-label",
        label: "White Label",
        icon: "paint",
        title: "White Label",
        description:
          "Resell ClipMax under your own brand. Manage branding, domains, and client workspaces from one place.",
      },
    ],
  },
];

/** Flat lookup of every nav item by route href. */
export const NAV_ITEMS: NavItem[] = NAV.flatMap((s) => s.items);

export function findNavItem(href: string): NavItem | undefined {
  return NAV_ITEMS.find((i) => i.href === href);
}
