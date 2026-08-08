import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: AdminSettings,
});

const FIELDS = [
  ["store_name", "Nome da loja"],
  ["email", "E-mail de contato"],
  ["phone", "Telefone"],
  ["whatsapp", "WhatsApp"],
  ["cnpj", "CNPJ"],
  ["address", "Endereço"],
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["tiktok", "TikTok"],
  ["logo_url", "URL do logo"],
] as const;

const TEXTAREAS = [
  ["exchange_policy", "Política de trocas"],
  ["privacy_policy", "Política de privacidade"],
  ["terms", "Termos de uso"],
] as const;

function AdminSettings() {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [shipping, setShipping] = useState({ flat_shipping: "0", free_shipping_min: "0" });

  const { data } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    const next: Record<string, string> = {};
    for (const [key] of [...FIELDS, ...TEXTAREAS]) {
      next[key] = (data as Record<string, unknown>)[key] as string ?? "";
    }
    setValues(next);
    setShipping({
      flat_shipping: String(data.flat_shipping),
      free_shipping_min: String(data.free_shipping_min),
    });
  }, [data]);

  const save = async () => {
    const { error } = await supabase
      .from("settings")
      .update({
        ...values,
        flat_shipping: Number(shipping.flat_shipping) || 0,
        free_shipping_min: Number(shipping.free_shipping_min) || 0,
      })
      .eq("id", 1);
    if (error) {
      toast.error("Não foi possível salvar as configurações.");
      return;
    }
    toast.success("Configurações salvas!");
    void qc.invalidateQueries();
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Loja</p>
        <h1 className="text-3xl">Configurações</h1>
      </header>

      <div className="grid gap-4 border border-border/70 bg-card p-6 sm:grid-cols-2">
        {FIELDS.map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</Label>
            <Input
              className="h-11"
              value={values[key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            />
          </div>
        ))}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Frete fixo (R$)</Label>
          <Input
            className="h-11"
            type="number"
            value={shipping.flat_shipping}
            onChange={(e) => setShipping((s) => ({ ...s, flat_shipping: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Frete grátis acima de (R$)</Label>
          <Input
            className="h-11"
            type="number"
            value={shipping.free_shipping_min}
            onChange={(e) => setShipping((s) => ({ ...s, free_shipping_min: e.target.value }))}
          />
        </div>
        {TEXTAREAS.map(([key, label]) => (
          <div key={key} className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</Label>
            <Textarea
              rows={5}
              value={values[key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <Button variant="gold" onClick={() => void save()}>
            Salvar configurações
          </Button>
        </div>
      </div>
    </div>
  );
}
