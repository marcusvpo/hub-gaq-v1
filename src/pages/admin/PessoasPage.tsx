import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCliente } from "@/contexts/ClienteContext";
import { Users, Plus, Edit3, Trash2, X } from "lucide-react";

interface Funcionario {
  id: string;
  nome: string;
  cargo: string | null;
  turno: string;
  salario: number | null;
  data_admissao: string | null;
  status: string;
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> =
  {
    ativo: { label: "Ativo", color: "#10B981", bg: "#F0FDF4" },
    ferias: { label: "Férias", color: "#3B82F6", bg: "#EFF6FF" },
    afastado: { label: "Afastado", color: "#F59E0B", bg: "#FFFBEB" },
    desligado: { label: "Desligado", color: "#EF4444", bg: "#FEF2F2" },
  };

const emptyForm = {
  nome: "",
  cargo: "",
  turno: "integral",
  salario: "",
  data_admissao: "",
  status: "ativo",
};

export default function PessoasPage() {
  const { selectedCliente } = useCliente();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (selectedCliente) loadFuncionarios();
  }, [selectedCliente]);

  async function loadFuncionarios() {
    if (!selectedCliente) return;
    const { data } = await supabase
      .from("funcionarios")
      .select("*")
      .eq("cliente_id", selectedCliente.id)
      .order("nome");
    if (data) setFuncionarios(data);
  }

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  }
  function openEdit(f: Funcionario) {
    setEditingId(f.id);
    setForm({
      nome: f.nome,
      cargo: f.cargo || "",
      turno: f.turno,
      salario: f.salario?.toString() || "",
      data_admissao: f.data_admissao || "",
      status: f.status,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!selectedCliente || !form.nome.trim()) return;
    const payload = {
      cliente_id: selectedCliente.id,
      nome: form.nome.trim(),
      cargo: form.cargo.trim() || null,
      turno: form.turno,
      salario: form.salario ? parseFloat(form.salario) : null,
      data_admissao: form.data_admissao || null,
      status: form.status,
    };
    if (editingId) {
      await supabase.from("funcionarios").update(payload).eq("id", editingId);
    } else {
      await supabase.from("funcionarios").insert(payload);
    }
    setShowModal(false);
    loadFuncionarios();
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este funcionário?")) return;
    await supabase.from("funcionarios").delete().eq("id", id);
    loadFuncionarios();
  }

  const ativos = funcionarios.filter((f) => f.status === "ativo");
  const custoTotal = ativos.reduce((acc, f) => acc + (f.salario || 0), 0);

  if (!selectedCliente)
    return (
      <div className="page-body">
        <div className="empty-state">
          <Users className="empty-state-icon" />
          <h3 className="empty-state-title">Selecione um cliente</h3>
        </div>
      </div>
    );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Pessoas</h1>
          <p className="page-subtitle">
            {selectedCliente.nome_fantasia} — equipe e custo de mão de obra
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Novo Funcionário
        </button>
      </div>
      <div className="page-body">
        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div className="card" style={{ padding: 20, textAlign: "center" }}>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1E293B" }}
            >
              {funcionarios.length}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              Total Cadastrados
            </div>
          </div>
          <div className="card" style={{ padding: 20, textAlign: "center" }}>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10B981" }}
            >
              {ativos.length}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>Ativos</div>
          </div>
          <div className="card" style={{ padding: 20, textAlign: "center" }}>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 800, color: "#3B82F6" }}
            >
              R${" "}
              {custoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              Folha Mensal (ativos)
            </div>
          </div>
          <div className="card" style={{ padding: 20, textAlign: "center" }}>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F59E0B" }}
            >
              {
                funcionarios.filter(
                  (f) => f.status === "ferias" || f.status === "afastado",
                ).length
              }
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              Férias/Afastados
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Turno</th>
                <th>Salário</th>
                <th>Admissão</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map((f) => {
                const sc = STATUS_CFG[f.status] || STATUS_CFG.ativo;
                return (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600 }}>{f.nome}</td>
                    <td>{f.cargo || "—"}</td>
                    <td>{f.turno}</td>
                    <td>
                      {f.salario
                        ? `R$ ${Number(f.salario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td>
                      {f.data_admissao
                        ? new Date(
                            f.data_admissao + "T12:00:00",
                          ).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "2px 10px",
                          borderRadius: 12,
                          background: sc.bg,
                          color: sc.color,
                          fontWeight: 600,
                        }}
                      >
                        {sc.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => openEdit(f)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <Edit3 size={14} style={{ color: "#94A3B8" }} />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
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
              {funcionarios.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      color: "#94A3B8",
                      padding: 40,
                    }}
                  >
                    Nenhum funcionário cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                {editingId ? "Editar Funcionário" : "Novo Funcionário"}
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
                  Nome *
                </label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    marginTop: 4,
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
                    Cargo
                  </label>
                  <input
                    value={form.cargo}
                    onChange={(e) =>
                      setForm({ ...form, cargo: e.target.value })
                    }
                    placeholder="Ex: Cozinheiro, Atendente"
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
                    Turno
                  </label>
                  <select
                    value={form.turno}
                    onChange={(e) =>
                      setForm({ ...form, turno: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      marginTop: 4,
                    }}
                  >
                    <option value="integral">Integral</option>
                    <option value="manha">Manhã</option>
                    <option value="tarde">Tarde</option>
                    <option value="noite">Noite</option>
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
                    Salário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.salario}
                    onChange={(e) =>
                      setForm({ ...form, salario: e.target.value })
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
                    Data Admissão
                  </label>
                  <input
                    type="date"
                    value={form.data_admissao}
                    onChange={(e) =>
                      setForm({ ...form, data_admissao: e.target.value })
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
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    marginTop: 4,
                  }}
                >
                  <option value="ativo">✅ Ativo</option>
                  <option value="ferias">🏖️ Férias</option>
                  <option value="afastado">⚠️ Afastado</option>
                  <option value="desligado">❌ Desligado</option>
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
