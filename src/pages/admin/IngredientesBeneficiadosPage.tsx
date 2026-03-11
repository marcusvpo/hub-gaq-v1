import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCliente } from "@/contexts/ClienteContext";
import { Plus, BookOpen, Trash2 } from "lucide-react";

interface IngredienteBeneficiado {
  id: string;
  nome: string;
  categoria: string;
  rendimento: number;
  unidade_rendimento: string;
  custo_total: number;
  custo_por_unidade: number;
  modo_preparo: string;
}

interface Item {
  id: string;
  insumo_id: string;
  insumo_nome: string;
  quantidade: number;
  custo_por_unidade: number;
  unidade_uso: string;
}

interface Insumo {
  id: string;
  nome: string;
  custo_por_unidade: number;
  unidade_uso: string;
}

export default function IngredientesBeneficiadosPage() {
  const { selectedCliente } = useCliente();
  const [ingredientes, setIngredientes] = useState<IngredienteBeneficiado[]>(
    [],
  );
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [selectedIngrediente, setSelectedIngrediente] =
    useState<IngredienteBeneficiado | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);

  const [newNome, setNewNome] = useState("");
  const [newCategoria, setNewCategoria] = useState("");
  const [newRendimento, setNewRendimento] = useState("1");
  const [newUnidade, setNewUnidade] = useState("kg");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedCliente) {
      loadIngredientes();
      loadInsumos();
    }
  }, [selectedCliente]);

  useEffect(() => {
    if (selectedIngrediente) loadItens(selectedIngrediente.id);
  }, [selectedIngrediente]);

  async function loadIngredientes() {
    if (!selectedCliente) return;
    const { data } = await supabase
      .from("ingredientes_beneficiados")
      .select("*")
      .eq("cliente_id", selectedCliente.id)
      .order("nome");
    if (data) {
      setIngredientes(data);
      if (data.length > 0 && !selectedIngrediente)
        setSelectedIngrediente(data[0]);
    }
  }

  async function loadInsumos() {
    if (!selectedCliente) return;
    const { data } = await supabase
      .from("insumos")
      .select("id, nome, custo_por_unidade, unidade_uso")
      .eq("cliente_id", selectedCliente.id)
      .eq("ativo", true)
      .order("nome");
    if (data) setInsumos(data);
  }

  async function loadItens(ingredienteId: string) {
    const { data } = await supabase
      .from("ingrediente_beneficiado_itens")
      .select("id, insumo_id, quantidade, custo_por_unidade")
      .eq("ingrediente_beneficiado_id", ingredienteId);
    if (data) {
      setItens(
        data.map((d) => {
          const ins = insumos.find((i) => i.id === d.insumo_id);
          return {
            ...d,
            insumo_nome: ins?.nome || "—",
            unidade_uso: ins?.unidade_uso || "un",
            custo_por_unidade:
              d.custo_por_unidade > 0
                ? d.custo_por_unidade
                : ins?.custo_por_unidade || 0,
          };
        }),
      );
    }
  }

  async function handleCreateIngrediente() {
    if (!newNome.trim() || !selectedCliente) return;

    // Convert comma to dot for parsing
    const parsedRend = parseFloat(newRendimento.replace(",", "."));
    if (isNaN(parsedRend) || parsedRend <= 0) {
      setError("Rendimento inválido");
      return;
    }

    setSaving(true);
    setError("");
    const { error: err } = await supabase
      .from("ingredientes_beneficiados")
      .insert({
        nome: newNome,
        categoria: newCategoria,
        rendimento: parsedRend,
        unidade_rendimento: newUnidade,
        cliente_id: selectedCliente.id,
      });
    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    await loadIngredientes();
    setShowNewModal(false);
    setNewNome("");
    setNewCategoria("");
    setNewRendimento("1");
    setSaving(false);
  }

  async function handleAddItem(insumoId: string) {
    if (!selectedIngrediente) return;
    const exists = itens.find((i) => i.insumo_id === insumoId);
    if (exists) return;

    const ins = insumos.find((i) => i.id === insumoId);

    await supabase.from("ingrediente_beneficiado_itens").insert({
      ingrediente_beneficiado_id: selectedIngrediente.id,
      insumo_id: insumoId,
      quantidade: 0.1, // Changed from 0 to 0.1 to avoid db constraints
      custo_por_unidade: ins?.custo_por_unidade || 0,
    });
    await loadItens(selectedIngrediente.id);
    await loadIngredientes(); // Refresh totals
  }

  // Handle commas to dots and update qtd
  async function handleUpdateQtd(itemId: string, valueStr: string) {
    const numericStr = valueStr.replace(",", ".");
    const qtd = parseFloat(numericStr);

    // Only update state temporarily if it's invalid so user can type
    if (isNaN(qtd)) {
      // Just let it be handled by local state if we want to get fancy,
      // but for now we'll do an immediate update if it's a valid number
      return;
    }

    await supabase
      .from("ingrediente_beneficiado_itens")
      .update({ quantidade: qtd })
      .eq("id", itemId);

    // Update local state instantly for UI responsiveness
    setItens(
      itens.map((i) => (i.id === itemId ? { ...i, quantidade: qtd } : i)),
    );

    // Reload ingredients to catch the new computed total from trigger
    await loadIngredientes();
  }

  async function handleRemoveItem(itemId: string) {
    await supabase
      .from("ingrediente_beneficiado_itens")
      .delete()
      .eq("id", itemId);
    setItens(itens.filter((i) => i.id !== itemId));
    await loadIngredientes(); // Refresh totals
  }

  async function handleUpdateRendimento(valueStr: string) {
    if (!selectedIngrediente) return;
    const numericStr = valueStr.replace(",", ".");
    const rend = parseFloat(numericStr);
    if (isNaN(rend) || rend <= 0) return;

    await supabase
      .from("ingredientes_beneficiados")
      .update({ rendimento: rend })
      .eq("id", selectedIngrediente.id);

    setSelectedIngrediente({ ...selectedIngrediente, rendimento: rend });
    setIngredientes(
      ingredientes.map((f) =>
        f.id === selectedIngrediente.id ? { ...f, rendimento: rend } : f,
      ),
    );
    // Reload to get updated calculated unit cost trigger
    await loadIngredientes();
  }

  const custoTotal = itens.reduce(
    (s, i) => s + i.quantidade * i.custo_por_unidade,
    0,
  );

  const rendimento = selectedIngrediente?.rendimento || 1;
  const custoPorUnidadeCalc = rendimento > 0 ? custoTotal / rendimento : 0;

  if (!selectedCliente)
    return (
      <div className="page-body">
        <div className="empty-state">
          <BookOpen className="empty-state-icon" />
          <h3 className="empty-state-title">Selecione um cliente</h3>
        </div>
      </div>
    );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ingredientes Beneficiados</h1>
          <p className="page-subtitle">
            {selectedCliente.nome_fantasia} — {ingredientes.length} cadastrados
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setError("");
            setShowNewModal(true);
          }}
        >
          <Plus size={18} /> Novo Ingrediente
        </button>
      </div>
      <div className="page-body">
        <div
          style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}
        >
          {/* Left - List */}
          <div>
            {ingredientes.map((ing) => (
              <button
                key={ing.id}
                onClick={() => setSelectedIngrediente(ing)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  textAlign: "left",
                  marginBottom: 6,
                  borderRadius: 10,
                  border:
                    selectedIngrediente?.id === ing.id
                      ? "2px solid #3B82F6"
                      : "1px solid #E2E8F0",
                  background:
                    selectedIngrediente?.id === ing.id ? "#EFF6FF" : "#fff",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  {ing.nome}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                  Custo/Un: R$ {Number(ing.custo_por_unidade).toFixed(2)} /{" "}
                  {ing.unidade_rendimento}
                </div>
              </button>
            ))}
            {ingredientes.length === 0 && (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "#94A3B8",
                  fontSize: "0.8rem",
                }}
              >
                Nenhum ingrediente beneficiado
              </div>
            )}
          </div>

          {/* Right - Editor */}
          {selectedIngrediente ? (
            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    {selectedIngrediente.nome}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginTop: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "#334155",
                      }}
                    >
                      Custo Total: R$ {custoTotal.toFixed(2)}
                    </span>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "#059669",
                      }}
                    >
                      Custo / {selectedIngrediente.unidade_rendimento}: R${" "}
                      {custoPorUnidadeCalc.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div className="form-group" style={{ margin: 0, width: 90 }}>
                    <label
                      className="form-label"
                      style={{ fontSize: "0.7rem" }}
                    >
                      Rendimento
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      step="any"
                      min="0.01"
                      defaultValue={selectedIngrediente.rendimento}
                      onBlur={(e) => handleUpdateRendimento(e.target.value)}
                      style={{ fontWeight: 700, padding: "6px 8px" }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0, width: 70 }}>
                    <label
                      className="form-label"
                      style={{ fontSize: "0.7rem" }}
                    >
                      Unidade
                    </label>
                    <input
                      className="form-input"
                      value={selectedIngrediente.unidade_rendimento}
                      disabled
                      style={{ background: "#F8FAFC", padding: "6px 8px" }}
                    />
                  </div>
                </div>
              </div>

              {/* Add ingredient */}
              <div style={{ marginBottom: 16 }}>
                <select
                  className="form-input"
                  onChange={(e) => {
                    if (e.target.value) handleAddItem(e.target.value);
                    e.target.value = "";
                  }}
                  style={{ fontSize: "0.85rem" }}
                >
                  <option value="">+ Adicionar insumo (base)...</option>
                  {insumos
                    .filter(
                      (ins) =>
                        !itens.find((i) => i.insumo_id === ins.id) &&
                        ins.id !== selectedIngrediente.id,
                    )
                    .map((ins) => (
                      <option key={ins.id} value={ins.id}>
                        {ins.nome} (R${" "}
                        {Number(ins.custo_por_unidade).toFixed(4)}/
                        {ins.unidade_uso})
                      </option>
                    ))}
                </select>
              </div>

              {/* Items table */}
              {itens.length > 0 ? (
                <div className="table-container" style={{ border: "none" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Insumo</th>
                        <th>Qtd</th>
                        <th>Un</th>
                        <th>Custo</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((i) => (
                        <tr key={i.id}>
                          <td style={{ fontWeight: 500 }}>{i.insumo_nome}</td>
                          <td style={{ width: 100 }}>
                            <input
                              className="form-input"
                              type="number"
                              step="any"
                              min="0"
                              defaultValue={i.quantidade}
                              onBlur={(e) =>
                                handleUpdateQtd(i.id, e.target.value)
                              }
                              style={{
                                padding: "4px 8px",
                                fontSize: "0.8rem",
                                width: "100%",
                              }}
                            />
                          </td>
                          <td style={{ fontSize: "0.8rem", color: "#64748B" }}>
                            {i.unidade_uso}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            R$ {(i.quantidade * i.custo_por_unidade).toFixed(2)}
                          </td>
                          <td>
                            <button
                              className="btn-icon"
                              onClick={() => handleRemoveItem(i.id)}
                              style={{ color: "#EF4444" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr
                        style={{
                          fontWeight: 700,
                          borderTop: "2px solid #E2E8F0",
                        }}
                      >
                        <td colSpan={3}>Custo Total</td>
                        <td>R$ {custoTotal.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "#94A3B8",
                    padding: 30,
                    background: "#F8FAFC",
                    borderRadius: 8,
                  }}
                >
                  <p style={{ fontSize: "0.85rem" }}>
                    Adicione insumos para compor este ingrediente beneficiado.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 300,
              }}
            >
              <div style={{ textAlign: "center", color: "#94A3B8" }}>
                <BookOpen size={40} style={{ marginBottom: 8, opacity: 0.4 }} />
                <p style={{ fontSize: "0.85rem" }}>
                  Selecione um ingrediente beneficiado ou crie um novo
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div
            className="modal animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 450 }}
          >
            <h2 className="modal-title">Novo Ingrediente Beneficiado</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">
                  Nome (ex: Geleia de Abacaxi) *
                </label>
                <input
                  className="form-input"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  placeholder="Nome do ingrediente"
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div className="form-group">
                  <label className="form-label">
                    Rendimento (Total gerado) *
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    step="any"
                    min="0.01"
                    value={newRendimento}
                    onChange={(e) => setNewRendimento(e.target.value)}
                    placeholder="Ex: 5"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unidade de Medida *</label>
                  <select
                    className="form-input"
                    value={newUnidade}
                    onChange={(e) => setNewUnidade(e.target.value)}
                  >
                    <option value="kg">Quilograma (kg)</option>
                    <option value="g">Grama (g)</option>
                    <option value="l">Litro (l)</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="un">Unidade (un)</option>
                  </select>
                </div>
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
                  onClick={() => setShowNewModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateIngrediente}
                  disabled={saving}
                >
                  {saving ? "Salvando..." : "Criar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
