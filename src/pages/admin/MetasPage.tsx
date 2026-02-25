import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCliente } from "@/contexts/ClienteContext";
import { Plus, Edit3, Trash2, Target, X } from "lucide-react";

interface Meta {
  id: string;
  tipo: string;
  valor_meta: number;
  valor_atual: number | null;
  periodo: string;
  data_inicio: string;
  data_fim: string | null;
  area_id: string | null;
  status: string;
  area_nome?: string;
}

interface Area {
  id: string;
  codigo: string;
  nome: string;
}

const TIPO_LABELS: Record<string, string> = {
  faturamento: "💰 Faturamento (R$)",
  cmv_percentual: "📊 CMV (%)",
  lucro_percentual: "📈 Lucro (%)",
  ticket_medio: "🎫 Ticket Médio (R$)",
  score_total: "🏆 Score Total",
  score_area: "📋 Score por Área",
};

const emptyForm = {
  tipo: "faturamento",
  valor_meta: "",
  periodo: "mensal",
  data_inicio: new Date().toISOString().split("T")[0],
  data_fim: "",
  area_id: "",
  status: "ativa",
};

export default function MetasPage() {
  const { selectedCliente } = useCliente();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

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
    if (selectedCliente) loadMetas();
  }, [selectedCliente]);

  async function loadMetas() {
    if (!selectedCliente) return;
    const { data } = await supabase
      .from("metas")
      .select("*")
      .eq("cliente_id", selectedCliente.id)
      .order("created_at", { ascending: false });
    if (data) {
      setMetas(
        data.map((m: any) => ({
          ...m,
          area_nome: areas.find((a) => a.id === m.area_id)?.nome || "",
        })),
      );
    }
  }

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }
  function openEdit(m: Meta) {
    setEditingId(m.id);
    setForm({
      tipo: m.tipo,
      valor_meta: m.valor_meta.toString(),
      periodo: m.periodo,
      data_inicio: m.data_inicio,
      data_fim: m.data_fim || "",
      area_id: m.area_id || "",
      status: m.status,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!selectedCliente || !form.valor_meta) return;
    const payload = {
      cliente_id: selectedCliente.id,
      tipo: form.tipo,
      valor_meta: parseFloat(form.valor_meta),
      periodo: form.periodo,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim || null,
      area_id: form.area_id || null,
      status: form.status,
    };
    if (editingId) {
      await supabase.from("metas").update(payload).eq("id", editingId);
    } else {
      await supabase.from("metas").insert(payload);
    }
    setShowModal(false);
    loadMetas();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta meta?")) return;
    await supabase.from("metas").delete().eq("id", id);
    loadMetas();
  }

  if (!selectedCliente)
    return (
      <div className="page-body">
        <div className="empty-state">
          <Target className="empty-state-icon" />
          <h3 className="empty-state-title">Selecione um cliente</h3>
        </div>
      </div>
    );

  const ativas = metas.filter((m) => m.status === "ativa");

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Metas</h1>
          <p className="page-subtitle">
            {selectedCliente.nome_fantasia} — metas financeiras e operacionais
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Nova Meta
        </button>
      </div>
      <div className="page-body">
        {ativas.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {ativas.map((m) => {
              const progress =
                m.valor_atual != null
                  ? Math.min(100, (m.valor_atual / m.valor_meta) * 100)
                  : 0;
              const isPercent = m.tipo.includes("percentual");
              const fmt = (v: number) =>
                isPercent
                  ? `${v.toFixed(1)}%`
                  : m.tipo === "score_total" || m.tipo === "score_area"
                    ? v.toString()
                    : `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
              return (
                <div key={m.id} className="card" style={{ padding: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748B",
                          fontWeight: 600,
                        }}
                      >
                        {TIPO_LABELS[m.tipo] || m.tipo}
                      </div>
                      {m.area_nome && (
                        <div style={{ fontSize: "0.7rem", color: "#7C3AED" }}>
                          {m.area_nome}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => openEdit(m)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Edit3 size={14} style={{ color: "#94A3B8" }} />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={14} style={{ color: "#EF4444" }} />
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: "#1E293B",
                    }}
                  >
                    {fmt(m.valor_meta)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#94A3B8",
                      marginBottom: 12,
                    }}
                  >
                    {m.periodo} •{" "}
                    {new Date(m.data_inicio + "T12:00:00").toLocaleDateString(
                      "pt-BR",
                    )}
                  </div>
                  {/* Progress bar */}
                  <div
                    style={{
                      background: "#F1F5F9",
                      borderRadius: 6,
                      height: 8,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height: "100%",
                        background:
                          progress >= 100
                            ? "#10B981"
                            : progress >= 70
                              ? "#3B82F6"
                              : "#F59E0B",
                        borderRadius: 6,
                        transition: "width 0.5s",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 6,
                    }}
                  >
                    <span style={{ fontSize: "0.7rem", color: "#64748B" }}>
                      Atual: {m.valor_atual != null ? fmt(m.valor_atual) : "—"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        color: progress >= 100 ? "#10B981" : "#64748B",
                      }}
                    >
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* All metas table */}
        <div className="card" style={{ padding: 24 }}>
          <div
            style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 16 }}
          >
            Todas as Metas
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Meta</th>
                  <th>Atual</th>
                  <th>Período</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {metas.map((m) => {
                  const isPercent = m.tipo.includes("percentual");
                  const fmt = (v: number) =>
                    isPercent
                      ? `${v.toFixed(1)}%`
                      : m.tipo === "score_total" || m.tipo === "score_area"
                        ? v.toString()
                        : `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                  return (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>
                        {TIPO_LABELS[m.tipo] || m.tipo}
                        {m.area_nome ? ` (${m.area_nome})` : ""}
                      </td>
                      <td style={{ fontWeight: 700 }}>{fmt(m.valor_meta)}</td>
                      <td>
                        {m.valor_atual != null ? fmt(m.valor_atual) : "—"}
                      </td>
                      <td>{m.periodo}</td>
                      <td>
                        <span
                          className={`badge ${m.status === "ativa" ? "badge-success" : m.status === "concluida" ? "badge-info" : "badge-warning"}`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => openEdit(m)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            <Edit3 size={14} style={{ color: "#94A3B8" }} />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={14} style={{ color: "#EF4444" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {metas.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        color: "#94A3B8",
                        padding: 40,
                      }}
                    >
                      Nenhuma meta definida
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
          <div className="card" style={{ width: 480, padding: 32 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                {editingId ? "Editar Meta" : "Nova Meta"}
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
                  Tipo de Meta
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
                  {Object.entries(TIPO_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              {form.tipo === "score_area" && (
                <div>
                  <label
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#64748B",
                    }}
                  >
                    Área
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
                    <option value="">Selecione...</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.codigo} — {a.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                    Valor da Meta *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valor_meta}
                    onChange={(e) =>
                      setForm({ ...form, valor_meta: e.target.value })
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
                    Período
                  </label>
                  <select
                    value={form.periodo}
                    onChange={(e) =>
                      setForm({ ...form, periodo: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      marginTop: 4,
                    }}
                  >
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
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
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={form.data_inicio}
                    onChange={(e) =>
                      setForm({ ...form, data_inicio: e.target.value })
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
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={form.data_fim}
                    onChange={(e) =>
                      setForm({ ...form, data_fim: e.target.value })
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
