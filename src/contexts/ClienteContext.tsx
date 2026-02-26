import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Cliente {
  id: string;
  nome_fantasia: string;
  razao_social: string | null;
  cnpj: string | null;
  segmento: string | null;
  contato_nome: string | null;
  contato_telefone: string | null;
  contato_email: string | null;
  cidade: string | null;
  estado: string | null;
  ativo?: boolean;
  score_atual?: number | null;
  classificacao_atual?: string | null;
  nome_donos?: string | null;
  status_relacionamento?: string;
}

interface ClienteContextType {
  clientes: Cliente[];
  selectedCliente: Cliente | null;
  selectCliente: (c: Cliente | null) => void;
  loadClientes: () => Promise<void>;
  loading: boolean;
}

const ClienteContext = createContext<ClienteContextType>({
  clientes: [],
  selectedCliente: null,
  selectCliente: () => {},
  loadClientes: async () => {},
  loading: true,
});

export function useCliente() {
  return useContext(ClienteContext);
}

export function ClienteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadClientes();
  }, [user]);

  async function loadClientes() {
    setLoading(true);
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .eq("ativo", true)
      .order("nome_fantasia");
    if (data) {
      setClientes(data);
      // Auto-select first if none selected
      if (!selectedCliente && data.length > 0) {
        const saved = localStorage.getItem("hub-gaq-selected-cliente");
        const found = saved ? data.find((c) => c.id === saved) : null;
        setSelectedCliente(found || data[0]);
      }
    }
    setLoading(false);
  }

  function selectCliente(c: Cliente | null) {
    setSelectedCliente(c);
    if (c) localStorage.setItem("hub-gaq-selected-cliente", c.id);
    else localStorage.removeItem("hub-gaq-selected-cliente");
  }

  return (
    <ClienteContext.Provider
      value={{
        clientes,
        selectedCliente,
        selectCliente,
        loadClientes,
        loading,
      }}
    >
      {children}
    </ClienteContext.Provider>
  );
}
