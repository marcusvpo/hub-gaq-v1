import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Calculator, DollarSign, TrendingUp, Percent } from "lucide-react";

interface DreData {
  faturamento_bruto: number;
  cmv_percentual_faturamento: number;
  lucro_operacional: number;
  lucro_operacional_percentual: number;
  total_custos_fixos: number;
  total_custos_variaveis: number;
}

export default function SimuladorESeClientPage() {
  const { user } = useAuth();
  const [dre, setDre] = useState<DreData | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulators
  const [precoChange, setPrecoChange] = useState(0);
  const [cmvTarget, setCmvTarget] = useState(30);
  const [vendasExtra, setVendasExtra] = useState(0);

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

    const { data } = await supabase
      .from("vw_dre_mensal")
      .select("*")
      .eq("cliente_id", cu[0].cliente_id)
      .order("mes_referencia", { ascending: false })
      .limit(1);
    if (data && data.length > 0) setDre(data[0]);
    setLoading(false);
  }

  if (loading)
    return (
      <div className="page-body" style={{ textAlign: "center", padding: 60 }}>
        Carregando...
      </div>
    );

  if (!dre)
    return (
      <div className="page-body">
        <div className="empty-state">
          <Calculator className="empty-state-icon" />
          <h3 className="empty-state-title">Sem dados financeiros</h3>
          <p className="empty-state-text">
            O simulador precisa de dados de DRE para funcionar
          </p>
        </div>
      </div>
    );

  const fat = Number(dre.faturamento_bruto);
  const cmvPct = Number(dre.cmv_percentual_faturamento);
  const cmvVal = (fat * cmvPct) / 100;
  const custoFixo = Number(dre.total_custos_fixos);
  const lucro = Number(dre.lucro_operacional);
  const lucroPct = Number(dre.lucro_operacional_percentual);

  // Sim 1: Price increase
  const newFat1 = fat * (1 + precoChange / 100);
  const newCmv1 = cmvVal; // CMV absoluto não muda
  const newCmvPct1 = (newCmv1 / newFat1) * 100;
  const newLucro1 = newFat1 - newCmv1 - custoFixo;
  const deltaLucro1 = newLucro1 - lucro;

  // Sim 2: CMV target
  const newCmvVal2 = (fat * cmvTarget) / 100;
  const savings2 = cmvVal - newCmvVal2;
  const newLucro2 = lucro + savings2;

  // Sim 3: Extra sales
  const ticketMedio = fat / 30; // rough daily avg
  const extraRev = vendasExtra * ticketMedio * 30;
  const extraCmv = (extraRev * cmvPct) / 100;
  const newLucro3 = lucro + (extraRev - extraCmv);

  const fmt = (v: number) =>
    `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Simulador "E Se?"</h1>
          <p className="page-subtitle">
            Visualize o impacto de mudanças no seu negócio
          </p>
        </div>
      </div>
      <div className="page-body">
        {/* Current stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div className="card" style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
              Faturamento Atual
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>
              {fmt(fat)}
            </div>
          </div>
          <div className="card" style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
              CMV Atual
            </div>
            <div
              style={{ fontSize: "1.2rem", fontWeight: 800, color: "#F97316" }}
            >
              {cmvPct.toFixed(1)}%
            </div>
          </div>
          <div className="card" style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
              Lucro Atual
            </div>
            <div
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                color: lucro >= 0 ? "#10B981" : "#EF4444",
              }}
            >
              {fmt(lucro)}
            </div>
          </div>
          <div className="card" style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Lucro %</div>
            <div
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                color: lucroPct >= 0 ? "#10B981" : "#EF4444",
              }}
            >
              {lucroPct.toFixed(1)}%
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 24,
          }}
        >
          {/* Sim 1: Price */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <DollarSign size={20} style={{ color: "#3B82F6" }} />
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                E se eu mudar o preço?
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "0.8rem", color: "#64748B" }}>
                Variação de preço:{" "}
                <strong>
                  {precoChange > 0 ? "+" : ""}
                  {precoChange}%
                </strong>
              </label>
              <input
                type="range"
                min={-20}
                max={30}
                value={precoChange}
                onChange={(e) => setPrecoChange(Number(e.target.value))}
                style={{ width: "100%", marginTop: 8, accentColor: "#3B82F6" }}
              />
            </div>
            <div
              style={{ background: "#F8FAFC", borderRadius: 12, padding: 16 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                  Novo Faturamento
                </span>
                <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                  {fmt(newFat1)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                  Novo CMV%
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: newCmvPct1 > 35 ? "#EF4444" : "#10B981",
                  }}
                >
                  {newCmvPct1.toFixed(1)}%
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px solid #E2E8F0",
                  paddingTop: 8,
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                  Impacto no Lucro
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    color: deltaLucro1 >= 0 ? "#10B981" : "#EF4444",
                  }}
                >
                  {deltaLucro1 >= 0 ? "+" : ""}
                  {fmt(deltaLucro1)}
                </span>
              </div>
            </div>
          </div>

          {/* Sim 2: CMV */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <Percent size={20} style={{ color: "#F97316" }} />
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                E se meu CMV cair?
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "0.8rem", color: "#64748B" }}>
                CMV alvo: <strong>{cmvTarget}%</strong> (atual:{" "}
                {cmvPct.toFixed(1)}%)
              </label>
              <input
                type="range"
                min={15}
                max={50}
                value={cmvTarget}
                onChange={(e) => setCmvTarget(Number(e.target.value))}
                style={{ width: "100%", marginTop: 8, accentColor: "#F97316" }}
              />
            </div>
            <div
              style={{ background: "#F8FAFC", borderRadius: 12, padding: 16 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                  Economia Mensal
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: savings2 > 0 ? "#10B981" : "#EF4444",
                  }}
                >
                  {fmt(savings2)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px solid #E2E8F0",
                  paddingTop: 8,
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                  Novo Lucro
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    color: newLucro2 >= 0 ? "#10B981" : "#EF4444",
                  }}
                >
                  {fmt(newLucro2)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                  Economia Anual
                </span>
                <span style={{ fontWeight: 700, color: "#3B82F6" }}>
                  {fmt(savings2 * 12)}
                </span>
              </div>
            </div>
          </div>

          {/* Sim 3: Sales */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <TrendingUp size={20} style={{ color: "#10B981" }} />
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                E se eu vender mais?
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "0.8rem", color: "#64748B" }}>
                Vendas extras/dia: <strong>+{vendasExtra}</strong>
              </label>
              <input
                type="range"
                min={0}
                max={50}
                value={vendasExtra}
                onChange={(e) => setVendasExtra(Number(e.target.value))}
                style={{ width: "100%", marginTop: 8, accentColor: "#10B981" }}
              />
            </div>
            <div
              style={{ background: "#F8FAFC", borderRadius: 12, padding: 16 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                  Receita Extra/mês
                </span>
                <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                  {fmt(extraRev)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                  Custo Extra/mês
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "#EF4444",
                  }}
                >
                  {fmt(extraCmv)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px solid #E2E8F0",
                  paddingTop: 8,
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                  Novo Lucro
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    color: newLucro3 >= 0 ? "#10B981" : "#EF4444",
                  }}
                >
                  {fmt(newLucro3)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
