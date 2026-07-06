import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { hashPassword, corsHeaders } from "../../../../lib/auth";

const schema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Palavra-passe deve ter pelo menos 6 caracteres"),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma conta com este email" },
        { status: 409, headers: corsHeaders() }
      );
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: { nome: data.nome, email: data.email, passwordHash, role: "USER" },
      select: { id: true, nome: true, email: true, role: true },
    });

    return NextResponse.json({ user }, { status: 201, headers: corsHeaders() });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400, headers: corsHeaders() }
      );
    }
    return NextResponse.json(
      { error: "Erro ao registar utilizador" },
      { status: 500, headers: corsHeaders() }
    );
  }
}