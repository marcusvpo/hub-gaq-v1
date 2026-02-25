import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
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

interface FTCusto {
  produto: string;
  custo_total: number;
  preco_venda: number;
  cmv_percentual: number;
  margem_contribuicao: number;
  markup: number;
  semaforo: string;
}

export default function RankingProdutosPage() {
  const { user } = useAuth();
  const [dados, setDados] = useState<FTCusto[]>([]);
  const [clienteNome, setClienteNome] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("cliente_users")
      .select("cliente_id")
      .eq("user_id", user.id)
      .limit(1)
      .then(async ({ data }) => {
        if (data && data.length > 0) {
          const cid = data[0].cliente_id;
          const { data: cl } = await supabase
            .from("clientes")
            .select("nome_fantasia")
            .eq("id", cid)
            .single();
          if (cl) setClienteNome(cl.nome_fantasia);
          const { data: ftData } = await supabase
            .from("vw_ficha_tecnica_custo")
            .select("*")
            .eq("cliente_id", cid)
            .order("margem_contribuicao", { ascending: false });
          if (ftData) setDados(ftData);
        }
      });
  }, [user]);

  const semaforoColor = (s: string) =>
    s === "verde" ? "#10B981" : s === "amarelo" ? "#F59E0B" : "#EF4444";
  const chartData = dados.filter((d) => Number(d.preco_venda) > 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ranking de Produtos</h1>
          <p className="page-subtitle">
            {clienteNome} — ordenado por margem de contribuição
          </p>
        </div>
      </div>
      <div className="page-body">
        {chartData.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">
              Nenhum produto com preço definido
            </h3>
            <p className="empty-state-text">
              Peça ao seu consultor para cadastrar fichas técnicas com preço de
              venda
            </p>
          </div>
        ) : (
          <>
            {/* Legenda do semáforo */}
            <div
              style={{
                display: "flex",
                gap: 24,
                marginBottom: 24,
                fontSize: "0.85rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="semaforo semaforo-verde" /> CMV ≤ 30%
                (Saudável)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="semaforo semaforo-amarelo" /> CMV 30-35%
                (Atenção)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="semaforo semaforo-vermelho" /> CMV &gt; 35%
                (Crítico)
              </div>
            </div>

            {/* Chart */}
            <div className="card" style={{ marginBottom: 24 }}>
              <ResponsiveContainer
                width="100%"
                height={Math.max(350, chartData.length * 45)}
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

            {/* Cards Grid */}
            <div className="grid grid-3 stagger">
              {chartData.map((d) => (
                <div key={d.produto} className="card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                        {d.produto}
                      </div>
                      <span
                        className={`badge ${Number(d.cmv_percentual) <= 30 ? "badge-success" : Number(d.cmv_percentual) <= 35 ? "badge-warning" : "badge-danger"}`}
                      >
                        CMV {Number(d.cmv_percentual).toFixed(1)}%
                      </span>
                    </div>
                    <span className={`semaforo semaforo-${d.semaforo}`} />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.85rem",
                      color: "#64748B",
                      marginBottom: 4,
                    }}
                  >
                    <span>Custo</span>
                    <span style={{ fontWeight: 600 }}>
                      R$ {Number(d.custo_total).toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.85rem",
                      color: "#64748B",
                      marginBottom: 4,
                    }}
                  >
                    <span>Preço Venda</span>
                    <span style={{ fontWeight: 600 }}>
                      R$ {Number(d.preco_venda).toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      color:
                        Number(d.margem_contribuicao) > 0
                          ? "#10B981"
                          : "#EF4444",
                      marginTop: 4,
                      paddingTop: 8,
                      borderTop: "1px solid #F1F5F9",
                    }}
                  >
                    <span>Margem</span>
                    <span>R$ {Number(d.margem_contribuicao).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
