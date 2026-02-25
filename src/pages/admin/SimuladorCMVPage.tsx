import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCliente } from "@/contexts/ClienteContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface FTCusto {
  produto: string;
  custo_total: number;
  preco_venda: number;
  cmv_percentual: number;
  margem_contribuicao: number;
  markup: number;
  semaforo: string;
}

export default function SimuladorCMVPage() {
  const { selectedCliente } = useCliente();
  const [dados, setDados] = useState<FTCusto[]>([]);

  useEffect(() => {
    if (!selectedCliente) return;
    supabase
      .from("vw_ficha_tecnica_custo")
      .select("*")
      .eq("cliente_id", selectedCliente.id)
      .order("margem_contribuicao", { ascending: false })
      .then(({ data }) => {
        if (data) setDados(data);
      });
  }, [selectedCliente]);

  const semaforoColor = (s: string) =>
    s === "verde" ? "#10B981" : s === "amarelo" ? "#F59E0B" : "#EF4444";
  const chartData = dados.filter((d) => Number(d.preco_venda) > 0);

  if (!selectedCliente)
    return (
      <div className="page-body">
        <div className="empty-state">
          <BarChart3 className="empty-state-icon" />
          <h3 className="empty-state-title">Selecione um cliente</h3>
        </div>
      </div>
    );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Simulador CMV</h1>
          <p className="page-subtitle">
            {selectedCliente.nome_fantasia} — ranking por margem
          </p>
        </div>
      </div>
      <div className="page-body">
        {chartData.length === 0 ? (
          <div className="empty-state">
            <BarChart3 className="empty-state-icon" />
            <h3 className="empty-state-title">
              Sem produtos com preço definido
            </h3>
            <p className="empty-state-text">
              Crie fichas técnicas com preço de venda para visualizar o
              simulador
            </p>
          </div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: 24 }}>
              <ResponsiveContainer
                width="100%"
                height={Math.max(300, chartData.length * 45)}
              >
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 130, right: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `R$ ${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="produto"
                    tick={{ fontSize: 13, fontWeight: 500 }}
                    width={120}
                  />
                  <Tooltip
                    formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Margem"]}
                  />
                  <Bar
                    dataKey="margem_contribuicao"
                    radius={[0, 8, 8, 0]}
                    barSize={24}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={semaforoColor(entry.semaforo)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Custo</th>
                    <th>Preço</th>
                    <th>CMV %</th>
                    <th>Margem</th>
                    <th>Markup</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((d) => (
                    <tr key={d.produto}>
                      <td style={{ fontWeight: 600 }}>{d.produto}</td>
                      <td>R$ {Number(d.custo_total).toFixed(2)}</td>
                      <td>R$ {Number(d.preco_venda).toFixed(2)}</td>
                      <td>
                        <span
                          className={`badge ${Number(d.cmv_percentual) <= 30 ? "badge-success" : Number(d.cmv_percentual) <= 35 ? "badge-warning" : "badge-danger"}`}
                        >
                          {Number(d.cmv_percentual).toFixed(1)}%
                        </span>
                      </td>
                      <td
                        style={{
                          fontWeight: 700,
                          color:
                            Number(d.margem_contribuicao) > 0
                              ? "#10B981"
                              : "#EF4444",
                        }}
                      >
                        R$ {Number(d.margem_contribuicao).toFixed(2)}
                      </td>
                      <td>{Number(d.markup).toFixed(1)}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
