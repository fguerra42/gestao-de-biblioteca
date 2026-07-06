import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">📚 Biblioteca</Link>
      <div className="nav-links">
        <Link to="/">Livros</Link>
        {user && <Link to="/emprestimos">Meus Empréstimos</Link>}
        {user?.role === "ADMIN" && <Link to="/admin/livros">Gerir Livros</Link>}
        {user?.role === "ADMIN" && <Link to="/dashboard">Dashboard</Link>}
        {!user && <Link to="/login">Entrar</Link>}
        {!user && <Link to="/registo">Registar</Link>}
        {user && (
          <button onClick={handleLogout} className="link-button">
            Sair ({user.nome})
          </button>
        )}
      </div>
    </nav>
  );
}