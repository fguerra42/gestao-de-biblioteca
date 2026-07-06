import { useAuth } from "../context/AuthContext";

export default function Topbar({ onToggleSidebar }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <button className="sidebar-toggle" onClick={onToggleSidebar} aria-label="Abrir/fechar menu">
        ☰
      </button>
      <span className="topbar-brand">📚 <span className="full">Sistema de Gestão de Biblioteca</span></span>
      {user && (
        <span className="topbar-user">
          <span className="avatar">{user.nome.charAt(0).toUpperCase()}</span>
          {user.nome}
        </span>
      )}
    </header>
  );
}