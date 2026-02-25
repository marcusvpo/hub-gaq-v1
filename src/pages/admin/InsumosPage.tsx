import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCliente } from "@/contexts/ClienteContext";
import { Plus, Edit3, Trash2, Package } from "lucide-react";

interface Insumo {
  id: string;
  nome: string;
  unidade_compra: string;
  preco_compra: number;
  quantidade_por_compra: number;
  custo_por_unidade: number;
}
interface InsumoForm {
  nome: string;
  unidade_compra: string;
  preco_compra: string;
  quantidade_por_compra: string;
}
const emptyForm: InsumoForm = {
  nome: "",
  unidade_compra: "kg",
  preco_compra: "",
  quantidade_por_compra: "",
};

export default function InsumosPage() {
  const { selectedCliente } = useCliente();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<InsumoForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedCliente) loadInsumos();
  }, [selectedCliente]);

  async function loadInsumos() {
    if (!selectedCliente) return;
    const { data } = await supabase
      .from("insumos")
      .select("*")
      .eq("cliente_id", selectedCliente.id)
      .eq("ativo", true)
      .order("nome");
    if (data) setInsumos(data);
  }

  function openNew() {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }
  function openEdit(i: Insumo) {
    setEditId(i.id);
    setForm({
      nome: i.nome,
      unidade_compra: i.unidade_compra,
      preco_compra: String(i.preco_compra),
      quantidade_por_compra: String(i.quantidade_por_compra),
    });
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    if (!selectedCliente) return;
    setSaving(true);
    setError("");
    const preco = parseFloat(form.preco_compra) || 0;
    const qtd = parseFloat(form.quantidade_por_compra) || 1;
    const payload: Record<string, unknown> = {
      nome: form.nome,
      unidade_compra: form.unidade_compra,
      preco_compra: preco,
      quantidade_por_compra: qtd,
      cliente_id: selectedCliente.id,
    };
    if (editId) {
      const { error: err } = await supabase
        .from("insumos")
        .update(payload)
        .eq("id", editId);
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: err } = await supabase.from("insumos").insert(payload);
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
    }
    await loadInsumos();
    setShowModal(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Desativar insumo?")) return;
    await supabase.from("insumos").update({ ativo: false }).eq("id", id);
    await loadInsumos();
  }

  const custoPreview = (() => {
    const p = parseFloat(form.preco_compra) || 0;
    const q = parseFloat(form.quantidade_por_compra) || 1;
    return q > 0 ? p / q : 0;
  })();

  if (!selectedCliente)
    return (
      <div className="page-body">
        <div className="empty-state">
          <Package className="empty-state-icon" />
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
          <h1 className="page-title">Insumos</h1>
          <p className="page-subtitle">
            {selectedCliente.nome_fantasia} — {insumos.length} insumos
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={18} /> Novo Insumo
        </button>
      </div>
      <div className="page-body">
        {insumos.length === 0 ? (
          <div className="empty-state">
            <Package className="empty-state-icon" />
            <h3 className="empty-state-title">Nenhum insumo cadastrado</h3>
            <p className="empty-state-text">
              Cadastre os ingredientes e insumos deste cliente
            </p>
            <button className="btn btn-primary" onClick={openNew}>
              <Plus size={16} /> Novo Insumo
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Unidade</th>
                  <th>Preço Emb.</th>
                  <th>Qtd Emb.</th>
                  <th>Custo/Unid.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((i) => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 600 }}>{i.nome}</td>
                    <td>{i.unidade_compra}</td>
                    <td>R$ {Number(i.preco_compra).toFixed(2)}</td>
                    <td>{Number(i.quantidade_por_compra).toFixed(3)}</td>
                    <td style={{ fontWeight: 700, color: "#3B82F6" }}>
                      R$ {Number(i.custo_por_unidade).toFixed(4)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn-icon"
                          onClick={() => openEdit(i)}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDelete(i.id)}
                          style={{ color: "#EF4444" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 440 }}
          >
            <h2 className="modal-title">
              {editId ? "Editar Insumo" : "Novo Insumo"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input
                  className="form-input"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Filé mignon"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unidade de Medida</label>
                <select
                  className="form-input"
                  value={form.unidade_compra}
                  onChange={(e) =>
                    setForm({ ...form, unidade_compra: e.target.value })
                  }
                >
                  <option value="kg">Quilograma (kg)</option>
                  <option value="g">Grama (g)</option>
                  <option value="L">Litro (L)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="un">Unidade (un)</option>
                </select>
              </div>
              <div className="grid grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Preço da Embalagem (R$)</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    value={form.preco_compra}
                    onChange={(e) =>
                      setForm({ ...form, preco_compra: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantidade na Emb.</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.001"
                    value={form.quantidade_por_compra}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        quantidade_por_compra: e.target.value,
                      })
                    }
                    placeholder="1.000"
                  />
                </div>
              </div>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#F0F9FF",
                  border: "1px solid #BAE6FD",
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "#0369A1" }}>
                  Custo unitário: <strong>R$ {custoPreview.toFixed(4)}</strong>{" "}
                  / {form.unidade_compra}
                </span>
              </div>
              {error && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#FEE2E2",
                    color: "#991B1B",
                    fontSize: "0.8rem",
                  }}
                >
                  {error}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  marginTop: 8,
                }}
              >
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
