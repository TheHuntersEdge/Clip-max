import { PageShell } from "@/components/PageShell";
import { findNavItem } from "@/lib/nav";

const meta = findNavItem("/marketplace")!;

export default function MarketplacePage() {
  return (
    <PageShell title={meta.title} description={meta.description} icon={meta.icon} />
  );
}
