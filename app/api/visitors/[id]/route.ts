import { NextRequest, NextResponse } from "next/server";
import {
  deleteDoc,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase-server";

const PAYS_COLLECTION = "pays";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const removeUndefinedShallow = (data: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );

const serializeFirestoreValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as any).toDate === "function"
  ) {
    try {
      return (value as any).toDate().toISOString();
    } catch {
      return null;
    }
  }

  if (Array.isArray(value)) {
    return value.map(serializeFirestoreValue);
  }

  if (isObject(value)) {
    const serialized: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      const result = serializeFirestoreValue(nestedValue);
      if (result !== undefined) {
        serialized[key] = result;
      }
    }
    return serialized;
  }

  return value;
};

interface VisitorRouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: VisitorRouteParams) {
  try {
    const { id } = await context.params;
    const visitorRef = doc(db, PAYS_COLLECTION, id);
    const visitorDoc = await getDoc(visitorRef);

    if (!visitorDoc.exists()) {
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: visitorDoc.id,
      ...(serializeFirestoreValue(visitorDoc.data()) as Record<string, unknown>),
    });
  } catch (error) {
    console.error("Error getting visitor:", error);
    return NextResponse.json(
      { error: "Failed to get visitor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: VisitorRouteParams
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

    const { id: _ignoredId, createdAt: _ignoredCreatedAt, ...rest } = payload;
    const safePayload = removeUndefinedShallow(rest);

    if (Object.keys(safePayload).length === 0) {
      return NextResponse.json(
        { error: "No fields provided for update." },
        { status: 400 }
      );
    }

    const visitorRef = doc(db, PAYS_COLLECTION, id);
    await updateDoc(visitorRef, {
      ...safePayload,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating visitor:", error);
    return NextResponse.json(
      { error: "Failed to update visitor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: VisitorRouteParams
) {
  try {
    const { id } = await context.params;
    const visitorRef = doc(db, PAYS_COLLECTION, id);
    await deleteDoc(visitorRef);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting visitor:", error);
    return NextResponse.json(
      { error: "Failed to delete visitor" },
      { status: 500 }
    );
  }
}
