import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "./button";

interface ImageUploaderProps {
  /** Bucket do Supabase Storage */
  bucket?: string;
  /** Pasta dentro do bucket */
  folder?: string;
  /** URL(s) já salvas — string única ou array */
  value: string | string[];
  /** Callback com a(s) URL(s) pública(s) após upload */
  onChange: (urls: string | string[]) => void;
  /** Se true, permite múltiplos arquivos */
  multiple?: boolean;
  label?: string;
}

const BUCKET = "images";

export function ImageUploader({
  bucket = BUCKET,
  folder = "uploads",
  value,
  onChange,
  multiple = false,
  label = "Imagem",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const urls: string[] = Array.isArray(value)
    ? value
    : value
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (!fileArr.length) return;
    setUploading(true);

    const newUrls: string[] = [];
    for (const file of fileArr) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        toast.error(`Erro ao enviar ${file.name}: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }

    setUploading(false);
    if (!newUrls.length) return;

    if (multiple) {
      const merged = [...urls, ...newUrls];
      onChange(merged);
    } else if (newUrls[0]) {
      onChange(newUrls[0]);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    void uploadFiles(files);
  };

  const remove = (idx: number) => {
    if (multiple) {
      const next = urls.filter((_, i) => i !== idx);
      onChange(next);
    } else {
      onChange("");
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-dashed p-6 transition-colors
          ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/30"}`}
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Enviando...</p>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Clique ou arraste {multiple ? "as fotos" : "a foto"} aqui
            </p>
            <p className="text-xs text-muted-foreground/60">JPG, PNG, WEBP até 10MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Preview */}
      {urls.length > 0 && (
        <div className={`flex flex-wrap gap-3`}>
          {urls.map((url, idx) => (
            <div key={idx} className="group relative">
              <img
                src={url}
                alt={`Imagem ${idx + 1}`}
                className="h-24 w-24 rounded border border-border object-cover"
              />
              {idx === 0 && multiple && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-[10px] text-white">
                  Principal
                </span>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 h-5 w-5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); remove(idx); }}
                aria-label="Remover imagem"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {multiple && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-24 w-24 flex-col items-center justify-center rounded border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/60"
            >
              <ImageIcon className="h-5 w-5" />
              <span className="mt-1 text-[10px]">Adicionar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
