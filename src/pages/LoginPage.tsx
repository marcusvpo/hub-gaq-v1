import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Shield, LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Fetch the user's profile to determine role
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Erro ao obter usuário");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      setError("Perfil não encontrado. Contate o administrador.");
      setLoading(false);
      return;
    }

    // Validate role matches login mode
    if (isAdminMode && profile.role !== "admin") {
      setError("Esta conta não possui permissão de administrador.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (!isAdminMode && profile.role !== "client") {
      setError(
        "Esta é uma conta de administrador. Use 'Entrar como Administrador'.",
      );
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // Navigate based on role
    navigate(profile.role === "admin" ? "/admin" : "/client");
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <div className="auth-logo">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              margin: "0 auto",
              background: isAdminMode
                ? "linear-gradient(135deg, #7C3AED, #3B82F6)"
                : "linear-gradient(135deg, #3B82F6, #06B6D4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: "1.5rem",
              transition: "background 0.3s ease",
            }}
          >
            {isAdminMode ? <Shield size={28} /> : "Q"}
          </div>
        </div>
        <h1 className="auth-title">Hub GAQ</h1>
        <p className="auth-subtitle">
          {isAdminMode ? "Acesso Administrativo" : "Acesse sua plataforma"}
        </p>

        {/* Mode toggle pills */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            borderRadius: 12,
            background: "#F1F5F9",
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsAdminMode(false);
              setError("");
            }}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: !isAdminMode ? "#fff" : "transparent",
              color: !isAdminMode ? "#0F172A" : "#94A3B8",
              boxShadow: !isAdminMode ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <LogIn size={14} />
              Cliente
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdminMode(true);
              setError("");
            }}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: isAdminMode ? "#fff" : "transparent",
              color: isAdminMode ? "#7C3AED" : "#94A3B8",
              boxShadow: isAdminMode ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Shield size={14} />
              Administrador
            </div>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "#FEE2E2",
                color: "#991B1B",
                fontSize: "0.85rem",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 8,
              background: isAdminMode
                ? "linear-gradient(135deg, #7C3AED, #3B82F6)"
                : undefined,
            }}
          >
            {loading ? (
              <div className="loading-spinner" />
            ) : isAdminMode ? (
              <>
                <Shield size={16} /> Entrar como Administrador
              </>
            ) : (
              <>
                <LogIn size={16} /> Entrar
              </>
            )}
          </button>
        </form>

        {isAdminMode && (
          <p
            style={{
              marginTop: 16,
              fontSize: "0.75rem",
              color: "#94A3B8",
              textAlign: "center",
            }}
          >
            Acesso restrito a consultores e administradores GAQ
          </p>
        )}
      </div>
    </div>
  );
}
