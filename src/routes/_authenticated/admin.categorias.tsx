import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/ui/image-uploader";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  component: AdminCategories,
});

function AdminCategories() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", description: "", image_url: "", sort_order: "0" });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-page"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const create = async () => {
    if (form.name.trim().length < 2) {
      toast.error("Informe o nome da categoria.");
      return;
    }
    const { error } = await supabase.from("categories").insert({
      name: form.name.trim(),
      slug: slugify(form.name),
      description: form.description || null,
      image_url: form.image_url || null,
      sort_order: Number(form.sort_order) || 0,
    });
    if (error) {
      toast.error("Não foi possível criar a categoria.");
      return;
    }
    toast.success("Categoria criada!");
    setForm({ name: "", description: "", image_url: "", sort_order: "0" });
    void qc.invalidateQueries();
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Catálogo</p>
        <h1 className="text-3xl">Categorias</h1>
      </header>

      <div className="grid gap-4 border border-border/70 bg-card p-6 sm:grid-cols-4">
        {(
          [
            ["name", "Nome"],
            ["description", "Descrição"],
            ["sort_order", "Ordem"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</Label>
            <Input className="h-11" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </div>
        ))}
        <div className="space-y-1.5 sm:col-span-4">
          <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Imagem da categoria</Label>
          <ImageUploader
            folder="categorias"
            value={form.image_url}
            onChange={(url) => setForm({ ...form, image_url: Array.isArray(url) ? url[0] ?? "" : url })}
          />
        </div>
        <div className="sm:col-span-4">
          <Button variant="gold" onClick={() => void create()}>
            Adicionar categoria
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-4 border border-border/70 bg-card p-4">
            {c.image_url && <img src={c.image_url} alt="" loading="lazy" className="h-16 w-16 object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">/{c.slug}</p>
            </div>
            <Switch
              checked={c.active}
              onCheckedChange={async (v) => {
                await supabase.from("categories").update({ active: v }).eq("id", c.id);
                void qc.invalidateQueries();
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              aria-label="Excluir categoria"
              onClick={async () => {
                await supabase.from("categories").delete().eq("id", c.id);
                void qc.invalidateQueries();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
