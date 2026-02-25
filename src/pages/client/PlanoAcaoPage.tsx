import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, Circle, AlertCircle, ArrowRight } from "lucide-react";

interface ActionItem {
  criterio_codigo: string;
  criterio_nome: string;
  criterio_descricao: string | null;
  area_codigo: string;
  area_nome: string;
  nota: number;
  prioridade: "critica" | "alta" | "media";
}

export default function PlanoAcaoPage() {
  const { user } = useAuth();
  const [actions, setActions] = useState<ActionItem[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("cliente_users")
      .select("cliente_id")
      .eq("user_id", user.id)
      .limit(1)
      .then(async ({ data }) => {
        if (data && data.length > 0) {
          // Get latest evaluation
          const { data: avs } = await supabase
            .from("avaliacoes")
            .select("id")
            .eq("cliente_id", data[0].cliente_id)
            .order("created_at", { ascending: false })
            .limit(1);
          if (avs && avs.length > 0) {
            // Get criteria with low scores
            const { data: crits } = await supabase
              .from("avaliacao_criterios")
              .select(
                `nota, criterio:criterios(codigo, nome, descricao, area:areas(codigo, nome))`,
              )
              .eq("avaliacao_id", avs[0].id)
              .in("nota", [0, 12])
              .order("nota");
            if (crits) {
              setActions(
                crits.map((c: any) => ({
                  criterio_codigo: c.criterio.codigo,
                  criterio_nome: c.criterio.nome,
                  criterio_descricao: c.criterio.descricao,
                  area_codigo: c.criterio.area.codigo,
                  area_nome: c.criterio.area.nome,
                  nota: c.nota,
                  prioridade: c.nota === 0 ? "critica" : "alta",
                })),
              );
            }
          }
        }
      });
  }, [user]);

  const criticas = actions.filter((a) => a.prioridade === "critica");
  const altas = actions.filter((a) => a.prioridade === "alta");

  const prioConfig = {
    critica: {
      label: "Crítica",
      color: "#EF4444",
      bg: "#FEF2F2",
      border: "#FECACA",
      icon: AlertCircle,
    },
    alta: {
      label: "Alta",
      color: "#F59E0B",
      bg: "#FFFBEB",
      border: "#FDE68A",
      icon: Circle,
    },
  };

  const renderGroup = (items: ActionItem[], prio: "critica" | "alta") => {
    const config = prioConfig[prio];
    return (
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <config.icon size={18} style={{ color: config.color }} />
          <span
            style={{ fontWeight: 700, fontSize: "1rem", color: config.color }}
          >
            Prioridade {config.label}
          </span>
          <span
            className="badge"
            style={{
              background: config.bg,
              color: config.color,
              border: `1px solid ${config.border}`,
            }}
          >
            {items.length} ações
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((a) => (
            <div
              key={a.criterio_codigo}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 20px",
                borderRadius: 14,
                background: config.bg,
                border: `1px solid ${config.border}`,
                transition: "transform var(--transition-fast)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: config.color + "20",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: config.color,
                  fontWeight: 700,
                  fontSize: "0.7rem",
                }}
              >
                {a.nota}pts
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                    {a.criterio_codigo} — {a.criterio_nome}
                  </span>
                  <span
                    className="badge badge-neutral"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {a.area_nome}
                  </span>
                </div>
                {a.criterio_descricao && (
                  <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    {a.criterio_descricao}
                  </div>
                )}
              </div>
              <ArrowRight size={16} style={{ color: "#CBD5E1" }} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Plano de Ação</h1>
          <p className="page-subtitle">
            Ações prioritárias baseadas no diagnóstico Raio-X
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div
            className="card"
            style={{
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={16} style={{ color: "#EF4444" }} />
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
              {criticas.length} críticas
            </span>
          </div>
          <div
            className="card"
            style={{
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Circle size={16} style={{ color: "#F59E0B" }} />
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
              {altas.length} melhorias
            </span>
          </div>
        </div>
      </div>
      <div className="page-body">
        {actions.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2
              className="empty-state-icon"
              style={{ color: "#10B981" }}
            />
            <h3 className="empty-state-title">Nenhuma ação pendente</h3>
            <p className="empty-state-text">
              Ou o diagnóstico ainda não foi realizado, ou tudo está nota
              máxima! 🎉
            </p>
          </div>
        ) : (
          <>
            {criticas.length > 0 && renderGroup(criticas, "critica")}
            {altas.length > 0 && renderGroup(altas, "alta")}

            {/* Summary */}
            <div
              className="card"
              style={{
                background: "#F0F9FF",
                borderColor: "#BAE6FD",
                textAlign: "center",
                padding: 32,
              }}
            >
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#0369A1",
                  fontWeight: 500,
                }}
              >
                Total de <strong>{actions.length}</strong> ações identificadas
                em{" "}
                <strong>
                  {new Set(actions.map((a) => a.area_codigo)).size}
                </strong>{" "}
                áreas diferentes. Comece pelas ações críticas (nota 0) para o
                maior impacto.
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
