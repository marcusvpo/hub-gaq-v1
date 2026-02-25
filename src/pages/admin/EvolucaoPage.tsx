import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCliente } from "@/contexts/ClienteContext";
import { TrendingUp, ArrowUp, ArrowDown, Minus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

interface ScoreHistory {
  data_avaliacao: string;
  score_total: number;
  classificacao: string;
}

interface AreaComparison {
  area: string;
  primeiro: number;
  ultimo: number;
}

interface DreHistory {
  mes: string;
  faturamento: number;
  cmv_pct: number;
  lucro_pct: number;
}

export default function EvolucaoPage() {
  const { selectedCliente } = useCliente();
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const [areaComparison, setAreaComparison] = useState<AreaComparison[]>([]);
  const [dreHistory, setDreHistory] = useState<DreHistory[]>([]);

  useEffect(() => {
    if (selectedCliente) loadAll();
  }, [selectedCliente]);

  async function loadAll() {
    if (!selectedCliente) return;

    // Score evolution
    const { data: avData } = await supabase
      .from("avaliacoes")
      .select("data_avaliacao, score_total, classificacao")
      .eq("cliente_id", selectedCliente.id)
      .eq("status", "concluido")
      .order("data_avaliacao");

    if (avData) {
      setScoreHistory(avData.filter((a) => a.score_total != null));

      // Area comparison: first vs last
      if (avData.length >= 2) {
        const firstAv = avData[0];
        const lastAv = avData[avData.length - 1];

        const [{ data: firstScores }, { data: lastScores }] = await Promise.all(
          [
            supabase
              .from("vw_score_por_area")
              .select("*")
              .eq(
                "avaliacao_id",
                (
                  await supabase
                    .from("avaliacoes")
                    .select("id")
                    .eq("cliente_id", selectedCliente.id)
                    .eq("data_avaliacao", firstAv.data_avaliacao)
                    .eq("status", "concluido")
                    .limit(1)
                ).data?.[0]?.id,
              ),
            supabase
              .from("vw_score_por_area")
              .select("*")
              .eq(
                "avaliacao_id",
                (
                  await supabase
                    .from("avaliacoes")
                    .select("id")
                    .eq("cliente_id", selectedCliente.id)
                    .eq("data_avaliacao", lastAv.data_avaliacao)
                    .eq("status", "concluido")
                    .limit(1)
                ).data?.[0]?.id,
              ),
          ],
        );

        if (firstScores && lastScores) {
          const areaMap = new Map<string, AreaComparison>();
          for (const s of firstScores) {
            areaMap.set(s.area_nome, {
              area: s.area_nome,
              primeiro: Math.round(
                (Number(s.score_area) / Number(s.pontos_maximos)) * 100,
              ),
              ultimo: 0,
            });
          }
          for (const s of lastScores) {
            const existing = areaMap.get(s.area_nome);
            if (existing)
              existing.ultimo = Math.round(
                (Number(s.score_area) / Number(s.pontos_maximos)) * 100,
              );
            else
              areaMap.set(s.area_nome, {
                area: s.area_nome,
                primeiro: 0,
                ultimo: Math.round(
                  (Number(s.score_area) / Number(s.pontos_maximos)) * 100,
                ),
              });
          }
          setAreaComparison(Array.from(areaMap.values()));
        }
      }
    }

    // DRE evolution
    const { data: dreData } = await supabase
      .from("vw_dre_mensal")
      .select("*")
      .eq("cliente_id", selectedCliente.id)
      .order("mes_referencia");

    if (dreData) {
      setDreHistory(
        dreData.map((d) => ({
          mes: new Date(d.mes_referencia + "T12:00:00").toLocaleDateString(
            "pt-BR",
            { month: "short", year: "2-digit" },
          ),
          faturamento: Number(d.faturamento_bruto),
          cmv_pct: Number(d.cmv_percentual_faturamento || 0),
          lucro_pct: Number(d.lucro_operacional_percentual || 0),
        })),
      );
    }
  }

  if (!selectedCliente) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <TrendingUp className="empty-state-icon" />
          <h3 className="empty-state-title">Selecione um cliente</h3>
        </div>
      </div>
    );
  }

  const scoreDelta =
    scoreHistory.length >= 2
      ? scoreHistory[scoreHistory.length - 1].score_total -
        scoreHistory[0].score_total
      : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Painel de Evolução</h1>
          <p className="page-subtitle">
            {selectedCliente.nome_fantasia} — acompanhe o progresso ao longo do
            tempo
          </p>
        </div>
      </div>
      <div className="page-body">
        {/* Score Evolution Summary */}
        {scoreHistory.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div className="card" style={{ padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
                Primeiro Score
              </div>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 800,
                  color: "#64748B",
                }}
              >
                {scoreHistory[0].score_total}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                {new Date(
                  scoreHistory[0].data_avaliacao + "T12:00:00",
                ).toLocaleDateString("pt-BR")}
              </div>
            </div>
            <div className="card" style={{ padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
                Score Atual
              </div>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 800,
                  color: "#1E293B",
                }}
              >
                {scoreHistory[scoreHistory.length - 1].score_total}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                {scoreHistory[scoreHistory.length - 1].classificacao}
              </div>
            </div>
            <div className="card" style={{ padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
                Variação
              </div>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 800,
                  color:
                    scoreDelta > 0
                      ? "#10B981"
                      : scoreDelta < 0
                        ? "#EF4444"
                        : "#64748B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                {scoreDelta > 0 ? (
                  <ArrowUp size={20} />
                ) : scoreDelta < 0 ? (
                  <ArrowDown size={20} />
                ) : (
                  <Minus size={20} />
                )}
                {Math.abs(scoreDelta)}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                {scoreHistory.length} diagnósticos
              </div>
            </div>
          </div>
        )}

        {/* Score Line Chart */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div
            style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 16 }}
          >
            📈 Evolução do Score
          </div>
          {scoreHistory.length >= 2 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={scoreHistory.map((s) => ({
                  data: new Date(
                    s.data_avaliacao + "T12:00:00",
                  ).toLocaleDateString("pt-BR", {
                    month: "short",
                    year: "2-digit",
                  }),
                  score: s.score_total,
                }))}
              >
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
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: "#94A3B8", fontSize: "0.85rem" }}>
              Necessário pelo menos 2 diagnósticos para visualizar evolução
            </div>
          )}
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
        >
          {/* Radar Comparison */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 16 }}
            >
              🔄 Antes × Agora
            </div>
            {areaComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={areaComparison}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="area" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Primeiro"
                    dataKey="primeiro"
                    stroke="#94A3B8"
                    fill="#94A3B8"
                    fillOpacity={0.15}
                    strokeDasharray="5 5"
                  />
                  <Radar
                    name="Último"
                    dataKey="ultimo"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: "#94A3B8", fontSize: "0.85rem" }}>
                Necessário pelo menos 2 diagnósticos
              </div>
            )}
          </div>

          {/* DRE Evolution */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 16 }}
            >
              💰 Evolução Financeira
            </div>
            {dreHistory.length >= 2 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dreHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    unit="%"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="faturamento"
                    name="Faturamento"
                    stroke="#3B82F6"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cmv_pct"
                    name="CMV%"
                    stroke="#F97316"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="lucro_pct"
                    name="Lucro%"
                    stroke="#10B981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: "#94A3B8", fontSize: "0.85rem" }}>
                Necessário pelo menos 2 meses de DRE
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
