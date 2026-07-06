import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "../services/api";

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [msg, setMsg] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  async function fetchAll() {
    const [b, c] = await Promise.all([api.get("/books"), api.get("/categories")]);
    setBooks(b.data.books);
    setCategories(c.data.categories);
  }

  useEffect(() => { fetchAll(); }, []);

  async function onSubmit(data) {
    setMsg("");
    try {
      await api.post("/books", {
        ...data,
        quantidadeTotal: Number(data.quantidadeTotal),
        categoriaId: data.categoriaId || null,
      });
      setMsg("Livro criado com sucesso!");
      reset();
      fetchAll();
    } catch (err) {
      setMsg(err.response?.data?.error || "Erro ao criar livro");
    }
  }

  async function remover(id) {
    if (!confirm("Confirma remoção deste livro?")) return;
    try {
      await api.delete(`/books/${id}`);
      fetchAll();
    } catch (err) {
      setMsg(err.response?.data?.error || "Erro ao remover livro");
    }
  }

  return (
    <div className="page">
      <h2>Gerir Livros (Admin)</h2>
      {msg && <p className="info-msg">{msg}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="form-inline">
        <input placeholder="Título" {...register("titulo", { required: true })} />
        <input placeholder="Autor" {...register("autor", { required: true })} />
        <input placeholder="ISBN" {...register("isbn", { required: true })} />
        <input type="number" placeholder="Quantidade" min="1" {...register("quantidadeTotal", { required: true })} />
        <select {...register("categoriaId")}>
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <button type="submit">Adicionar Livro</button>
      </form>
      {(errors.titulo || errors.autor || errors.isbn || errors.quantidadeTotal) && (
        <p className="error-msg">Preenche todos os campos obrigatórios.</p>
      )}

      <table className="table">
        <thead>
          <tr><th>Título</th><th>Autor</th><th>Disponível</th><th>Total</th><th></th></tr>
        </thead>
        <tbody>
          {books.map((b) => (
            <tr key={b.id}>
              <td>{b.titulo}</td>
              <td>{b.autor}</td>
              <td>{b.quantidadeDisponivel}</td>
              <td>{b.quantidadeTotal}</td>
              <td><button onClick={() => remover(b.id)}>Remover</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}