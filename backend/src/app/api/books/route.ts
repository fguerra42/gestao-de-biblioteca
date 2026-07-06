import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { corsHeaders } from "../../../lib/auth";
import { requireAuth } from "@/middleware/requireAuth";

const bookSchema = z.object({
  titulo: z.string().min(1),
  autor: z.string().min(1),
  isbn: z.string().min(5),
  categoriaId: z.string().optional().nullable(),
  quantidadeTotal: z.number().int().positive(),
  capaUrl: z.string().url().optional().nullable(),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// Lista pública de livros (com pesquisa opcional ?q=)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const books = await prisma.book.findMany({
    where: q
      ? {
          OR: [
            { titulo: { contains: q, mode: "insensitive" } },
            { autor: { contains: q, mode: "insensitive" } },
            { isbn: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { categoria: true },
    orderBy: { titulo: "asc" },
  });

  return NextResponse.json({ books }, { headers: corsHeaders() });
}

// Criar livro (apenas ADMIN)
export async function POST(req: NextRequest) {
  const user = requireAuth(req, ["ADMIN"]);
  if (user instanceof NextResponse) return user;

  try {
    const data = bookSchema.parse(await req.json());

    const book = await prisma.book.create({
      data: {
        ...data,
        quantidadeDisponivel: data.quantidadeTotal,
      },
    });

    return NextResponse.json({ book }, { status: 201, headers: corsHeaders() });
  } catch (err: any) {
    if (err.name === "ZodError") {
  const mensagem = err.issues?.[0]?.message || err.errors?.[0]?.message || "Dados inválidos";
  return NextResponse.json(
    { error: mensagem },
    { status: 400, headers: corsHeaders() }
  );
}
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um livro com este ISBN" },
        { status: 409, headers: corsHeaders() }
      );
    }
    return NextResponse.json(
      { error: "Erro ao criar livro" },
      { status: 500, headers: corsHeaders() }
    );
  }
}