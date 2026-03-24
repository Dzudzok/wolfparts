import { NextRequest, NextResponse } from "next/server";
import { validateOrder } from "@/lib/nextis-api";

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();
    if (!items?.length) {
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    const userToken = req.headers.get("x-user-token") || undefined;
    const result = await validateOrder(items, userToken);
    return NextResponse.json({ items: result });
  } catch (error) {
    console.error("Order validation error:", error);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
