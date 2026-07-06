import { NextResponse } from "next/server";
import { corsHeaders } from "../../../../lib/auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST() {
  const res = NextResponse.json({ message: "Sessão encerrada" }, { headers: corsHeaders() });
  res.cookies.set("token", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}