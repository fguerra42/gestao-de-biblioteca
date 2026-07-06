import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [msg, setMsg] = useState("");
  const [linkSimulado, setLinkSimulado] = useState("");
  const [erro, setErro] = useState("");

  async function onSubmit(data) {
    setErro("");
    setMsg("");
    setLinkSimulado("");
    try {
      const res = await api.post("/auth/forgot-password", { email: data.email });
      setMsg(res.data.message);
      if (res.data.linkSimulado) {
        setLinkSimulado(res.data.linkSimulado);
      }
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao processar pedido");
    }
  }

  return (
    <div className="auth-container">
      <h2>Recuperar Palavra-passe</h2>
      <p>Informe o seu email para receber um link de recuperação.</p>

      {erro && <p className="error-msg">{erro}</p>}
      {msg && <p className="success-msg">{msg}</p>}

      {linkSimulado && (
        <p className="info-msg" style={{ wordBreak: "break-all" }}>
          <strong>Simulação de email:</strong>{" "}
          <Link to={linkSimulado.replace(window.location.origin, "")}>{linkSimulado}</Link>
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <label>Email</label>
        <input type="email" {...register("email", { required: "Email é obrigatório" })} />
        {errors.email && <span className="error-msg">{errors.email.message}</span>}

        <button type="submit">Enviar link de recuperação</button>
      </form>

      <p><Link to="/login">Voltar ao login</Link></p>
    </div>
  );
}