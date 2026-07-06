import { NextRequest, NextResponse } from "next/server";
import { verifyToken, corsHeaders, JwtPayload } from "../lib/auth";

export function getUserFromRequest(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Retorna o utilizador autenticado, ou uma NextResponse de erro (401/403)
export function requireAuth(
  req: NextRequest,
  roles: ("ADMIN" | "USER")[] | null = null
): JwtPayload | NextResponse {
  const user = getUserFromRequest(req);

  if (!user) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401, headers: corsHeaders() }
    );
  }

  if (roles && !roles.includes(user.role)) {
    return NextResponse.json(
      { error: "Acesso negado: permissão insuficiente" },
      { status: 403, headers: corsHeaders() }
    );
  }

  return user;
}