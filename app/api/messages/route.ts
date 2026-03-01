import { NextRequest, NextResponse } from "next/server";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase-server";

const MESSAGES_COLLECTION = "messages";

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

export async function GET(request: NextRequest) {
  try {
    const applicationId = request.nextUrl.searchParams.get("applicationId");
    if (!applicationId) {
      return NextResponse.json(
        { error: "applicationId query param is required." },
        { status: 400 }
      );
    }

    const messagesQuery = query(
      collection(db, MESSAGES_COLLECTION),
      where("applicationId", "==", applicationId),
      orderBy("timestamp", "asc")
    );

    const snapshot = await getDocs(messagesQuery);
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(serializeFirestoreValue(doc.data()) as Record<string, unknown>),
    }));

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error loading messages:", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    if (!isObject(payload)) {
      return NextResponse.json(
        { error: "Invalid payload. Expected JSON object." },
        { status: 400 }
      );
    }

    const safePayload = removeUndefinedShallow(payload);
    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
      ...safePayload,
      timestamp: serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
