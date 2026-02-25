import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, TrendingUp, TrendingDown, Bell } from "lucide-react";

interface PriceAlert {
  id: string;
  insumo_nome: string;
  preco_anterior: number;
  preco_novo: number;
  variacao_percentual: number;
  created_at: string;
}
interface CMVAlert {
  produto: string;
  cmv_percentual: number;
  semaforo: string;
  preco_venda: number;
  custo_total: number;
}

export default function AlertaCustosPage() {
  const { user } = useAuth();
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [cmvAlerts, setCmvAlerts] = useState<CMVAlert[]>([]);

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
          // Price change alerts
          const { data: insumos } = await supabase
            .from("insumos")
            .select("id, nome")
            .eq("cliente_id", cid);
          if (insumos && insumos.length > 0) {
            const ids = insumos.map((i) => i.id);
            const nameMap = Object.fromEntries(
              insumos.map((i) => [i.id, i.nome]),
            );
            const { data: hist } = await supabase
              .from("insumo_historico_precos")
              .select("*")
              .in("insumo_id", ids)
              .order("created_at", { ascending: false })
              .limit(20);
            if (hist) {
              setPriceAlerts(
                hist.map((h) => ({
                  id: h.id,
                  insumo_nome: nameMap[h.insumo_id] || "Insumo",
                  preco_anterior: h.preco_anterior,
                  preco_novo: h.preco_novo,
                  variacao_percentual: h.variacao_percentual,
                  created_at: h.created_at,
                })),
              );
            }
          }
          // CMV alerts — products above 35%
          const { data: cmvData } = await supabase
            .from("vw_ficha_tecnica_custo")
            .select(
              "produto, cmv_percentual, semaforo, preco_venda, custo_total",
            )
            .eq("cliente_id", cid)
            .order("cmv_percentual", { ascending: false });
          if (cmvData)
            setCmvAlerts(cmvData.filter((d) => Number(d.cmv_percentual) > 30));
        }
      });
  }, [user]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Alertas de Custo</h1>
          <p className="page-subtitle">
            Monitoramento de variações de preço e CMV acima do teto
          </p>
        </div>
      </div>
      <div className="page-body">
        {/* CMV Alerts */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span
              className="card-title"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <AlertTriangle size={18} style={{ color: "#F59E0B" }} /> Produtos
              com CMV Elevado
            </span>
            <span className="badge badge-warning">
              {cmvAlerts.length} alertas
            </span>
          </div>
          {cmvAlerts.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "#94A3B8",
                fontSize: "0.875rem",
              }}
            >
              ✅ Todos os produtos estão com CMV saudável (&lt; 30%)
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cmvAlerts.map((a) => (
                <div
                  key={a.produto}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: 10,
                    background:
                      a.semaforo === "vermelho" ? "#FEF2F2" : "#FFFBEB",
                    border: `1px solid ${a.semaforo === "vermelho" ? "#FECACA" : "#FDE68A"}`,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span className={`semaforo semaforo-${a.semaforo}`} />
                    <span style={{ fontWeight: 600 }}>{a.produto}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      fontSize: "0.85rem",
                    }}
                  >
                    <span>
                      Custo:{" "}
                      <strong>R$ {Number(a.custo_total).toFixed(2)}</strong>
                    </span>
                    <span>
                      Venda:{" "}
                      <strong>R$ {Number(a.preco_venda).toFixed(2)}</strong>
                    </span>
                    <span
                      className={`badge ${Number(a.cmv_percentual) > 35 ? "badge-danger" : "badge-warning"}`}
                    >
                      CMV {Number(a.cmv_percentual).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price Change History */}
        <div className="card">
          <div className="card-header">
            <span
              className="card-title"
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Bell size={18} style={{ color: "#3B82F6" }} /> Histórico de
              Reajustes
            </span>
          </div>
          {priceAlerts.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "#94A3B8",
                fontSize: "0.875rem",
              }}
            >
              Nenhum reajuste registrado ainda
            </div>
          ) : (
            <div className="table-container" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>Preço Anterior</th>
                    <th>Preço Novo</th>
                    <th>Variação</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {priceAlerts.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{a.insumo_nome}</td>
                      <td>R$ {Number(a.preco_anterior).toFixed(2)}</td>
                      <td>R$ {Number(a.preco_novo).toFixed(2)}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {Number(a.variacao_percentual) > 0 ? (
                            <TrendingUp
                              size={14}
                              style={{ color: "#EF4444" }}
                            />
                          ) : (
                            <TrendingDown
                              size={14}
                              style={{ color: "#10B981" }}
                            />
                          )}
                          <span
                            className={`badge ${Number(a.variacao_percentual) > 0 ? "badge-danger" : "badge-success"}`}
                          >
                            {Number(a.variacao_percentual) > 0 ? "+" : ""}
                            {Number(a.variacao_percentual).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td style={{ color: "#64748B", fontSize: "0.8rem" }}>
                        {formatDate(a.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
