import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function onSubmit(data) {
    setErro("");
    try {
      await registerUser(data.nome, data.email, data.password);
      setSucesso(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao registar");
    }
  }

  return (
    <div className="auth-container">
      <h2>Criar Conta</h2>
      {erro && <p className="error-msg">{erro}</p>}
      {sucesso && <p className="success-msg">Conta criada! A redirecionar para login...</p>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <label>Nome</label>
        <input {...register("nome", { required: "Nome é obrigatório" })} />
        {errors.nome && <span className="error-msg">{errors.nome.message}</span>}

        <label>Email</label>
        <input type="email" {...register("email", { required: "Email é obrigatório" })} />
        {errors.email && <span className="error-msg">{errors.email.message}</span>}

        <label>Palavra-passe</label>
        <input
          type="password"
          {...register("password", {
            required: "Palavra-passe é obrigatória",
            minLength: { value: 6, message: "Mínimo 6 caracteres" },
          })}
        />
        {errors.password && <span className="error-msg">{errors.password.message}</span>}

        <button type="submit">Registar</button>
      </form>
      <p>Já tens conta? <Link to="/login">Entrar</Link></p>
    </div>
  );
}