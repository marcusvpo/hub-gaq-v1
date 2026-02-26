import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  BarChart3,
  AlertTriangle,
  Gauge,
  TrendingDown,
  RadarIcon,
  ListChecks,
  LogOut,
  TrendingUp,
  UtensilsCrossed,
  Calculator,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function ClientLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const { isSidebarCollapsed, toggleSidebar } = useAppStore();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

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
              <span className="sidebar-brand">HUB Ariel Quadros</span>
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
          <div className="sidebar-section-title">Visão Geral</div>
          <NavLink
            to="/client"
            end
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <LayoutDashboard className="icon" /> Dashboard
          </NavLink>

          <div className="sidebar-section-title">Custos & Preços</div>
          <NavLink
            to="/client/ranking"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <BarChart3 className="icon" /> Ranking de Produtos
          </NavLink>
          <NavLink
            to="/client/alertas"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <AlertTriangle className="icon" /> Alertas de Custo
          </NavLink>

          <div className="sidebar-section-title">Saúde Financeira</div>
          <NavLink
            to="/client/lucro"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Gauge className="icon" /> Velocímetro de Lucro
          </NavLink>
          <NavLink
            to="/client/cascata"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <TrendingDown className="icon" /> Cascata Financeira
          </NavLink>

          <div className="sidebar-section-title">Diagnóstico</div>
          <NavLink
            to="/client/raio-x"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <RadarIcon className="icon" /> Scorecard
          </NavLink>
          <NavLink
            to="/client/plano-acao"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <ListChecks className="icon" /> Plano de Ação
          </NavLink>

          <div className="sidebar-section-title">Inteligência</div>
          <NavLink
            to="/client/progresso"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <TrendingUp className="icon" /> Meu Progresso
          </NavLink>
          <NavLink
            to="/client/cardapio"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <UtensilsCrossed className="icon" /> Cardápio Inteligente
          </NavLink>
          <NavLink
            to="/client/simulador"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Calculator className="icon" /> Simulador "E Se?"
          </NavLink>
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
                background: "#D1FAE5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#059669",
                fontWeight: 700,
                fontSize: "0.8rem",
              }}
            >
              {profile?.full_name?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                {profile?.full_name || "Cliente"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                Proprietário
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
        <Outlet />
      </main>
    </div>
  );
}
