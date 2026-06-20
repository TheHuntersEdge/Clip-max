import { PageShell } from "@/components/PageShell";
import { findNavItem } from "@/lib/nav";

const meta = findNavItem("/inbox")!;

export default function InboxPage() {
  return (
    <PageShell title={meta.title} description={meta.description} icon={meta.icon} />
  );
}
