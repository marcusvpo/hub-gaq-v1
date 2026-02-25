import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCliente } from "@/contexts/ClienteContext";
import { Plus, BookOpen, Trash2 } from "lucide-react";

interface Ficha {
  id: string;
  nome: string;
  preco_venda: number;
  categoria: string;
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

export default function FichasTecnicasPage() {
  const { selectedCliente } = useCliente();
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProduto, setNewProduto] = useState("");
  const [newCategoria, setNewCategoria] = useState("");
  const [newPreco, setNewPreco] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedCliente) {
      loadFichas();
      loadInsumos();
    }
  }, [selectedCliente]);

  useEffect(() => {
    if (selectedFicha) loadItens(selectedFicha.id);
  }, [selectedFicha]);

  async function loadFichas() {
    if (!selectedCliente) return;
    const { data } = await supabase
      .from("fichas_tecnicas")
      .select("id, nome, preco_venda, categoria")
      .eq("cliente_id", selectedCliente.id)
      .order("nome");
    if (data) {
      setFichas(data);
      if (data.length > 0 && !selectedFicha) setSelectedFicha(data[0]);
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

  async function loadItens(fichaId: string) {
    const { data } = await supabase
      .from("ficha_tecnica_itens")
      .select("id, insumo_id, quantidade")
      .eq("ficha_tecnica_id", fichaId);
    if (data) {
      setItens(
        data.map((d) => {
          const ins = insumos.find((i) => i.id === d.insumo_id);
          return {
            ...d,
            insumo_nome: ins?.nome || "—",
            custo_por_unidade: ins?.custo_por_unidade || 0,
            unidade_uso: ins?.unidade_uso || "un",
          };
        }),
      );
    }
  }

  async function handleCreateFicha() {
    if (!newProduto.trim() || !selectedCliente) return;
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("fichas_tecnicas").insert({
      nome: newProduto,
      categoria: newCategoria,
      preco_venda: parseFloat(newPreco) || 0,
      cliente_id: selectedCliente.id,
    });
    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    await loadFichas();
    setShowNewModal(false);
    setNewProduto("");
    setNewCategoria("");
    setNewPreco("");
    setSaving(false);
  }

  async function handleAddItem(insumoId: string) {
    if (!selectedFicha) return;
    const exists = itens.find((i) => i.insumo_id === insumoId);
    if (exists) return;
    await supabase.from("ficha_tecnica_itens").insert({
      ficha_tecnica_id: selectedFicha.id,
      insumo_id: insumoId,
      quantidade: 0.1,
    });
    await loadItens(selectedFicha.id);
  }

  async function handleUpdateQtd(itemId: string, qtd: number) {
    await supabase
      .from("ficha_tecnica_itens")
      .update({ quantidade: qtd })
      .eq("id", itemId);
    setItens(
      itens.map((i) => (i.id === itemId ? { ...i, quantidade: qtd } : i)),
    );
  }

  async function handleRemoveItem(itemId: string) {
    await supabase.from("ficha_tecnica_itens").delete().eq("id", itemId);
    setItens(itens.filter((i) => i.id !== itemId));
  }

  async function handleUpdatePreco(preco: number) {
    if (!selectedFicha) return;
    await supabase
      .from("fichas_tecnicas")
      .update({ preco_venda: preco })
      .eq("id", selectedFicha.id);
    setSelectedFicha({ ...selectedFicha, preco_venda: preco });
    setFichas(
      fichas.map((f) =>
        f.id === selectedFicha.id ? { ...f, preco_venda: preco } : f,
      ),
    );
  }

  const custoTotal = itens.reduce(
    (s, i) => s + i.quantidade * i.custo_por_unidade,
    0,
  );
  const precoVenda = selectedFicha?.preco_venda || 0;
  const cmvPct = precoVenda > 0 ? (custoTotal / precoVenda) * 100 : 0;
  const margem = precoVenda - custoTotal;
  const semaforoClass =
    cmvPct <= 30
      ? "semaforo-verde"
      : cmvPct <= 35
        ? "semaforo-amarelo"
        : "semaforo-vermelho";

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
          <h1 className="page-title">Fichas Técnicas</h1>
          <p className="page-subtitle">
            {selectedCliente.nome_fantasia} — {fichas.length} fichas
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setError("");
            setShowNewModal(true);
          }}
        >
          <Plus size={18} /> Nova Ficha
        </button>
      </div>
      <div className="page-body">
        <div
          style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}
        >
          {/* Left - Product list */}
          <div>
            {fichas.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFicha(f)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  textAlign: "left",
                  marginBottom: 6,
                  borderRadius: 10,
                  border:
                    selectedFicha?.id === f.id
                      ? "2px solid #3B82F6"
                      : "1px solid #E2E8F0",
                  background: selectedFicha?.id === f.id ? "#EFF6FF" : "#fff",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  {f.nome}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                  R$ {Number(f.preco_venda).toFixed(2)}{" "}
                  {f.categoria && `• ${f.categoria}`}
                </div>
              </button>
            ))}
            {fichas.length === 0 && (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "#94A3B8",
                  fontSize: "0.8rem",
                }}
              >
                Nenhuma ficha criada
              </div>
            )}
          </div>

          {/* Right - Composition editor */}
          {selectedFicha ? (
            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    {selectedFicha.nome}
                  </h3>
                  <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                    <span className={`semaforo ${semaforoClass}`} />
                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      CMV: {cmvPct.toFixed(1)}%
                    </span>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: margem >= 0 ? "#10B981" : "#EF4444",
                        fontWeight: 600,
                      }}
                    >
                      Margem: R$ {margem.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0, width: 120 }}>
                  <label className="form-label" style={{ fontSize: "0.7rem" }}>
                    Preço Venda
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    value={precoVenda}
                    onChange={(e) =>
                      handleUpdatePreco(parseFloat(e.target.value) || 0)
                    }
                    style={{ fontWeight: 700 }}
                  />
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
                  <option value="">+ Adicionar insumo...</option>
                  {insumos
                    .filter((ins) => !itens.find((i) => i.insumo_id === ins.id))
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
              {itens.length > 0 && (
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
                          <td style={{ width: 90 }}>
                            <input
                              className="form-input"
                              type="number"
                              step="1"
                              min="1"
                              value={i.quantidade}
                              onChange={(e) =>
                                handleUpdateQtd(
                                  i.id,
                                  parseFloat(e.target.value) || 0,
                                )
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
                        <td colSpan={3}>Total</td>
                        <td>R$ {custoTotal.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
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
                  Selecione uma ficha ou crie uma nova
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
            style={{ maxWidth: 400 }}
          >
            <h2 className="modal-title">Nova Ficha Técnica</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Produto *</label>
                <input
                  className="form-input"
                  value={newProduto}
                  onChange={(e) => setNewProduto(e.target.value)}
                  placeholder="Ex: X-Burguer"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <input
                  className="form-input"
                  value={newCategoria}
                  onChange={(e) => setNewCategoria(e.target.value)}
                  placeholder="Ex: Hambúrgueres"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Preço de Venda (R$)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  value={newPreco}
                  onChange={(e) => setNewPreco(e.target.value)}
                  placeholder="0.00"
                />
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
                style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
              >
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowNewModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateFicha}
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
