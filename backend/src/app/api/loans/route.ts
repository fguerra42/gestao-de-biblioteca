import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { corsHeaders } from "../../../lib/auth";
import { requireAuth } from "@/middleware/requireAuth";

const loanSchema = z.object({
  bookId: z.string().min(1),
  diasParaDevolucao: z.number().int().positive().default(14),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const loans = await prisma.loan.findMany({
    where: user.role === "ADMIN" ? undefined : { userId: user.id },
    include: { book: true, user: { select: { id: true, nome: true, email: true } } },
    orderBy: { dataEmprestimo: "desc" },
  });

  return NextResponse.json({ loans }, { headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  if (user.role === "ADMIN") {
    return NextResponse.json(
      { error: "Administradores não podem realizar empréstimos" },
      { status: 403, headers: corsHeaders() }
    );
  }

  try {
    const data = loanSchema.parse(await req.json());

    const result = await prisma.$transaction(async (tx) => {
      // Verifica se o livro existe
      const book = await tx.book.findUnique({ where: { id: data.bookId } });
      if (!book) throw new Error("NOT_FOUND");

      // UPDATE ATÔMICO: só decrementa se, no momento exato da escrita,
      // quantidadeDisponivel ainda for maior que 0. Isso elimina a condição
      // de corrida — o banco bloqueia a linha durante o UPDATE e reavalia
      // a condição "gt: 0" já com o valor mais recente gravado, mesmo sob
      // concorrência (várias requisições simultâneas para o mesmo livro).
      const atualizado = await tx.book.updateMany({
        where: { id: data.bookId, quantidadeDisponivel: { gt: 0 } },
        data: { quantidadeDisponivel: { decrement: 1 } },
      });

      if (atualizado.count === 0) throw new Error("NO_STOCK");

      const dataDevolucaoPrevista = new Date();
      dataDevolucaoPrevista.setDate(dataDevolucaoPrevista.getDate() + data.diasParaDevolucao);

      return tx.loan.create({
        data: {
          userId: user.id,
          bookId: book.id,
          dataDevolucaoPrevista,
          status: "ATIVO",
        },
        include: { book: true },
      });
    });

    return NextResponse.json({ loan: result }, { status: 201, headers: corsHeaders() });
  } catch (err: any) {
    if (err.name === "ZodError") {
      const mensagem = err.issues?.[0]?.message || err.errors?.[0]?.message || "Dados inválidos";
      return NextResponse.json({ error: mensagem }, { status: 400, headers: corsHeaders() });
    }
    if (err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Livro não encontrado" }, { status: 404, headers: corsHeaders() });
    }
    if (err.message === "NO_STOCK") {
      return NextResponse.json({ error: "Não há exemplares disponíveis" }, { status: 409, headers: corsHeaders() });
    }
    return NextResponse.json({ error: "Erro ao criar empréstimo" }, { status: 500, headers: corsHeaders() });
  }
}