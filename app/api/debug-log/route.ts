import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("\n================ [DEBUG LOG DESDE CELULAR] ================");
    console.log(JSON.stringify(data, null, 2));
    console.log("===========================================================\n");
    return NextResponse.json({ ok: true, received: data });
  } catch (err: any) {
    console.error("[DEBUG LOG ERROR]", err);
    return NextResponse.json({ ok: false, error: err?.message }, { status: 400 });
  }
}
