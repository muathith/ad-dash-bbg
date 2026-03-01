import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-server";

const MESSAGES_COLLECTION = "messages";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const removeUndefinedShallow = (data: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );

interface MessageRouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  context: MessageRouteParams
) {
  try {
    const { id } = await context.params;
    const payload = await request.json();
    if (!isObject(payload)) {
      return NextResponse.json(
        { error: "Invalid payload. Expected JSON object." },
        { status: 400 }
      );
    }

    const safePayload = removeUndefinedShallow(payload);
    if (Object.keys(safePayload).length === 0) {
      return NextResponse.json(
        { error: "No fields provided for update." },
        { status: 400 }
      );
    }

    const messageRef = doc(db, MESSAGES_COLLECTION, id);
    await updateDoc(messageRef, safePayload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}
