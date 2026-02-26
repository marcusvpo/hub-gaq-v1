import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCliente } from "@/contexts/ClienteContext";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Building2,
  UserPlus,
  Users,
} from "lucide-react";

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
  nome_donos: string;
  status_relacionamento: string;
  contatos_extras: any[];
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
  nome_donos: "",
  status_relacionamento: "ativo",
  contatos_extras: [],
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
  const [clienteUsers, setClienteUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

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
      nome_donos: c.nome_donos || "",
      status_relacionamento: c.status_relacionamento || "ativo",
      contatos_extras: [],
    });

    // Load extra contacts
    supabase
      .from("cliente_contatos")
      .select("*")
      .eq("cliente_id", c.id)
      .then(({ data }) => {
        if (data) setForm((prev) => ({ ...prev, contatos_extras: data }));
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

    let clientId = editId;

    if (editId) {
      const { error: err } = await supabase
        .from("clientes")
        .update({
          nome_fantasia: form.nome_fantasia,
          razao_social: form.razao_social,
          cnpj: form.cnpj,
          segmento: form.segmento,
          contato_nome: form.contato_nome,
          contato_telefone: form.contato_telefone,
          contato_email: form.contato_email,
          cidade: form.cidade,
          estado: form.estado,
          nome_donos: form.nome_donos,
          status_relacionamento: form.status_relacionamento,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editId);
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error: err } = await supabase
        .from("clientes")
        .insert({
          nome_fantasia: form.nome_fantasia,
          razao_social: form.razao_social,
          cnpj: form.cnpj,
          segmento: form.segmento,
          contato_nome: form.contato_nome,
          contato_telefone: form.contato_telefone,
          contato_email: form.contato_email,
          cidade: form.cidade,
          estado: form.estado,
          nome_donos: form.nome_donos,
          status_relacionamento: form.status_relacionamento,
          admin_id: user!.id,
        })
        .select("id")
        .single();

      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
      clientId = data.id;
    }

    if (clientId) {
      // Remove old contacts and insert new ones
      await supabase
        .from("cliente_contatos")
        .delete()
        .eq("cliente_id", clientId);

      if (form.contatos_extras.length > 0) {
        await supabase.from("cliente_contatos").insert(
          form.contatos_extras.map((c) => ({
            cliente_id: clientId,
            nome: c.nome,
            cargo: c.cargo,
            telefone: c.telefone,
            email: c.email,
          })),
        );
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

  async function openUserModal(clienteId: string, nome: string) {
    setUserClienteId(clienteId);
    setUserClienteNome(nome);
    setUserEmail("");
    setUserPassword("");
    setUserFullName("");
    setUserError("");
    setUserSuccess("");
    setShowUserModal(true);

    setLoadingUsers(true);
    const { data: rels } = await supabase
      .from("cliente_users")
      .select("user_id")
      .eq("cliente_id", clienteId);

    if (rels && rels.length > 0) {
      const ids = rels.map((r) => r.user_id);
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", ids);
      setClienteUsers(profs || []);
    } else {
      setClienteUsers([]);
    }
    setLoadingUsers(false);
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

      // Refresh user list
      if (userClienteId) {
        openUserModal(userClienteId, userClienteNome);
      }
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
                    <div
                      style={{
                        fontWeight: 900,
                        fontSize: "1.05rem",
                        color: "#0F172A",
                      }}
                    >
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
                    {c.status_relacionamento &&
                    c.status_relacionamento !== "ativo" ? (
                      <span
                        className="badge"
                        style={{
                          marginTop: 4,
                          marginLeft: 6,
                          background:
                            c.status_relacionamento === "lead"
                              ? "#F0F9FF"
                              : c.status_relacionamento === "negociacao"
                                ? "#FFF7ED"
                                : c.status_relacionamento === "avulso"
                                  ? "#F3F4F6"
                                  : "#FEE2E2",
                          color:
                            c.status_relacionamento === "lead"
                              ? "#0EA5E9"
                              : c.status_relacionamento === "negociacao"
                                ? "#F97316"
                                : c.status_relacionamento === "avulso"
                                  ? "#6B7280"
                                  : "#EF4444",
                        }}
                      >
                        {c.status_relacionamento === "lead"
                          ? "Lead"
                          : c.status_relacionamento === "negociacao"
                            ? "Em Negociação"
                            : c.status_relacionamento === "avulso"
                              ? "Avulso"
                              : "Inativo"}
                      </span>
                    ) : null}
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
                {c.nome_donos && (
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#64748B",
                      fontWeight: 500,
                      marginBottom: 4,
                    }}
                  >
                    <Users
                      size={12}
                      style={{
                        display: "inline",
                        marginRight: 4,
                        verticalAlign: "-2px",
                      }}
                    />
                    {c.nome_donos}
                  </div>
                )}
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
            style={{ maxWidth: 520, maxHeight: "90vh", overflow: "auto" }}
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
                    onChange={(e) => {
                      const dddMap: Record<string, string> = {
                        "11": "SP",
                        "12": "SP",
                        "13": "SP",
                        "14": "SP",
                        "15": "SP",
                        "16": "SP",
                        "17": "SP",
                        "18": "SP",
                        "19": "SP",
                        "21": "RJ",
                        "22": "RJ",
                        "24": "RJ",
                        "27": "ES",
                        "28": "ES",
                        "31": "MG",
                        "32": "MG",
                        "33": "MG",
                        "34": "MG",
                        "35": "MG",
                        "37": "MG",
                        "38": "MG",
                        "41": "PR",
                        "42": "PR",
                        "43": "PR",
                        "44": "PR",
                        "45": "PR",
                        "46": "PR",
                        "47": "SC",
                        "48": "SC",
                        "49": "SC",
                        "51": "RS",
                        "53": "RS",
                        "54": "RS",
                        "55": "RS",
                        "61": "DF",
                        "62": "GO",
                        "64": "GO",
                        "63": "TO",
                        "65": "MT",
                        "66": "MT",
                        "67": "MS",
                        "68": "AC",
                        "69": "RO",
                        "71": "BA",
                        "73": "BA",
                        "74": "BA",
                        "75": "BA",
                        "77": "BA",
                        "79": "SE",
                        "81": "PE",
                        "87": "PE",
                        "82": "AL",
                        "83": "PB",
                        "84": "RN",
                        "85": "CE",
                        "88": "CE",
                        "86": "PI",
                        "89": "PI",
                        "91": "PA",
                        "93": "PA",
                        "94": "PA",
                        "92": "AM",
                        "97": "AM",
                        "95": "RR",
                        "96": "AP",
                        "98": "MA",
                        "99": "MA",
                      };

                      let val = e.target.value.replace(/\D/g, "");
                      let formatted = val;
                      if (val.length > 11) val = val.slice(0, 11);

                      if (val.length > 2) {
                        formatted = `(${val.substring(0, 2)}) ${val.substring(2)}`;
                      }
                      if (val.length > 7) {
                        formatted = `(${val.substring(0, 2)}) ${val.substring(2, 7)}-${val.substring(7, 11)}`;
                      }

                      const updates: Partial<ClienteForm> = {
                        contato_telefone: formatted,
                      };
                      if (val.length >= 2) {
                        const ddd = val.substring(0, 2);
                        if (dddMap[ddd]) {
                          updates.estado = dddMap[ddd];
                        }
                      }
                      setForm({ ...form, ...updates });
                    }}
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

              {/* Contatos Extras */}
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <label className="form-label" style={{ margin: 0 }}>
                    Sócios / Contatos Adicionais
                  </label>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "0.7rem" }}
                    onClick={() =>
                      setForm({
                        ...form,
                        contatos_extras: [
                          ...form.contatos_extras,
                          { nome: "", cargo: "", telefone: "", email: "" },
                        ],
                      })
                    }
                  >
                    + Adicionar
                  </button>
                </div>
                {form.contatos_extras.map((ctt, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 12,
                      border: "1px solid #F1F5F9",
                      borderRadius: 12,
                      marginBottom: 8,
                      position: "relative",
                      background: "#F8FAFC",
                    }}
                  >
                    <button
                      onClick={() =>
                        setForm({
                          ...form,
                          contatos_extras: form.contatos_extras.filter(
                            (_, i) => i !== idx,
                          ),
                        })
                      }
                      style={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        background: "none",
                        border: "none",
                        color: "#EF4444",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="grid grid-2" style={{ gap: 8 }}>
                      <input
                        className="form-input"
                        placeholder="Nome"
                        value={ctt.nome}
                        onChange={(e) => {
                          const newC = [...form.contatos_extras];
                          newC[idx].nome = e.target.value;
                          setForm({ ...form, contatos_extras: newC });
                        }}
                      />
                      <input
                        className="form-input"
                        placeholder="Cargo"
                        value={ctt.cargo}
                        onChange={(e) => {
                          const newC = [...form.contatos_extras];
                          newC[idx].cargo = e.target.value;
                          setForm({ ...form, contatos_extras: newC });
                        }}
                      />
                    </div>
                  </div>
                ))}
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
            style={{ maxWidth: 650, width: "100%" }}
          >
            <h2 className="modal-title">
              Gerenciar Acessos — {userClienteNome}
            </h2>

            <div className="grid grid-2" style={{ gap: 24 }}>
              {/* Lado Esquerdo - Criação */}
              <div
                style={{ paddingRight: 24, borderRight: "1px solid #E2E8F0" }}
              >
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  Novo Usuário
                </h3>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
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
                        padding: 10,
                        background: "#FEE2E2",
                        color: "#991B1B",
                        borderRadius: 8,
                        fontSize: "0.75rem",
                      }}
                    >
                      {userError}
                    </div>
                  )}

                  {userSuccess && (
                    <div
                      style={{
                        padding: 10,
                        background: "#F0FDF4",
                        color: "#166534",
                        borderRadius: 8,
                        fontSize: "0.75rem",
                      }}
                    >
                      {userSuccess}
                    </div>
                  )}

                  <button
                    className="btn btn-primary"
                    onClick={handleCreateUser}
                    disabled={userSaving}
                    style={{ width: "100%" }}
                  >
                    {userSaving ? "Criando..." : "Criar Usuário"}
                  </button>
                </div>
              </div>

              {/* Lado Direito - Listagem */}
              <div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  Usuários Vinculados
                </h3>
                {loadingUsers ? (
                  <p style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Carregando...
                  </p>
                ) : clienteUsers.length === 0 ? (
                  <p style={{ fontSize: "0.8rem", color: "#64748B" }}>
                    Nenhum usuário vinculado.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {clienteUsers.map((u) => (
                      <div
                        key={u.id}
                        style={{
                          padding: 12,
                          background: "#F8FAFC",
                          borderRadius: 8,
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            color: "#1E293B",
                          }}
                        >
                          {u.full_name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                          {u.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 24,
                paddingTop: 16,
                borderTop: "1px solid #E2E8F0",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setShowUserModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
