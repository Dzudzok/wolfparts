import { NextRequest, NextResponse } from "next/server";
import { sendOrder } from "@/lib/nextis-api";

export async function POST(req: NextRequest) {
  try {
    const { items, userOrder, userNote, customerInfo, deliveryAddress } = await req.json();
    if (!items?.length) {
      return NextResponse.json({ error: "Košík je prázdný" }, { status: 400 });
    }

    const userToken = req.headers.get("x-user-token") || undefined;
    const result = await sendOrder(items, userOrder, userToken, userNote, customerInfo, deliveryAddress);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Order send error:", error);
    return NextResponse.json({ error: "Chyba při odesílání objednávky" }, { status: 500 });
  }
}
