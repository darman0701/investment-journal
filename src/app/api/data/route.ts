import { NextRequest, NextResponse } from "next/server";
import { put, head } from "@vercel/blob";

const BLOB_PATH = "investment-journal/entries.json";

interface EntriesData {
  trades: unknown[];
  watchlist: unknown[];
  rules: unknown[];
  analyses: unknown[];
}

const EMPTY_DATA: EntriesData = { trades: [], watchlist: [], rules: [], analyses: [] };

export async function GET() {
  try {
    const blob = await head(BLOB_PATH);
    if (!blob) return NextResponse.json(EMPTY_DATA);

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const res = await fetch(blob.url, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return NextResponse.json(EMPTY_DATA);

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(EMPTY_DATA);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data: EntriesData = await req.json();
    await put(BLOB_PATH, JSON.stringify(data), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
