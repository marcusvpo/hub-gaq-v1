import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, Percent, Activity } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface DreResumo {
  faturamento_bruto: number;
  lucro_operacional: number;
  lucro_operacional_percentual: number;
  cmv_percentual_faturamento: number;
}
interface ScoreArea {
  area_codigo: string;
  area_nome: string;
  score_area: number;
  pontos_maximos: number;
  percentual: number;
}

export default function ClientDashboard() {
  const { user, profile } = useAuth();
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [clienteNome, setClienteNome] = useState("");
  const [dre, setDre] = useState<DreResumo | null>(null);
  const [scoreTotal, setScoreTotal] = useState(0);
  const [classificacao, setClassificacao] = useState("");
  const [radarData, setRadarData] = useState<ScoreArea[]>([]);
  const [cmvMedio, setCmvMedio] = useState(0);

  useEffect(() => {
    if (!user) return;
    // Find linked client
    supabase
      .from("cliente_users")
      .select("cliente_id")
      .eq("user_id", user.id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setClienteId(data[0].cliente_id);
          loadClienteNome(data[0].cliente_id);
        }
      });
  }, [user]);

  useEffect(() => {
    if (clienteId) loadAll();
  }, [clienteId]);

  async function loadClienteNome(id: string) {
    const { data } = await supabase
      .from("clientes")
      .select("nome_fantasia")
      .eq("id", id)
      .single();
    if (data) setClienteNome(data.nome_fantasia);
  }

  async function loadAll() {
    if (!clienteId) return;
    // Latest DRE
    const { data: dreData } = await supabase
      .from("vw_dre_mensal")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("mes_referencia", { ascending: false })
      .limit(1);
    if (dreData && dreData.length > 0) setDre(dreData[0]);

    // Latest evaluation
    const { data: avs } = await supabase
      .from("avaliacoes")
      .select("id, score_total, classificacao")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (avs && avs.length > 0) {
      setScoreTotal(avs[0].score_total || 0);
      setClassificacao(avs[0].classificacao || "");
      // Radar data
      const { data: radarRaw } = await supabase
        .from("vw_score_por_area")
        .select("*")
        .eq("avaliacao_id", avs[0].id);
      if (radarRaw) setRadarData(radarRaw);
    }

    // Average CMV
    const { data: cmvData } = await supabase
      .from("vw_ficha_tecnica_custo")
      .select("cmv_percentual")
      .eq("cliente_id", clienteId);
    if (cmvData && cmvData.length > 0) {
      const avg =
        cmvData.reduce((s, d) => s + Number(d.cmv_percentual), 0) /
        cmvData.length;
      setCmvMedio(avg);
    }
  }

  const scoreColor = (s: number) => {
    if (s <= 350) return "#EF4444";
    if (s <= 500) return "#F97316";
    if (s <= 650) return "#F59E0B";
    if (s <= 800) return "#10B981";
    if (s <= 900) return "#3B82F6";
    return "#8B5CF6";
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Olá, {profile?.full_name || "Gestor"} 👋
          </h1>
          <p className="page-subtitle">
            {clienteNome
              ? `Visão consolidada — ${clienteNome}`
              : "Vincule seu negócio para ver os dados"}
          </p>
        </div>
      </div>
      <div className="page-body">
        <div className="grid grid-4 stagger" style={{ marginBottom: 32 }}>
          <div className="card metric-card">
            <div className="metric-icon metric-icon-blue">
              <TrendingUp size={20} />
            </div>
            <div className="card-value" style={{ fontSize: "1.3rem" }}>
              R${" "}
              {dre
                ? Number(dre.faturamento_bruto).toLocaleString("pt-BR", {
                    minimumFractionDigits: 0,
                  })
                : "—"}
            </div>
            <div className="card-label">Faturamento</div>
          </div>
          <div className="card metric-card">
            <div className="metric-icon metric-icon-yellow">
              <Percent size={20} />
            </div>
            <div
              className="card-value"
              style={{
                fontSize: "1.3rem",
                color:
                  cmvMedio <= 30
                    ? "#10B981"
                    : cmvMedio <= 35
                      ? "#F59E0B"
                      : "#EF4444",
              }}
            >
              {cmvMedio > 0 ? `${cmvMedio.toFixed(1)}%` : "—"}
            </div>
            <div className="card-label">CMV Médio</div>
          </div>
          <div className="card metric-card">
            <div className="metric-icon metric-icon-green">
              <TrendingUp size={20} />
            </div>
            <div
              className="card-value"
              style={{
                fontSize: "1.3rem",
                color:
                  dre && Number(dre.lucro_operacional) >= 0
                    ? "#10B981"
                    : "#EF4444",
              }}
            >
              {dre
                ? `${Number(dre.lucro_operacional_percentual).toFixed(1)}%`
                : "—"}
            </div>
            <div className="card-label">Margem de Lucro</div>
          </div>
          <div className="card metric-card">
            <div className="metric-icon metric-icon-purple">
              <Activity size={20} />
            </div>
            <div
              className="card-value"
              style={{ fontSize: "1.3rem", color: scoreColor(scoreTotal) }}
            >
              {scoreTotal > 0 ? `${scoreTotal}/1000` : "—"}
            </div>
            <div className="card-label">Score Raio-X</div>
          </div>
        </div>

        <div className="grid grid-2">
          {/* Radar Chart */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Raio-X do Negócio</span>
              {classificacao && (
                <span
                  className="badge"
                  style={{
                    background: scoreColor(scoreTotal) + "20",
                    color: scoreColor(scoreTotal),
                  }}
                >
                  {classificacao}
                </span>
              )}
            </div>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart
                  data={radarData.map((r) => ({
                    area: r.area_codigo,
                    score: r.score_area,
                    max: r.pontos_maximos,
                  }))}
                >
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis
                    dataKey="area"
                    tick={{ fontSize: 12, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis domain={[0, 125]} tick={false} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: "48px 16px" }}>
                <p className="empty-state-text">
                  Nenhum diagnóstico realizado ainda
                </p>
              </div>
            )}
          </div>

          {/* Score by area */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pontuação por Área</span>
            </div>
            {radarData.length > 0 ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {radarData.map((r) => {
                  const pct = Number(r.percentual);
                  const barColor =
                    pct >= 80
                      ? "#10B981"
                      : pct >= 60
                        ? "#3B82F6"
                        : pct >= 40
                          ? "#F59E0B"
                          : "#EF4444";
                  return (
                    <div key={r.area_codigo}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                          {r.area_nome}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                          {r.score_area}/{r.pontos_maximos}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          background: "#F1F5F9",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: barColor,
                            borderRadius: 4,
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "48px 16px" }}>
                <p className="empty-state-text">
                  Aguardando avaliação do consultor
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
