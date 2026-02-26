import { Plus, Trash2 } from "lucide-react";

export interface ContatoAdicional {
  id?: string;
  nome: string;
  telefone: string;
  email: string;
  cargo: string;
}

interface Props {
  value: ContatoAdicional[];
  onChange: (val: ContatoAdicional[]) => void;
}

export default function ResponsaveisInput({ value, onChange }: Props) {
  function addRow() {
    onChange([...value, { nome: "", telefone: "", email: "", cargo: "" }]);
  }

  function removeRow(idx: number) {
    const newVal = [...value];
    newVal.splice(idx, 1);
    onChange(newVal);
  }

  function handleChange(
    idx: number,
    field: keyof ContatoAdicional,
    val: string,
  ) {
    const newVal = [...value];
    newVal[idx] = { ...newVal[idx], [field]: val };
    onChange(newVal);
  }

  return (
    <div
      style={{
        marginTop: 24,
        padding: 16,
        border: "1px dashed #E2E8F0",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <label className="form-label" style={{ margin: 0 }}>
          Responsáveis Adicionais
        </label>
        <button
          type="button"
          onClick={addRow}
          className="btn btn-secondary btn-sm"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <Plus size={14} /> Adicionar
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {value.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
              gap: 8,
              alignItems: "start",
            }}
          >
            <input
              className="form-input"
              placeholder="Nome"
              value={item.nome}
              onChange={(e) => handleChange(idx, "nome", e.target.value)}
            />
            <input
              className="form-input"
              placeholder="Cargo"
              value={item.cargo}
              onChange={(e) => handleChange(idx, "cargo", e.target.value)}
            />
            <input
              className="form-input"
              placeholder="Telefone"
              value={item.telefone}
              onChange={(e) => handleChange(idx, "telefone", e.target.value)}
            />
            <input
              className="form-input"
              placeholder="Email"
              value={item.email}
              onChange={(e) => handleChange(idx, "email", e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="btn-icon"
              style={{ color: "#EF4444" }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {value.length === 0 && (
          <div
            style={{
              fontSize: "0.8rem",
              color: "#94A3B8",
              textAlign: "center",
              padding: "12px 0",
            }}
          >
            Nenhum responsável adicional cadastrado.
          </div>
        )}
      </div>
    </div>
  );
}
