import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  MessageSquare,
  Calendar,
  X,
  ArrowRight,
  Mail,
  Phone,
  Tag,
} from "lucide-react";

interface Lead {
  id: string;
  nome_contato: string;
  empresa_nome: string;
  segmento: string;
  status:
    | "novo"
    | "contato_feito"
    | "reuniao_agendada"
    | "proposta_enviada"
    | "fechado"
    | "perdido";
  prioridade: "baixa" | "media" | "alta";
  valor_estimado: number;
  tags: string[];
  cidade: string;
  estado: string;
  origem: string;
  observacoes: string;
  created_at: string;
}

interface LeadPost {
  id: string;
  lead_id: string;
  tipo: "nota" | "ligacao" | "email" | "reuniao" | "whatsapp";
  conteudo: string;
  created_at: string;
}

const KANBAN_STAGES = [
  { id: "novo", title: "Novo Lead", color: "#94A3B8" },
  { id: "contato_feito", title: "Contato Feito", color: "#3B82F6" },
  { id: "reuniao_agendada", title: "Reunião Agendada", color: "#F59E0B" },
  { id: "proposta_enviada", title: "Proposta Enviada", color: "#8B5CF6" },
  { id: "fechado", title: "Fechado / Ganho", color: "#10B981" },
  { id: "perdido", title: "Perdido", color: "#EF4444" },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showPostsDrawer, setShowPostsDrawer] = useState(false);
  const [posts, setPosts] = useState<LeadPost[]>([]);
  const [newPost, setNewPost] = useState("");
  const [postType, setPostType] = useState<LeadPost["tipo"]>("nota");
  const [priorityFilter, setPriorityFilter] = useState<string>("todos");

  // Form State
  const [formData, setFormData] = useState<Partial<Lead>>({
    nome_contato: "",
    empresa_nome: "",
    status: "novo",
    prioridade: "media",
    tags: [],
  });

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  }

  async function handleSaveLead() {
    if (!formData.nome_contato) return;
    setLoading(true);
    if (editId) {
      await supabase.from("leads").update(formData).eq("id", editId);
    } else {
      await supabase.from("leads").insert(formData);
    }
    setShowAddModal(false);
    setEditId(null);
    setFormData({
      nome_contato: "",
      empresa_nome: "",
      status: "novo",
      prioridade: "media",
      tags: [],
    });
    loadLeads();
  }

  function openEditLead(lead: Lead) {
    setEditId(lead.id);
    setFormData({
      nome_contato: lead.nome_contato,
      empresa_nome: lead.empresa_nome,
      status: lead.status,
      prioridade: lead.prioridade,
      tags: lead.tags || [],
      valor_estimado: lead.valor_estimado,
      segmento: lead.segmento,
      observacoes: lead.observacoes,
    });
    setShowAddModal(true);
  }

  async function handleDeleteLead(id: string) {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (!error) loadLeads();
  }

  async function handleUpdateStatus(id: string, newStatus: Lead["status"]) {
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus })
      .eq("id", id);
    if (!error) loadLeads();
  }

  async function loadPosts(leadId: string) {
    const { data } = await supabase
      .from("lead_posts")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    if (data) setPosts(data);
  }

  async function handleAddPost() {
    if (!selectedLead || !newPost) return;
    const { error } = await supabase.from("lead_posts").insert({
      lead_id: selectedLead.id,
      tipo: postType,
      conteudo: newPost,
    });
    if (!error) {
      setNewPost("");
      loadPosts(selectedLead.id);
    }
  }

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.nome_contato.toLowerCase().includes(search.toLowerCase()) ||
      l.empresa_nome?.toLowerCase().includes(search.toLowerCase());
    const matchesPriority =
      priorityFilter === "todos" || l.prioridade === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="page-body" style={{ padding: "0 24px 24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 className="page-title">Leads & Follow-up</h1>
          <p className="page-subtitle">
            Gerencie suas prospecções e histórico de interações
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={18} /> Novo Lead
        </button>
      </div>

      <div
        className="card"
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 32,
          padding: "16px 24px",
          alignItems: "center",
          flexWrap: "wrap",
          background: "#fff",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 280 }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94A3B8",
            }}
          />
          <input
            className="form-input"
            type="text"
            placeholder="Buscar por contato ou empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 42 }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Tag size={16} style={{ color: "#64748B" }} />
          <select
            className="form-input"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ width: "auto", minWidth: 140 }}
          >
            <option value="todos">Todas Prioridades</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        {(search || priorityFilter !== "todos") && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearch("");
              setPriorityFilter("todos");
            }}
            style={{
              color: "#EF4444",
              borderColor: "transparent",
              background: "transparent",
            }}
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center" }}>
          Carregando leads...
        </div>
      ) : (
        <div
          className="kanban-board"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${KANBAN_STAGES.length}, 300px)`,
            gap: 20,
            overflowX: "auto",
            paddingBottom: 20,
            minHeight: "calc(100vh - 250px)",
          }}
        >
          {KANBAN_STAGES.map((stage) => (
            <div
              key={stage.id}
              className="kanban-column"
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 4px",
                  borderBottom: `2px solid ${stage.color}`,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "#1E293B",
                  }}
                >
                  {stage.title}
                </span>
                <span className="badge badge-neutral">
                  {filteredLeads.filter((l) => l.status === stage.id).length}
                </span>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {filteredLeads
                  .filter((l) => l.status === stage.id)
                  .map((lead) => (
                    <div
                      key={lead.id}
                      className="card"
                      style={{
                        padding: 16,
                        cursor: "grab",
                        borderLeft:
                          lead.prioridade === "alta"
                            ? "4px solid #EF4444"
                            : "1px solid var(--color-border)",
                      }}
                      onClick={() => {
                        setSelectedLead(lead);
                        loadPosts(lead.id);
                        setShowPostsDrawer(true);
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: "#94A3B8",
                            textTransform: "uppercase",
                          }}
                        >
                          {lead.segmento || "Sem segmento"}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            alignItems: "center",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              handleUpdateStatus(
                                lead.id,
                                e.target.value as Lead["status"],
                              )
                            }
                            style={{
                              fontSize: "0.65rem",
                              padding: "2px 4px",
                              borderRadius: 4,
                              border: "1px solid #E2E8F0",
                              background: "#fff",
                              color: "#64748B",
                            }}
                          >
                            {KANBAN_STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.title}
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn-icon"
                            style={{ padding: 4 }}
                            onClick={() => openEditLead(lead)}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            className="btn-icon"
                            style={{ padding: 4, color: "#EF4444" }}
                            onClick={() => handleDeleteLead(lead.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          color: "#1E293B",
                          marginBottom: 4,
                        }}
                      >
                        {lead.nome_contato}
                      </div>
                      {lead.empresa_nome && (
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#64748B",
                            marginBottom: 12,
                          }}
                        >
                          {lead.empresa_nome}
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 4,
                          marginBottom: 12,
                        }}
                      >
                        {lead.tags?.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: "0.6rem",
                              background: "#F1F5F9",
                              color: "#475569",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontWeight: 600,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: "auto",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <MessageSquare
                            size={14}
                            style={{ color: "#94A3B8" }}
                          />
                          <span
                            style={{ fontSize: "0.7rem", color: "#94A3B8" }}
                          >
                            Follow-up
                          </span>
                        </div>
                        {lead.valor_estimado > 0 && (
                          <div
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              color: "#10B981",
                            }}
                          >
                            R${" "}
                            {Number(lead.valor_estimado).toLocaleString(
                              "pt-BR",
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Posts Drawer */}
      {showPostsDrawer && selectedLead && (
        <div
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            width: 450,
            background: "#fff",
            boxShadow: "-10px 0 30px rgba(0,0,0,0.1)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: 24,
              borderBottom: "1px solid #F1F5F9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>
                Histórico: {selectedLead.nome_contato}
              </h2>
              <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
                {selectedLead.empresa_nome}
              </span>
            </div>
            <button
              className="btn-icon"
              onClick={() => setShowPostsDrawer(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            <div
              style={{
                background: "#F8FAFC",
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {(
                  ["nota", "ligacao", "email", "whatsapp", "reuniao"] as const
                ).map((type) => (
                  <button
                    key={type}
                    onClick={() => setPostType(type)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      background: postType === type ? "#1E293B" : "#fff",
                      color: postType === type ? "#fff" : "#64748B",
                      border: "1px solid #E2E8F0",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Descreva a interação..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: "0.85rem",
                  minHeight: 80,
                  marginBottom: 12,
                }}
              />
              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={handleAddPost}
              >
                Publicar Interação
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {posts.map((post) => (
                <div key={post.id} style={{ display: "flex", gap: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "#F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#64748B",
                      }}
                    >
                      {post.tipo === "ligacao" ? (
                        <Phone size={14} />
                      ) : post.tipo === "email" ? (
                        <Mail size={14} />
                      ) : post.tipo === "whatsapp" ? (
                        <MessageSquare size={14} />
                      ) : post.tipo === "reuniao" ? (
                        <Calendar size={14} />
                      ) : (
                        <ArrowRight size={14} />
                      )}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        width: 2,
                        background: "#F1F5F9",
                        marginTop: 8,
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#1E293B",
                          textTransform: "capitalize",
                        }}
                      >
                        {post.tipo}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                        {new Date(post.created_at).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "#475569",
                        lineHeight: 1.5,
                      }}
                    >
                      {post.conteudo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowAddModal(false);
            setEditId(null);
          }}
        >
          <div
            className="modal animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 500 }}
          >
            <h2 className="modal-title">
              {editId ? "Editar Lead" : "Novo Lead"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nome do Contato *</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.nome_contato}
                  onChange={(e) =>
                    setFormData({ ...formData, nome_contato: e.target.value })
                  }
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="grid grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Empresa</label>
                  <input
                    className="form-input"
                    type="text"
                    value={formData.empresa_nome}
                    onChange={(e) =>
                      setFormData({ ...formData, empresa_nome: e.target.value })
                    }
                    placeholder="Ex: Café Bela Vista"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Segmento</label>
                  <input
                    className="form-input"
                    type="text"
                    value={formData.segmento}
                    onChange={(e) =>
                      setFormData({ ...formData, segmento: e.target.value })
                    }
                    placeholder="Ex: Alimentação"
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div className="form-group">
                  <label className="form-label">Prioridade</label>
                  <select
                    className="form-input"
                    value={formData.prioridade}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prioridade: e.target.value as any,
                      })
                    }
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor Estimado</label>
                  <input
                    className="form-input"
                    type="number"
                    value={formData.valor_estimado || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        valor_estimado: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Tags (separadas por vírgula)
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.tags?.join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter((t) => t !== ""),
                    })
                  }
                  placeholder="Ex: Urgente, Eventos"
                />
              </div>
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
                  onClick={() => {
                    setShowAddModal(false);
                    setEditId(null);
                  }}
                >
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={handleSaveLead}>
                  {editId ? "Salvar Alterações" : "Criar Lead"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
