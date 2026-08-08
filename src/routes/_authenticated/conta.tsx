import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Heart, LogOut, MapPin, Package, User as UserIcon } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { brl, formatDate, ORDER_STATUS } from "@/lib/format";
import type { Product } from "@/services/catalog";

export const Route = createFileRoute("/_authenticated/conta")({
  validateSearch: z.object({ aba: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Minha conta | DKIMPORTS" },
      { name: "description", content: "Gerencie seus dados, endereços, pedidos e favoritos na DKIMPORTS." },
      { property: "og:title", content: "Minha conta | DKIMPORTS" },
      { property: "og:description", content: "Pedidos, favoritos e dados pessoais DKIMPORTS." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

const STATUS_FLOW = [
  "pedido_realizado",
  "pagamento_aprovado",
  "preparando",
  "enviado",
  "em_transito",
  "entregue",
];

function AccountPage() {
  const { aba } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();
  const [profile, setProfile] = useState({ full_name: "", phone: "", cpf: "" });
  const [address, setAddress] = useState({
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
  });

  const { data: profileData } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ["addresses", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase.from("addresses").select("*");
      return data ?? [];
    },
  });

  const { data: favoriteProducts = [] } = useQuery({
    queryKey: ["favorite-products", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("product_id, products(*, product_images(*), categories(name, slug))");
      return (data ?? [])
        .map((f) => f.products as unknown as Product)
        .filter(Boolean);
    },
  });

  useEffect(() => {
    if (profileData) {
      setProfile({
        full_name: profileData.full_name ?? "",
        phone: profileData.phone ?? "",
        cpf: profileData.cpf ?? "",
      });
    }
  }, [profileData]);

  const saveProfile = async () => {
    if (profile.full_name.trim().length < 3) {
      toast.error("Informe seu nome completo.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name.trim(), phone: profile.phone, cpf: profile.cpf })
      .eq("id", user!.id);
    if (error) {
      toast.error("Não foi possível salvar.");
      return;
    }
    toast.success("Dados atualizados!");
    void qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const saveAddress = async () => {
    const schema = z.object({
      cep: z.string().min(8),
      street: z.string().min(3),
      number: z.string().min(1),
      district: z.string().min(2),
      city: z.string().min(2),
      state: z.string().length(2),
    });
    if (!schema.safeParse(address).success) {
      toast.error("Preencha o endereço corretamente (UF com 2 letras).");
      return;
    }
    const { error } = await supabase
      .from("addresses")
      .insert({ ...address, state: address.state.toUpperCase(), user_id: user!.id });
    if (error) {
      toast.error("Não foi possível salvar o endereço.");
      return;
    }
    toast.success("Endereço salvo!");
    setAddress({ cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" });
    void qc.invalidateQueries({ queryKey: ["addresses"] });
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <StoreLayout>
      <div className="container-dk py-12">
        <header className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="eyebrow">Minha conta</p>
            <h1 className="truncate text-3xl sm:text-4xl">
              Olá, {profile.full_name || user?.email}
            </h1>
          </div>
          <div className="flex shrink-0 gap-2">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outlineGold" size="sm">
                  Painel
                </Button>
              </Link>
            )}
            <Button variant="minimal" size="sm" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </header>

        <Tabs
          value={aba ?? "dados"}
          onValueChange={(v) => void navigate({ to: "/conta", search: { aba: v } })}
        >
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="dados">
              <UserIcon className="mr-2 h-4 w-4" /> Dados
            </TabsTrigger>
            <TabsTrigger value="pedidos">
              <Package className="mr-2 h-4 w-4" /> Pedidos
            </TabsTrigger>
            <TabsTrigger value="enderecos">
              <MapPin className="mr-2 h-4 w-4" /> Endereços
            </TabsTrigger>
            <TabsTrigger value="favoritos">
              <Heart className="mr-2 h-4 w-4" /> Favoritos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="pt-8">
            <div className="max-w-xl space-y-4 border border-border/70 bg-card p-6">
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input
                  className="h-11"
                  value={profile.full_name}
                  onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input className="h-11" value={user?.email ?? ""} disabled />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input
                    className="h-11"
                    value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>CPF</Label>
                  <Input
                    className="h-11"
                    value={profile.cpf}
                    onChange={(e) => setProfile((p) => ({ ...p, cpf: e.target.value }))}
                  />
                </div>
              </div>
              <Button variant="gold" onClick={() => void saveProfile()}>
                Salvar alterações
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="pedidos" className="space-y-4 pt-8">
            {orders.length === 0 && (
              <p className="text-muted-foreground">Você ainda não possui pedidos.</p>
            )}
            {orders.map((order) => (
              <article key={order.id} className="border border-border/70 bg-card p-6">
                <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-primary">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                  </div>
                  <span className="shrink-0 border border-primary/50 px-3 py-1 text-xs text-primary">
                    {ORDER_STATUS[order.status]}
                  </span>
                </header>
                <ul className="mb-4 space-y-2">
                  {(order.order_items ?? []).map((i) => (
                    <li key={i.id} className="flex items-center gap-3 text-sm">
                      {i.product_image && (
                        <img src={i.product_image} alt="" loading="lazy" className="h-14 w-11 object-cover" />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {i.quantity}x {i.product_name}
                      </span>
                      <span>{brl(Number(i.unit_price) * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                {order.status !== "cancelado" && (
                  <div className="mb-4 flex flex-wrap gap-1">
                    {STATUS_FLOW.map((s) => (
                      <span
                        key={s}
                        className={`h-1 flex-1 min-w-8 ${
                          STATUS_FLOW.indexOf(order.status) >= STATUS_FLOW.indexOf(s)
                            ? "bg-gradient-gold"
                            : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                )}
                <footer className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {order.payment_method} · {order.shipping_city}/{order.shipping_state}
                  </span>
                  <span className="font-semibold text-primary">{brl(order.total)}</span>
                </footer>
              </article>
            ))}
          </TabsContent>

          <TabsContent value="enderecos" className="pt-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                {addresses.length === 0 && (
                  <p className="text-muted-foreground">Nenhum endereço cadastrado.</p>
                )}
                {addresses.map((a) => (
                  <div key={a.id} className="border border-border/70 bg-card p-5 text-sm">
                    <p>
                      {a.street}, {a.number} {a.complement}
                    </p>
                    <p className="text-muted-foreground">
                      {a.district} · {a.city}/{a.state} · CEP {a.cep}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-destructive"
                      onClick={async () => {
                        await supabase.from("addresses").delete().eq("id", a.id);
                        void qc.invalidateQueries({ queryKey: ["addresses"] });
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
              <div className="space-y-3 border border-border/70 bg-card p-6">
                <h2 className="text-xl">Novo endereço</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["cep", "CEP"],
                      ["street", "Rua"],
                      ["number", "Número"],
                      ["complement", "Complemento"],
                      ["district", "Bairro"],
                      ["city", "Cidade"],
                      ["state", "UF"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {label}
                      </Label>
                      <Input
                        className="h-11"
                        value={address[key]}
                        onChange={(e) => setAddress((a) => ({ ...a, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <Button variant="gold" onClick={() => void saveAddress()}>
                  Salvar endereço
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="favoritos" className="pt-8">
            {favoriteProducts.length === 0 ? (
              <p className="text-muted-foreground">Você ainda não favoritou nenhuma peça.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {favoriteProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StoreLayout>
  );
}
