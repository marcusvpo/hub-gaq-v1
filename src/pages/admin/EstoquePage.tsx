import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCliente } from "@/contexts/ClienteContext";
import { Package, Plus, X } from "lucide-react";

interface InsumoEstoque {
  insumo_id: string;
  insumo_nome: string;
  unidade_uso: string;
  quantidade_atual: number;
  estoque_minimo: number | null;
  estoque_maximo: number | null;
}

interface Movimentacao {
  id: string;
  insumo_nome: string;
  tipo: string;
  quantidade: number;
  valor_unitario: number | null;
  fornecedor: string | null;
  observacao: string | null;
  data_movimentacao: string;
}

const TIPO_MOV: Record<string, { label: string; color: string; sign: string }> =
  {
    entrada: { label: "Entrada", color: "#10B981", sign: "+" },
    saida_producao: { label: "Saída Produção", color: "#3B82F6", sign: "-" },
    saida_desperdicio: { label: "Desperdício", color: "#EF4444", sign: "-" },
    ajuste: { label: "Ajuste", color: "#F59E0B", sign: "±" },
  };

export default function EstoquePage() {
  const { selectedCliente } = useCliente();
  const [saldos, setSaldos] = useState<InsumoEstoque[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [insumos, setInsumos] = useState<
    { id: string; nome: string; unidade_uso: string }[]
  >([]);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<"saldos" | "movimentacoes">("saldos");
  const [form, setForm] = useState({
    insumo_id: "",
    tipo: "entrada",
    quantidade: "",
    valor_unitario: "",
    fornecedor: "",
    observacao: "",
    data_movimentacao: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (selectedCliente) loadAll();
  }, [selectedCliente]);

  async function loadAll() {
    if (!selectedCliente) return;

    // Load insumos
    const { data: insData } = await supabase
      .from("insumos")
      .select("id, nome, unidade_uso")
      .eq("cliente_id", selectedCliente.id)
      .eq("ativo", true)
      .order("nome");
    if (insData) setInsumos(insData);

    // Load saldos with insumo info
    const { data: saldoData } = await supabase
      .from("estoque_saldos")
      .select("*")
      .eq("cliente_id", selectedCliente.id);

    if (insData) {
      const saldoMap = new Map(
        (saldoData || []).map((s: any) => [s.insumo_id, s.quantidade_atual]),
      );
      const { data: insFullData } = await supabase
        .from("insumos")
        .select("id, nome, unidade_uso, estoque_minimo, estoque_maximo")
        .eq("cliente_id", selectedCliente.id)
        .eq("ativo", true)
        .order("nome");

      if (insFullData) {
        setSaldos(
          insFullData.map((ins: any) => ({
            insumo_id: ins.id,
            insumo_nome: ins.nome,
            unidade_uso: ins.unidade_uso,
            quantidade_atual: Number(saldoMap.get(ins.id) || 0),
            estoque_minimo: ins.estoque_minimo
              ? Number(ins.estoque_minimo)
              : null,
            estoque_maximo: ins.estoque_maximo
              ? Number(ins.estoque_maximo)
              : null,
          })),
        );
      }
    }

    // Load recent movimentacoes
    const { data: movData } = await supabase
      .from("estoque_movimentacoes")
      .select("*")
      .eq("cliente_id", selectedCliente.id)
      .order("data_movimentacao", { ascending: false })
      .limit(50);

    if (movData && insData) {
      const insMap = new Map(insData.map((i: any) => [i.id, i.nome]));
      setMovimentacoes(
        movData.map((m: any) => ({
          ...m,
          insumo_nome: insMap.get(m.insumo_id) || "?",
        })),
      );
    }
  }

  async function handleSave() {
    if (!selectedCliente || !form.insumo_id || !form.quantidade) return;
    const qty = parseFloat(form.quantidade);
    if (isNaN(qty) || qty <= 0) return;

    await supabase.from("estoque_movimentacoes").insert({
      cliente_id: selectedCliente.id,
      insumo_id: form.insumo_id,
      tipo: form.tipo,
      quantidade: qty,
      valor_unitario: form.valor_unitario
        ? parseFloat(form.valor_unitario)
        : null,
      fornecedor: form.fornecedor.trim() || null,
      observacao: form.observacao.trim() || null,
      data_movimentacao: form.data_movimentacao,
    });

    // Update saldo
    const { data: existing } = await supabase
      .from("estoque_saldos")
      .select("*")
      .eq("cliente_id", selectedCliente.id)
      .eq("insumo_id", form.insumo_id)
      .limit(1);

    const delta =
      form.tipo === "entrada" ? qty : form.tipo === "ajuste" ? qty : -qty;
    const currentQty =
      existing && existing.length > 0
        ? Number(existing[0].quantidade_atual)
        : 0;
    const newQty = Math.max(0, currentQty + delta);

    if (existing && existing.length > 0) {
      await supabase
        .from("estoque_saldos")
        .update({
          quantidade_atual: newQty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing[0].id);
    } else {
      await supabase.from("estoque_saldos").insert({
        cliente_id: selectedCliente.id,
        insumo_id: form.insumo_id,
        quantidade_atual: newQty,
      });
    }

    setShowModal(false);
    setForm({
      insumo_id: "",
      tipo: "entrada",
      quantidade: "",
      valor_unitario: "",
      fornecedor: "",
      observacao: "",
      data_movimentacao: new Date().toISOString().split("T")[0],
    });
    loadAll();
  }

  const lowStockCount = saldos.filter(
    (s) => s.estoque_minimo && s.quantidade_atual <= s.estoque_minimo,
  ).length;

  if (!selectedCliente)
    return (
      <div className="page-body">
        <div className="empty-state">
          <Package className="empty-state-icon" />
          <h3 className="empty-state-title">Selecione um cliente</h3>
        </div>
      </div>
    );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Estoque</h1>
          <p className="page-subtitle">
            {selectedCliente.nome_fantasia} — controle de entradas, saídas e
            saldos
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nova Movimentação
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
              {saldos.length}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              Itens em Estoque
            </div>
          </div>
          <div className="card" style={{ padding: 20, textAlign: "center" }}>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: lowStockCount > 0 ? "#EF4444" : "#10B981",
              }}
            >
              {lowStockCount}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              Abaixo do Mínimo
            </div>
          </div>
          <div className="card" style={{ padding: 20, textAlign: "center" }}>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10B981" }}
            >
              {movimentacoes.filter((m) => m.tipo === "entrada").length}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              Entradas (recentes)
            </div>
          </div>
          <div className="card" style={{ padding: 20, textAlign: "center" }}>
            <div
              style={{ fontSize: "1.5rem", fontWeight: 800, color: "#EF4444" }}
            >
              {
                movimentacoes.filter((m) => m.tipo === "saida_desperdicio")
                  .length
              }
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
              Desperdícios
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {(["saldos", "movimentacoes"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 20px",
                borderRadius: "8px 8px 0 0",
                border: "1px solid",
                borderBottom: "none",
                borderColor: tab === t ? "#3B82F6" : "#E2E8F0",
                background: tab === t ? "#EFF6FF" : "#fff",
                color: tab === t ? "#3B82F6" : "#64748B",
                fontWeight: tab === t ? 700 : 400,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              {t === "saldos" ? "📦 Saldos" : "📋 Movimentações"}
            </button>
          ))}
        </div>

        {tab === "saldos" ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Unidade</th>
                  <th>Qtd Atual</th>
                  <th>Mínimo</th>
                  <th>Máximo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {saldos.map((s) => {
                  const isLow =
                    s.estoque_minimo != null &&
                    s.quantidade_atual <= s.estoque_minimo;
                  const isHigh =
                    s.estoque_maximo != null &&
                    s.quantidade_atual >= s.estoque_maximo;
                  return (
                    <tr key={s.insumo_id}>
                      <td style={{ fontWeight: 600 }}>{s.insumo_nome}</td>
                      <td>{s.unidade_uso}</td>
                      <td
                        style={{
                          fontWeight: 700,
                          color: isLow ? "#EF4444" : "#1E293B",
                        }}
                      >
                        {s.quantidade_atual.toFixed(1)}
                      </td>
                      <td style={{ color: "#94A3B8" }}>
                        {s.estoque_minimo?.toFixed(1) ?? "—"}
                      </td>
                      <td style={{ color: "#94A3B8" }}>
                        {s.estoque_maximo?.toFixed(1) ?? "—"}
                      </td>
                      <td>
                        {isLow ? (
                          <span className="badge badge-danger">⚠️ Baixo</span>
                        ) : isHigh ? (
                          <span className="badge badge-warning">📈 Alto</span>
                        ) : (
                          <span className="badge badge-success">✅ OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {saldos.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        color: "#94A3B8",
                        padding: 40,
                      }}
                    >
                      Nenhum saldo registrado — faça sua primeira movimentação
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Insumo</th>
                  <th>Tipo</th>
                  <th>Qtd</th>
                  <th>Valor Unit.</th>
                  <th>Fornecedor</th>
                  <th>Obs</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.map((m) => {
                  const cfg = TIPO_MOV[m.tipo] || TIPO_MOV.entrada;
                  return (
                    <tr key={m.id}>
                      <td>
                        {new Date(
                          m.data_movimentacao + "T12:00:00",
                        ).toLocaleDateString("pt-BR")}
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.insumo_nome}</td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "2px 8px",
                            borderRadius: 12,
                            background: `${cfg.color}15`,
                            color: cfg.color,
                            fontWeight: 600,
                          }}
                        >
                          {cfg.sign} {cfg.label}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {Number(m.quantidade).toFixed(1)}
                      </td>
                      <td>
                        {m.valor_unitario
                          ? `R$ ${Number(m.valor_unitario).toFixed(2)}`
                          : "—"}
                      </td>
                      <td>{m.fornecedor || "—"}</td>
                      <td
                        style={{
                          fontSize: "0.8rem",
                          color: "#64748B",
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {m.observacao || "—"}
                      </td>
                    </tr>
                  );
                })}
                {movimentacoes.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        color: "#94A3B8",
                        padding: 40,
                      }}
                    >
                      Nenhuma movimentação registrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Nova Movimentação */}
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
                Nova Movimentação
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
                  Insumo *
                </label>
                <select
                  value={form.insumo_id}
                  onChange={(e) =>
                    setForm({ ...form, insumo_id: e.target.value })
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
                  {insumos.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nome} ({i.unidade_uso})
                    </option>
                  ))}
                </select>
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
                    <option value="entrada">📥 Entrada (Compra)</option>
                    <option value="saida_producao">📤 Saída Produção</option>
                    <option value="saida_desperdicio">🗑️ Desperdício</option>
                    <option value="ajuste">⚖️ Ajuste</option>
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
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.quantidade}
                    onChange={(e) =>
                      setForm({ ...form, quantidade: e.target.value })
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
                    Valor Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valor_unitario}
                    onChange={(e) =>
                      setForm({ ...form, valor_unitario: e.target.value })
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
                    Data
                  </label>
                  <input
                    type="date"
                    value={form.data_movimentacao}
                    onChange={(e) =>
                      setForm({ ...form, data_movimentacao: e.target.value })
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
                  Fornecedor
                </label>
                <input
                  value={form.fornecedor}
                  onChange={(e) =>
                    setForm({ ...form, fornecedor: e.target.value })
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
                  Observação
                </label>
                <input
                  value={form.observacao}
                  onChange={(e) =>
                    setForm({ ...form, observacao: e.target.value })
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
