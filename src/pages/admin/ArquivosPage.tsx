import { useState, useEffect, useCallback } from "react";
import { useCliente } from "@/contexts/ClienteContext";
import { supabase } from "@/lib/supabase";
import { Upload, File, Trash2, ExternalLink, FolderOpen } from "lucide-react";
import toast from "react-hot-toast";

type StorageFile = {
  name: string;
  url: string;
  type: "image" | "document" | "unknown";
  created_at?: string;
};

export default function ArquivosPage() {
  const { selectedCliente } = useCliente();

  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Load files when client changes
  useEffect(() => {
    if (selectedCliente?.id) {
      loadFiles();
    } else {
      setFiles([]);
    }
  }, [selectedCliente?.id]);

  const loadFiles = useCallback(async () => {
    if (!selectedCliente?.id) return;

    setLoading(true);
    try {
      // List files in the client's folder
      const { data, error } = await supabase.storage
        .from("clientes")
        .list(`${selectedCliente.id}/`);

      if (error) {
        console.error("Error listing files:", error);
        throw error;
      }

      // Filter out the empty folder placeholder if any
      const validFiles =
        data?.filter((f: any) => f.name !== ".emptyFolderPlaceholder") || [];

      // Generate public URLs for all files
      const fileUrls = validFiles.map((file: any) => {
        const {
          data: { publicUrl },
        } = supabase.storage
          .from("clientes")
          .getPublicUrl(`${selectedCliente.id}/${file.name}`);

        return {
          name: file.name,
          url: publicUrl,
          created_at: file.created_at,
          type: determineFileType(file.name),
        };
      });

      // Sort by newest first
      fileUrls.sort((a: any, b: any) => {
        if (!a.created_at || !b.created_at) return 0;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      setFiles(fileUrls);
    } catch (error: any) {
      toast.error("Erro ao carregar arquivos");
    } finally {
      setLoading(false);
    }
  }, [selectedCliente?.id]);

  const determineFileType = (
    filename: string,
  ): "image" | "document" | "unknown" => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || ""))
      return "image";
    if (["pdf", "doc", "docx", "xls", "xlsx", "txt"].includes(ext || ""))
      return "document";
    return "unknown";
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement> | React.DragEvent,
  ) => {
    if (!selectedCliente?.id) {
      toast.error("Selecione um cliente primeiro");
      return;
    }

    let filesToUpload: FileList | null = null;

    if ("dataTransfer" in e) {
      filesToUpload = e.dataTransfer.files;
    } else if ("target" in e && e.target instanceof HTMLInputElement) {
      filesToUpload = e.target.files;
    }

    if (!filesToUpload || filesToUpload.length === 0) return;

    setUploading(true);
    const uploadPromises = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      // Create unique filename to prevent overwrites
      const uniqueName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const filePath = `${selectedCliente.id}/${uniqueName}`;

      const promise = supabase.storage
        .from("clientes")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })
        .then(({ data, error }: any) => {
          if (error) throw error;
          return data;
        });

      uploadPromises.push(promise);
    }

    try {
      await Promise.all(uploadPromises);
      toast.success(
        `${uploadPromises.length === 1 ? "Arquivo enviado" : "Arquivos enviados"} com sucesso`,
      );
      loadFiles();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar arquivo(s)");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!selectedCliente?.id) return;

    if (!confirm("Tem certeza que deseja excluir este arquivo?")) return;

    try {
      const { error } = await supabase.storage
        .from("clientes")
        .remove([`${selectedCliente.id}/${fileName}`]);

      if (error) throw error;

      toast.success("Arquivo excluído com sucesso");
      setFiles(files.filter((f) => f.name !== fileName));
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Erro ao excluir arquivo");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e);
    }
  };

  if (!selectedCliente) {
    return (
      <div
        className="card"
        style={{ textAlign: "center", padding: "48px 24px" }}
      >
        <FolderOpen
          size={48}
          color="var(--gray-300)"
          style={{ margin: "0 auto 16px" }}
        />
        <h3 style={{ marginBottom: 8 }}>Nenhum Cliente Selecionado</h3>
        <p style={{ color: "var(--gray-500)", fontSize: "0.9rem" }}>
          Por favor, selecione um cliente no menu lateral para visualizar e
          gerenciar seus arquivos.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        className="page-header"
        style={{ padding: "0 0 24px 0", borderBottom: "none" }}
      >
        <div>
          <h1 className="page-title">Arquivos do Cliente</h1>
          <p className="page-subtitle">
            Gerencie imagens, documentos e outros arquivos de{" "}
            {selectedCliente.nome_fantasia}
          </p>
        </div>
      </div>

      <div
        className="card"
        style={{
          border: dragActive
            ? "2px dashed var(--brand)"
            : "2px dashed var(--gray-300)",
          background: dragActive ? "var(--brand-wash)" : "var(--color-surface)",
          padding: "40px 24px",
          textAlign: "center",
          transition: "all 0.2s",
          cursor: "pointer",
          marginBottom: 24,
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--brand-wash)",
            color: "var(--brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Upload size={24} />
        </div>

        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>
          Clique ou arraste arquivos para enviar
        </h3>
        <p
          style={{
            color: "var(--gray-500)",
            fontSize: "0.85rem",
            maxWidth: 400,
            margin: "0 auto",
          }}
        >
          Suporta imagens (.png, .jpg, etc) e documentos. Os arquivos são
          armazenados de forma segura e exclusiva para este cliente.
        </p>

        <input
          id="file-upload"
          type="file"
          multiple
          onChange={handleUpload}
          style={{ display: "none" }}
        />

        {uploading && (
          <div
            style={{
              marginTop: 16,
              color: "var(--brand)",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            Enviando arquivo(s)...
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {loading ? (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: 40,
              color: "var(--gray-400)",
            }}
          >
            Carregando arquivos...
          </div>
        ) : files.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: 40,
              background: "var(--color-surface)",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
            }}
          >
            <p style={{ color: "var(--gray-500)" }}>
              Nenhum arquivo enviado ainda.
            </p>
          </div>
        ) : (
          files.map((file, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: 160,
                  background: "var(--gray-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderBottom: "1px solid var(--color-border)",
                  position: "relative",
                }}
              >
                {file.type === "image" ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <File size={48} color="var(--gray-400)" />
                )}

                {/* Delete button (overlay) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(file.name);
                  }}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.9)",
                    color: "var(--color-danger)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  title="Excluir arquivo"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div
                style={{
                  padding: "12px 16px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  title={file.name}
                >
                  {file.name.replace(/^\d+_/, "")}{" "}
                  {/* Remove timestamp prefix */}
                  <ExternalLink
                    size={12}
                    style={{ flexShrink: 0, opacity: 0.5 }}
                  />
                </a>

                {file.created_at && (
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--color-text-muted)",
                      marginTop: "auto",
                    }}
                  >
                    Enviado em{" "}
                    {new Date(file.created_at).toLocaleDateString("pt-BR")}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
