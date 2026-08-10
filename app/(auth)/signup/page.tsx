import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Create your workspace</h1>
      <p className="mt-1 text-sm text-muted-foreground">Start hiring with structured video interviews.</p>
      <div className="mt-8">
        <SignupForm />
      </div>
    </div>
  );
}
