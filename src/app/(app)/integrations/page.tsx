import { PageShell } from "@/components/PageShell";
import { findNavItem } from "@/lib/nav";

const meta = findNavItem("/integrations")!;

export default function IntegrationsPage() {
  return (
    <PageShell title={meta.title} description={meta.description} icon={meta.icon} />
  );
}
