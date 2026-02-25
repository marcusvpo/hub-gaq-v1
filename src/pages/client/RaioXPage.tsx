import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface ScoreArea {
  area_codigo: string;
  area_nome: string;
  score_area: number;
  pontos_maximos: number;
  percentual: number;
}

const FAIXAS = [
  {
    min: 0,
    max: 350,
    label: "Risco Estrutural Alto",
    color: "#EF4444",
    desc: "O negócio precisa de ação urgente em diversas frentes para sobreviver.",
  },
  {
    min: 351,
    max: 500,
    label: "Operação Instável",
    color: "#F97316",
    desc: "Existem riscos importantes. Foco em estabilizar processos e custos.",
  },
  {
    min: 501,
    max: 650,
    label: "Estrutura Funcional",
    color: "#F59E0B",
    desc: "O básico funciona, mas há oportunidades claras de melhoria.",
  },
  {
    min: 651,
    max: 800,
    label: "Estrutura Organizada",
    color: "#10B981",
    desc: "Boa organização. É hora de otimizar e acelerar.",
  },
  {
    min: 801,
    max: 900,
    label: "Gestão Profissional",
    color: "#3B82F6",
    desc: "Gestão madura. Foque em refinamento e escalabilidade.",
  },
  {
    min: 901,
    max: 1000,
    label: "Operação Escalável",
    color: "#8B5CF6",
    desc: "Excelência operacional. Preparado para escalar.",
  },
];

export default function RaioXPage() {
  const { user } = useAuth();
  const [scoreTotal, setScoreTotal] = useState(0);
  const [classificacao, setClassificacao] = useState("");
  const [radarData, setRadarData] = useState<ScoreArea[]>([]);
  const [dataAvaliacao, setDataAvaliacao] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("cliente_users")
      .select("cliente_id")
      .eq("user_id", user.id)
      .limit(1)
      .then(async ({ data }) => {
        if (data && data.length > 0) {
          const { data: avs } = await supabase
            .from("avaliacoes")
            .select("id, score_total, classificacao, data_avaliacao")
            .eq("cliente_id", data[0].cliente_id)
            .order("created_at", { ascending: false })
            .limit(1);
          if (avs && avs.length > 0) {
            setScoreTotal(avs[0].score_total || 0);
            setClassificacao(avs[0].classificacao || "");
            setDataAvaliacao(avs[0].data_avaliacao);
            const { data: radar } = await supabase
              .from("vw_score_por_area")
              .select("*")
              .eq("avaliacao_id", avs[0].id);
            if (radar) setRadarData(radar);
          }
        }
      });
  }, [user]);

  const faixa =
    FAIXAS.find((f) => scoreTotal >= f.min && scoreTotal <= f.max) || FAIXAS[0];
  const scorePct = (scoreTotal / 1000) * 100;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Raio-X do Negócio</h1>
          <p className="page-subtitle">
            {dataAvaliacao
              ? `Última avaliação: ${new Date(dataAvaliacao).toLocaleDateString("pt-BR")}`
              : "Diagnóstico operacional"}
          </p>
        </div>
      </div>
      <div className="page-body">
        {radarData.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">Nenhum diagnóstico realizado</h3>
            <p className="empty-state-text">
              Seu consultor ainda não realizou a avaliação de diagnóstico
            </p>
          </div>
        ) : (
          <>
            {/* Score Header */}
            <div
              className="card"
              style={{ textAlign: "center", marginBottom: 32, padding: 40 }}
            >
              <div
                style={{
                  fontSize: "5rem",
                  fontWeight: 800,
                  color: faixa.color,
                  lineHeight: 1,
                }}
              >
                {scoreTotal}
              </div>
              <div
                style={{ fontSize: "0.9rem", color: "#64748B", marginTop: 4 }}
              >
                de 1000 pontos
              </div>
              <div
                style={{
                  display: "inline-block",
                  marginTop: 16,
                  padding: "8px 24px",
                  borderRadius: 24,
                  background: faixa.color + "15",
                  color: faixa.color,
                  fontWeight: 700,
                  fontSize: "1rem",
                }}
              >
                {classificacao}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#64748B",
                  marginTop: 12,
                  maxWidth: 500,
                  margin: "12px auto 0",
                }}
              >
                {faixa.desc}
              </div>
              {/* Progress bar */}
              <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
                <div
                  style={{
                    height: 12,
                    background: "#F1F5F9",
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${scorePct}%`,
                      background: `linear-gradient(90deg, ${faixa.color}, ${faixa.color}CC)`,
                      borderRadius: 6,
                      transition: "width 0.8s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.7rem",
                    color: "#94A3B8",
                    marginTop: 4,
                  }}
                >
                  <span>0</span>
                  <span>350</span>
                  <span>500</span>
                  <span>650</span>
                  <span>800</span>
                  <span>900</span>
                  <span>1000</span>
                </div>
              </div>
            </div>

            <div className="grid grid-2" style={{ marginBottom: 32 }}>
              {/* Radar */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 16 }}>
                  Visão Radar
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart
                    data={radarData.map((r) => ({
                      area: r.area_codigo,
                      score: r.score_area,
                    }))}
                  >
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis
                      dataKey="area"
                      tick={{ fontSize: 13, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis domain={[0, 125]} tick={false} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke={faixa.color}
                      fill={faixa.color}
                      fillOpacity={0.2}
                      strokeWidth={2.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Score by Area */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 16 }}>
                  Pontuação por Área
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {radarData
                    .sort((a, b) => Number(b.percentual) - Number(a.percentual))
                    .map((r) => {
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
                              marginBottom: 6,
                            }}
                          >
                            <div>
                              <span
                                style={{ fontWeight: 700, fontSize: "0.9rem" }}
                              >
                                {r.area_nome}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#94A3B8",
                                  marginLeft: 8,
                                }}
                              >
                                {r.area_codigo}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span
                                className={`badge ${pct >= 80 ? "badge-success" : pct >= 60 ? "badge-info" : pct >= 40 ? "badge-warning" : "badge-danger"}`}
                              >
                                {pct.toFixed(0)}%
                              </span>
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#64748B",
                                  fontWeight: 600,
                                }}
                              >
                                {r.score_area}/{r.pontos_maximos}
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              height: 10,
                              background: "#F1F5F9",
                              borderRadius: 5,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: barColor,
                                borderRadius: 5,
                                transition: "width 0.6s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
