import { NextRequest } from "next/server";
import { POST as criarEmprestimo } from "../route";
import { prisma } from "../../../../lib/prisma";
import { hashPassword, signToken } from "../../../../lib/auth";

describe("Teste de concorrência - vários utilizadores emprestando o mesmo livro", () => {
  const NUM_UTILIZADORES = 10;
  const QUANTIDADE_LIVRO = 3; // só 3 exemplares disponíveis

  let bookId: string;
  let userIds: string[] = [];
  let tokens: string[] = [];

  beforeAll(async () => {
    // Cria um livro com stock limitado
    const book = await prisma.book.create({
      data: {
        titulo: "Livro de Teste de Concorrência",
        autor: "Jest",
        isbn: `TESTE-CONCORRENCIA-${Date.now()}`,
        quantidadeTotal: QUANTIDADE_LIVRO,
        quantidadeDisponivel: QUANTIDADE_LIVRO,
      },
    });
    bookId = book.id;

    // Cria vários utilizadores diferentes
    for (let i = 0; i < NUM_UTILIZADORES; i++) {
      const passwordHash = await hashPassword("123456");
      const user = await prisma.user.create({
        data: {
          nome: `Utilizador Concorrente ${i}`,
          email: `concorrencia${i}.${Date.now()}@teste.com`,
          passwordHash,
          role: "USER",
        },
      });
      userIds.push(user.id);
      tokens.push(signToken({ id: user.id, role: "USER", email: user.email }));
    }
  });

  afterAll(async () => {
    // Limpeza: apaga empréstimos, depois utilizadores e o livro de teste
    await prisma.loan.deleteMany({ where: { bookId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.book.delete({ where: { id: bookId } });
    await prisma.$disconnect();
  });

  function criarRequestComToken(token: string) {
    const req = new NextRequest("http://10.0.0.10:3000/api/loans", {
      method: "POST",
      body: JSON.stringify({ bookId, diasParaDevolucao: 14 }),
    });
    // Simula o cookie de autenticação
    req.cookies.set("token", token);
    return req;
  }

  it(`deve permitir só ${QUANTIDADE_LIVRO} empréstimos de ${NUM_UTILIZADORES} tentativas simultâneas`, async () => {
    // Dispara TODAS as requisições ao mesmo tempo (Promise.all = concorrência real)
    const resultados = await Promise.all(
      tokens.map((token) => criarEmprestimo(criarRequestComToken(token)))
    );

    const respostas = await Promise.all(resultados.map((r) => r.json().then((data) => ({ status: r.status, data }))));

    const sucessos = respostas.filter((r) => r.status === 201);
    const falhas = respostas.filter((r) => r.status === 409);

    console.log(`✅ Sucessos: ${sucessos.length} | ❌ Sem stock: ${falhas.length}`);

    // O número de sucessos NUNCA pode ultrapassar o stock disponível
    expect(sucessos.length).toBe(QUANTIDADE_LIVRO);
    expect(falhas.length).toBe(NUM_UTILIZADORES - QUANTIDADE_LIVRO);

    // Confirma no banco que o stock ficou exatamente em 0 (não negativo, não sobrando)
    const bookFinal = await prisma.book.findUnique({ where: { id: bookId } });
    expect(bookFinal?.quantidadeDisponivel).toBe(0);

    // Confirma que só foram criados exatamente 3 empréstimos no banco
    const loansCount = await prisma.loan.count({ where: { bookId } });
    expect(loansCount).toBe(QUANTIDADE_LIVRO);
  });
});