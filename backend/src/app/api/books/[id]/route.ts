import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { corsHeaders } from "../../../../lib/auth";
import { requireAuth } from "@/middleware/requireAuth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const book = await prisma.book.findUnique({
    where: { id },
    include: { categoria: true },
  });
  if (!book) {
    return NextResponse.json({ error: "Livro não encontrado" }, { status: 404, headers: corsHeaders() });
  }
  return NextResponse.json({ book }, { headers: corsHeaders() });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["ADMIN"]);
  if (user instanceof NextResponse) return user;

  const { id } = await params;

  try {
    const body = await req.json();
    const book = await prisma.book.update({
      where: { id },
      data: body,
    });
    return NextResponse.json({ book }, { headers: corsHeaders() });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao atualizar livro" },
      { status: 400, headers: corsHeaders() }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req, ["ADMIN"]);
  if (user instanceof NextResponse) return user;

  const { id } = await params;

  try {
    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ message: "Livro removido" }, { headers: corsHeaders() });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao remover livro (pode ter empréstimos associados)" },
      { status: 400, headers: corsHeaders() }
    );
  }
}