import { NextRequest, NextResponse } from "next/server";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase-server";

const PAYS_COLLECTION = "pays";

const isValidIdList = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((item) => typeof item === "string" && item.trim().length > 0);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const ids = (payload as { ids?: unknown })?.ids;

    if (!isValidIdList(ids)) {
      return NextResponse.json(
        { error: "Invalid payload. Expected non-empty string[] ids." },
        { status: 400 }
      );
    }

    await Promise.all(
      ids.map((id) => deleteDoc(doc(db, PAYS_COLLECTION, id.trim())))
    );

    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (error) {
    console.error("Error deleting visitors:", error);
    return NextResponse.json(
      { error: "Failed to delete visitors" },
      { status: 500 }
    );
  }
}
