import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
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

interface DreData {
  faturamento_bruto: number;
  total_impostos: number;
  total_custos_variaveis: number;
  total_custos_fixos: number;
  lucro_operacional: number;
}

export default function CascataFinanceiraPage() {
  const { user } = useAuth();
  const [dre, setDre] = useState<DreData | null>(null);
  const [mesLabel, setMesLabel] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("cliente_users")
      .select("cliente_id")
      .eq("user_id", user.id)
      .limit(1)
      .then(async ({ data }) => {
        if (data && data.length > 0) {
          const { data: dreData } = await supabase
            .from("vw_dre_mensal")
            .select("*")
            .eq("cliente_id", data[0].cliente_id)
            .order("mes_referencia", { ascending: false })
            .limit(1);
          if (dreData && dreData.length > 0) {
            setDre(dreData[0]);
            setMesLabel(
              new Date(dreData[0].mes_referencia).toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              }),
            );
          }
        }
      });
  }, [user]);

  if (!dre)
    return (
      <>
        <div className="page-header">
          <div>
            <h1 className="page-title">Cascata Financeira</h1>
          </div>
        </div>
        <div className="page-body">
          <div className="empty-state">
            <h3 className="empty-state-title">Sem dados financeiros</h3>
          </div>
        </div>
      </>
    );

  const fat = Number(dre.faturamento_bruto);
  const imp = Number(dre.total_impostos);
  const cmv = Number(dre.total_custos_variaveis);
  const fix = Number(dre.total_custos_fixos);
  const lucro = Number(dre.lucro_operacional);

  const waterfallData = [
    {
      name: "Faturamento\nBruto",
      value: fat,
      fill: "#3B82F6",
      label: `R$ ${(fat / 1000).toFixed(1)}k`,
    },
    {
      name: "Impostos\n& Taxas",
      value: -imp,
      fill: "#EF4444",
      label: `-R$ ${(imp / 1000).toFixed(1)}k`,
    },
    {
      name: "CMV",
      value: -cmv,
      fill: "#F97316",
      label: `-R$ ${(cmv / 1000).toFixed(1)}k`,
    },
    {
      name: "Custos\nFixos",
      value: -fix,
      fill: "#F59E0B",
      label: `-R$ ${(fix / 1000).toFixed(1)}k`,
    },
    {
      name: "Lucro\nOperacional",
      value: lucro,
      fill: lucro >= 0 ? "#10B981" : "#EF4444",
      label: `R$ ${(lucro / 1000).toFixed(1)}k`,
    },
  ];

  const detalhes = [
    { label: "Faturamento Bruto", valor: fat, cor: "#3B82F6", pct: 100 },
    {
      label: "(-) Impostos & Taxas",
      valor: imp,
      cor: "#EF4444",
      pct: fat > 0 ? (imp / fat) * 100 : 0,
    },
    {
      label: "(-) CMV (Custo de Mercadoria)",
      valor: cmv,
      cor: "#F97316",
      pct: fat > 0 ? (cmv / fat) * 100 : 0,
    },
    {
      label: "(=) Lucro Bruto",
      valor: fat - imp - cmv,
      cor: "#0369A1",
      pct: fat > 0 ? ((fat - imp - cmv) / fat) * 100 : 0,
    },
    {
      label: "(-) Custos Fixos",
      valor: fix,
      cor: "#F59E0B",
      pct: fat > 0 ? (fix / fat) * 100 : 0,
    },
    {
      label: "(=) Lucro Operacional",
      valor: lucro,
      cor: lucro >= 0 ? "#10B981" : "#EF4444",
      pct: fat > 0 ? (lucro / fat) * 100 : 0,
    },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cascata Financeira</h1>
          <p className="page-subtitle">
            Onde o dinheiro foi parar — {mesLabel}
          </p>
        </div>
      </div>
      <div className="page-body">
        {/* Waterfall Chart */}
        <div className="card" style={{ marginBottom: 32 }}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={waterfallData}
              margin={{ top: 20, right: 30, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fontWeight: 500 }}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: number) => [
                  `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                  "",
                ]}
              />
              <ReferenceLine y={0} stroke="#94A3B8" />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                {waterfallData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detalhamento */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>
            Detalhamento DRE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {detalhes.map((d, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderRadius: 12,
                  background:
                    i === detalhes.length - 1
                      ? lucro >= 0
                        ? "#F0FDF4"
                        : "#FEF2F2"
                      : i === 3
                        ? "#F0F9FF"
                        : "#F8FAFC",
                  border: `1px solid ${i === detalhes.length - 1 ? (lucro >= 0 ? "#BBF7D0" : "#FECACA") : "#E2E8F0"}`,
                  fontWeight: i === 3 || i === detalhes.length - 1 ? 700 : 400,
                }}
              >
                <span style={{ fontSize: "0.9rem", color: d.cor }}>
                  {d.label}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
                    {d.pct.toFixed(1)}%
                  </span>
                  <span
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: d.cor,
                      minWidth: 120,
                      textAlign: "right",
                    }}
                  >
                    R${" "}
                    {d.valor.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
