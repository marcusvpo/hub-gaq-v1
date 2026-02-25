import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCliente } from "@/contexts/ClienteContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { TrendingDown, Save } from "lucide-react";

interface Categoria {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  grupo: string;
  ordem: number;
}

export default function DREPage() {
  const { selectedCliente } = useCliente();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [lancamentos, setLancamentos] = useState<Record<string, number>>({});
  const [mesRef, setMesRef] = useState(new Date().toISOString().slice(0, 7));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("categorias_dre")
      .select("*")
      .order("ordem")
      .then(({ data }) => {
        if (data) setCategorias(data);
      });
  }, []);

  useEffect(() => {
    if (selectedCliente) loadLancamentos();
  }, [selectedCliente, mesRef]);

  async function loadLancamentos() {
    if (!selectedCliente) return;
    const { data } = await supabase
      .from("lancamentos_mensais")
      .select("categoria_id, valor")
      .eq("cliente_id", selectedCliente.id)
      .eq("mes_referencia", mesRef + "-01");
    const map: Record<string, number> = {};
    data?.forEach((d) => {
      map[d.categoria_id] = d.valor;
    });
    setLancamentos(map);
  }

  async function handleSave() {
    if (!selectedCliente) return;
    setSaving(true);
    // Delete existing
    await supabase
      .from("lancamentos_mensais")
      .delete()
      .eq("cliente_id", selectedCliente.id)
      .eq("mes_referencia", mesRef + "-01");
    // Insert new
    const rows = Object.entries(lancamentos)
      .filter(([, v]) => v > 0)
      .map(([catId, valor]) => ({
        cliente_id: selectedCliente.id,
        categoria_id: catId,
        mes_referencia: mesRef + "-01",
        valor,
      }));
    if (rows.length > 0)
      await supabase.from("lancamentos_mensais").insert(rows);
    setSaving(false);
  }

  const groups = [
    "Receitas",
    "Impostos e Taxas",
    "Custos Variáveis",
    "Custos Fixos",
  ];
  const getByGroup = (g: string) => categorias.filter((c) => c.grupo === g);
  const sum = (g: string) =>
    getByGroup(g).reduce((s, c) => s + (lancamentos[c.id] || 0), 0);
  const faturamento = sum("Receitas");
  const impostos = sum("Impostos e Taxas");
  const custosVar = sum("Custos Variáveis");
  const custosFix = sum("Custos Fixos");
  const lucro = faturamento - impostos - custosVar - custosFix;

  const waterfallData = [
    { name: "Faturamento", value: faturamento, fill: "#3B82F6" },
    { name: "Impostos", value: -impostos, fill: "#EF4444" },
    { name: "CMV", value: -custosVar, fill: "#F97316" },
    { name: "Custos Fixos", value: -custosFix, fill: "#F59E0B" },
    { name: "Lucro", value: lucro, fill: lucro >= 0 ? "#10B981" : "#EF4444" },
  ];

  if (!selectedCliente)
    return (
      <div className="page-body">
        <div className="empty-state">
          <TrendingDown className="empty-state-icon" />
          <h3 className="empty-state-title">Selecione um cliente</h3>
        </div>
      </div>
    );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">DRE Gerencial</h1>
          <p className="page-subtitle">{selectedCliente.nome_fantasia}</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            type="month"
            className="form-input"
            value={mesRef}
            onChange={(e) => setMesRef(e.target.value)}
            style={{ width: 170 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
      <div className="page-body">
        {/* Summary cards */}
        <div className="grid grid-4 stagger" style={{ marginBottom: 24 }}>
          {[
            { label: "Faturamento", value: faturamento, color: "#3B82F6" },
            {
              label: "CMV",
              value: custosVar,
              color: "#F97316",
              pct:
                faturamento > 0
                  ? ((custosVar / faturamento) * 100).toFixed(1) + "%"
                  : "",
            },
            { label: "Custos Fixos", value: custosFix, color: "#F59E0B" },
            {
              label: "Lucro",
              value: lucro,
              color: lucro >= 0 ? "#10B981" : "#EF4444",
            },
          ].map((s) => (
            <div key={s.label} className="card metric-card">
              <div className="card-label">{s.label}</div>
              <div className="card-value" style={{ color: s.color }}>
                R${" "}
                {s.value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              </div>
              {s.pct && (
                <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                  {s.pct} do faturamento
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
        >
          {/* Form */}
          <div>
            {groups.map((g) => (
              <div key={g} className="card" style={{ marginBottom: 16 }}>
                <div className="card-title" style={{ marginBottom: 12 }}>
                  {g}
                </div>
                {getByGroup(g).map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <label style={{ flex: 1, fontSize: "0.85rem" }}>
                      {c.nome}
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      style={{ width: 130, textAlign: "right" }}
                      value={lancamentos[c.id] || ""}
                      placeholder="0"
                      onChange={(e) =>
                        setLancamentos({
                          ...lancamentos,
                          [c.id]: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>
              Cascata Financeira
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={waterfallData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: number) => [
                    `R$ ${Math.abs(v).toLocaleString("pt-BR")}`,
                    "",
                  ]}
                />
                <ReferenceLine y={0} stroke="#94A3B8" />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                  {waterfallData.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
