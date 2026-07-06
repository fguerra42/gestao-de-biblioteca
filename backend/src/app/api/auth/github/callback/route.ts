import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { signToken } from "../../../../../lib/auth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${process.env.FRONTEND_URL}/login?erro=github_sem_code`);
  }

  try {
    // 1. Trocar o "code" por um access_token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
      }),
    });
   
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${process.env.FRONTEND_URL}/login?erro=github_token_falhou`);
    }

    // 2. Buscar dados do utilizador no GitHub
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const githubUser = await userRes.json();

    // 3. Buscar o email (às vezes não vem no /user, precisa de endpoint separado)
    let email = githubUser.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const emails = await emailsRes.json();
      const primary = emails.find((e: any) => e.primary) || emails[0];
      email = primary?.email;
    }

    if (!email) {
      return NextResponse.redirect(`${process.env.FRONTEND_URL}/login?erro=github_sem_email`);
    }

    // 4. Encontrar ou criar o utilizador no nosso banco
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          nome: githubUser.name || githubUser.login,
          email,
          provider: "github",
          role: "USER",
        },
      });
    }

    // 5. Gerar o mesmo tipo de JWT usado no login normal
    const token = signToken({ id: user.id, role: user.role as "ADMIN" | "USER", email: user.email });

    // 6. Redirecionar para o frontend já autenticado (com cookie)
    const response = NextResponse.redirect(`${process.env.FRONTEND_URL}/`);
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(`${process.env.FRONTEND_URL}/login?erro=github_falhou`);
  }
}