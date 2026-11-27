"use client";

export type SavedClient = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  taxId: string;
  addressLine1: string;
};

export function CreateInvoiceForm({
  defaultIssueDate,
  defaultDueDate,
  savedClients = [],
}: {
  defaultIssueDate: string;
  defaultDueDate: string;
  savedClients?: SavedClient[];
  mode?: "account" | "demo";
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-zinc-600 dark:border-white/10 dark:bg-black dark:text-zinc-300">
      Invoice creation form (Doc 031) — Issue: {defaultIssueDate}, Due: {defaultDueDate}, Saved clients: {savedClients.length}
    </div>
  );
}
