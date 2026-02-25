import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCliente } from "@/contexts/ClienteContext";
import { useAuth } from "@/contexts/AuthContext";
import { ClipboardCheck, Save, Check, X } from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface Area {
  id: string;
  codigo: string;
  nome: string;
  pontos_maximos: number;
  ordem: number;
}
interface Criterio {
  id: string;
  area_id: string;
  codigo: string;
  nome: string;
  descricao: string;
  pontos_maximos: number;
  ordem: number;
}
interface IndicadorPadrao {
  id: string;
  area_id: string;
  codigo: string;
  descricao: string;
  tipo: string;
}
interface AvaliacaoIndicador {
  id?: string;
  indicador_padrao_id: string;
  area_id: string;
  codigo: string;
  descricao_personalizada: string;
  tipo: string;
}

const FAIXAS = [
  { min: 0, max: 350, label: "Risco Estrutural Alto", color: "#EF4444" },
  { min: 351, max: 500, label: "Operação Instável", color: "#F97316" },
  { min: 501, max: 650, label: "Estrutura Funcional", color: "#F59E0B" },
  { min: 651, max: 800, label: "Estrutura Organizada", color: "#10B981" },
  { min: 801, max: 900, label: "Gestão Profissional", color: "#3B82F6" },
  { min: 901, max: 1000, label: "Operação Escalável", color: "#8B5CF6" },
];

export default function ScorecardPage() {
  const { selectedCliente } = useCliente();
  const { user } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [indicadores, setIndicadores] = useState<IndicadorPadrao[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [avaliacaoId, setAvaliacaoId] = useState<string | null>(null);
  const [tab, setTab] = useState<"indicadores" | "pontuacao" | "resumo">(
    "indicadores",
  );
  const [registeredIndicators, setRegisteredIndicators] = useState<
    AvaliacaoIndicador[]
  >([]);
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [scoreByArea, setScoreByArea] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStructure();
  }, []);
  useEffect(() => {
    if (selectedCliente && indicadores.length > 0) loadOrCreateAvaliacao();
  }, [selectedCliente, indicadores.length]);

  async function loadStructure() {
    const [{ data: a }, { data: c }, { data: i }] = await Promise.all([
      supabase.from("areas").select("*").order("ordem"),
      supabase.from("criterios").select("*").order("ordem"),
      supabase
        .from("indicadores_padrao")
        .select("*")
        .eq("ativo", true)
        .order("codigo"),
    ]);
    if (a) {
      setAreas(a);
      if (a.length > 0) setSelectedArea(a[0]);
    }
    if (c) setCriterios(c);
    if (i) setIndicadores(i);
  }

  async function loadOrCreateAvaliacao() {
    if (!selectedCliente) return;
    const { data: existing } = await supabase
      .from("avaliacoes")
      .select("id")
      .eq("cliente_id", selectedCliente.id)
      .order("created_at", { ascending: false })
      .limit(1);
    let avId: string;
    if (existing && existing.length > 0) {
      avId = existing[0].id;
    } else {
      const { data: newAv } = await supabase
        .from("avaliacoes")
        .insert({
          cliente_id: selectedCliente.id,
          consultor_id: user?.id,
          status: "rascunho",
        })
        .select("id")
        .single();
      if (!newAv) return;
      avId = newAv.id;
    }
    setAvaliacaoId(avId);
    const { data: regInds } = await supabase
      .from("avaliacao_indicadores")
      .select(
        "id, indicador_padrao_id, area_id, codigo_custom, descricao_personalizada, tipo",
      )
      .eq("avaliacao_id", avId);
    if (regInds) {
      setRegisteredIndicators(
        regInds.map((r) => ({
          id: r.id,
          indicador_padrao_id: r.indicador_padrao_id,
          area_id: r.area_id,
          codigo:
            indicadores.find((i) => i.id === r.indicador_padrao_id)?.codigo ||
            r.codigo_custom ||
            "",
          descricao_personalizada: r.descricao_personalizada,
          tipo: r.tipo,
        })),
      );
    }
    const { data: critScores } = await supabase
      .from("avaliacao_criterios")
      .select("criterio_id, nota")
      .eq("avaliacao_id", avId);
    if (critScores) {
      const n: Record<string, number> = {};
      critScores.forEach((cs) => {
        n[cs.criterio_id] = cs.nota;
      });
      setNotas(n);
    }
  }

  useEffect(() => {
    const scores: Record<string, number> = {};
    areas.forEach((a) => {
      const ac = criterios.filter((c) => c.area_id === a.id);
      scores[a.id] = ac.reduce((s, c) => s + (notas[c.id] || 0), 0);
    });
    setScoreByArea(scores);
  }, [notas, areas, criterios]);

  const scoreTotal = Object.values(scoreByArea).reduce((s, v) => s + v, 0);
  const faixa =
    FAIXAS.find((f) => scoreTotal >= f.min && scoreTotal <= f.max) || FAIXAS[0];

  // Auto-register all indicators for current area when opening the tab
  async function ensureAllIndicatorsRegistered(areaId: string) {
    if (!avaliacaoId) return;
    const areaInds = indicadores.filter((i) => i.area_id === areaId);
    const toInsert = areaInds.filter(
      (ind) =>
        !registeredIndicators.find((r) => r.indicador_padrao_id === ind.id),
    );
    if (toInsert.length === 0) return;
    const rows = toInsert.map((ind) => ({
      avaliacao_id: avaliacaoId,
      indicador_padrao_id: ind.id,
      area_id: ind.area_id,
      descricao_personalizada: "",
      tipo: "positivo",
    }));
    const { data } = await supabase
      .from("avaliacao_indicadores")
      .insert(rows)
      .select(
        "id, indicador_padrao_id, area_id, descricao_personalizada, tipo",
      );
    if (data) {
      const newRegs: AvaliacaoIndicador[] = data.map((d) => ({
        id: d.id,
        indicador_padrao_id: d.indicador_padrao_id,
        area_id: d.area_id,
        codigo:
          indicadores.find((i) => i.id === d.indicador_padrao_id)?.codigo || "",
        descricao_personalizada: d.descricao_personalizada,
        tipo: d.tipo,
      }));
      setRegisteredIndicators((prev) => [...prev, ...newRegs]);
    }
  }

  // When selecting an area on the indicators tab, auto-register
  useEffect(() => {
    if (
      selectedArea &&
      tab === "indicadores" &&
      avaliacaoId &&
      indicadores.length > 0
    ) {
      ensureAllIndicatorsRegistered(selectedArea.id);
    }
  }, [selectedArea, tab, avaliacaoId, indicadores.length]);

  async function updateIndicator(id: string, field: string, value: string) {
    // Update local state immediately
    setRegisteredIndicators((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );

    // Debounce or at least handle the DB update
    if (!id) return;
    
    const dbField = field === "tipo" ? "tipo" : "descricao_personalizada";
    try {
      const { error } = await supabase
        .from("avaliacao_indicadores")
        .update({ [dbField]: value })
        .eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao salvar indicador:", err);
    }
  }

  async function setNota(criterioId: string, nota: number) {
    if (!avaliacaoId) return;
    setNotas({ ...notas, [criterioId]: nota });
    try {
      const { error } = await supabase.from("avaliacao_criterios").upsert(
        {
          avaliacao_id: avaliacaoId,
          criterio_id: criterioId,
          nota,
        },
        { onConflict: "avaliacao_id,criterio_id" },
      );
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao salvar nota:", err);
    }
  }

  async function handleSave() {
    if (!avaliacaoId) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("calcular_score_avaliacao", {
        p_avaliacao_id: avaliacaoId,
      });
      if (error) throw error;
      alert("Score calculado e salvo com sucesso!");
    } catch (err) {
      console.error("Erro ao calcular score:", err);
      alert("Erro ao salvar o score.");
    } finally {
      setSaving(false);
    }
  }

  const areaRegistered = selectedArea
    ? registeredIndicators.filter((r) => r.area_id === selectedArea.id)
    : [];
  const areaCriterios = selectedArea
    ? criterios.filter((c) => c.area_id === selectedArea.id)
    : [];

  if (!selectedCliente)
    return (
      <div className="page-body">
        <div className="empty-state">
          <ClipboardCheck className="empty-state-icon" />
          <h3 className="empty-state-title">Selecione um cliente</h3>
          <p className="empty-state-text">
            Use o menu lateral para selecionar um cliente
          </p>
        </div>
      </div>
    );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Scorecard</h1>
          <p className="page-subtitle">
            {selectedCliente.nome_fantasia} — Diagnóstico Operacional
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              fontWeight: 700,
              background: faixa.color + "15",
              color: faixa.color,
              fontSize: "0.9rem",
            }}
          >
            {scoreTotal}/1000
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} /> {saving ? "Salvando..." : "Salvar Score"}
          </button>
        </div>
      </div>
      <div className="page-body">
        <div
          style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}
        >
          {/* Area selector */}
          <div>
            {areas.map((a) => {
              const aScore = scoreByArea[a.id] || 0;
              const pct = (aScore / a.pontos_maximos) * 100;
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedArea(a)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    textAlign: "left",
                    marginBottom: 4,
                    borderRadius: 10,
                    cursor: "pointer",
                    border:
                      selectedArea?.id === a.id
                        ? "2px solid #3B82F6"
                        : "1px solid #E2E8F0",
                    background: selectedArea?.id === a.id ? "#EFF6FF" : "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                      {a.codigo}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                      {aScore}/{a.pontos_maximos}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#64748B",
                      marginTop: 2,
                    }}
                  >
                    {a.nome}
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "#F1F5F9",
                      borderRadius: 2,
                      marginTop: 6,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: pct + "%",
                        borderRadius: 2,
                        background:
                          pct >= 80
                            ? "#10B981"
                            : pct >= 60
                              ? "#3B82F6"
                              : pct >= 40
                                ? "#F59E0B"
                                : "#EF4444",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div>
            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: 4,
                marginBottom: 20,
                background: "#F1F5F9",
                borderRadius: 10,
                padding: 4,
              }}
            >
              {(["indicadores", "pontuacao", "resumo"] as const).map((t) => {
                const labels = {
                  indicadores: "Indicadores de Observação",
                  pontuacao: "Pontuação (Critérios)",
                  resumo: "Resumo",
                };
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      flex: 1,
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      background: tab === t ? "#fff" : "transparent",
                      fontWeight: tab === t ? 700 : 400,
                      fontSize: "0.85rem",
                      color: tab === t ? "#1E293B" : "#64748B",
                      boxShadow:
                        tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    {labels[t]}
                  </button>
                );
              })}
            </div>

            {/* TAB: Indicadores — Fixed grid layout */}
            {tab === "indicadores" && selectedArea && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">
                    {selectedArea.codigo} — {selectedArea.nome}
                  </span>
                  <span className="badge badge-neutral">
                    {areaRegistered.length} indicadores
                  </span>
                </div>
                {areaRegistered.length === 0 ? (
                  <div
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "#94A3B8",
                      fontSize: "0.85rem",
                    }}
                  >
                    Carregando indicadores...
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    {areaRegistered.map((r) => {
                      const indPadrao = indicadores.find(
                        (i) => i.id === r.indicador_padrao_id,
                      );
                      return (
                        <div
                          key={r.id}
                          style={{
                            padding: "14px 16px",
                            borderRadius: 12,
                            background:
                              r.tipo === "positivo" ? "#F0FDF4" : "#FEF2F2",
                            border:
                              "1px solid " +
                              (r.tipo === "positivo" ? "#BBF7D0" : "#FECACA"),
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          {/* Header: code + description + toggle */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: 6,
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                  background:
                                    r.tipo === "positivo"
                                      ? "#DCFCE7"
                                      : "#FEE2E2",
                                  color:
                                    r.tipo === "positivo"
                                      ? "#166534"
                                      : "#991B1B",
                                }}
                              >
                                {r.codigo}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  color: "#334155",
                                }}
                              >
                                {indPadrao?.descricao || ""}
                              </span>
                            </div>
                            {/* Toggle positivo/negativo */}
                            <button
                              onClick={() =>
                                updateIndicator(
                                  r.id!,
                                  "tipo",
                                  r.tipo === "positivo"
                                    ? "negativo"
                                    : "positivo",
                                )
                              }
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "4px 10px",
                                borderRadius: 8,
                                border: "none",
                                cursor: "pointer",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                background:
                                  r.tipo === "positivo" ? "#10B981" : "#EF4444",
                                color: "#fff",
                                transition: "all 0.2s ease",
                              }}
                            >
                              {r.tipo === "positivo" ? (
                                <Check size={12} />
                              ) : (
                                <X size={12} />
                              )}
                              {r.tipo === "positivo" ? "Positivo" : "Negativo"}
                            </button>
                          </div>
                          {/* Observation textarea */}
                          <textarea
                            className="form-input"
                            rows={3}
                            placeholder="Observação: o que foi encontrado neste cliente..."
                            value={r.descricao_personalizada}
                            onChange={(e) =>
                              updateIndicator(
                                r.id!,
                                "descricao_personalizada",
                                e.target.value,
                              )
                            }
                            style={{
                              fontSize: "0.8rem",
                              resize: "vertical",
                              minHeight: 60,
                              background: "#fff",
                              border: "1px solid #E2E8F0",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Pontuação */}
            {tab === "pontuacao" && selectedArea && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">
                    {selectedArea.codigo} — Critérios de Pontuação
                  </span>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#3B82F6",
                    }}
                  >
                    {scoreByArea[selectedArea.id] || 0} /{" "}
                    {selectedArea.pontos_maximos} pts
                  </span>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {areaCriterios.map((c) => {
                    const nota = notas[c.id];
                    const bgColor =
                      nota === 25
                        ? "#F0FDF4"
                        : nota === 12
                          ? "#FFFBEB"
                          : nota === 0
                            ? "#FEF2F2"
                            : "#F8FAFC";
                    const bdColor =
                      nota === 25
                        ? "#BBF7D0"
                        : nota === 12
                          ? "#FDE68A"
                          : nota === 0
                            ? "#FECACA"
                            : "#E2E8F0";
                    return (
                      <div
                        key={c.id}
                        style={{
                          padding: "16px 18px",
                          borderRadius: 12,
                          background: bgColor,
                          border: "1px solid " + bdColor,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 4,
                              }}
                            >
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                  background: "#EFF6FF",
                                  color: "#1D4ED8",
                                }}
                              >
                                {c.codigo}
                              </span>
                              <span
                                style={{ fontWeight: 700, fontSize: "0.9rem" }}
                              >
                                {c.nome}
                              </span>
                            </div>
                            {c.descricao && (
                              <p
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#64748B",
                                  margin: "4px 0 0",
                                  lineHeight: 1.4,
                                }}
                              >
                                {c.descricao}
                              </p>
                            )}
                          </div>
                          <div
                            style={{ display: "flex", gap: 6, marginLeft: 16 }}
                          >
                            {[0, 12, 25].map((n) => (
                              <button
                                key={n}
                                onClick={() => setNota(c.id, n)}
                                style={{
                                  width: 44,
                                  height: 36,
                                  borderRadius: 8,
                                  border: "none",
                                  cursor: "pointer",
                                  fontWeight: 700,
                                  fontSize: "0.85rem",
                                  background:
                                    nota === n
                                      ? n === 25
                                        ? "#10B981"
                                        : n === 12
                                          ? "#F59E0B"
                                          : "#EF4444"
                                      : "#F1F5F9",
                                  color: nota === n ? "#fff" : "#64748B",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: Resumo */}
            {tab === "resumo" && (
              <div>
                <div
                  className="card"
                  style={{ textAlign: "center", marginBottom: 24 }}
                >
                  <div
                    style={{
                      fontSize: "4rem",
                      fontWeight: 800,
                      color: faixa.color,
                      lineHeight: 1,
                    }}
                  >
                    {scoreTotal}
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#64748B",
                      margin: "4px 0 12px",
                    }}
                  >
                    de 1000 pontos
                  </div>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "6px 20px",
                      borderRadius: 20,
                      background: faixa.color + "15",
                      color: faixa.color,
                      fontWeight: 700,
                    }}
                  >
                    {faixa.label}
                  </div>
                </div>
                <div className="grid grid-2">
                  <div className="card">
                    <div className="card-title" style={{ marginBottom: 12 }}>
                      Radar
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart
                        data={areas.map((a) => ({
                          area: a.codigo,
                          score: scoreByArea[a.id] || 0,
                          max: a.pontos_maximos,
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
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card">
                    <div className="card-title" style={{ marginBottom: 12 }}>
                      Por Área
                    </div>
                    {areas.map((a) => {
                      const score = scoreByArea[a.id] || 0;
                      const pct = (score / a.pontos_maximos) * 100;
                      const barColor =
                        pct >= 80
                          ? "#10B981"
                          : pct >= 60
                            ? "#3B82F6"
                            : pct >= 40
                              ? "#F59E0B"
                              : "#EF4444";
                      return (
                        <div key={a.id} style={{ marginBottom: 10 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.8rem",
                              marginBottom: 4,
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{a.nome}</span>
                            <span style={{ color: "#64748B" }}>
                              {score}/{a.pontos_maximos}
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
                                width: pct + "%",
                                background: barColor,
                                borderRadius: 4,
                                transition: "width 0.4s",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
