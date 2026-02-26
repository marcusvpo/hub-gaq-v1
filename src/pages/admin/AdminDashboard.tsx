import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCliente } from "@/contexts/ClienteContext";
import {
  Users,
  AlertTriangle,
  Calendar,
  Activity,
  Star,
  MessageSquare,
} from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  clientes: number;
  leads_contato: number;
  acoes_abertas: number;
  score_medio: number;
}

interface ClienteScore {
  id: string;
  nome_fantasia: string;
  segmento: string | null;
  score_total: number | null;
  classificacao: string | null;
  data_avaliacao: string | null;
}

interface RecentActivity {
  id: string;
  tipo: string;
  descricao: string;
  data: string;
  cliente_nome: string;
}

interface AlertItem {
  id: string;
  tipo: string;
  mensagem: string;
  cliente_nome: string;
  urgencia: "alta" | "media" | "baixa";
}

const FAIXAS_COLORS: Record<string, string> = {
  "Risco Estrutural Alto": "#EF4444",
  "Operação Instável": "#F97316",
  "Estrutura Funcional": "#F59E0B",
  "Estrutura Organizada": "#10B981",
  "Gestão Profissional": "#3B82F6",
  "Operação Escalável": "#8B5CF6",
};

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { clientes } = useCliente();
  const [stats, setStats] = useState<Stats>({
    clientes: 0,
    leads_contato: 0,
    acoes_abertas: 0,
    score_medio: 0,
  });
  const [clienteScores, setClienteScores] = useState<ClienteScore[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    [],
  );
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [avgScoreByArea, setAvgScoreByArea] = useState<
    { area: string; score: number }[]
  >([]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    // Stats
    const [c, l, ac] = await Promise.all([
      supabase
        .from("clientes")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .in("status", ["novo", "contato_feito", "reuniao_agendada"]),
      supabase
        .from("planos_acao")
        .select("id", { count: "exact", head: true })
        .eq("status", "pendente"),
    ]);

    // Calcular score médio
    const { data: avScores } = await supabase
      .from("avaliacoes")
      .select("score_total")
      .eq("status", "concluido");
    const avg =
      avScores && avScores.length > 0
        ? Math.round(
            avScores.reduce((acc, curr) => acc + (curr.score_total || 0), 0) /
              avScores.length,
          )
        : 0;

    setStats({
      clientes: c.count ?? 0,
      leads_contato: l.count ?? 0,
      acoes_abertas: ac.count ?? 0,
      score_medio: avg,
    });

    // Latest scores per client
    const { data: avData } = await supabase
      .from("avaliacoes")
      .select("id, cliente_id, score_total, classificacao, data_avaliacao")
      .eq("status", "concluido")
      .order("data_avaliacao", { ascending: false });

    if (avData && avData.length > 0) {
      // Get unique latest per client
      const latestMap = new Map<string, (typeof avData)[0]>();
      for (const av of avData) {
        if (!latestMap.has(av.cliente_id)) latestMap.set(av.cliente_id, av);
      }

      const { data: clientesData } = await supabase
        .from("clientes")
        .select("id, nome_fantasia, segmento")
        .eq("ativo", true);

      if (clientesData) {
        const scored: ClienteScore[] = clientesData.map((cl) => {
          const av = latestMap.get(cl.id);
          return {
            ...cl,
            score_total: av?.score_total ?? null,
            classificacao: av?.classificacao ?? null,
            data_avaliacao: av?.data_avaliacao ?? null,
          };
        });
        scored.sort((a, b) => (b.score_total ?? -1) - (a.score_total ?? -1));
        setClienteScores(scored);
      }
    } else {
      const { data: clientesData } = await supabase
        .from("clientes")
        .select("id, nome_fantasia, segmento")
        .eq("ativo", true);
      if (clientesData) {
        setClienteScores(
          clientesData.map((cl) => ({
            ...cl,
            score_total: null,
            classificacao: null,
            data_avaliacao: null,
          })),
        );
      }
    }

    // Avg score by area across all clients
    const { data: scoreAreaData } = await supabase
      .from("vw_score_por_area")
      .select("*");

    if (scoreAreaData && scoreAreaData.length > 0) {
      const areaMap = new Map<
        string,
        { total: number; count: number; max: number }
      >();
      for (const row of scoreAreaData) {
        const key = row.area_nome;
        const cur = areaMap.get(key) || { total: 0, count: 0, max: 125 };
        cur.total += Number(row.score_area);
        cur.count += 1;
        areaMap.set(key, cur);
      }
      setAvgScoreByArea(
        Array.from(areaMap.entries()).map(([area, d]) => ({
          area,
          score: Math.round((d.total / d.count / 125) * 100),
        })),
      );
    }

    // Recent activities
    const activities: RecentActivity[] = [];

    const { data: recentAv } = await supabase
      .from("avaliacoes")
      .select("id, cliente_id, data_avaliacao, score_total, status")
      .order("created_at", { ascending: false })
      .limit(5);

    if (recentAv) {
      for (const av of recentAv) {
        const cl = clientes.find((c) => c.id === av.cliente_id);
        activities.push({
          id: av.id,
          tipo: "diagnostico",
          descricao: `Scorecard ${av.status === "concluido" ? `concluído (${av.score_total} pts)` : av.status}`,
          data: av.data_avaliacao,
          cliente_nome: cl?.nome_fantasia || "Cliente",
        });
      }
    }

    setRecentActivities(activities);

    // Alerts
    const alertList: AlertItem[] = [];
    // Clients without diagnosis
    if (clienteScores.length > 0) {
      for (const cl of clienteScores) {
        if (!cl.score_total) {
          alertList.push({
            id: cl.id,
            tipo: "sem_diagnostico",
            mensagem: "Sem diagnóstico realizado",
            cliente_nome: cl.nome_fantasia,
            urgencia: "alta",
          });
        } else if (cl.score_total <= 350) {
          alertList.push({
            id: cl.id,
            tipo: "risco",
            mensagem: `Score ${cl.score_total} — Risco Estrutural`,
            cliente_nome: cl.nome_fantasia,
            urgencia: "alta",
          });
        }
      }
    }
    setAlerts(alertList.slice(0, 5));
  }

  const avgScore =
    clienteScores.filter((c) => c.score_total !== null).length > 0
      ? Math.round(
          clienteScores
            .filter((c) => c.score_total !== null)
            .reduce((acc, c) => acc + (c.score_total || 0), 0) /
            clienteScores.filter((c) => c.score_total !== null).length,
        )
      : 0;

  const atRiskCount = clienteScores.filter(
    (c) => c.score_total !== null && c.score_total <= 350,
  ).length;

  const metrics = [
    {
      label: "Clientes Ativos",
      value: stats.clientes,
      icon: Users,
      color: "blue",
    },
    {
      label: "Leads em Contato",
      value: stats.leads_contato,
      icon: MessageSquare,
      color: "green",
    },
    {
      label: "Ações Pendentes",
      value: stats.acoes_abertas,
      icon: Activity,
      color: "purple",
    },
    {
      label: "Score Médio Rede",
      value: stats.score_medio,
      icon: Star,
      color: "yellow",
    },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Olá, {profile?.full_name || "Consultor"} 👋
          </h1>
          <p className="page-subtitle">
            Resumo geral da plataforma HUB Ariel Quadros
          </p>
        </div>
      </div>
      <div className="page-body">
        {/* KPI Cards */}
        <div className="grid grid-4 stagger">
          {metrics.map((m) => (
            <div key={m.label} className="card metric-card">
              <div className={`metric-icon metric-icon-${m.color}`}>
                <m.icon size={20} />
              </div>
              <div className="card-value">{m.value}</div>
              <div className="card-label">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Secondary KPI row */}
        <div
          className="grid stagger"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            marginTop: 24,
          }}
        >
          <div className="card" style={{ padding: 24, textAlign: "center" }}>
            <Activity size={28} style={{ color: "#3B82F6", marginBottom: 8 }} />
            <div
              style={{ fontSize: "2rem", fontWeight: 800, color: "#1E293B" }}
            >
              {avgScore}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              Score Médio dos Clientes
            </div>
          </div>
          <div className="card" style={{ padding: 24, textAlign: "center" }}>
            <AlertTriangle
              size={28}
              style={{ color: "#EF4444", marginBottom: 8 }}
            />
            <div
              style={{ fontSize: "2rem", fontWeight: 800, color: "#EF4444" }}
            >
              {atRiskCount}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              Clientes em Risco
            </div>
          </div>
          <div className="card" style={{ padding: 24, textAlign: "center" }}>
            <Star size={28} style={{ color: "#F59E0B", marginBottom: 8 }} />
            <div
              style={{ fontSize: "2rem", fontWeight: 800, color: "#1E293B" }}
            >
              {
                clienteScores.filter(
                  (c) => c.score_total && c.score_total > 650,
                ).length
              }
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              Clientes Bem Classificados
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginTop: 24,
          }}
        >
          {/* Ranking de Clientes */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                marginBottom: 16,
                color: "#1E293B",
              }}
            >
              🏆 Ranking de Clientes por Score
            </div>
            {clienteScores.length === 0 ? (
              <div style={{ color: "#94A3B8", fontSize: "0.85rem" }}>
                Nenhum cliente cadastrado
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {clienteScores.slice(0, 8).map((cl, i) => (
                  <div
                    key={cl.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: i < 3 ? "#F8FAFC" : "transparent",
                      border: "1px solid #F1F5F9",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background:
                            i === 0
                              ? "#FEF3C7"
                              : i === 1
                                ? "#E2E8F0"
                                : i === 2
                                  ? "#FED7AA"
                                  : "#F8FAFC",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "#64748B",
                        }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "#1E293B",
                          }}
                        >
                          {cl.nome_fantasia}
                        </div>
                        {cl.segmento && (
                          <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                            {cl.segmento}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {cl.score_total != null ? (
                        <>
                          <span
                            style={{
                              fontSize: "0.9rem",
                              fontWeight: 700,
                              color:
                                FAIXAS_COLORS[cl.classificacao || ""] ||
                                "#64748B",
                            }}
                          >
                            {cl.score_total}
                          </span>
                          <div
                            style={{ fontSize: "0.65rem", color: "#94A3B8" }}
                          >
                            {cl.classificacao}
                          </div>
                        </>
                      ) : (
                        <span
                          className="badge badge-warning"
                          style={{ fontSize: "0.65rem" }}
                        >
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Radar Chart - Score médio por área */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                marginBottom: 16,
                color: "#1E293B",
              }}
            >
              📊 Score Médio por Área (Benchmark)
            </div>
            {avgScoreByArea.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={avgScoreByArea}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis
                    dataKey="area"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                  />
                  <Radar
                    name="Score %"
                    dataKey="score"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: "#94A3B8", fontSize: "0.85rem" }}>
                Complete diagnósticos para visualizar
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: Activities + Alerts */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginTop: 24,
          }}
        >
          {/* Recent Activities */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                marginBottom: 16,
                color: "#1E293B",
              }}
            >
              📅 Atividades Recentes
            </div>
            {recentActivities.length === 0 ? (
              <div style={{ color: "#94A3B8", fontSize: "0.85rem" }}>
                Nenhuma atividade recente
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: "1px solid #F1F5F9",
                    }}
                  >
                    <Calendar
                      size={16}
                      style={{ color: "#3B82F6", flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                        {act.cliente_nome}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        {act.descricao}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#94A3B8",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {act.data
                        ? new Date(act.data + "T12:00:00").toLocaleDateString(
                            "pt-BR",
                          )
                        : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                marginBottom: 16,
                color: "#1E293B",
              }}
            >
              ⚠️ Alertas de Ação
            </div>
            {alerts.length === 0 ? (
              <div
                style={{
                  color: "#10B981",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                ✅ Tudo em dia — nenhum alerta pendente
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {alerts.map((al) => (
                  <div
                    key={al.id + al.tipo}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background:
                        al.urgencia === "alta" ? "#FEF2F2" : "#FFFBEB",
                      border: `1px solid ${al.urgencia === "alta" ? "#FECACA" : "#FDE68A"}`,
                    }}
                  >
                    <AlertTriangle
                      size={16}
                      style={{
                        color: al.urgencia === "alta" ? "#EF4444" : "#F59E0B",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "#1E293B",
                        }}
                      >
                        {al.cliente_nome}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        {al.mensagem}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
