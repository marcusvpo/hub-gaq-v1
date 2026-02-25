import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCliente } from "@/contexts/ClienteContext";
import { Send, CheckCircle } from "lucide-react";

const QUALIDADES_OPTIONS = [
  "Clareza",
  "Visão estratégica",
  "Objetividade",
  "Organização",
  "Profundidade técnica",
  "Capacidade de estruturar o caos",
  "Personalização",
  "Segurança na tomada de decisão",
  "Geração de valor prático",
  "Agilidade",
];

const IMPACTO_OPTIONS = [
  "Custos, margens e rentabilidade",
  "Fluxo de trabalho/produção",
  "Diagnóstico do negócio",
  "Processos operacionais",
  "Marketing",
  "Todas as anteriores",
];

const REPRESENTACAO_OPTIONS = [
  "Uma parceria estratégica",
  "Organização e estruturação",
  "Um suporte técnico",
];

const CUSTO_BENEFICIO_OPTIONS = [
  "Excelente",
  "Muito boa",
  "Boa",
  "Regular",
  "Ruim",
];

const EXPECTATIVAS_OPTIONS = [
  "Acima do esperado",
  "Dentro do esperado",
  "Abaixo do esperado",
];

export default function AvaliacaoPercepcaoPage() {
  const { selectedCliente } = useCliente();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    nome_respondente: "",
    cargo_respondente: "",
    empresa_nome: "",
    cidade: "",
    nps: 10,
    resumo_3_palavras: "",
    area_atuacao_percebida: "",
    representacao_servico: "",
    relacao_custo_beneficio: "",
    qualidades: [] as string[],
    expectativas: "",
  });

  const handleQualidadeToggle = (qualidade: string) => {
    setFormData((prev) => {
      const current = prev.qualidades;
      if (current.includes(qualidade)) {
        return { ...prev, qualidades: current.filter((q) => q !== qualidade) };
      }
      if (current.length >= 3) return prev;
      return { ...prev, qualidades: [...current, qualidade] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("avaliacao_percepcao").insert([
        {
          ...formData,
          cliente_id: selectedCliente?.id || null,
          empresa_nome:
            formData.empresa_nome || selectedCliente?.nome_fantasia || "",
        },
      ]);

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error("Erro ao enviar avaliação:", err);
      alert("Erro ao enviar avaliação. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div
        className="page-body"
        style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}
      >
        <div className="card" style={{ padding: 40 }}>
          <CheckCircle size={64} color="#10B981" style={{ marginBottom: 20 }} />
          <h2 style={{ marginBottom: 12 }}>Avaliação registrada!</h2>
          <p style={{ color: "#64748B", marginBottom: 24 }}>
            As respostas do cliente foram salvas com sucesso.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setSubmitted(false)}
          >
            Registrar outra avaliação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-body" style={{ maxWidth: 800, margin: "0 auto" }}>
      <div
        className="page-header"
        style={{ textAlign: "center", marginBottom: 32 }}
      >
        <h1 className="page-title">Avaliação de Percepção de Valor</h1>
        <p className="page-subtitle">
          {selectedCliente
            ? `Registrar respostas do cliente: ${selectedCliente.nome_fantasia}`
            : "Selecione um cliente para registrar a avaliação"}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Nome do respondente</label>
            <input
              className="form-input"
              required
              value={formData.nome_respondente}
              onChange={(e) =>
                setFormData({ ...formData, nome_respondente: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cargo do respondente</label>
            <input
              className="form-input"
              value={formData.cargo_respondente}
              onChange={(e) =>
                setFormData({ ...formData, cargo_respondente: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Nome da empresa</label>
            <input
              className="form-input"
              value={formData.empresa_nome}
              onChange={(e) =>
                setFormData({ ...formData, empresa_nome: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cidade</label>
            <input
              className="form-input"
              value={formData.cidade}
              onChange={(e) =>
                setFormData({ ...formData, cidade: e.target.value })
              }
            />
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #E2E8F0" }} />

        <div className="form-group">
          <label className="form-label">
            De 0 a 10, o quanto o cliente recomendaria esse serviço para outro
            empresário ou gestor?
          </label>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 4,
              marginTop: 8,
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setFormData({ ...formData, nps: n })}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 8,
                  border:
                    "1px solid " + (formData.nps === n ? "#3B82F6" : "#E2E8F0"),
                  background: formData.nps === n ? "#3B82F6" : "#fff",
                  color: formData.nps === n ? "#fff" : "#1E293B",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.75rem",
              color: "#64748B",
              marginTop: 4,
            }}
          >
            <span>Não recomendaria em hipótese alguma</span>
            <span>Recomendaria com certeza</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Em até 3 palavras, como o cliente resumiria esse serviço?
          </label>
          <input
            className="form-input"
            placeholder="Ex: Eficiente, claro, estratégico"
            value={formData.resumo_3_palavras}
            onChange={(e) =>
              setFormData({ ...formData, resumo_3_palavras: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Onde o cliente percebe que esse serviço mais atuou no negócio?
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginTop: 8,
            }}
          >
            {IMPACTO_OPTIONS.map((opt) => (
              <label
                key={opt}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  cursor: "pointer",
                  background:
                    formData.area_atuacao_percebida === opt
                      ? "#F1F5F9"
                      : "#fff",
                }}
              >
                <input
                  type="radio"
                  name="impacto"
                  checked={formData.area_atuacao_percebida === opt}
                  onChange={() =>
                    setFormData({ ...formData, area_atuacao_percebida: opt })
                  }
                />
                <span style={{ fontSize: "0.9rem" }}>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            O cliente enxerga que esse serviço representa principalmente:
          </label>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: 8,
            }}
          >
            {REPRESENTACAO_OPTIONS.map((opt) => (
              <label
                key={opt}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  cursor: "pointer",
                  background:
                    formData.representacao_servico === opt ? "#F1F5F9" : "#fff",
                }}
              >
                <input
                  type="radio"
                  name="representacao"
                  checked={formData.representacao_servico === opt}
                  onChange={() =>
                    setFormData({ ...formData, representacao_servico: opt })
                  }
                />
                <span style={{ fontSize: "0.9rem" }}>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Relação custo-benefício percebida pelo cliente
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {CUSTO_BENEFICIO_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, relacao_custo_beneficio: opt })
                }
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  border:
                    "1px solid " +
                    (formData.relacao_custo_beneficio === opt
                      ? "#3B82F6"
                      : "#E2E8F0"),
                  background:
                    formData.relacao_custo_beneficio === opt
                      ? "#EFF6FF"
                      : "#fff",
                  color:
                    formData.relacao_custo_beneficio === opt
                      ? "#3B82F6"
                      : "#64748B",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Na percepção do cliente, quais são as 3 principais qualidades desse
            serviço? (Selecione até 3)
          </label>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}
          >
            {QUALIDADES_OPTIONS.map((opt) => {
              const selected = formData.qualidades.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleQualidadeToggle(opt)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 20,
                    border: "1px solid " + (selected ? "#3B82F6" : "#E2E8F0"),
                    background: selected ? "#3B82F6" : "#fff",
                    color: selected ? "#fff" : "#64748B",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Em relação às expectativas iniciais do cliente, esse serviço foi:
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {EXPECTATIVAS_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFormData({ ...formData, expectativas: opt })}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  border:
                    "1px solid " +
                    (formData.expectativas === opt ? "#3B82F6" : "#E2E8F0"),
                  background:
                    formData.expectativas === opt ? "#EFF6FF" : "#fff",
                  color: formData.expectativas === opt ? "#3B82F6" : "#64748B",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{
            padding: "14px",
            marginTop: 12,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
          }}
        >
          {loading ? (
            "Salvando..."
          ) : (
            <>
              <Send size={18} /> Salvar Avaliação
            </>
          )}
        </button>
      </form>
    </div>
  );
}
