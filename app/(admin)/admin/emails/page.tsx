import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailLog } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin · Emails" };

const statusVariant = {
  queued: "outline",
  sent: "success",
  delivered: "success",
  failed: "destructive",
} as const;

export default async function AdminEmailsPage() {
  const rows = await db.select().from(emailLog).orderBy(desc(emailLog.createdAt)).limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Email Log</h1>

      <Card>
        <CardContent className="divide-y divide-border py-0">
          {rows.map((email) => (
            <div key={email.id} className="flex items-start justify-between gap-4 py-4 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{email.recipient}</p>
                <p className="text-xs text-muted-foreground">
                  {email.type} · {new Date(email.createdAt).toLocaleString()}
                </p>
                {email.error && <p className="mt-1 break-words text-xs text-destructive">{email.error}</p>}
              </div>
              <Badge variant={statusVariant[email.status]} className="shrink-0">
                {email.status}
              </Badge>
            </div>
          ))}
          {rows.length === 0 && <p className="py-6 text-sm text-muted-foreground">No emails sent yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
