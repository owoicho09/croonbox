import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6 sm:py-20">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Get in Touch</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Questions about Croonbox, Enterprise plans, or your account? We&apos;re happy to help.
      </p>

      <Card className="mx-auto mt-10 max-w-sm text-left">
        <CardHeader>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary">
            <Mail className="h-5 w-5" />
          </span>
          <CardTitle className="pt-2">Email us</CardTitle>
          <CardDescription>We typically respond within one business day.</CardDescription>
        </CardHeader>
        <CardContent>
          <a href="mailto:hello@croonbox.app" className="font-medium text-primary hover:underline">
            hello@croonbox.app
          </a>
        </CardContent>
      </Card>
    </section>
  );
}
