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
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/cupons")({
  component: AdminCoupons,
});

function AdminCoupons() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ code: "", percent_off: "", amount_off: "", min_order: "0", usage_limit: "" });

  const { data: coupons = [] } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = async () => {
    if (form.code.trim().length < 3 || (!form.percent_off && !form.amount_off)) {
      toast.error("Informe o código e um tipo de desconto.");
      return;
    }
    const { error } = await supabase.from("coupons").insert({
      code: form.code.trim().toUpperCase(),
      percent_off: form.percent_off ? Number(form.percent_off) : null,
      amount_off: form.amount_off ? Number(form.amount_off) : null,
      min_order: Number(form.min_order) || 0,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
    });
    if (error) {
      toast.error("Não foi possível criar o cupom.");
      return;
    }
    toast.success("Cupom criado!");
    setForm({ code: "", percent_off: "", amount_off: "", min_order: "0", usage_limit: "" });
    void qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Marketing</p>
        <h1 className="text-3xl">Cupons de desconto</h1>
      </header>

      <div className="grid gap-4 border border-border/70 bg-card p-6 sm:grid-cols-5">
        {(
          [
            ["code", "Código"],
            ["percent_off", "% desconto"],
            ["amount_off", "R$ desconto"],
            ["min_order", "Pedido mínimo"],
            ["usage_limit", "Limite de usos"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</Label>
            <Input
              className="h-11"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}
        <div className="sm:col-span-5">
          <Button variant="gold" onClick={() => void create()}>
            Criar cupom
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border border-border/70 bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border/70 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Desconto</th>
              <th className="p-3">Mínimo</th>
              <th className="p-3">Usos</th>
              <th className="p-3">Ativo</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-border/50">
                <td className="p-3 font-semibold text-primary">{c.code}</td>
                <td className="p-3">{c.percent_off ? `${c.percent_off}%` : brl(c.amount_off ?? 0)}</td>
                <td className="p-3 text-muted-foreground">{brl(c.min_order)}</td>
                <td className="p-3 text-muted-foreground">
                  {c.used_count}
                  {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                </td>
                <td className="p-3">
                  <Switch
                    checked={c.active}
                    onCheckedChange={async (v) => {
                      await supabase.from("coupons").update({ active: v }).eq("id", c.id);
                      void qc.invalidateQueries({ queryKey: ["admin-coupons"] });
                    }}
                  />
                </td>
                <td className="p-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    aria-label="Excluir cupom"
                    onClick={async () => {
                      await supabase.from("coupons").delete().eq("id", c.id);
                      void qc.invalidateQueries({ queryKey: ["admin-coupons"] });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
