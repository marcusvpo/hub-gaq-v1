import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Building2, Phone, Mail, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Lead {
  id: string;
  nome_empresa: string;
  origem: string | null;
  tags: string[] | null;
  contato_nome: string | null;
  contato_telefone: string | null;
  contato_email: string | null;
  status: string;
  created_at: string;
}
  id: string;
  nome_fantasia: string;
  segmento: string | null;
  contato_nome: string | null;
  contato_telefone: string | null;
  contato_email: string | null;
  cidade: string | null;
  estado: string | null;
  status_relacionamento: string;
  created_at: string;
}

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"lead" | "negociacao" | "avulso">(
    "lead",
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, [user]);

  async function loadLeads() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .in("status_relacionamento", ["lead", "negociacao", "avulso"])
      .order("created_at", { ascending: false });

    if (data) {
      setLeads(data);
    }
    setLoading(false);
  }

  const filteredLeads = leads.filter(
    (l) =>
      l.status_relacionamento === activeTab &&
      (l.nome_fantasia.toLowerCase().includes(search.toLowerCase()) ||
        (l.segmento || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.contato_nome || "").toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads & Follow-up</h1>
          <p className="page-subtitle">
            Gestão de contatos comerciais e clientes prospectados
          </p>
        </div>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            borderBottom: "1px solid #E2E8F0",
            paddingBottom: 12,
          }}
        >
          {[
            { id: "lead", label: "Leads Iniciais" },
            { id: "negociacao", label: "Em Negociação" },
            { id: "avulso", label: "Serviços Avulsos" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "8px 16px",
                border: "none",
                background: activeTab === tab.id ? "#EFF6FF" : "transparent",
                color: activeTab === tab.id ? "#3B82F6" : "#64748B",
                fontWeight: activeTab === tab.id ? 600 : 500,
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              {tab.label} (
              {leads.filter((l) => l.status_relacionamento === tab.id).length})
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div
            className="form-input"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 14px",
            }}
          >
            <Search size={16} style={{ color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Buscar por empresa, segmento ou contato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                width: "100%",
                padding: "10px 0",
                fontSize: "0.875rem",
                background: "transparent",
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>
            Carregando leads...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="empty-state">
            <Building2 className="empty-state-icon" />
            <h3 className="empty-state-title">Nenhum registro encontrado</h3>
            <p className="empty-state-text">
              Você não tem registros de{" "}
              {activeTab === "lead"
                ? "leads"
                : activeTab === "negociacao"
                  ? "negociações"
                  : "serviços avulsos"}{" "}
              no momento.
            </p>
            <p
              className="empty-state-text"
              style={{ fontSize: "0.8rem", marginTop: 8 }}
            >
              Dica: Cadastre novos clientes pela aba "Clientes" e os marque com
              o status correspondente.
            </p>
          </div>
        ) : (
          <div className="grid grid-3 stagger">
            {filteredLeads.map((lead) => (
              <div key={lead.id} className="card" style={{ padding: 20 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background:
                        activeTab === "lead"
                          ? "#F0F9FF"
                          : activeTab === "negociacao"
                            ? "#FFF7ED"
                            : "#F3F4F6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color:
                        activeTab === "lead"
                          ? "#0EA5E9"
                          : activeTab === "negociacao"
                            ? "#F97316"
                            : "#6B7280",
                    }}
                  >
                    <Building2 size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "#1E293B",
                        marginBottom: 2,
                      }}
                    >
                      {lead.nome_fantasia}
                    </h3>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748B",
                        display: "inline-block",
                        background: "#F1F5F9",
                        padding: "2px 8px",
                        borderRadius: 12,
                      }}
                    >
                      {lead.segmento || "Sem segmento"}
                    </span>
                  </div>
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: "0.85rem",
                      color: "#475569",
                    }}
                  >
                    <Search size={14} style={{ color: "#94A3B8" }} />
                    <span style={{ fontWeight: 500 }}>
                      {lead.contato_nome || "Contato não informado"}
                    </span>
                  </div>

                  {lead.contato_telefone && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: "0.85rem",
                        color: "#475569",
                      }}
                    >
                      <Phone size={14} style={{ color: "#94A3B8" }} />
                      <a
                        href={`https://wa.me/55${lead.contato_telefone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#3B82F6", textDecoration: "none" }}
                      >
                        {lead.contato_telefone}
                      </a>
                    </div>
                  )}

                  {lead.contato_email && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: "0.85rem",
                        color: "#475569",
                      }}
                    >
                      <Mail size={14} style={{ color: "#94A3B8" }} />
                      <a
                        href={`mailto:${lead.contato_email}`}
                        style={{ color: "#475569", textDecoration: "none" }}
                      >
                        {lead.contato_email}
                      </a>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: "0.85rem",
                      color: "#475569",
                    }}
                  >
                    <Clock size={14} style={{ color: "#94A3B8" }} />
                    Criado em{" "}
                    {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
