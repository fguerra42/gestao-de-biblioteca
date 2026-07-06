import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { hashPassword, corsHeaders } from "../../../../lib/auth";

const schema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  novaSenha: z.string().min(6, "Palavra-passe deve ter pelo menos 6 caracteres"),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());

    const user = await prisma.user.findFirst({
      where: {
        resetToken: data.token,
        resetTokenExpiry: { gt: new Date() }, // ainda não expirou
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const passwordHash = await hashPassword(data.novaSenha);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null, // invalida o token após o uso
      },
    });

    return NextResponse.json(
      { message: "Palavra-passe redefinida com sucesso!" },
      { headers: corsHeaders() }
    );
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400, headers: corsHeaders() }
      );
    }
    return NextResponse.json(
      { error: "Erro ao redefinir palavra-passe" },
      { status: 500, headers: corsHeaders() }
    );
  }
}