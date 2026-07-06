import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { corsHeaders } from "../../../../lib/auth";
import { requireAuth } from "@/middleware/requireAuth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  const user = requireAuth(req, ["ADMIN"]);
  if (user instanceof NextResponse) return user;

  const [totalLivros, totalUtilizadores, emprestimosAtivos, emprestimosAtrasados] = await Promise.all([
    prisma.book.count(),
    prisma.user.count(),
    prisma.loan.count({ where: { status: "ATIVO" } }),
    prisma.loan.count({ where: { status: "ATIVO", dataDevolucaoPrevista: { lt: new Date() } } }),
  ]);

  // Empréstimos por mês (últimos 6 meses)
  const seisMesesAtras = new Date();
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
  const emprestimosRecentes = await prisma.loan.findMany({
    where: { dataEmprestimo: { gte: seisMesesAtras } },
    select: { dataEmprestimo: true },
  });
  const porMes: Record<string, number> = {};
  emprestimosRecentes.forEach((l) => {
    const chave = `${l.dataEmprestimo.getFullYear()}-${String(l.dataEmprestimo.getMonth() + 1).padStart(2, "0")}`;
    porMes[chave] = (porMes[chave] || 0) + 1;
  });
  const emprestimosPorMes = Object.entries(porMes)
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([mes, total]) => ({ mes, total }));

  // Top 5 livros mais emprestados
  const topLivrosRaw = await prisma.loan.groupBy({
    by: ["bookId"],
    _count: { bookId: true },
    orderBy: { _count: { bookId: "desc" } },
    take: 5,
  });
  const topLivros = await Promise.all(
    topLivrosRaw.map(async (item) => {
      const book = await prisma.book.findUnique({ where: { id: item.bookId } });
      return { titulo: book?.titulo || "Desconhecido", totalEmprestimos: item._count.bookId };
    })
  );

  return NextResponse.json(
    {
      totalLivros,
      totalUtilizadores,
      emprestimosAtivos,
      emprestimosAtrasados,
      emprestimosPorMes,
      topLivros,
    },
    { headers: corsHeaders() }
  );
}