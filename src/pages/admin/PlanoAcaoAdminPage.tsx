import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCliente } from "@/contexts/ClienteContext";
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  X,
} from "lucide-react";

interface PlanoAcao {
  id: string;
  cliente_id: string;
  area_id: string | null;
  titulo: string;
  descricao: string | null;
  prioridade: string;
  responsavel: string | null;
  prazo: string | null;
  status: string;
  created_at: string;
  area_nome?: string;
  subtarefas?: Subtarefa[];
}

interface Subtarefa {
  id: string;
  descricao: string;
  concluido: boolean;
}

interface Area {
  id: string;
  codigo: string;
  nome: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: typeof Circle }
> = {
  pendente: {
    label: "Pendente",
    color: "#F59E0B",
    bg: "#FFFBEB",
    icon: Circle,
  },
  em_andamento: {
    label: "Em Andamento",
    color: "#3B82F6",
    bg: "#EFF6FF",
    icon: Clock,
  },
  concluido: {
    label: "Concluído",
    color: "#10B981",
    bg: "#F0FDF4",
    icon: CheckCircle2,
  },
  cancelado: { label: "Cancelado", color: "#94A3B8", bg: "#F8FAFC", icon: X },
};

const PRIORIDADE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  critica: { label: "Crítica", color: "#EF4444", bg: "#FEF2F2" },
  alta: { label: "Alta", color: "#F97316", bg: "#FFF7ED" },
  media: { label: "Média", color: "#F59E0B", bg: "#FFFBEB" },
  baixa: { label: "Baixa", color: "#10B981", bg: "#F0FDF4" },
};

const emptyForm = {
  titulo: "",
  descricao: "",
  prioridade: "media",
  responsavel: "",
  prazo: "",
  area_id: "",
  status: "pendente",
};

export default function PlanoAcaoAdminPage() {
  const { selectedCliente } = useCliente();
  const [planos, setPlanos] = useState<PlanoAcao[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [newSubtarefa, setNewSubtarefa] = useState("");

  useEffect(() => {
    supabase
      .from("areas")
      .select("id, codigo, nome")
      .order("ordem")
      .then(({ data }) => {
        if (data) setAreas(data);
      });
  }, []);

  useEffect(() => {
    if (selectedCliente) loadPlanos();
  }, [selectedCliente]);

  async function loadPlanos() {
    if (!selectedCliente) return;
    const { data } = await supabase
      .from("planos_acao")
      .select("*")
      .eq("cliente_id", selectedCliente.id)
      .order("created_at", { ascending: false });

    if (data) {
      // Load areas names and subtarefas
      const enriched = await Promise.all(
        data.map(async (p) => {
          const area = areas.find((a) => a.id === p.area_id);
          const { data: subs } = await supabase
            .from("plano_acao_subtarefas")
            .select("*")
            .eq("plano_acao_id", p.id)
            .order("created_at");
          return {
            ...p,
            area_nome: area?.nome || "",
            subtarefas: subs || [],
          };
        }),
      );
      setPlanos(enriched);
    }
  }

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(p: PlanoAcao) {
    setEditingId(p.id);
    setForm({
      titulo: p.titulo,
      descricao: p.descricao || "",
      prioridade: p.prioridade,
      responsavel: p.responsavel || "",
      prazo: p.prazo || "",
      area_id: p.area_id || "",
      status: p.status,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!selectedCliente || !form.titulo.trim()) return;
    const payload = {
      cliente_id: selectedCliente.id,
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      prioridade: form.prioridade,
      responsavel: form.responsavel.trim() || null,
      prazo: form.prazo || null,
      area_id: form.area_id || null,
      status: form.status,
    };

    if (editingId) {
      await supabase.from("planos_acao").update(payload).eq("id", editingId);
    } else {
      await supabase.from("planos_acao").insert(payload);
    }
    setShowModal(false);
    loadPlanos();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta ação?")) return;
    await supabase.from("planos_acao").delete().eq("id", id);
    loadPlanos();
  }

  async function toggleStatus(id: string, current: string) {
    const next =
      current === "pendente"
        ? "em_andamento"
        : current === "em_andamento"
          ? "concluido"
          : "pendente";
    await supabase.from("planos_acao").update({ status: next }).eq("id", id);
    loadPlanos();
  }

  async function addSubtarefa(planoId: string) {
    if (!newSubtarefa.trim()) return;
    await supabase.from("plano_acao_subtarefas").insert({
      plano_acao_id: planoId,
      descricao: newSubtarefa.trim(),
    });
    setNewSubtarefa("");
    loadPlanos();
  }

  async function toggleSubtarefa(id: string, current: boolean) {
    await supabase
      .from("plano_acao_subtarefas")
      .update({ concluido: !current })
      .eq("id", id);
    loadPlanos();
  }

  async function deleteSubtarefa(id: string) {
    await supabase.from("plano_acao_subtarefas").delete().eq("id", id);
    loadPlanos();
  }

  const filtered =
    filterStatus === "todos"
      ? planos
      : planos.filter((p) => p.status === filterStatus);

  if (!selectedCliente)
    return (
      <div className="page-body">
        <div className="empty-state">
          <AlertTriangle className="empty-state-icon" />
          <h3 className="empty-state-title">Selecione um cliente</h3>
        </div>
      </div>
    );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Plano de Ação</h1>
          <p className="page-subtitle">
            {selectedCliente.nome_fantasia} — ações e tarefas do consultor
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Nova Ação
        </button>
      </div>

      <div className="page-body">
        {/* Status filter */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {["todos", "pendente", "em_andamento", "concluido", "cancelado"].map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: "1px solid",
                  borderColor: filterStatus === s ? "#3B82F6" : "#E2E8F0",
                  background: filterStatus === s ? "#EFF6FF" : "#fff",
                  color: filterStatus === s ? "#3B82F6" : "#64748B",
                  fontWeight: filterStatus === s ? 600 : 400,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                {s === "todos" ? "Todos" : STATUS_CONFIG[s]?.label || s}
                {s !== "todos" && (
                  <span style={{ marginLeft: 6, opacity: 0.7 }}>
                    ({planos.filter((p) => p.status === s).length})
                  </span>
                )}
              </button>
            ),
          )}
        </div>

        {/* Summary cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {Object.entries(PRIORIDADE_CONFIG).map(([key, cfg]) => (
            <div
              key={key}
              style={{
                padding: 16,
                borderRadius: 12,
                background: cfg.bg,
                border: `1px solid ${cfg.color}20`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: cfg.color,
                }}
              >
                {
                  planos.filter(
                    (p) => p.prioridade === key && p.status !== "concluido",
                  ).length
                }
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: cfg.color,
                  fontWeight: 600,
                }}
              >
                {cfg.label}
              </div>
            </div>
          ))}
        </div>

        {/* Planos list */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state-title">Nenhuma ação encontrada</h3>
            <p className="empty-state-text">
              Crie ações para acompanhar melhorias do cliente
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((p) => {
              const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.pendente;
              const pc =
                PRIORIDADE_CONFIG[p.prioridade] || PRIORIDADE_CONFIG.media;
              const Icon = sc.icon;
              const completedSubs = (p.subtarefas || []).filter(
                (s) => s.concluido,
              ).length;
              const totalSubs = (p.subtarefas || []).length;

              return (
                <div key={p.id} className="card" style={{ padding: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ display: "flex", gap: 12, flex: 1 }}>
                      <button
                        onClick={() => toggleStatus(p.id, p.status)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          marginTop: 2,
                        }}
                      >
                        <Icon size={20} style={{ color: sc.color }} />
                      </button>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            color: "#1E293B",
                            textDecoration:
                              p.status === "concluido"
                                ? "line-through"
                                : "none",
                          }}
                        >
                          {p.titulo}
                        </div>
                        {p.descricao && (
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#64748B",
                              marginTop: 4,
                            }}
                          >
                            {p.descricao}
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "2px 8px",
                              borderRadius: 12,
                              background: pc.bg,
                              color: pc.color,
                              fontWeight: 600,
                            }}
                          >
                            {pc.label}
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "2px 8px",
                              borderRadius: 12,
                              background: sc.bg,
                              color: sc.color,
                              fontWeight: 600,
                            }}
                          >
                            {sc.label}
                          </span>
                          {p.area_nome && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                padding: "2px 8px",
                                borderRadius: 12,
                                background: "#EDE9FE",
                                color: "#7C3AED",
                                fontWeight: 600,
                              }}
                            >
                              {p.area_nome}
                            </span>
                          )}
                          {p.responsavel && (
                            <span
                              style={{ fontSize: "0.7rem", color: "#94A3B8" }}
                            >
                              👤 {p.responsavel}
                            </span>
                          )}
                          {p.prazo && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                color:
                                  new Date(p.prazo) < new Date() &&
                                  p.status !== "concluido"
                                    ? "#EF4444"
                                    : "#94A3B8",
                              }}
                            >
                              📅{" "}
                              {new Date(
                                p.prazo + "T12:00:00",
                              ).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                          {totalSubs > 0 && (
                            <span
                              style={{ fontSize: "0.7rem", color: "#64748B" }}
                            >
                              ✅ {completedSubs}/{totalSubs}
                            </span>
                          )}
                        </div>

                        {/* Subtarefas */}
                        {(p.subtarefas || []).length > 0 && (
                          <div style={{ marginTop: 12, paddingLeft: 4 }}>
                            {p.subtarefas!.map((sub) => (
                              <div
                                key={sub.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "4px 0",
                                }}
                              >
                                <button
                                  onClick={() =>
                                    toggleSubtarefa(sub.id, sub.concluido)
                                  }
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                  }}
                                >
                                  {sub.concluido ? (
                                    <CheckCircle2
                                      size={14}
                                      style={{ color: "#10B981" }}
                                    />
                                  ) : (
                                    <Circle
                                      size={14}
                                      style={{ color: "#CBD5E1" }}
                                    />
                                  )}
                                </button>
                                <span
                                  style={{
                                    fontSize: "0.8rem",
                                    color: sub.concluido
                                      ? "#94A3B8"
                                      : "#475569",
                                    textDecoration: sub.concluido
                                      ? "line-through"
                                      : "none",
                                  }}
                                >
                                  {sub.descricao}
                                </span>
                                <button
                                  onClick={() => deleteSubtarefa(sub.id)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    marginLeft: "auto",
                                  }}
                                >
                                  <X size={12} style={{ color: "#CBD5E1" }} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add subtarefa inline */}
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <input
                            placeholder="Adicionar subtarefa..."
                            value={newSubtarefa}
                            onChange={(e) => setNewSubtarefa(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addSubtarefa(p.id);
                            }}
                            style={{
                              flex: 1,
                              padding: "4px 10px",
                              fontSize: "0.8rem",
                              borderRadius: 6,
                              border: "1px solid #E2E8F0",
                            }}
                          />
                          <button
                            onClick={() => addSubtarefa(p.id)}
                            className="btn btn-primary"
                            style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={() => openEdit(p)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Edit3 size={16} style={{ color: "#94A3B8" }} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={16} style={{ color: "#EF4444" }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{
              width: 520,
              maxHeight: "90vh",
              overflow: "auto",
              padding: 32,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                {editingId ? "Editar Ação" : "Nova Ação"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#64748B",
                  }}
                >
                  Título *
                </label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    marginTop: 4,
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#64748B",
                  }}
                >
                  Descrição
                </label>
                <textarea
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    marginTop: 4,
                    resize: "vertical",
                  }}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#64748B",
                    }}
                  >
                    Prioridade
                  </label>
                  <select
                    value={form.prioridade}
                    onChange={(e) =>
                      setForm({ ...form, prioridade: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      marginTop: 4,
                    }}
                  >
                    <option value="critica">🔴 Crítica</option>
                    <option value="alta">🟠 Alta</option>
                    <option value="media">🟡 Média</option>
                    <option value="baixa">🟢 Baixa</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#64748B",
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      marginTop: 4,
                    }}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#64748B",
                    }}
                  >
                    Responsável
                  </label>
                  <input
                    value={form.responsavel}
                    onChange={(e) =>
                      setForm({ ...form, responsavel: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      marginTop: 4,
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#64748B",
                    }}
                  >
                    Prazo
                  </label>
                  <input
                    type="date"
                    value={form.prazo}
                    onChange={(e) =>
                      setForm({ ...form, prazo: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      marginTop: 4,
                    }}
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#64748B",
                  }}
                >
                  Área do Scorecard
                </label>
                <select
                  value={form.area_id}
                  onChange={(e) =>
                    setForm({ ...form, area_id: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    marginTop: 4,
                  }}
                >
                  <option value="">Nenhuma</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.codigo} — {a.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 24,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                className="btn"
                style={{ background: "#F1F5F9", color: "#64748B" }}
              >
                Cancelar
              </button>
              <button onClick={handleSave} className="btn btn-primary">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
