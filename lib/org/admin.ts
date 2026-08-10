import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/actions/auth";

export async function requirePlatformAdmin() {
  const user = await requireUser();
  if (!user.isPlatformAdmin) redirect("/dashboard");
  return user;
}
