import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "../../../../lib/prisma";
import { corsHeaders } from "../../../../lib/auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email é obrigatório" }, { status: 400, headers: corsHeaders() });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Por segurança, não revelamos se o email existe ou não
  if (!user) {
    return NextResponse.json(
      { message: "Se o email existir, um link de recuperação foi enviado." },
      { headers: corsHeaders() }
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 1000 * 60 * 30); // expira em 30 minutos

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  // SIMULAÇÃO: em produção, aqui enviaríamos um email com este link.
  // Para o exame, devolvemos o token/link diretamente na resposta.
  const resetLink = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}`;

  return NextResponse.json(
    {
      message: "Se o email existir, um link de recuperação foi enviado.",
      // Campo abaixo é só para demonstração/teste (simulação de envio de email):
      linkSimulado: resetLink,
    },
    { headers: corsHeaders() }
  );
}