import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { brl, formatDate, ORDER_STATUS } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  component: AdminOrders,
});

const STATUSES = Object.keys(ORDER_STATUS) as OrderStatus[];

function AdminOrders() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("todos");

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          (status === "todos" || o.status === status) &&
          `${o.order_number} ${o.customer_name} ${o.customer_email}`
            .toLowerCase()
            .includes(query.toLowerCase().trim()),
      ),
    [orders, query, status],
  );

  const updateStatus = async (id: string, value: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status: value }).eq("id", id);
    if (error) {
      toast.error("Não foi possível atualizar o status.");
      return;
    }
    toast.success("Status atualizado.");
    void qc.invalidateQueries();
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Vendas</p>
        <h1 className="text-3xl">Pedidos</h1>
      </header>

      <div className="flex flex-wrap gap-3">
        <Input
          className="h-11 max-w-xs"
          placeholder="Buscar por nº, cliente ou e-mail"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="h-11 border border-input bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="todos">Todos os status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((o) => (
          <article key={o.id} className="border border-border/70 bg-card p-5">
            <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-primary">{o.order_number}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {o.customer_name} · {o.customer_email} · {formatDate(o.created_at)}
                </p>
              </div>
              <select
                className="h-9 shrink-0 border border-input bg-background px-2 text-xs"
                value={o.status}
                onChange={(e) => void updateStatus(o.id, e.target.value as OrderStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS[s]}
                  </option>
                ))}
              </select>
            </header>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              {(o.order_items ?? []).map((i) => (
                <li key={i.id}>
                  {i.quantity}x {i.product_name}
                  {i.size ? ` · ${i.size}` : ""}
                  {i.color ? ` · ${i.color}` : ""} — {brl(Number(i.unit_price) * i.quantity)}
                </li>
              ))}
            </ul>
            <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-sm">
              <span className="text-muted-foreground">
                {o.shipping_street}, {o.shipping_number} · {o.shipping_city}/{o.shipping_state} · CEP{" "}
                {o.shipping_cep}
              </span>
              <span className="font-semibold text-primary">{brl(o.total)}</span>
            </footer>
          </article>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground">Nenhum pedido encontrado.</p>}
      </div>
    </div>
  );
}
