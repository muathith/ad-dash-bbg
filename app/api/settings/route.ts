import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-server";

interface Settings {
  blockedCardBins: string[];
  allowedCountries: string[];
}

const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC_ID = "app_settings";

const defaultSettings: Settings = {
  blockedCardBins: [],
  allowedCountries: [],
};

const normalizeSettings = (value: unknown): Settings => {
  const data =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  const blockedCardBins = Array.isArray(data.blockedCardBins)
    ? data.blockedCardBins
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];

  const allowedCountries = Array.isArray(data.allowedCountries)
    ? data.allowedCountries
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().toUpperCase())
        .filter((item) => item.length > 0)
    : [];

  return {
    blockedCardBins: Array.from(new Set(blockedCardBins)),
    allowedCountries: Array.from(new Set(allowedCountries)),
  };
};

const getSettingsRef = () => doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);

export async function GET() {
  try {
    const settingsRef = getSettingsRef();
    const settingsDoc = await getDoc(settingsRef);

    if (!settingsDoc.exists()) {
      await setDoc(settingsRef, defaultSettings);
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(normalizeSettings(settingsDoc.data()));
  } catch (error) {
    console.error("Error loading settings:", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await request.json();
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      return NextResponse.json(
        { error: "Invalid payload. Expected JSON object." },
        { status: 400 }
      );
    }

    const body = payload as Record<string, unknown>;
    const updates: Partial<Settings> = {};

    if (body.blockedCardBins !== undefined) {
      if (!Array.isArray(body.blockedCardBins)) {
        return NextResponse.json(
          { error: "blockedCardBins must be an array." },
          { status: 400 }
        );
      }
      updates.blockedCardBins = body.blockedCardBins
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    if (body.allowedCountries !== undefined) {
      if (!Array.isArray(body.allowedCountries)) {
        return NextResponse.json(
          { error: "allowedCountries must be an array." },
          { status: 400 }
        );
      }
      updates.allowedCountries = body.allowedCountries
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().toUpperCase())
        .filter((item) => item.length > 0);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    const settingsRef = getSettingsRef();
    await setDoc(settingsRef, updates, { merge: true });

    const updatedDoc = await getDoc(settingsRef);
    return NextResponse.json(normalizeSettings(updatedDoc.data()));
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
