import { PageShell } from "@/components/PageShell";
import { findNavItem } from "@/lib/nav";

const meta = findNavItem("/analytics")!;

export default function AnalyticsPage() {
  return (
    <PageShell title={meta.title} description={meta.description} icon={meta.icon} />
  );
}
