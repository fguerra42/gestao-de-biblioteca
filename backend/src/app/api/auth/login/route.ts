import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { comparePassword, signToken, corsHeaders } from "../../../../lib/auth";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Palavra-passe é obrigatória"),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401, headers: corsHeaders() }
      );
    }

    const valid = await comparePassword(data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401, headers: corsHeaders() }
      );
    }

    const token = signToken({ id: user.id, role: user.role as "ADMIN" | "USER", email: user.email });

    const res = NextResponse.json(
      { user: { id: user.id, nome: user.nome, email: user.email, role: user.role } },
      { status: 200, headers: corsHeaders() }
    );

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return res;
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400, headers: corsHeaders() }
      );
    }
    return NextResponse.json(
      { error: "Erro ao autenticar" },
      { status: 500, headers: corsHeaders() }
    );
  }
}