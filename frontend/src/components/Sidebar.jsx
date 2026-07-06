import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    onClose();
    navigate("/login");
  }

  return (
    <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <nav className="sidebar-links">
        <NavLink to="/" end onClick={onClose} className={({ isActive }) => isActive ? "active" : ""}>
          📖 Livros
        </NavLink>

        {user && user.role !== "ADMIN" && (
          <NavLink to="/emprestimos" onClick={onClose} className={({ isActive }) => isActive ? "active" : ""}>
            📋 Meus Empréstimos
          </NavLink>
        )}

        {user?.role === "ADMIN" && (
          <>
            <NavLink to="/emprestimos" onClick={onClose} className={({ isActive }) => isActive ? "active" : ""}>
              📋 Empréstimos
            </NavLink>
            <NavLink to="/admin/livros" onClick={onClose} className={({ isActive }) => isActive ? "active" : ""}>
              🗂️ Gerir Livros
            </NavLink>
            <NavLink to="/dashboard" onClick={onClose} className={({ isActive }) => isActive ? "active" : ""}>
              📊 Dashboard
            </NavLink>
          </>
        )}

        {!user && (
          <>
            <NavLink to="/login" onClick={onClose} className={({ isActive }) => isActive ? "active" : ""}>
              🔑 Entrar
            </NavLink>
            <NavLink to="/registo" onClick={onClose} className={({ isActive }) => isActive ? "active" : ""}>
              📝 Registar
            </NavLink>
          </>
        )}
      </nav>

      {user && (
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Sair
        </button>
      )}
    </aside>
  );
}