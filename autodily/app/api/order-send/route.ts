import { NextRequest, NextResponse } from "next/server";
import { sendOrder } from "@/lib/nextis-api";

export async function POST(req: NextRequest) {
  try {
    const { items, userOrder, userNote } = await req.json();
    if (!items?.length) {
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    const result = await sendOrder(items, userOrder);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Order send error:", error);
    return NextResponse.json({ error: "Order failed" }, { status: 500 });
  }
}
