import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useCliente } from "@/contexts/ClienteContext";
import {
  Sparkles,
  ArrowUpDown,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* ───────── types ───────── */
interface Produto {
  id: string;
  nome: string;
  categoria: string;
  preco_venda: number;
  cmv: number; // custo total (R$)
  cmv_pct: number; // % CMV
  valor_cmv30: number; // target price for 30% CMV
  margem_bruta: number; // R$
  status: "SAUDÁVEL" | "ATENÇÃO" | "CRÍTICO";
  demanda: "ALTA" | "NORMAL" | "BAIXA";
  prioridade: "PRIORIDADE ALTA" | "PRIORIDADE BAIXA" | "NÃO AJUSTAR AGORA";
}

/* ───────── constants ───────── */
const STATUS_CONFIG = {
  SAUDÁVEL: { color: "#10B981", bg: "#F0FDF4", icon: CheckCircle2 },
  ATENÇÃO: { color: "#F59E0B", bg: "#FFFBEB", icon: AlertTriangle },
  CRÍTICO: { color: "#EF4444", bg: "#FEF2F2", icon: XCircle },
} as const;

const PRIORIDADE_CONFIG = {
  "PRIORIDADE ALTA": { color: "#EF4444", bg: "#FEF2F2" },
  "PRIORIDADE BAIXA": { color: "#F59E0B", bg: "#FFFBEB" },
  "NÃO AJUSTAR AGORA": { color: "#10B981", bg: "#F0FDF4" },
} as const;

const DEMANDA_OPTIONS = ["ALTA", "NORMAL", "BAIXA"] as const;

function calcStatus(cmvPct: number): "SAUDÁVEL" | "ATENÇÃO" | "CRÍTICO" {
  if (cmvPct < 28) return "SAUDÁVEL";
  if (cmvPct < 32) return "ATENÇÃO";
  return "CRÍTICO";
}

function calcPrioridade(
  status: string,
): "PRIORIDADE ALTA" | "PRIORIDADE BAIXA" | "NÃO AJUSTAR AGORA" {
  if (status === "CRÍTICO") return "PRIORIDADE ALTA";
  if (status === "ATENÇÃO") return "PRIORIDADE BAIXA";
  return "NÃO AJUSTAR AGORA";
}

/* ───────── component ───────── */
export default function RaioXProdutosAdminPage() {
  const { selectedCliente } = useCliente();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof Produto>("cmv_pct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterCategoria, setFilterCategoria] = useState<string>("todas");

  useEffect(() => {
    if (selectedCliente) loadProdutos();
  }, [selectedCliente]);

  /* ───── load data ───── */
  async function loadProdutos() {
    if (!selectedCliente) return;
    setLoading(true);

    // 1. fichas técnicas
    const { data: fichas } = await supabase
      .from("fichas_tecnicas")
      .select("id, nome, categoria, preco_venda, demanda")
      .eq("cliente_id", selectedCliente.id)
      .eq("ativo", true);

    if (!fichas || fichas.length === 0) {
      setProdutos([]);
      setLoading(false);
      return;
    }

    // 2. itens das fichas
    const fichaIds = fichas.map((f) => f.id);
    const { data: itens } = await supabase
      .from("ficha_tecnica_itens")
      .select("ficha_tecnica_id, insumo_id, quantidade")
      .in("ficha_tecnica_id", fichaIds);

    // 3. insumos com custo
    const insumoIds = [...new Set((itens || []).map((i) => i.insumo_id))];
    const insumosMap: Record<string, number> = {};
    if (insumoIds.length > 0) {
      const { data: insumos } = await supabase
        .from("insumos")
        .select("id, custo_por_unidade")
        .in("id", insumoIds);
      insumos?.forEach((ins) => {
        insumosMap[ins.id] = Number(ins.custo_por_unidade) || 0;
      });
    }

    // 4. montar produtos
    const result: Produto[] = fichas.map((f) => {
      const fichaItens = (itens || []).filter(
        (i) => i.ficha_tecnica_id === f.id,
      );
      const cmv = fichaItens.reduce(
        (sum, item) =>
          sum + Number(item.quantidade) * (insumosMap[item.insumo_id] || 0),
        0,
      );
      const preco = Number(f.preco_venda) || 0;
      const cmv_pct = preco > 0 ? (cmv / preco) * 100 : 0;
      const valor_cmv30 = cmv > 0 ? cmv / 0.3 : 0;
      const margem_bruta = preco - cmv;
      const status = calcStatus(cmv_pct);
      const demandaRaw = (f.demanda || "normal").toUpperCase() as
        | "ALTA"
        | "NORMAL"
        | "BAIXA";
      const prioridade = calcPrioridade(status);

      return {
        id: f.id,
        nome: f.nome || "",
        categoria: f.categoria || "Sem categoria",
        preco_venda: preco,
        cmv,
        cmv_pct,
        valor_cmv30,
        margem_bruta,
        status,
        demanda: demandaRaw,
        prioridade,
      };
    });

    setProdutos(result);
    setLoading(false);
  }

  /* ───── update demanda ───── */
  async function updateDemanda(prodId: string, newDemanda: string) {
    setProdutos((prev) =>
      prev.map((p) =>
        p.id === prodId
          ? {
              ...p,
              demanda: newDemanda as "ALTA" | "NORMAL" | "BAIXA",
            }
          : p,
      ),
    );
    await supabase
      .from("fichas_tecnicas")
      .update({ demanda: newDemanda.toLowerCase() })
      .eq("id", prodId);
  }

  /* ───── sort ───── */
  function toggleSort(field: keyof Produto) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  /* ───── derived data ───── */
  const categorias = useMemo(
    () => [...new Set(produtos.map((p) => p.categoria))].sort(),
    [produtos],
  );

  const filtered = useMemo(() => {
    return produtos
      .filter((p) => filterStatus === "todos" || p.status === filterStatus)
      .filter(
        (p) => filterCategoria === "todas" || p.categoria === filterCategoria,
      )
      .sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        if (typeof av === "number" && typeof bv === "number")
          return sortDir === "asc" ? av - bv : bv - av;
        return sortDir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
  }, [produtos, filterStatus, filterCategoria, sortField, sortDir]);

  const stats = useMemo(() => {
    const n = produtos.length;
    return {
      total: n,
      cmvMedio: n > 0 ? produtos.reduce((s, p) => s + p.cmv_pct, 0) / n : 0,
      margemMedia:
        n > 0 ? produtos.reduce((s, p) => s + p.margem_bruta, 0) / n : 0,
      criticos: produtos.filter((p) => p.status === "CRÍTICO").length,
      atencao: produtos.filter((p) => p.status === "ATENÇÃO").length,
      saudaveis: produtos.filter((p) => p.status === "SAUDÁVEL").length,
    };
  }, [produtos]);

  const scatterData = useMemo(
    () =>
      produtos
        .filter((p) => p.preco_venda > 0)
        .map((p) => ({
          name: p.nome,
          cmv: Number(p.cmv_pct.toFixed(1)),
          margem: Number(p.margem_bruta.toFixed(2)),
          status: p.status,
        })),
    [produtos],
  );

  /* ───── render ───── */
  if (!selectedCliente)
    return (
      <div className="page-body">
        <div className="empty-state">
          <Sparkles className="empty-state-icon" />
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
          <h1 className="page-title">Raio-X Produtos</h1>
          <p className="page-subtitle">
            {selectedCliente.nome_fantasia} — Análise de CMV, Margens e
            Prioridades
          </p>
        </div>
      </div>
      <div className="page-body">
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94A3B8" }}>
            Carregando...
          </div>
        ) : stats.total === 0 ? (
          <div className="empty-state">
            <Sparkles className="empty-state-icon" />
            <h3 className="empty-state-title">Nenhuma ficha técnica</h3>
            <p className="empty-state-text">
              Cadastre fichas técnicas com insumos para ver a análise
            </p>
          </div>
        ) : (
          <>
            {/* ────── SUMMARY CARDS ────── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 14,
                marginBottom: 24,
              }}
            >
              <SummaryCard
                label="Total Produtos"
                value={String(stats.total)}
                color="#3B82F6"
                bg="#EFF6FF"
              />
              <SummaryCard
                label="CMV Médio"
                value={stats.cmvMedio.toFixed(1) + "%"}
                color={STATUS_CONFIG[calcStatus(stats.cmvMedio)].color}
                bg={STATUS_CONFIG[calcStatus(stats.cmvMedio)].bg}
              />
              <SummaryCard
                label="SAUDÁVEL"
                value={String(stats.saudaveis)}
                color="#10B981"
                bg="#F0FDF4"
                icon={<CheckCircle2 size={18} />}
              />
              <SummaryCard
                label="ATENÇÃO"
                value={String(stats.atencao)}
                color="#F59E0B"
                bg="#FFFBEB"
                icon={<AlertTriangle size={18} />}
              />
              <SummaryCard
                label="CRÍTICO"
                value={String(stats.criticos)}
                color="#EF4444"
                bg="#FEF2F2"
                icon={<XCircle size={18} />}
              />
            </div>

            {/* ────── SCATTER CHART ────── */}
            {scatterData.length > 1 && (
              <div
                className="card"
                style={{ marginBottom: 24, overflow: "visible" }}
              >
                <div
                  className="card-header"
                  style={{ borderBottom: "1px solid #F1F5F9" }}
                >
                  <span
                    className="card-title"
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <TrendingUp size={16} /> % CMV vs Margem Bruta (R$)
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      fontSize: "0.75rem",
                      color: "#64748B",
                    }}
                  >
                    {(
                      Object.entries(STATUS_CONFIG) as [
                        string,
                        { color: string },
                      ][]
                    ).map(([label, cfg]) => (
                      <span
                        key={label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: cfg.color,
                            display: "inline-block",
                          }}
                        />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "8px 0" }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart
                      margin={{ top: 10, right: 30, bottom: 10, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        type="number"
                        dataKey="cmv"
                        name="CMV %"
                        unit="%"
                        tick={{ fontSize: 11 }}
                        label={{
                          value: "% CMV",
                          position: "insideBottomRight",
                          offset: -5,
                          style: { fontSize: 11, fill: "#94A3B8" },
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="margem"
                        name="Margem"
                        unit=" R$"
                        tick={{ fontSize: 11 }}
                        label={{
                          value: "Margem (R$)",
                          angle: -90,
                          position: "insideLeft",
                          offset: 10,
                          style: { fontSize: 11, fill: "#94A3B8" },
                        }}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={({ payload }) => {
                          if (!payload || payload.length === 0) return null;
                          const d = payload[0].payload as {
                            name: string;
                            cmv: number;
                            margem: number;
                            status: string;
                          };
                          return (
                            <div
                              style={{
                                background: "#fff",
                                border: "1px solid #E2E8F0",
                                borderRadius: 10,
                                padding: "10px 14px",
                                fontSize: "0.8rem",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                              }}
                            >
                              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                                {d.name}
                              </div>
                              <div>CMV: {d.cmv}%</div>
                              <div>Margem: R$ {d.margem.toFixed(2)}</div>
                              <div
                                style={{
                                  color:
                                    STATUS_CONFIG[
                                      d.status as keyof typeof STATUS_CONFIG
                                    ]?.color,
                                  fontWeight: 600,
                                }}
                              >
                                {d.status}
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Scatter data={scatterData} fill="#3B82F6">
                        {scatterData.map((entry, idx) => (
                          <Cell
                            key={idx}
                            fill={
                              STATUS_CONFIG[
                                entry.status as keyof typeof STATUS_CONFIG
                              ]?.color || "#94A3B8"
                            }
                            r={7}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ────── FILTERS ────── */}
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 16,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Filter size={16} style={{ color: "#94A3B8" }} />
              <select
                className="form-input"
                style={{ width: "auto", fontSize: "0.8rem" }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="todos">Todos Status</option>
                <option value="SAUDÁVEL">🟢 Saudável</option>
                <option value="ATENÇÃO">🟡 Atenção</option>
                <option value="CRÍTICO">🔴 Crítico</option>
              </select>
              <select
                className="form-input"
                style={{ width: "auto", fontSize: "0.8rem" }}
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
              >
                <option value="todas">Todas Categorias</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "0.8rem",
                  color: "#64748B",
                }}
              >
                {filtered.length} produto{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* ────── MAIN TABLE — KOME STRUCTURE ────── */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.82rem",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#F8FAFC",
                        borderBottom: "2px solid #E2E8F0",
                      }}
                    >
                      <SortTh
                        label="Produto"
                        field="nome"
                        current={sortField}
                        dir={sortDir}
                        onClick={toggleSort}
                      />
                      <SortTh
                        label="CMV (R$)"
                        field="cmv"
                        current={sortField}
                        dir={sortDir}
                        onClick={toggleSort}
                      />
                      <SortTh
                        label="Preço Venda ATUAL"
                        field="preco_venda"
                        current={sortField}
                        dir={sortDir}
                        onClick={toggleSort}
                      />
                      <SortTh
                        label="% CMV"
                        field="cmv_pct"
                        current={sortField}
                        dir={sortDir}
                        onClick={toggleSort}
                      />
                      <th style={thStyle}>Valor p/ CMV 30%</th>
                      <SortTh
                        label="Margem Bruta ATUAL"
                        field="margem_bruta"
                        current={sortField}
                        dir={sortDir}
                        onClick={toggleSort}
                      />
                      <th style={thStyle}>STATUS</th>
                      <th style={thStyle}>DEMANDA</th>
                      <th style={thStyle}>PRIORIDADE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => {
                      const stCfg = STATUS_CONFIG[p.status];
                      const priCfg = PRIORIDADE_CONFIG[p.prioridade];
                      return (
                        <tr
                          key={p.id}
                          style={{
                            borderBottom: "1px solid #F1F5F9",
                            background: i % 2 === 0 ? "#fff" : "#FAFBFC",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#F0F4FF")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              i % 2 === 0 ? "#fff" : "#FAFBFC")
                          }
                        >
                          {/* Produto */}
                          <td style={{ ...tdStyle, fontWeight: 600 }}>
                            {p.nome}
                          </td>
                          {/* CMV R$ */}
                          <td style={tdStyle}>R$ {p.cmv.toFixed(2)}</td>
                          {/* Preço Venda */}
                          <td style={tdStyle}>R$ {p.preco_venda.toFixed(2)}</td>
                          {/* %CMV */}
                          <td
                            style={{
                              ...tdStyle,
                              fontWeight: 700,
                              color: stCfg.color,
                            }}
                          >
                            {p.cmv_pct.toFixed(2)}%
                          </td>
                          {/* Valor p/ CMV 30% */}
                          <td style={{ ...tdStyle, color: "#64748B" }}>
                            R$ {p.valor_cmv30.toFixed(2)}
                          </td>
                          {/* Margem Bruta */}
                          <td
                            style={{
                              ...tdStyle,
                              fontWeight: 600,
                              color:
                                p.margem_bruta >= 0 ? "#10B981" : "#EF4444",
                            }}
                          >
                            R$ {p.margem_bruta.toFixed(2)}
                          </td>
                          {/* STATUS */}
                          <td style={tdStyle}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "4px 10px",
                                borderRadius: 20,
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                background: stCfg.bg,
                                color: stCfg.color,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: "50%",
                                  background: stCfg.color,
                                }}
                              />
                              {p.status}
                            </span>
                          </td>
                          {/* DEMANDA — editable */}
                          <td style={tdStyle}>
                            <select
                              value={p.demanda}
                              onChange={(e) =>
                                updateDemanda(p.id, e.target.value)
                              }
                              style={{
                                padding: "4px 8px",
                                borderRadius: 8,
                                border: "1px solid #E2E8F0",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                background: "#fff",
                                cursor: "pointer",
                                color:
                                  p.demanda === "ALTA"
                                    ? "#3B82F6"
                                    : p.demanda === "BAIXA"
                                      ? "#94A3B8"
                                      : "#64748B",
                              }}
                            >
                              {DEMANDA_OPTIONS.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </td>
                          {/* PRIORIDADE */}
                          <td style={tdStyle}>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: 20,
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                background: priCfg.bg,
                                color: priCfg.color,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {p.prioridade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ───────── sub-components ───────── */

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontWeight: 700,
  fontSize: "0.72rem",
  color: "#64748B",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  whiteSpace: "nowrap",
};

function SortTh({
  label,
  field,
  current,
  dir,
  onClick,
}: {
  label: string;
  field: keyof Produto;
  current: keyof Produto;
  dir: "asc" | "desc";
  onClick: (f: keyof Produto) => void;
}) {
  const active = current === field;
  return (
    <th
      style={{ ...thStyle, cursor: "pointer", userSelect: "none" }}
      onClick={() => onClick(field)}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {label}
        <ArrowUpDown
          size={11}
          style={{
            opacity: active ? 1 : 0.35,
            transform: active && dir === "asc" ? "rotate(180deg)" : "none",
            transition: "transform 0.2s, opacity 0.2s",
          }}
        />
      </span>
    </th>
  );
}

function SummaryCard({
  label,
  value,
  color,
  bg,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="card"
      style={{
        textAlign: "center",
        background: bg,
        border: "none",
        padding: "18px 14px",
      }}
    >
      {icon && (
        <div style={{ color, marginBottom: 4, opacity: 0.7 }}>{icon}</div>
      )}
      <div
        style={{
          fontSize: "0.7rem",
          color: "#64748B",
          fontWeight: 600,
          marginBottom: 2,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
