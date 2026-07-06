import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { corsHeaders } from "../../../lib/auth";
import { requireAuth } from "@/middleware/requireAuth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json({ categories }, { headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["ADMIN"]);
  if (user instanceof NextResponse) return user;

  const { nome } = await req.json();
  if (!nome) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400, headers: corsHeaders() });
  }
  const category = await prisma.category.create({ data: { nome } });
  return NextResponse.json({ category }, { status: 201, headers: corsHeaders() });
}