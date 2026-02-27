import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCliente } from "@/contexts/ClienteContext";
import {
  LayoutDashboard,
  Users,
  Package,
  BookOpen,
  BarChart3,
  TrendingDown,
  ClipboardCheck,
  LogOut,
  ChevronDown,
  Building2,
  Sparkles,
  MessageSquare,
  ClipboardList,
  Calendar,
  Warehouse,
  Target,
  TrendingUp,
  UserCheck,
  PanelLeftClose,
  PanelLeft,
  Kanban,
  FolderOpen,
} from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const { clientes, selectedCliente, selectCliente } = useCliente();
  const navigate = useNavigate();
  const [showClientePicker, setShowClientePicker] = useState(false);

  const { isSidebarCollapsed, toggleSidebar } = useAppStore();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const hasCliente = !!selectedCliente;

  return (
    <div className="app-layout">
      <aside className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header" style={{ position: "relative" }}>
          {!isSidebarCollapsed && (
            <>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #3B82F6, #06B6D4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                }}
              >
                Q
              </div>
              <span className="sidebar-brand">Ariel Quadros</span>
            </>
          )}
          <button
            onClick={toggleSidebar}
            style={{
              position: "absolute",
              right: isSidebarCollapsed ? "50%" : 12,
              transform: isSidebarCollapsed ? "translateX(50%)" : "none",
              background: "none",
              border: "none",
              color: "#94A3B8",
              cursor: "pointer",
              padding: 4,
            }}
          >
            {isSidebarCollapsed ? (
              <PanelLeft size={20} />
            ) : (
              <PanelLeftClose size={20} />
            )}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Geral</div>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <LayoutDashboard className="icon" />{" "}
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin/clientes"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Users className="icon" />{" "}
            <span className="nav-label">Clientes</span>
          </NavLink>
          <NavLink
            to="/admin/leads"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Kanban className="icon" />{" "}
            <span className="nav-label">Leads & Follow-up</span>
          </NavLink>

          {/* Client Picker */}
          <div style={{ padding: "12px 16px 4px" }}>
            <div
              className="sidebar-section-title"
              style={{ margin: 0, paddingLeft: 0 }}
            >
              Cliente Ativo
            </div>
            <button
              onClick={() => setShowClientePicker(!showClientePicker)}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "8px 12px",
                borderRadius: 8,
                background: hasCliente ? "#F0F9FF" : "#FEF2F2",
                border: `1px solid ${hasCliente ? "#BAE6FD" : "#FECACA"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: hasCliente ? "#0369A1" : "#991B1B",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  overflow: "hidden",
                }}
              >
                <Building2 size={14} />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {hasCliente
                    ? selectedCliente.nome_fantasia
                    : "Selecione um cliente"}
                </span>
              </div>
              <ChevronDown
                size={14}
                style={{
                  transform: showClientePicker ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {showClientePicker && (
              <div
                style={{
                  marginTop: 4,
                  background: "#fff",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  maxHeight: 200,
                  overflowY: "auto",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              >
                {clientes.length === 0 ? (
                  <div
                    style={{
                      padding: 12,
                      fontSize: "0.75rem",
                      color: "#94A3B8",
                      textAlign: "center",
                    }}
                  >
                    Nenhum cliente cadastrado
                  </div>
                ) : (
                  clientes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        selectCliente(c);
                        setShowClientePicker(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        textAlign: "left",
                        background:
                          selectedCliente?.id === c.id
                            ? "#EFF6FF"
                            : "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: selectedCliente?.id === c.id ? 700 : 400,
                        color: "#1E293B",
                        borderBottom: "1px solid #F1F5F9",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#F8FAFC")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background =
                          selectedCliente?.id === c.id
                            ? "#EFF6FF"
                            : "transparent")
                      }
                    >
                      {c.nome_fantasia}
                      {c.segmento && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "#94A3B8",
                            marginLeft: 6,
                          }}
                        >
                          {c.segmento}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Client-scoped menu items */}
          {hasCliente && (
            <>
              <div className="sidebar-section-title" style={{ marginTop: 16 }}>
                Operacional
              </div>
              <NavLink
                to="/admin/insumos"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <Package className="icon" />{" "}
                <span className="nav-label">Insumos</span>
              </NavLink>
              <NavLink
                to="/admin/fichas-tecnicas"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <BookOpen className="icon" />{" "}
                <span className="nav-label">Fichas Técnicas</span>
              </NavLink>
              <NavLink
                to="/admin/simulador"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <BarChart3 className="icon" />{" "}
                <span className="nav-label">Simulador CMV</span>
              </NavLink>
              <NavLink
                to="/admin/raio-x-produtos"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <Sparkles className="icon" />{" "}
                <span className="nav-label">Raio-X Produtos</span>
              </NavLink>
              <NavLink
                to="/admin/estoque"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <Warehouse className="icon" />{" "}
                <span className="nav-label">Estoque</span>
              </NavLink>
              <NavLink
                to="/admin/pessoas"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <UserCheck className="icon" />{" "}
                <span className="nav-label">Pessoas</span>
              </NavLink>

              <div className="sidebar-section-title">Financeiro</div>
              <NavLink
                to="/admin/dre"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <TrendingDown className="icon" />{" "}
                <span className="nav-label">DRE Gerencial</span>
              </NavLink>

              <div className="sidebar-section-title">Diagnóstico</div>
              <NavLink
                to="/admin/scorecard"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <ClipboardCheck className="icon" />{" "}
                <span className="nav-label">Scorecard</span>
              </NavLink>
              <NavLink
                to="/admin/avaliacao"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <MessageSquare className="icon" />{" "}
                <span className="nav-label">Avaliação de Percepção</span>
              </NavLink>

              <div className="sidebar-section-title">Acompanhamento</div>
              <NavLink
                to="/admin/plano-acao"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <ClipboardList className="icon" />{" "}
                <span className="nav-label">Plano de Ação</span>
              </NavLink>
              <NavLink
                to="/admin/evolucao"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <TrendingUp className="icon" />{" "}
                <span className="nav-label">Evolução</span>
              </NavLink>
              <NavLink
                to="/admin/metas"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <Target className="icon" />{" "}
                <span className="nav-label">Metas</span>
              </NavLink>
              <NavLink
                to="/admin/atendimentos"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <Calendar className="icon" />{" "}
                <span className="nav-label">Atendimentos</span>
              </NavLink>

              <div className="sidebar-section-title">Arquivos</div>
              <NavLink
                to="/admin/arquivos"
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <FolderOpen className="icon" />{" "}
                <span className="nav-label">Arquivos do Cliente</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3B82F6",
                fontWeight: 700,
                fontSize: "0.8rem",
              }}
            >
              {profile?.full_name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                {profile?.full_name || "Admin"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                Consultor
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="nav-item"
            style={{ width: "100%", color: "#94A3B8" }}
          >
            <LogOut className="icon" /> <span className="nav-label">Sair</span>
          </button>
        </div>
      </aside>

      <main className={`main-content ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="page-wrapper">
          <Breadcrumbs />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
