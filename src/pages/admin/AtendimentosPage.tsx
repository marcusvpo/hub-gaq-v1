import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCliente } from "@/contexts/ClienteContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  Edit3,
  Trash2,
  MapPin,
  Phone,
  Clock,
  X,
  Calendar,
} from "lucide-react";

interface Atendimento {
  id: string;
  data_atendimento: string;
  tipo: string;
  duracao_minutos: number | null;
  descricao: string | null;
  areas_trabalhadas: string[] | null;
  created_at: string;
}

const TIPO_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof MapPin }
> = {
  presencial: { label: "Presencial", color: "#10B981", icon: MapPin },
  remoto: { label: "Remoto", color: "#3B82F6", icon: Phone },
  telefone: { label: "Telefone", color: "#F59E0B", icon: Phone },
};

const emptyForm = {
  data_atendimento: new Date().toISOString().split("T")[0],
  tipo: "presencial",
  duracao_minutos: "",
  descricao: "",
  areas_trabalhadas: [] as string[],
};

const AREAS_OPTIONS = [
  "Financeiro",
  "CMV & Markup",
  "Operação",
  "Estoque",
  "Pessoas",
  "Vendas",
  "Marketing",
  "Gestão & Estratégia",
];

export default function AtendimentosPage() {
  const { selectedCliente } = useCliente();
  const { user } = useAuth();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (selectedCliente) loadAtendimentos();
  }, [selectedCliente]);

  async function loadAtendimentos() {
    if (!selectedCliente) return;
    const { data } = await supabase
      .from("atendimentos")
      .select("*")
      .eq("cliente_id", selectedCliente.id)
      .order("data_atendimento", { ascending: false });
    if (data) setAtendimentos(data);
  }

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(a: Atendimento) {
    setEditingId(a.id);
    setForm({
      data_atendimento: a.data_atendimento,
      tipo: a.tipo,
      duracao_minutos: a.duracao_minutos?.toString() || "",
      descricao: a.descricao || "",
      areas_trabalhadas: a.areas_trabalhadas || [],
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!selectedCliente) return;
    const payload = {
      cliente_id: selectedCliente.id,
      consultor_id: user?.id,
      data_atendimento: form.data_atendimento,
      tipo: form.tipo,
      duracao_minutos: form.duracao_minutos
        ? parseInt(form.duracao_minutos)
        : null,
      descricao: form.descricao.trim() || null,
      areas_trabalhadas:
        form.areas_trabalhadas.length > 0 ? form.areas_trabalhadas : null,
    };

    if (editingId) {
      await supabase.from("atendimentos").update(payload).eq("id", editingId);
    } else {
      await supabase.from("atendimentos").insert(payload);
    }
    setShowModal(false);
    loadAtendimentos();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este atendimento?")) return;
    await supabase.from("atendimentos").delete().eq("id", id);
    loadAtendimentos();
  }

  function toggleArea(area: string) {
    setForm((f) => ({
      ...f,
      areas_trabalhadas: f.areas_trabalhadas.includes(area)
        ? f.areas_trabalhadas.filter((a) => a !== area)
        : [...f.areas_trabalhadas, area],
    }));
  }

  const totalHoras = atendimentos.reduce(
    (acc, a) => acc + (a.duracao_minutos || 0),
    0,
  );

  if (!selectedCliente)
    return (
      <div className="page-body">
        <div className="empty-state">
          <Calendar className="empty-state-icon" />
          <h3 className="empty-state-title">Selecione um cliente</h3>
        </div>
      </div>
    );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Atendimentos</h1>
          <p className="page-subtitle">
            {selectedCliente.nome_fantasia} — {atendimentos.length} visitas,{" "}
            {Math.round(totalHoras / 60)}h totais
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Novo Atendimento
        </button>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
            <div
              key={key}
              className="card"
              style={{ padding: 20, textAlign: "center" }}
            >
              <cfg.icon
                size={24}
                style={{ color: cfg.color, marginBottom: 8 }}
              />
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "#1E293B",
                }}
              >
                {atendimentos.filter((a) => a.tipo === key).length}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
                {cfg.label}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        {atendimentos.length === 0 ? (
          <div className="empty-state">
            <Calendar className="empty-state-icon" />
            <h3 className="empty-state-title">Nenhum atendimento registrado</h3>
            <p className="empty-state-text">
              Registre suas visitas e reuniões com o cliente
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {atendimentos.map((a) => {
              const cfg = TIPO_CONFIG[a.tipo] || TIPO_CONFIG.presencial;
              const Icon = cfg.icon;
              return (
                <div key={a.id} className="card" style={{ padding: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ display: "flex", gap: 14, flex: 1 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: `${cfg.color}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={18} style={{ color: cfg.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 4,
                          }}
                        >
                          <span style={{ fontWeight: 700, color: "#1E293B" }}>
                            {new Date(
                              a.data_atendimento + "T12:00:00",
                            ).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "2px 8px",
                              borderRadius: 12,
                              background: `${cfg.color}15`,
                              color: cfg.color,
                              fontWeight: 600,
                            }}
                          >
                            {cfg.label}
                          </span>
                          {a.duracao_minutos && (
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#94A3B8",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Clock size={12} /> {a.duracao_minutos}min
                            </span>
                          )}
                        </div>
                        {a.descricao && (
                          <div
                            style={{
                              fontSize: "0.85rem",
                              color: "#475569",
                              marginTop: 6,
                              lineHeight: 1.5,
                            }}
                          >
                            {a.descricao}
                          </div>
                        )}
                        {a.areas_trabalhadas &&
                          a.areas_trabalhadas.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                marginTop: 10,
                                flexWrap: "wrap",
                              }}
                            >
                              {a.areas_trabalhadas.map((area) => (
                                <span
                                  key={area}
                                  style={{
                                    fontSize: "0.7rem",
                                    padding: "2px 8px",
                                    borderRadius: 12,
                                    background: "#EDE9FE",
                                    color: "#7C3AED",
                                    fontWeight: 500,
                                  }}
                                >
                                  {area}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => openEdit(a)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Edit3 size={16} style={{ color: "#94A3B8" }} />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
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
                {editingId ? "Editar Atendimento" : "Novo Atendimento"}
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
                    Data
                  </label>
                  <input
                    type="date"
                    value={form.data_atendimento}
                    onChange={(e) =>
                      setForm({ ...form, data_atendimento: e.target.value })
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
                    Tipo
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      marginTop: 4,
                    }}
                  >
                    <option value="presencial">📍 Presencial</option>
                    <option value="remoto">💻 Remoto</option>
                    <option value="telefone">📞 Telefone</option>
                  </select>
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
                  Duração (minutos)
                </label>
                <input
                  type="number"
                  value={form.duracao_minutos}
                  onChange={(e) =>
                    setForm({ ...form, duracao_minutos: e.target.value })
                  }
                  placeholder="ex: 120"
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
                  Descrição / Anotações
                </label>
                <textarea
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                  rows={4}
                  placeholder="O que foi trabalhado nesta visita..."
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
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#64748B",
                    marginBottom: 8,
                    display: "block",
                  }}
                >
                  Áreas Trabalhadas
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {AREAS_OPTIONS.map((area) => (
                    <button
                      key={area}
                      onClick={() => toggleArea(area)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 20,
                        border: "1px solid",
                        borderColor: form.areas_trabalhadas.includes(area)
                          ? "#7C3AED"
                          : "#E2E8F0",
                        background: form.areas_trabalhadas.includes(area)
                          ? "#EDE9FE"
                          : "#fff",
                        color: form.areas_trabalhadas.includes(area)
                          ? "#7C3AED"
                          : "#64748B",
                        fontWeight: form.areas_trabalhadas.includes(area)
                          ? 600
                          : 400,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      {area}
                    </button>
                  ))}
                </div>
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
