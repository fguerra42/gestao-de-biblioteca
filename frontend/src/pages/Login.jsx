import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState("");

  async function onSubmit(data) {
    setErro("");
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao entrar");
    }
  }

  function loginComGithub() {
    window.location.href = "http://10.0.0.10:3000/api/auth/github";
  }

  return (
    <div className="auth-container">
      <h2>Entrar</h2>
      {erro && <p className="error-msg">{erro}</p>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <label>Email</label>
        <input type="email" {...register("email", { required: "Email é obrigatório" })} />
        {errors.email && <span className="error-msg">{errors.email.message}</span>}

        <label>Palavra-passe</label>
        <input type="password" {...register("password", { required: "Palavra-passe é obrigatória" })} />
        {errors.password && <span className="error-msg">{errors.password.message}</span>}

        <button type="submit">Entrar</button>
      </form>

      <div className="divider">ou</div>

      <button type="button" className="btn-github" onClick={loginComGithub}>
        Entrar com GitHub
      </button>

      <p><Link to="/esqueci-senha">Esqueci a minha palavra-passe</Link></p>
      <p>Não tens conta? <Link to="/registo">Regista-te</Link></p>
    </div>
  );
}