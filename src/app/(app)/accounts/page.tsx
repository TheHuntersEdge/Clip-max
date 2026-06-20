import { PageShell } from "@/components/PageShell";
import { findNavItem } from "@/lib/nav";

const meta = findNavItem("/accounts")!;

export default function AccountsPage() {
  return (
    <PageShell title={meta.title} description={meta.description} icon={meta.icon} />
  );
}
