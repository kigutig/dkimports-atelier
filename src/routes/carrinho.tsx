import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cartKey, useCart } from "@/hooks/useCart";
import { brl } from "@/lib/format";
import { fetchSettings } from "@/services/catalog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Sacola de compras | DKIMPORTS" },
      { name: "description", content: "Revise os itens da sua sacola e finalize sua compra na DKIMPORTS." },
      { property: "og:title", content: "Sacola de compras | DKIMPORTS" },
      { property: "og:description", content: "Finalize sua compra com segurança na DKIMPORTS." },
    ],
  }),
  component: CartPage,
});

export function useCoupon(subtotal: number) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);

  const apply = async () => {
    const value = code.trim().toUpperCase();
    if (!value) return;
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", value)
      .eq("active", true)
      .maybeSingle();
    if (!data) {
      toast.error("Cupom inválido ou expirado.");
      return;
    }
    if (data.ends_at && new Date(data.ends_at) < new Date()) {
      toast.error("Cupom expirado.");
      return;
    }
    if (subtotal < Number(data.min_order)) {
      toast.error(`Pedido mínimo de ${brl(data.min_order)} para este cupom.`);
      return;
    }
    const discount = data.percent_off
      ? (subtotal * Number(data.percent_off)) / 100
      : Number(data.amount_off ?? 0);
    setApplied({ code: value, discount });
    toast.success(`Cupom aplicado: -${brl(discount)}`);
  };

  return { code, setCode, applied, apply, clear: () => setApplied(null) };
}

function CartPage() {
  const { items, remove, setQuantity, subtotal } = useCart();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const coupon = useCoupon(subtotal);

  const freeMin = Number(settings?.free_shipping_min ?? 299);
  const shipping = subtotal === 0 || subtotal >= freeMin ? 0 : Number(settings?.flat_shipping ?? 24.9);
  const discount = coupon.applied?.discount ?? 0;
  const total = Math.max(subtotal - discount, 0) + shipping;

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="container-dk flex flex-col items-center py-32 text-center">
          <ShoppingBag className="mb-6 h-12 w-12 text-primary" />
          <h1 className="text-3xl">Sua sacola está vazia</h1>
          <p className="mt-2 text-muted-foreground">Explore a nova coleção DKIMPORTS.</p>
          <Link to="/produtos" search={{}} className="mt-8">
            <Button variant="gold" size="lg">
              Ver produtos
            </Button>
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container-dk py-10">
        <h1 className="mb-8 text-4xl">Sacola</h1>
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => {
              const key = cartKey(item);
              return (
                <div
                  key={key}
                  className="grid grid-cols-[88px_1fr] gap-4 border border-border/70 bg-card p-4 sm:grid-cols-[110px_1fr_auto]"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover"
                  />
                  <div className="min-w-0 space-y-1">
                    <Link
                      to="/produto/$slug"
                      params={{ slug: item.slug }}
                      className="line-clamp-2 text-sm font-medium hover:text-primary"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {[item.size, item.color].filter(Boolean).join(" · ") || "Padrão"}
                    </p>
                    <p className="text-sm text-primary">{brl(item.price)}</p>
                    <div className="flex items-center gap-3 pt-2">
                      <div className="flex items-center border border-border">
                        <button
                          className="grid h-9 w-9 place-items-center text-muted-foreground hover:text-primary"
                          onClick={() => setQuantity(key, item.quantity - 1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          className="grid h-9 w-9 place-items-center text-muted-foreground hover:text-primary"
                          onClick={() => setQuantity(key, item.quantity + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(key)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="col-span-2 text-right text-sm font-semibold sm:col-span-1 sm:self-center">
                    {brl(item.price * item.quantity)}
                  </p>
                </div>
              );
            })}
          </div>

          <aside className="h-fit space-y-4 border border-border/70 bg-card p-6 lg:sticky lg:top-28">
            <h2 className="text-2xl">Resumo</h2>
            <div className="flex gap-2">
              <Input
                value={coupon.code}
                onChange={(e) => coupon.setCode(e.target.value)}
                placeholder="Cupom de desconto"
                className="h-11"
              />
              <Button variant="minimal" className="h-11" onClick={() => void coupon.apply()}>
                Aplicar
              </Button>
            </div>
            <dl className="space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{brl(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Desconto</dt>
                <dd className="text-primary">-{brl(discount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Frete</dt>
                <dd>{shipping === 0 ? "Grátis" : brl(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold">
                <dt>Total</dt>
                <dd className="text-primary">{brl(total)}</dd>
              </div>
            </dl>
            {subtotal < freeMin && (
              <p className="text-xs text-muted-foreground">
                Faltam {brl(freeMin - subtotal)} para frete grátis.
              </p>
            )}
            <Link
              to="/checkout"
              search={coupon.applied ? { cupom: coupon.applied.code } : {}}
              className="block"
            >
              <Button variant="gold" size="lg" className="w-full">
                Finalizar compra
              </Button>
            </Link>
          </aside>
        </div>
      </div>
    </StoreLayout>
  );
}
