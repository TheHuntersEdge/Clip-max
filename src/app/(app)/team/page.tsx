import { PageShell } from "@/components/PageShell";
import { findNavItem } from "@/lib/nav";

const meta = findNavItem("/team")!;

export default function TeamPage() {
  return (
    <PageShell title={meta.title} description={meta.description} icon={meta.icon} />
  );
}
