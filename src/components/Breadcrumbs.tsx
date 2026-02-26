import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeConfig: Record<string, string> = {
  admin: "Início",
  clientes: "Clientes",
  leads: "Leads & Follow-up",
  insumos: "Insumos",
  "fichas-tecnicas": "Fichas Técnicas",
  simulador: "Simulador CMV",
  dre: "DRE Gerencial",
  scorecard: "Scorecard",
  "raio-x-produtos": "Raio-X Produtos",
  avaliacao: "Avaliação de Percepção",
  "plano-acao": "Plano de Ação",
  atendimentos: "Atendimentos",
  estoque: "Estoque",
  metas: "Metas",
  evolucao: "Evolução",
  pessoas: "Pessoas",
  client: "Dashboard Cliente",
  ranking: "Ranking de Produtos",
  alertas: "Alertas de Custos",
  lucro: "Velocímetro de Lucro",
  cascata: "Cascata Financeira",
  "raio-x": "Diagnóstico Raio-X",
  progresso: "Meu Progresso",
  cardapio: "Engenharia de Cardápio",
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 0",
        marginBottom: 8,
        fontSize: "0.75rem",
        color: "#64748B",
      }}
    >
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          color: "inherit",
          textDecoration: "none",
        }}
      >
        <Home size={14} />
      </Link>

      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const label =
          routeConfig[value] || value.charAt(0).toUpperCase() + value.slice(1);

        return (
          <div
            key={to}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <ChevronRight size={14} />
            {last ? (
              <span style={{ fontWeight: 600, color: "#1E293B" }}>{label}</span>
            ) : (
              <Link
                to={to}
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
