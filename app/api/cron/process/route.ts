import { NextRequest, NextResponse } from "next/server";
import { processNextJob } from "@/lib/processing/worker";

const MAX_JOBS_PER_INVOCATION = 10;

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function run(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let processed = 0;
  for (let i = 0; i < MAX_JOBS_PER_INVOCATION; i++) {
    const result = await processNextJob();
    if (result === "empty") break;
    processed++;
  }

  return NextResponse.json({ processed });
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
