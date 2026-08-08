import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/estoque")({
  component: AdminStock,
});

function AdminStock() {
  const qc = useQueryClient();
  const [edits, setEdits] = useState<Record<string, string>>({});

  const { data: products = [] } = useQuery({
    queryKey: ["admin-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, stock, min_stock, sales_count")
        .order("stock");
      if (error) throw error;
      return data;
    },
  });

  const save = async (id: string) => {
    const value = Number(edits[id]);
    if (Number.isNaN(value) || value < 0) {
      toast.error("Quantidade inválida.");
      return;
    }
    const { error } = await supabase.from("products").update({ stock: value }).eq("id", id);
    if (error) {
      toast.error("Não foi possível atualizar.");
      return;
    }
    toast.success("Estoque atualizado.");
    setEdits((e) => ({ ...e, [id]: "" }));
    void qc.invalidateQueries();
  };

  const alerts = products.filter((p) => p.stock <= p.min_stock);

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Operação</p>
        <h1 className="text-3xl">Controle de estoque</h1>
      </header>

      {alerts.length > 0 && (
        <div className="flex items-start gap-3 border border-destructive/50 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p>
            {alerts.length} produto(s) com estoque igual ou abaixo do mínimo:{" "}
            {alerts.slice(0, 6).map((p) => p.name).join(", ")}
            {alerts.length > 6 && "…"}
          </p>
        </div>
      )}

      <div className="overflow-x-auto border border-border/70 bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border/70 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="p-3">Produto</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Estoque</th>
              <th className="p-3">Mínimo</th>
              <th className="p-3">Vendas</th>
              <th className="p-3">Ajustar</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="p-3">{p.name}</td>
                <td className="p-3 text-muted-foreground">{p.sku ?? "—"}</td>
                <td className={p.stock <= p.min_stock ? "p-3 font-semibold text-destructive" : "p-3"}>
                  {p.stock}
                </td>
                <td className="p-3 text-muted-foreground">{p.min_stock}</td>
                <td className="p-3 text-muted-foreground">{p.sales_count}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      className="h-9 w-24"
                      placeholder={String(p.stock)}
                      value={edits[p.id] ?? ""}
                      onChange={(e) => setEdits((s) => ({ ...s, [p.id]: e.target.value }))}
                    />
                    <Button size="sm" variant="outlineGold" onClick={() => void save(p.id)}>
                      Salvar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
