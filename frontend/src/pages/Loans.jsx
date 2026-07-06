import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Loans() {
    const [loans, setLoans] = useState([]);
    const [msg, setMsg] = useState("");
    const { user } = useAuth();

    async function fetchLoans() {
        const res = await api.get("/loans");
        setLoans(res.data.loans);
    }

    useEffect(() => { fetchLoans(); }, []);

    async function devolver(id) {
        try {
            await api.put(`/loans/${id}`);
            setMsg("Livro devolvido com sucesso!");
            fetchLoans();
        } catch (err) {
            setMsg(err.response?.data?.error || "Erro ao devolver livro");
        }
    }

    return (
        <div className="page">
            <h2>{user?.role === "ADMIN" ? "Todos os Empréstimos" : "Meus Empréstimos"}</h2>
            {msg && <p className="info-msg">{msg}</p>}
            <table className="table">
                <thead>
                    <tr>
                        <th>Livro</th>
                        {user?.role === "ADMIN" && <th>Utilizador</th>}
                        <th>Data Empréstimo</th>
                        <th>Devolução Prevista</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {loans.map((l) => (
                        <tr key={l.id}>
                            <td>{l.book.titulo}</td>
                            {user?.role === "ADMIN" && <td>{l.user.nome}</td>}
                            <td>{new Date(l.dataEmprestimo).toLocaleDateString()}</td>
                            <td>{new Date(l.dataDevolucaoPrevista).toLocaleDateString()}</td>
                            <td>
                                <span className={`badge badge-${l.status.toLowerCase()}`}>{l.status}</span>
                            </td>
                            <td>
                                {l.status === "ATIVO" && <button onClick={() => devolver(l.id)}>Devolver</button>}
                            </td>
                        </tr>
                    ))}
                    {loans.length === 0 && <tr><td colSpan={6}>Nenhum empréstimo encontrado.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}