import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, ArrowUp, ArrowDown, Star } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";

interface ScoreEntry {
  data: string;
  score: number;
  classificacao: string;
}
interface AreaDelta {
  area: string;
  primeiro: number;
  ultimo: number;
  delta: number;
}

export default function ProgressoClientPage() {
  const { user } = useAuth();
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [areaDelta, setAreaDelta] = useState<AreaDelta[]>([]);
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

    const { data: avData } = await supabase
      .from("avaliacoes")
      .select("id, data_avaliacao, score_total, classificacao")
      .eq("cliente_id", clienteId)
      .eq("status", "concluido")
      .order("data_avaliacao");

    if (avData && avData.length > 0) {
      setScores(
        avData
          .filter((a) => a.score_total != null)
          .map((a) => ({
            data: new Date(a.data_avaliacao + "T12:00:00").toLocaleDateString(
              "pt-BR",
              { month: "short", year: "2-digit" },
            ),
            score: a.score_total!,
            classificacao: a.classificacao || "",
          })),
      );

      if (avData.length >= 2) {
        const firstId = avData[0].id;
        const lastId = avData[avData.length - 1].id;
        const [{ data: firstScores }, { data: lastScores }] = await Promise.all(
          [
            supabase
              .from("vw_score_por_area")
              .select("*")
              .eq("avaliacao_id", firstId),
            supabase
              .from("vw_score_por_area")
              .select("*")
              .eq("avaliacao_id", lastId),
          ],
        );

        if (firstScores && lastScores) {
          const map = new Map<string, { primeiro: number; ultimo: number }>();
          for (const s of firstScores)
            map.set(s.area_nome, {
              primeiro: Math.round(
                (Number(s.score_area) / Number(s.pontos_maximos)) * 100,
              ),
              ultimo: 0,
            });
          for (const s of lastScores) {
            const e = map.get(s.area_nome);
            const val = Math.round(
              (Number(s.score_area) / Number(s.pontos_maximos)) * 100,
            );
            if (e) e.ultimo = val;
            else map.set(s.area_nome, { primeiro: 0, ultimo: val });
          }
          setAreaDelta(
            Array.from(map.entries()).map(([area, d]) => ({
              area,
              ...d,
              delta: d.ultimo - d.primeiro,
            })),
          );
        }
      }
    }
    setLoading(false);
  }

  if (loading)
    return (
      <div className="page-body" style={{ textAlign: "center", padding: 60 }}>
        Carregando...
      </div>
    );

  const currentScore = scores.length > 0 ? scores[scores.length - 1].score : 0;
  const firstScore = scores.length > 0 ? scores[0].score : 0;
  const delta = currentScore - firstScore;
  const progressPct = Math.round((currentScore / 1000) * 100);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Meu Progresso</h1>
          <p className="page-subtitle">
            Acompanhe sua evolução ao longo da consultoria
          </p>
        </div>
      </div>
      <div className="page-body">
        {/* Score Overview */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div className="card" style={{ padding: 24, textAlign: "center" }}>
            <Star size={28} style={{ color: "#F59E0B", marginBottom: 8 }} />
            <div
              style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1E293B" }}
            >
              {currentScore}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              Score Atual
            </div>
            {scores.length > 0 && (
              <div
                style={{ fontSize: "0.75rem", color: "#7C3AED", marginTop: 4 }}
              >
                {scores[scores.length - 1].classificacao}
              </div>
            )}
          </div>
          <div className="card" style={{ padding: 24, textAlign: "center" }}>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                color:
                  delta > 0 ? "#10B981" : delta < 0 ? "#EF4444" : "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              {delta > 0 ? (
                <ArrowUp size={24} />
              ) : delta < 0 ? (
                <ArrowDown size={24} />
              ) : null}
              {delta > 0 ? "+" : ""}
              {delta}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              Variação Total
            </div>
          </div>
          <div className="card" style={{ padding: 24, textAlign: "center" }}>
            <div
              style={{ fontSize: "2.5rem", fontWeight: 800, color: "#3B82F6" }}
            >
              {progressPct}%
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              Do Score Máximo
            </div>
            <div
              style={{
                background: "#F1F5F9",
                borderRadius: 6,
                height: 8,
                marginTop: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: "100%",
                  background:
                    progressPct >= 65
                      ? "#10B981"
                      : progressPct >= 35
                        ? "#F59E0B"
                        : "#EF4444",
                  borderRadius: 6,
                }}
              />
            </div>
          </div>
        </div>

        {/* Score Line Chart */}
        {scores.length >= 2 && (
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <div
              style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 16 }}
            >
              📈 Evolução do Score
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={scores}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="data" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 1000]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#3B82F6" }}
                  activeDot={{ r: 8, fill: "#1D4ED8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Radar comparison + Area deltas */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
        >
          {areaDelta.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                🔄 Antes × Agora
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={areaDelta}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="area" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="Primeiro"
                    dataKey="primeiro"
                    stroke="#CBD5E1"
                    fill="#CBD5E1"
                    fillOpacity={0.15}
                    strokeDasharray="5 5"
                  />
                  <Radar
                    name="Atual"
                    dataKey="ultimo"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {areaDelta.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                🏅 Destaques por Área
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {areaDelta
                  .sort((a, b) => b.delta - a.delta)
                  .map((ad) => (
                    <div
                      key={ad.area}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: 10,
                        background:
                          ad.delta > 0
                            ? "#F0FDF4"
                            : ad.delta < 0
                              ? "#FEF2F2"
                              : "#F8FAFC",
                        border: `1px solid ${ad.delta > 0 ? "#BBF7D0" : ad.delta < 0 ? "#FECACA" : "#E2E8F0"}`,
                      }}
                    >
                      <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        {ad.area}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            ad.delta > 0
                              ? "#10B981"
                              : ad.delta < 0
                                ? "#EF4444"
                                : "#64748B",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {ad.delta > 0 ? (
                          <ArrowUp size={14} />
                        ) : ad.delta < 0 ? (
                          <ArrowDown size={14} />
                        ) : null}
                        {ad.delta > 0 ? "+" : ""}
                        {ad.delta}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {scores.length === 0 && (
          <div className="empty-state">
            <TrendingUp className="empty-state-icon" />
            <h3 className="empty-state-title">Sem dados de progresso</h3>
            <p className="empty-state-text">
              Aguarde seu consultor realizar o primeiro diagnóstico
            </p>
          </div>
        )}
      </div>
    </>
  );
}
