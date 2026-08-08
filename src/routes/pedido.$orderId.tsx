import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { brl, formatDate, ORDER_STATUS } from "@/lib/format";

export const Route = createFileRoute("/pedido/$orderId")({
  head: () => ({
    meta: [
      { title: "Confirmação do pedido | DKIMPORTS" },
      { name: "description", content: "Acompanhe os detalhes e o status do seu pedido DKIMPORTS." },
      { property: "og:title", content: "Confirmação do pedido | DKIMPORTS" },
      { property: "og:description", content: "Detalhes e status do seu pedido DKIMPORTS." },
    ],
  }),
  component: OrderConfirmation,
});

function OrderConfirmation() {
  const { orderId } = Route.useParams();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container-dk py-32 text-center text-muted-foreground">Carregando...</div>
      </StoreLayout>
    );
  }

  if (!order) {
    return (
      <StoreLayout>
        <div className="container-dk py-32 text-center">
          <h1 className="text-3xl">Pedido não encontrado</h1>
          <Link to="/" className="mt-8 inline-block">
            <Button variant="gold">Voltar à loja</Button>
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container-dk max-w-3xl py-16">
        <div className="mb-10 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-4xl">Pedido confirmado</h1>
          <p className="mt-2 text-muted-foreground">
            Número do pedido{" "}
            <strong className="text-primary">{order.order_number}</strong> · {formatDate(order.created_at)}
          </p>
        </div>

        <div className="space-y-6">
          <section className="border border-border/70 bg-card p-6">
            <h2 className="mb-4 text-2xl">Produtos</h2>
            <ul className="space-y-3">
              {(order.order_items ?? []).map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  {item.product_image && (
                    <img src={item.product_image} alt="" loading="lazy" className="h-16 w-12 object-cover" />
                  )}
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="line-clamp-2">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity}x {[item.size, item.color].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className="text-sm">{brl(Number(item.unit_price) * item.quantity)}</p>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <section className="border border-border/70 bg-card p-6 text-sm">
              <h2 className="mb-3 text-xl">Entrega</h2>
              <p className="text-muted-foreground">
                {order.shipping_street}, {order.shipping_number}
                {order.shipping_complement ? ` - ${order.shipping_complement}` : ""}
                <br />
                {order.shipping_district} · {order.shipping_city}/{order.shipping_state}
                <br />
                CEP {order.shipping_cep}
                <br />
                {order.shipping_method}
              </p>
            </section>
            <section className="border border-border/70 bg-card p-6 text-sm">
              <h2 className="mb-3 text-xl">Pagamento</h2>
              <p className="text-muted-foreground">
                {order.payment_method} · {order.payment_status}
              </p>
              <dl className="mt-4 space-y-1">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{brl(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Frete</dt>
                  <dd>{brl(order.shipping_cost)}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>Total</dt>
                  <dd className="text-primary">{brl(order.total)}</dd>
                </div>
              </dl>
            </section>
          </div>

          <section className="border border-border/70 bg-card p-6">
            <h2 className="mb-3 text-xl">Status</h2>
            <p className="text-primary">{ORDER_STATUS[order.status] ?? order.status}</p>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link to="/conta" search={{ aba: "pedidos" }}>
              <Button variant="gold">Ver meus pedidos</Button>
            </Link>
            <Link to="/produtos" search={{}}>
              <Button variant="minimal">Continuar comprando</Button>
            </Link>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
