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

export const Route = createFileRoute("/_authenticated/admin/banners")({
  component: AdminBanners,
});

const EMPTY = { eyebrow: "", title: "", subtitle: "", image_url: "", button_label: "", button_link: "", sort_order: "0" };

function AdminBanners() {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  const { data: banners = [] } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const create = async () => {
    if (form.title.trim().length < 3) {
      toast.error("Informe um título para o banner.");
      return;
    }
    const { error } = await supabase.from("banners").insert({
      eyebrow: form.eyebrow || null,
      title: form.title.trim(),
      subtitle: form.subtitle || null,
      image_url: form.image_url || null,
      button_label: form.button_label || null,
      button_link: form.button_link || null,
      sort_order: Number(form.sort_order) || 0,
    });
    if (error) {
      toast.error("Não foi possível criar o banner.");
      return;
    }
    toast.success("Banner criado!");
    setForm(EMPTY);
    void qc.invalidateQueries();
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Vitrine</p>
        <h1 className="text-3xl">Banners da home</h1>
      </header>

      <div className="grid gap-4 border border-border/70 bg-card p-6 sm:grid-cols-3">
        {(
          [
            ["eyebrow", "Chapéu"],
            ["title", "Título"],
            ["subtitle", "Subtítulo"],
            ["button_label", "Texto do botão"],
            ["button_link", "Link do botão"],
            ["sort_order", "Ordem"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</Label>
            <Input className="h-11" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </div>
        ))}
        <div className="space-y-1.5 sm:col-span-3">
          <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Imagem do banner</Label>
          <ImageUploader
            folder="banners"
            value={form.image_url}
            onChange={(url) => setForm({ ...form, image_url: Array.isArray(url) ? url[0] ?? "" : url })}
          />
        </div>
        <div className="sm:col-span-3">
          <Button variant="gold" onClick={() => void create()}>
            Adicionar banner
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {banners.map((b) => (
          <div key={b.id} className="flex items-center gap-4 border border-border/70 bg-card p-4">
            {b.image_url && <img src={b.image_url} alt="" loading="lazy" className="h-16 w-28 object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{b.title}</p>
              <p className="truncate text-xs text-muted-foreground">{b.subtitle}</p>
            </div>
            <Switch
              checked={b.active}
              onCheckedChange={async (v) => {
                await supabase.from("banners").update({ active: v }).eq("id", b.id);
                void qc.invalidateQueries();
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              aria-label="Excluir banner"
              onClick={async () => {
                await supabase.from("banners").delete().eq("id", b.id);
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
