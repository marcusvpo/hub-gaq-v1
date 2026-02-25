import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface DreData {
  mes_referencia: string;
  faturamento_bruto: number;
  total_impostos: number;
  faturamento_liquido: number;
  total_custos_variaveis: number;
  lucro_bruto: number;
  total_custos_fixos: number;
  lucro_operacional: number;
  lucro_operacional_percentual: number;
}

export default function VelocimetroLucroPage() {
  const { user } = useAuth();
  const [dre, setDre] = useState<DreData | null>(null);
  const [historico, setHistorico] = useState<DreData[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("cliente_users")
      .select("cliente_id")
      .eq("user_id", user.id)
      .limit(1)
      .then(async ({ data }) => {
        if (data && data.length > 0) {
          const { data: dreList } = await supabase
            .from("vw_dre_mensal")
            .select("*")
            .eq("cliente_id", data[0].cliente_id)
            .order("mes_referencia", { ascending: false })
            .limit(6);
          if (dreList && dreList.length > 0) {
            setDre(dreList[0]);
            setHistorico(dreList.reverse());
          }
        }
      });
  }, [user]);

  if (!dre)
    return (
      <>
        <div className="page-header">
          <div>
            <h1 className="page-title">Velocímetro de Lucro</h1>
          </div>
        </div>
        <div className="page-body">
          <div className="empty-state">
            <h3 className="empty-state-title">Sem dados financeiros</h3>
            <p className="empty-state-text">
              O consultor ainda não registrou dados do DRE
            </p>
          </div>
        </div>
      </>
    );

  const lucroPct = Number(dre.lucro_operacional_percentual);
  const lucroVal = Number(dre.lucro_operacional);
  const faturamento = Number(dre.faturamento_bruto);

  // Gauge data
  const gaugeValue = Math.max(0, Math.min(100, lucroPct + 20)); // offset for visual
  const gaugeData = [
    {
      value: gaugeValue,
      color:
        lucroPct >= 15
          ? "#10B981"
          : lucroPct >= 8
            ? "#3B82F6"
            : lucroPct >= 0
              ? "#F59E0B"
              : "#EF4444",
    },
    { value: 100 - gaugeValue, color: "#F1F5F9" },
  ];

  const distribuicao = [
    {
      name: "CMV",
      value: Number(dre.total_custos_variaveis),
      color: "#F97316",
    },
    { name: "Impostos", value: Number(dre.total_impostos), color: "#EF4444" },
    {
      name: "Custos Fixos",
      value: Number(dre.total_custos_fixos),
      color: "#F59E0B",
    },
    { name: "Lucro", value: Math.max(0, lucroVal), color: "#10B981" },
  ].filter((d) => d.value > 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Velocímetro de Lucro</h1>
          <p className="page-subtitle">
            Último mês:{" "}
            {new Date(dre.mes_referencia).toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
      <div className="page-body">
        <div className="grid grid-2" style={{ marginBottom: 32 }}>
          {/* Gauge */}
          <div className="card" style={{ textAlign: "center" }}>
            <div
              style={{
                position: "relative",
                width: 220,
                height: 120,
                margin: "0 auto 16px",
              }}
            >
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="100%"
                    innerRadius={70}
                    outerRadius={100}
                    startAngle={180}
                    endAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {gaugeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                <div
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: 800,
                    color: lucroPct >= 0 ? "#10B981" : "#EF4444",
                    lineHeight: 1,
                  }}
                >
                  {lucroPct.toFixed(1)}%
                </div>
                <div
                  style={{ fontSize: "0.8rem", color: "#64748B", marginTop: 4 }}
                >
                  Margem de Lucro
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: lucroVal >= 0 ? "#10B981" : "#EF4444",
              }}
            >
              R${" "}
              {lucroVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748B" }}>
              Lucro Operacional
            </div>
            <div
              style={{
                marginTop: 16,
                padding: "12px 20px",
                background: "#F0F9FF",
                borderRadius: 12,
                display: "inline-block",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "#0369A1" }}>
                De um faturamento de{" "}
                <strong>
                  R${" "}
                  {faturamento.toLocaleString("pt-BR", {
                    minimumFractionDigits: 0,
                  })}
                </strong>
              </span>
            </div>
          </div>

          {/* Distribuição */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>
              Para onde foi o dinheiro
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={distribuicao}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={3}
                >
                  {distribuicao.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [
                    `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                    "",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                justifyContent: "center",
                marginTop: 8,
              }}
            >
              {distribuicao.map((d) => (
                <div
                  key={d.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.8rem",
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: d.color,
                    }}
                  />
                  <span>
                    {d.name}:{" "}
                    <strong>
                      {faturamento > 0
                        ? ((d.value / faturamento) * 100).toFixed(1)
                        : 0}
                      %
                    </strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Histórico */}
        {historico.length > 1 && (
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>
              Evolução Mensal
            </div>
            <div className="table-container" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Faturamento</th>
                    <th>CMV %</th>
                    <th>Custos Fixos</th>
                    <th>Lucro</th>
                    <th>Margem %</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((h) => {
                    const cmvPct =
                      Number(h.faturamento_bruto) > 0
                        ? (
                            (Number(h.total_custos_variaveis) /
                              Number(h.faturamento_bruto)) *
                            100
                          ).toFixed(1)
                        : "0.0";
                    return (
                      <tr key={h.mes_referencia}>
                        <td style={{ fontWeight: 600 }}>
                          {new Date(h.mes_referencia).toLocaleDateString(
                            "pt-BR",
                            { month: "short", year: "numeric" },
                          )}
                        </td>
                        <td>
                          R${" "}
                          {Number(h.faturamento_bruto).toLocaleString("pt-BR", {
                            minimumFractionDigits: 0,
                          })}
                        </td>
                        <td>
                          <span
                            className={`badge ${Number(cmvPct) <= 30 ? "badge-success" : Number(cmvPct) <= 35 ? "badge-warning" : "badge-danger"}`}
                          >
                            {cmvPct}%
                          </span>
                        </td>
                        <td>
                          R${" "}
                          {Number(h.total_custos_fixos).toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 0 },
                          )}
                        </td>
                        <td
                          style={{
                            fontWeight: 700,
                            color:
                              Number(h.lucro_operacional) >= 0
                                ? "#10B981"
                                : "#EF4444",
                          }}
                        >
                          R${" "}
                          {Number(h.lucro_operacional).toLocaleString("pt-BR", {
                            minimumFractionDigits: 0,
                          })}
                        </td>
                        <td>
                          <span
                            className={`badge ${Number(h.lucro_operacional_percentual) >= 10 ? "badge-success" : Number(h.lucro_operacional_percentual) >= 0 ? "badge-warning" : "badge-danger"}`}
                          >
                            {Number(h.lucro_operacional_percentual).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
