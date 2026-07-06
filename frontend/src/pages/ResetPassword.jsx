import { useForm } from "react-hook-form";
import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(data) {
    setErro("");
    try {
      await api.post("/auth/reset-password", { token, novaSenha: data.novaSenha });
      setSucesso(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao redefinir palavra-passe");
    }
  }

  if (!token) {
    return (
      <div className="auth-container">
        <h2>Link inválido</h2>
        <p className="error-msg">Nenhum token de recuperação foi encontrado nesta página.</p>
        <p><Link to="/esqueci-senha">Solicitar novo link</Link></p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h2>Redefinir Palavra-passe</h2>

      {erro && <p className="error-msg">{erro}</p>}
      {sucesso && <p className="success-msg">Palavra-passe redefinida! A redirecionar para login...</p>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <label>Nova palavra-passe</label>
        <input
          type="password"
          {...register("novaSenha", {
            required: "Nova palavra-passe é obrigatória",
            minLength: { value: 6, message: "Mínimo 6 caracteres" },
          })}
        />
        {errors.novaSenha && <span className="error-msg">{errors.novaSenha.message}</span>}

        <button type="submit">Redefinir Palavra-passe</button>
      </form>
    </div>
  );
}