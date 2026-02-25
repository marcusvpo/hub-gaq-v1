import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { UtensilsCrossed } from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Produto {
  id: string;
  nome: string;
  categoria: string | null;
  preco_venda: number;
  custo_total: number;
  cmv_pct: number;
  margem: number;
  status: "estrela" | "vaca" | "interrogacao" | "abacaxi";
  recomendacao: string;
}

const QUADRANTE_CONFIG = {
  estrela: {
    label: "⭐ Estrela",
    desc: "Alta margem + Alta venda",
    color: "#F59E0B",
    bg: "#FFFBEB",
    rec: "Destaque no cardápio",
  },
  vaca: {
    label: "🐄 Vaca Leiteira",
    desc: "Alta margem + Venda normal",
    color: "#10B981",
    bg: "#F0FDF4",
    rec: "Manter e otimizar",
  },
  interrogacao: {
    label: "❓ Ponto de Interrogação",
    desc: "Baixa margem + Alta venda",
    color: "#3B82F6",
    bg: "#EFF6FF",
    rec: "Revisar preço",
  },
  abacaxi: {
    label: "🍍 Abacaxi",
    desc: "Baixa margem + Baixa venda",
    color: "#EF4444",
    bg: "#FEF2F2",
    rec: "Considerar remover",
  },
};

export default function CardapioClientPage() {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    const { data: cu } = await supabase
      .from("cliente_users")
      .select("cliente_id")
      .eq("user_id", user.id)
      .limit(1);
    if (!cu || cu.length === 0) {
      setLoading(false);
      return;
    }
    const clienteId = cu[0].cliente_id;

    const { data } = await supabase
      .from("vw_ficha_tecnica_custo")
      .select("*")
      .eq("cliente_id", clienteId);

    if (data) {
      // Get demand info
      const fichaIds = data.map((d: any) => d.ficha_tecnica_id);
      const { data: fichasData } = await supabase
        .from("fichas_tecnicas")
        .select("id, demanda")
        .in("id", fichaIds);
      const demandaMap = new Map(
        (fichasData || []).map((f: any) => [f.id, f.demanda || "normal"]),
      );

      const cmvValues = data.map((d: any) => Number(d.cmv_percentual || 0));
      const avgCmv =
        cmvValues.reduce((a: number, b: number) => a + b, 0) /
        (cmvValues.length || 1);

      setProdutos(
        data.map((d: any) => {
          const cmv = Number(d.cmv_percentual || 0);
          const margem = Number(d.margem_contribuicao || 0);
          const demanda = demandaMap.get(d.ficha_tecnica_id) || "normal";
          const highMargin = cmv < avgCmv;
          const highDemand = demanda === "alta" || demanda === "ALTA";

          let status: Produto["status"];
          let recomendacao: string;
          if (highMargin && highDemand) {
            status = "estrela";
            recomendacao = "Destaque no cardápio — é seu carro-chefe!";
          } else if (highMargin && !highDemand) {
            status = "vaca";
            recomendacao = "Boa margem, tente aumentar vendas com promoção";
          } else if (!highMargin && highDemand) {
            status = "interrogacao";
            recomendacao =
              "Vende bem mas margem baixa — revise preço ou receita";
          } else {
            status = "abacaxi";
            recomendacao =
              "Margem e venda baixas — considere remover do cardápio";
          }

          return {
            id: d.ficha_tecnica_id,
            nome: d.produto,
            categoria: d.categoria,
            preco_venda: Number(d.preco_venda || 0),
            custo_total: Number(d.custo_total || 0),
            cmv_pct: cmv,
            margem,
            status,
            recomendacao,
          };
        }),
      );
    }
    setLoading(false);
  }

  if (loading)
    return (
      <div className="page-body" style={{ textAlign: "center", padding: 60 }}>
        Carregando...
      </div>
    );

  const groups = {
    estrela: produtos.filter((p) => p.status === "estrela"),
    vaca: produtos.filter((p) => p.status === "vaca"),
    interrogacao: produtos.filter((p) => p.status === "interrogacao"),
    abacaxi: produtos.filter((p) => p.status === "abacaxi"),
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cardápio Inteligente</h1>
          <p className="page-subtitle">
            Análise de Menu Engineering — saiba quais produtos priorizar
          </p>
        </div>
      </div>
      <div className="page-body">
        {produtos.length === 0 ? (
          <div className="empty-state">
            <UtensilsCrossed className="empty-state-icon" />
            <h3 className="empty-state-title">Sem dados de produtos</h3>
            <p className="empty-state-text">
              Aguarde seu consultor cadastrar fichas técnicas
            </p>
          </div>
        ) : (
          <>
            {/* Quadrant summary */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {(
                Object.entries(QUADRANTE_CONFIG) as [
                  keyof typeof QUADRANTE_CONFIG,
                  (typeof QUADRANTE_CONFIG)[keyof typeof QUADRANTE_CONFIG],
                ][]
              ).map(([key, cfg]) => (
                <div
                  key={key}
                  className="card"
                  style={{
                    padding: 20,
                    textAlign: "center",
                    borderLeft: `4px solid ${cfg.color}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: cfg.color,
                    }}
                  >
                    {groups[key].length}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#1E293B",
                    }}
                  >
                    {cfg.label}
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#94A3B8",
                      marginTop: 2,
                    }}
                  >
                    {cfg.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* Scatter chart */}
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Mapa de Produtos: CMV% × Margem (R$)
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    type="number"
                    dataKey="cmv_pct"
                    name="CMV%"
                    unit="%"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="margem"
                    name="Margem"
                    unit=" R$"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={(v: any, name: string) => [
                      name === "CMV%"
                        ? `${Number(v).toFixed(1)}%`
                        : `R$ ${Number(v).toFixed(2)}`,
                      name,
                    ]}
                  />
                  <Scatter data={produtos} fill="#3B82F6">
                    {produtos.map((p, i) => (
                      <Cell key={i} fill={QUADRANTE_CONFIG[p.status].color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Products by quadrant */}
            {(Object.entries(groups) as [keyof typeof groups, Produto[]][])
              .filter(([, items]) => items.length > 0)
              .map(([key, items]) => {
                const cfg = QUADRANTE_CONFIG[key];
                return (
                  <div
                    key={key}
                    className="card"
                    style={{
                      padding: 24,
                      marginBottom: 16,
                      borderLeft: `4px solid ${cfg.color}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: cfg.color,
                        marginBottom: 12,
                      }}
                    >
                      {cfg.label} — {cfg.rec}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {items.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            borderRadius: 10,
                            background: cfg.bg,
                          }}
                        >
                          <div>
                            <div
                              style={{ fontWeight: 600, fontSize: "0.9rem" }}
                            >
                              {p.nome}
                            </div>
                            {p.categoria && (
                              <div
                                style={{ fontSize: "0.7rem", color: "#94A3B8" }}
                              >
                                {p.categoria}
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 20,
                              alignItems: "center",
                            }}
                          >
                            <div style={{ textAlign: "right" }}>
                              <div
                                style={{ fontSize: "0.7rem", color: "#94A3B8" }}
                              >
                                Preço
                              </div>
                              <div style={{ fontWeight: 700 }}>
                                R$ {p.preco_venda.toFixed(2)}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div
                                style={{ fontSize: "0.7rem", color: "#94A3B8" }}
                              >
                                CMV
                              </div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: p.cmv_pct > 35 ? "#EF4444" : "#10B981",
                                }}
                              >
                                {p.cmv_pct.toFixed(1)}%
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div
                                style={{ fontSize: "0.7rem", color: "#94A3B8" }}
                              >
                                Margem
                              </div>
                              <div
                                style={{ fontWeight: 700, color: "#10B981" }}
                              >
                                R$ {p.margem.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </>
        )}
      </div>
    </>
  );
}
