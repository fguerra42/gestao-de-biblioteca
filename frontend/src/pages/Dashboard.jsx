import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import api from "../services/api";

const CORES = ["#4f46e5", "#06b6d4", "#f59e0b", "#ef4444", "#10b981"];

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/stats").then((res) => setStats(res.data));
  }, []);

  if (!stats) return <p className="page">A carregar dashboard...</p>;

  return (
    <div className="page">
      <h2>Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card"><h3>{stats.totalLivros}</h3><p>Livros no acervo</p></div>
        <div className="stat-card"><h3>{stats.totalUtilizadores}</h3><p>Utilizadores</p></div>
        <div className="stat-card"><h3>{stats.emprestimosAtivos}</h3><p>Empréstimos ativos</p></div>
        <div className="stat-card"><h3>{stats.emprestimosAtrasados}</h3><p>Empréstimos atrasados</p></div>
      </div>

      <div className="charts-grid">
        <div className="chart-box">
          <h4>Empréstimos por mês</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.emprestimosPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h4>Top 5 livros mais emprestados</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.topLivros}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="titulo" hide />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="totalEmprestimos" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h4>Distribuição Top Livros</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stats.topLivros} dataKey="totalEmprestimos" nameKey="titulo" outerRadius={90} label>
                {stats.topLivros.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}