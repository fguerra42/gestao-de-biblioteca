import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { corsHeaders } from "../../../../lib/auth";
import { requireAuth } from "@/middleware/requireAuth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// Marca o empréstimo como devolvido e repõe o stock
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const { id } = await params;

  try {
    const loan = await prisma.loan.findUnique({ where: { id } });
    if (!loan) {
      return NextResponse.json({ error: "Empréstimo não encontrado" }, { status: 404, headers: corsHeaders() });
    }
    // USER só pode devolver o seu próprio empréstimo
    if (user.role !== "ADMIN" && loan.userId !== user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403, headers: corsHeaders() });
    }
    if (loan.status === "DEVOLVIDO") {
      return NextResponse.json({ error: "Empréstimo já foi devolvido" }, { status: 400, headers: corsHeaders() });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id: loan.bookId },
        data: { quantidadeDisponivel: { increment: 1 } },
      });
      return tx.loan.update({
        where: { id: loan.id },
        data: { status: "DEVOLVIDO", dataDevolucaoReal: new Date() },
      });
    });

    return NextResponse.json({ loan: updated }, { headers: corsHeaders() });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao processar devolução" }, { status: 500, headers: corsHeaders() });
  }
}