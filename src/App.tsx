import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ClienteProvider } from "@/contexts/ClienteContext";
import AdminLayout from "@/layouts/AdminLayout";
import ClientLayout from "@/layouts/ClientLayout";
import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ClientesPage from "@/pages/admin/ClientesPage";
import InsumosPage from "@/pages/admin/InsumosPage";
import FichasTecnicasPage from "@/pages/admin/FichasTecnicasPage";
import SimuladorCMVPage from "@/pages/admin/SimuladorCMVPage";
import DREPage from "@/pages/admin/DREPage";
import ScorecardPage from "@/pages/admin/ScorecardPage";
import RaioXProdutosAdminPage from "@/pages/admin/RaioXProdutosAdminPage";
import AvaliacaoPercepcaoPage from "@/pages/admin/AvaliacaoPercepcaoPage";
import PlanoAcaoAdminPage from "@/pages/admin/PlanoAcaoAdminPage";
import AtendimentosPage from "@/pages/admin/AtendimentosPage";
import EstoquePage from "@/pages/admin/EstoquePage";
import MetasPage from "@/pages/admin/MetasPage";
import EvolucaoPage from "@/pages/admin/EvolucaoPage";
import PessoasPage from "@/pages/admin/PessoasPage";
import LeadsPage from "@/pages/admin/LeadsPage";
import ClientDashboard from "@/pages/client/ClientDashboard";
import RankingProdutosPage from "@/pages/client/RankingProdutosPage";
import AlertaCustosPage from "@/pages/client/AlertaCustosPage";
import VelocimetroLucroPage from "@/pages/client/VelocimetroLucroPage";
import CascataFinanceiraPage from "@/pages/client/CascataFinanceiraPage";
import RaioXPage from "@/pages/client/RaioXPage";
import PlanoAcaoPage from "@/pages/client/PlanoAcaoPage";
import ProgressoClientPage from "@/pages/client/ProgressoClientPage";
import CardapioClientPage from "@/pages/client/CardapioClientPage";
import SimuladorESeClientPage from "@/pages/client/SimuladorESeClientPage";
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading, profile } = useAuth();
  if (loading)
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
      </div>
    );
  if (user)
    return <Navigate to={profile?.role === "client" ? "/client" : "/admin"} />;
  return <>{children}</>;
}

function SmartRedirect() {
  const { user, loading, profile } = useAuth();
  if (loading)
    return (
      <div className="loading-page">
        <div className="loading-spinner" />
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={profile?.role === "client" ? "/client" : "/admin"} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <ClienteProvider>
                  <AdminLayout />
                </ClienteProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="insumos" element={<InsumosPage />} />
            <Route path="fichas-tecnicas" element={<FichasTecnicasPage />} />
            <Route path="simulador" element={<SimuladorCMVPage />} />
            <Route path="dre" element={<DREPage />} />
            <Route path="scorecard" element={<ScorecardPage />} />
            <Route
              path="raio-x-produtos"
              element={<RaioXProdutosAdminPage />}
            />
            <Route path="avaliacao" element={<AvaliacaoPercepcaoPage />} />
            <Route path="plano-acao" element={<PlanoAcaoAdminPage />} />
            <Route path="atendimentos" element={<AtendimentosPage />} />
            <Route path="estoque" element={<EstoquePage />} />
            <Route path="metas" element={<MetasPage />} />
            <Route path="evolucao" element={<EvolucaoPage />} />
            <Route path="pessoas" element={<PessoasPage />} />
          </Route>

          {/* Client Routes */}
          <Route
            path="/client"
            element={
              <ProtectedRoute>
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ClientDashboard />} />
            <Route path="ranking" element={<RankingProdutosPage />} />
            <Route path="alertas" element={<AlertaCustosPage />} />
            <Route path="lucro" element={<VelocimetroLucroPage />} />
            <Route path="cascata" element={<CascataFinanceiraPage />} />
            <Route path="raio-x" element={<RaioXPage />} />
            <Route path="plano-acao" element={<PlanoAcaoPage />} />
            <Route path="progresso" element={<ProgressoClientPage />} />
            <Route path="cardapio" element={<CardapioClientPage />} />
            <Route path="simulador" element={<SimuladorESeClientPage />} />
          </Route>

          <Route path="*" element={<SmartRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
