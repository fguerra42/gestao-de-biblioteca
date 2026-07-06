import { hashPassword, comparePassword, signToken, verifyToken } from "../auth";

describe("Autenticação - funções auxiliares", () => {
  describe("hashPassword / comparePassword", () => {
    it("deve gerar um hash diferente da senha original", async () => {
      const senha = "minhaSenha123";
      const hash = await hashPassword(senha);
      expect(hash).not.toBe(senha);
      expect(hash.length).toBeGreaterThan(0);
    });

    it("deve validar corretamente a senha certa", async () => {
      const senha = "minhaSenha123";
      const hash = await hashPassword(senha);
      const valido = await comparePassword(senha, hash);
      expect(valido).toBe(true);
    });

    it("deve rejeitar uma senha errada", async () => {
      const senha = "minhaSenha123";
      const hash = await hashPassword(senha);
      const valido = await comparePassword("senhaErrada", hash);
      expect(valido).toBe(false);
    });
  });

  describe("signToken / verifyToken", () => {
    const payload = { id: "abc123", role: "USER" as const, email: "teste@teste.com" };

    it("deve gerar um token JWT válido", () => {
      const token = signToken(payload);
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT tem 3 partes separadas por ponto
    });

    it("deve verificar e devolver o payload correto", () => {
      const token = signToken(payload);
      const decoded = verifyToken(token);
      expect(decoded?.id).toBe(payload.id);
      expect(decoded?.role).toBe(payload.role);
      expect(decoded?.email).toBe(payload.email);
    });

    it("deve retornar null para um token inválido", () => {
      const decoded = verifyToken("token.invalido.aqui");
      expect(decoded).toBeNull();
    });
  });
});