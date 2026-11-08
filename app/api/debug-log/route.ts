import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("\n================ [DEBUG LOG DESDE CELULAR] ================");
    console.log(JSON.stringify(data, null, 2));
    console.log("===========================================================\n");
    return NextResponse.json({ ok: true, received: data });
  } catch (err: unknown) {
    console.error("[DEBUG LOG ERROR]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
