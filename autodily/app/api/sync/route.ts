import { NextRequest, NextResponse } from "next/server";
import { syncProducts } from "@/lib/sync";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const limit = body.limit;
    const dryRun = body.dryRun ?? false;

    const result = await syncProducts({ limit, dryRun });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
