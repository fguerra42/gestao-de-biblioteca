import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Books() {
  const [books, setBooks] = useState([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  async function fetchBooks() {
    setLoading(true);
    try {
      const res = await api.get("/books", { params: { q } });
      setBooks(res.data.books);
    } catch (err) {
      setMsg("Erro ao carregar livros");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchBooks(); }, []);

  async function emprestar(bookId) {
    setMsg("");
    try {
      await api.post("/loans", { bookId, diasParaDevolucao: 14 });
      setMsg("Empréstimo realizado com sucesso!");
      fetchBooks();
    } catch (err) {
      setMsg(err.response?.data?.error || "Erro ao emprestar livro");
    }
  }

  return (
    <div className="page">
      <h2>Catálogo de Livros</h2>
      <form onSubmit={(e) => { e.preventDefault(); fetchBooks(); }} className="search-bar">
        <input
          placeholder="Pesquisar por título, autor ou ISBN..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit">Pesquisar</button>
      </form>

      {msg && <p className="info-msg">{msg}</p>}
      {loading ? (
        <p>A carregar...</p>
      ) : (
        <div className="cards-grid">
          {books.map((b) => (
            <div className="card" key={b.id}>
              <h3>{b.titulo}</h3>
              <p><strong>Autor:</strong> {b.autor}</p>
              <p><strong>Categoria:</strong> {b.categoria?.nome || "N/A"}</p>
              <p><strong>Disponíveis:</strong> {b.quantidadeDisponivel}/{b.quantidadeTotal}</p>

              {user && user.role !== "ADMIN" && (
                <button disabled={b.quantidadeDisponivel < 1} onClick={() => emprestar(b.id)}>
                  {b.quantidadeDisponivel < 1 ? "Indisponível" : "Emprestar"}
                </button>
              )}

              {user?.role === "ADMIN" && (
                <p className="admin-note">Modo administrador — sem empréstimo</p>
              )}
            </div>
          ))}
          {books.length === 0 && <p>Nenhum livro encontrado.</p>}
        </div>
      )}
    </div>
  );
}