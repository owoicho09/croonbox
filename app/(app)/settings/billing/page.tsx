import { redirect } from "next/navigation";

export default async function BillingRedirect({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const query = new URLSearchParams({ tab: "billing", ...params }).toString();
  redirect(`/settings?${query}`);
}
