import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CreateInvoiceForm } from "@/components/invoice/create-invoice-form";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const instant = false;

export default async function NewInvoicePage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/sign-in");

  // Opt out of prerendering before reading the current time.
  await connection();

  const clients = await prisma.client.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      company: true,
      email: true,
      phone: true,
      taxId: true,
      addressLine1: true,
    },
  });

  const today = new Date();
  const due = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl dark:text-white">
            Create invoice
          </h1>
        </div>
        <Link
          href="/invoices"
          className="inline-flex items-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black hover:text-white dark:border-white/15 dark:text-white dark:hover:bg-white dark:hover:text-black"
        >
          All invoices
        </Link>
      </div>

      <CreateInvoiceForm
        defaultIssueDate={today.toISOString().slice(0, 10)}
        defaultDueDate={due.toISOString().slice(0, 10)}
        savedClients={clients.map((c) => ({
          id: c.id,
          name: c.name,
          company: c.company ?? "",
          email: c.email ?? "",
          phone: c.phone ?? "",
          taxId: c.taxId ?? "",
          addressLine1: c.addressLine1 ?? "",
        }))}
      />
    </main>
  );
}
