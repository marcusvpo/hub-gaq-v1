import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCliente } from "@/contexts/ClienteContext";
import { Plus, Search, Edit3, Trash2, Building2, UserPlus } from "lucide-react";

interface ClienteForm {
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  segmento: string;
  contato_nome: string;
  contato_telefone: string;
  contato_email: string;
  cidade: string;
  estado: string;
}

const emptyForm: ClienteForm = {
  nome_fantasia: "",
  razao_social: "",
  cnpj: "",
  segmento: "",
  contato_nome: "",
  contato_telefone: "",
  contato_email: "",
  cidade: "",
  estado: "SP",
};

export default function ClientesPage() {
  const { user } = useAuth();
  const { clientes, loadClientes, selectCliente, selectedCliente } =
    useCliente();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ClienteForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);
  const [userClienteId, setUserClienteId] = useState<string | null>(null);
  const [userClienteNome, setUserClienteNome] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");

  const filtered = clientes.filter(
    (c) =>
      c.nome_fantasia.toLowerCase().includes(search.toLowerCase()) ||
      (c.segmento || "").toLowerCase().includes(search.toLowerCase()),
  );

  function openNew() {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(c: any) {
    setEditId(c.id);
    setForm({
      nome_fantasia: c.nome_fantasia || "",
      razao_social: c.razao_social || "",
      cnpj: c.cnpj || "",
      segmento: c.segmento || "",
      contato_nome: c.contato_nome || "",
      contato_telefone: c.contato_telefone || "",
      contato_email: c.contato_email || "",
      cidade: c.cidade || "",
      estado: c.estado || "SP",
    });
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.nome_fantasia.trim()) {
      setError("Nome fantasia é obrigatório");
      return;
    }
    setSaving(true);
    setError("");

    if (editId) {
      const { error: err } = await supabase
        .from("clientes")
        .update({
          ...form,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editId);
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: err } = await supabase.from("clientes").insert({
        ...form,
        admin_id: user!.id,
      });
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
    }

    await loadClientes();
    setShowModal(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Tem certeza que deseja EXCLUIR este cliente? Esta ação não pode ser desfeita.",
      )
    )
      return;
    const { error: err } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id);
    if (err) {
      alert("Erro ao excluir: " + err.message);
      return;
    }
    if (selectedCliente?.id === id) selectCliente(null);
    await loadClientes();
  }

  function openUserModal(clienteId: string, nome: string) {
    setUserClienteId(clienteId);
    setUserClienteNome(nome);
    setUserEmail("");
    setUserPassword("");
    setUserFullName("");
    setUserError("");
    setUserSuccess("");
    setShowUserModal(true);
  }

  async function handleCreateUser() {
    if (!userEmail || !userPassword || !userClienteId) {
      setUserError("Email e senha são obrigatórios");
      return;
    }
    if (userPassword.length < 6) {
      setUserError("Senha deve ter no mínimo 6 caracteres");
      return;
    }
    setUserSaving(true);
    setUserError("");
    setUserSuccess("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "create-client-user",
        {
          body: {
            email: userEmail,
            password: userPassword,
            full_name: userFullName || userEmail,
            cliente_id: userClienteId,
          },
        },
      );
      if (fnError) throw new Error(fnError.message || "Erro ao criar usuário");
      if (data?.error) throw new Error(data.error);
      setUserSuccess(`Usuário ${data?.email || userEmail} criado com sucesso!`);
      setUserEmail("");
      setUserPassword("");
      setUserFullName("");
    } catch (err: unknown) {
      setUserError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setUserSaving(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">
            {clientes.length} clientes cadastrados
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={18} /> Novo Cliente
        </button>
      </div>
      <div className="page-body">
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
              placeholder="Buscar por nome ou segmento..."
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

        {filtered.length === 0 ? (
          <div className="empty-state">
            <Building2 className="empty-state-icon" />
            <h3 className="empty-state-title">Nenhum cliente encontrado</h3>
            <p className="empty-state-text">
              Cadastre seu primeiro cliente para começar
            </p>
            <button className="btn btn-primary" onClick={openNew}>
              <Plus size={16} /> Novo Cliente
            </button>
          </div>
        ) : (
          <div className="grid grid-3 stagger">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="card"
                style={{ cursor: "pointer" }}
                onClick={() => selectCliente(c)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                      {c.nome_fantasia}
                    </div>
                    {c.segmento && (
                      <span
                        className="badge badge-neutral"
                        style={{ marginTop: 4 }}
                      >
                        {c.segmento}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="btn-icon"
                      title="Criar acesso"
                      onClick={(e) => {
                        e.stopPropagation();
                        openUserModal(c.id, c.nome_fantasia);
                      }}
                      style={{ color: "#3B82F6" }}
                    >
                      <UserPlus size={14} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(c);
                      }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.id);
                      }}
                      style={{ color: "#EF4444" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {c.contato_nome && (
                  <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    {c.contato_nome}
                  </div>
                )}
                {c.contato_telefone && (
                  <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    {c.contato_telefone}
                  </div>
                )}
                {c.cidade && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#94A3B8",
                      marginTop: 6,
                    }}
                  >
                    {c.cidade}/{c.estado}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520 }}
          >
            <h2 className="modal-title">
              {editId ? "Editar Cliente" : "Novo Cliente"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Nome Fantasia *</label>
                <input
                  className="form-input"
                  value={form.nome_fantasia}
                  onChange={(e) =>
                    setForm({ ...form, nome_fantasia: e.target.value })
                  }
                  placeholder="Ex: Restaurante do João"
                />
              </div>
              <div className="grid grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Razão Social</label>
                  <input
                    className="form-input"
                    value={form.razao_social}
                    onChange={(e) =>
                      setForm({ ...form, razao_social: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CNPJ</label>
                  <input
                    className="form-input"
                    value={form.cnpj}
                    onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Segmento</label>
                <select
                  className="form-input"
                  value={form.segmento}
                  onChange={(e) =>
                    setForm({ ...form, segmento: e.target.value })
                  }
                >
                  <option value="">Selecione</option>
                  <option value="Restaurante">Restaurante</option>
                  <option value="Lanchonete">Lanchonete</option>
                  <option value="Food Truck">Food Truck</option>
                  <option value="Padaria">Padaria</option>
                  <option value="Pizzaria">Pizzaria</option>
                  <option value="Bar">Bar</option>
                  <option value="Cafeteria">Cafeteria</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div className="grid grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Contato</label>
                  <input
                    className="form-input"
                    value={form.contato_nome}
                    onChange={(e) =>
                      setForm({ ...form, contato_nome: e.target.value })
                    }
                    placeholder="Nome do responsável"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input
                    className="form-input"
                    value={form.contato_telefone}
                    onChange={(e) =>
                      setForm({ ...form, contato_telefone: e.target.value })
                    }
                    placeholder="(19) 99999-0000"
                  />
                </div>
              </div>
              <div className="grid grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input
                    className="form-input"
                    value={form.cidade}
                    onChange={(e) =>
                      setForm({ ...form, cidade: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <input
                    className="form-input"
                    value={form.estado}
                    onChange={(e) =>
                      setForm({ ...form, estado: e.target.value })
                    }
                    maxLength={2}
                  />
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

      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div
            className="modal animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <h2 className="modal-title">Criar Acesso — {userClienteNome}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input
                  className="form-input"
                  value={userFullName}
                  onChange={(e) => setUserFullName(e.target.value)}
                  placeholder="Nome do usuário"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  className="form-input"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="usuario@email.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Senha *</label>
                <input
                  className="form-input"
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              {userError && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#FEE2E2",
                    color: "#991B1B",
                    fontSize: "0.8rem",
                  }}
                >
                  {userError}
                </div>
              )}
              {userSuccess && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#DCFCE7",
                    color: "#166534",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  {userSuccess}
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
                  onClick={() => setShowUserModal(false)}
                >
                  Fechar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateUser}
                  disabled={userSaving}
                >
                  {userSaving ? "Criando..." : "Criar Usuário"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
