import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { CreditCard, Landmark, QrCode, Wallet } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { brl } from "@/lib/format";
import { fetchSettings } from "@/services/catalog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  validateSearch: z.object({ cupom: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Checkout seguro | DKIMPORTS" },
      { name: "description", content: "Finalize seu pedido DKIMPORTS com pagamento seguro e entrega para todo o Brasil." },
      { property: "og:title", content: "Checkout seguro | DKIMPORTS" },
      { property: "og:description", content: "Pagamento seguro e entrega rápida DKIMPORTS." },
    ],
  }),
  component: Checkout,
});

const customerSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo").max(120),
  cpf: z.string().trim().min(11, "CPF inválido").max(14),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().min(10, "Telefone inválido").max(20),
  cep: z.string().trim().min(8, "CEP inválido").max(9),
  street: z.string().trim().min(3, "Informe a rua").max(160),
  number: z.string().trim().min(1, "Informe o número").max(20),
  complement: z.string().trim().max(80).optional(),
  district: z.string().trim().min(2, "Informe o bairro").max(80),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
  state: z.string().trim().min(2, "UF").max(2),
});

const SHIPPING_OPTIONS = [
  { id: "padrao", label: "Entrega padrão", eta: "5 a 9 dias úteis", price: 24.9 },
  { id: "expressa", label: "Entrega expressa", eta: "2 a 4 dias úteis", price: 39.9 },
  { id: "retirada", label: "Retirada na loja", eta: "Disponível em 24h", price: 0 },
];

const PAYMENTS = [
  { id: "pix", label: "PIX", icon: QrCode, note: "Aprovação imediata" },
  { id: "credito", label: "Cartão de crédito", icon: CreditCard, note: "Até 10x sem juros" },
  { id: "debito", label: "Cartão de débito", icon: Landmark, note: "Débito online" },
  { id: "mercadopago", label: "Mercado Pago", icon: Wallet, note: "Carteira digital" },
  { id: "stripe", label: "Stripe", icon: CreditCard, note: "Pagamento internacional" },
];

function Checkout() {
  const { cupom } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { items, subtotal, clear } = useCart();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });

  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState("padrao");
  const [payment, setPayment] = useState("pix");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("profiles")
      .select("full_name, email, phone, cpf")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setForm((f) => ({
          ...f,
          name: f.name || (data.full_name ?? ""),
          email: f.email || (data.email ?? user.email ?? ""),
          phone: f.phone || (data.phone ?? ""),
          cpf: f.cpf || (data.cpf ?? ""),
        }));
      });
  }, [user]);

  useEffect(() => {
    if (!cupom) return;
    void supabase
      .from("coupons")
      .select("*")
      .eq("code", cupom)
      .eq("active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setDiscount(
          data.percent_off
            ? (subtotal * Number(data.percent_off)) / 100
            : Number(data.amount_off ?? 0),
        );
      });
  }, [cupom, subtotal]);

  const freeMin = Number(settings?.free_shipping_min ?? 299);
  const shippingOption = SHIPPING_OPTIONS.find((s) => s.id === shipping)!;
  const shippingCost = subtotal >= freeMin && shipping === "padrao" ? 0 : shippingOption.price;
  const total = Math.max(subtotal - discount, 0) + shippingCost;

  if (!loading && !user) {
    return (
      <StoreLayout>
        <div className="container-dk py-32 text-center">
          <h1 className="text-3xl">Entre para finalizar sua compra</h1>
          <p className="mt-2 text-muted-foreground">
            Precisamos da sua conta para registrar e acompanhar o pedido.
          </p>
          <Link to="/auth" search={{ redirect: "/checkout" }} className="mt-8 inline-block">
            <Button variant="gold" size="lg">
              Entrar / criar conta
            </Button>
          </Link>
        </div>
      </StoreLayout>
    );
  }

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="container-dk py-32 text-center">
          <h1 className="text-3xl">Sua sacola está vazia</h1>
          <Link to="/produtos" search={{}} className="mt-8 inline-block">
            <Button variant="gold">Ver produtos</Button>
          </Link>
        </div>
      </StoreLayout>
    );
  }

  const validateStep1 = () => {
    const result = customerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Revise os dados informados.");
      return false;
    }
    setErrors({});
    return true;
  };

  const submitOrder = async () => {
    if (!user || !validateStep1()) return;
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          customer_cpf: form.cpf,
          shipping_cep: form.cep,
          shipping_street: form.street,
          shipping_number: form.number,
          shipping_complement: form.complement,
          shipping_district: form.district,
          shipping_city: form.city,
          shipping_state: form.state.toUpperCase(),
          shipping_method: shippingOption.label,
          shipping_cost: shippingCost,
          subtotal,
          discount,
          total,
          coupon_code: cupom ?? null,
          payment_method: PAYMENTS.find((p) => p.id === payment)?.label ?? payment,
          payment_status: "pendente",
        })
        .select()
        .single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.productId,
          product_name: i.name,
          product_image: i.image,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
          unit_price: i.price,
        })),
      );
      if (itemsError) throw itemsError;

      clear();
      toast.success("Pedido criado com sucesso!");
      void navigate({ to: "/pedido/$orderId", params: { orderId: order.id } });
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível concluir o pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name: keyof typeof form, label: string, extra?: { placeholder?: string }) => (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</Label>
      <Input
        value={form[name]}
        placeholder={extra?.placeholder}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        className={cn("h-11", errors[name] && "border-destructive")}
      />
      {errors[name] && <p className="text-xs text-destructive">{errors[name]}</p>}
    </div>
  );

  return (
    <StoreLayout>
      <div className="container-dk py-10">
        <h1 className="mb-2 text-4xl">Checkout</h1>
        <div className="mb-10 flex flex-wrap gap-4 text-xs uppercase tracking-[0.2em]">
          {["Dados", "Entrega", "Pagamento"].map((label, i) => (
            <span key={label} className={step >= i + 1 ? "text-primary" : "text-muted-foreground"}>
              {i + 1}. {label}
            </span>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            {step === 1 && (
              <section className="space-y-6 border border-border/70 bg-card p-6">
                <h2 className="text-2xl">Dados do cliente</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {field("name", "Nome completo")}
                  {field("cpf", "CPF", { placeholder: "000.000.000-00" })}
                  {field("email", "E-mail")}
                  {field("phone", "Telefone", { placeholder: "(11) 99999-0000" })}
                </div>
                <h3 className="pt-2 text-xl">Endereço de entrega</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {field("cep", "CEP")}
                  {field("street", "Rua")}
                  {field("number", "Número")}
                  {field("complement", "Complemento")}
                  {field("district", "Bairro")}
                  {field("city", "Cidade")}
                  {field("state", "Estado (UF)")}
                </div>
                <Button
                  variant="gold"
                  size="lg"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                >
                  Continuar para entrega
                </Button>
              </section>
            )}

            {step === 2 && (
              <section className="space-y-6 border border-border/70 bg-card p-6">
                <h2 className="text-2xl">Entrega</h2>
                <RadioGroup value={shipping} onValueChange={setShipping} className="space-y-3">
                  {SHIPPING_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-4 border p-4 transition-colors",
                        shipping === opt.id ? "border-primary" : "border-border",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <RadioGroupItem value={opt.id} />
                        <span>
                          <span className="block text-sm">{opt.label}</span>
                          <span className="block text-xs text-muted-foreground">{opt.eta}</span>
                        </span>
                      </span>
                      <span className="text-sm text-primary">
                        {opt.id === "padrao" && subtotal >= freeMin
                          ? "Grátis"
                          : opt.price === 0
                            ? "Grátis"
                            : brl(opt.price)}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
                <div className="flex gap-3">
                  <Button variant="minimal" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button variant="gold" onClick={() => setStep(3)}>
                    Continuar para pagamento
                  </Button>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="space-y-6 border border-border/70 bg-card p-6">
                <h2 className="text-2xl">Pagamento</h2>
                <RadioGroup value={payment} onValueChange={setPayment} className="grid gap-3 sm:grid-cols-2">
                  {PAYMENTS.map((opt) => (
                    <label
                      key={opt.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 border p-4 transition-colors",
                        payment === opt.id ? "border-primary" : "border-border",
                      )}
                    >
                      <RadioGroupItem value={opt.id} />
                      <opt.icon className="h-5 w-5 text-primary" />
                      <span>
                        <span className="block text-sm">{opt.label}</span>
                        <span className="block text-xs text-muted-foreground">{opt.note}</span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
                <p className="border border-border bg-background p-4 text-xs leading-relaxed text-muted-foreground">
                  A estrutura de pagamento está pronta para integração com um provedor real (PIX,
                  cartões, Mercado Pago ou Stripe). O pedido é registrado com status de pagamento
                  <strong className="text-foreground"> pendente</strong> até a confirmação pelo
                  provedor.
                </p>
                <div className="flex gap-3">
                  <Button variant="minimal" onClick={() => setStep(2)}>
                    Voltar
                  </Button>
                  <Button variant="gold" size="lg" disabled={submitting} onClick={() => void submitOrder()}>
                    {submitting ? "Processando..." : "Concluir pedido"}
                  </Button>
                </div>
              </section>
            )}
          </div>

          <aside className="h-fit space-y-4 border border-border/70 bg-card p-6 lg:sticky lg:top-28">
            <h2 className="text-2xl">Seu pedido</h2>
            <ul className="space-y-3 border-b border-border pb-4">
              {items.map((i) => (
                <li key={`${i.productId}${i.size}${i.color}`} className="flex gap-3">
                  <img src={i.image} alt="" loading="lazy" className="h-16 w-12 object-cover" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="line-clamp-2">{i.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.quantity}x {[i.size, i.color].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className="text-sm">{brl(i.price * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 text-sm">
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
                <dd>{shippingCost === 0 ? "Grátis" : brl(shippingCost)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold">
                <dt>Total</dt>
                <dd className="text-primary">{brl(total)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </StoreLayout>
  );
}
