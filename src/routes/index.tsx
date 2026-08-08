import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Headphones, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard, ProductCardSkeleton } from "@/components/store/ProductCard";
import { fetchBanner, fetchCategories, fetchProducts } from "@/services/catalog";
import heroImage from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DKIMPORTS | Estilo que te destaca" },
      {
        name: "description",
        content:
          "Nova coleção DKIMPORTS: camisetas, moletons, calças, bermudas e acessórios premium. Estilo, qualidade e atitude com envio rápido.",
      },
      { property: "og:title", content: "DKIMPORTS | Estilo que te destaca" },
      {
        property: "og:description",
        content: "Moda premium com identidade. Nova coleção DKIMPORTS disponível.",
      },
    ],
  }),
  component: Home,
});

const BENEFITS = [
  { icon: BadgeCheck, title: "Produtos selecionados", text: "Curadoria peça a peça." },
  { icon: ShieldCheck, title: "Compra segura", text: "Ambiente protegido do início ao fim." },
  { icon: Truck, title: "Envio rápido", text: "Despacho em até 24h úteis." },
  { icon: Headphones, title: "Atendimento", text: "Suporte humano, todos os dias." },
];

function Home() {
  const { data: banner } = useQuery({ queryKey: ["banner"], queryFn: fetchBanner });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: featured = [], isLoading } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => fetchProducts({ featured: true, limit: 8 }),
  });
  const { data: sale = [] } = useQuery({
    queryKey: ["products", "sale"],
    queryFn: () => fetchProducts({ onSale: true, limit: 4 }),
  });

  return (
    <StoreLayout>
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img
          src={banner?.image_url ?? heroImage}
          alt="Nova coleção DKIMPORTS"
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
        <div className="container-dk relative flex min-h-[78vh] flex-col justify-center py-24">
          <div className="max-w-xl animate-fade-up space-y-6">
            <p className="eyebrow">{banner?.eyebrow ?? "NOVA COLEÇÃO"}</p>
            <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              {banner?.title ?? "ESTILO QUE TE DESTACA"}
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              {banner?.subtitle ?? "Peças selecionadas para quem não passa despercebido."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/produtos" search={{}}>
                <Button variant="gold" size="xl">
                  {banner?.button_label ?? "COMPRAR AGORA"}
                </Button>
              </Link>
              <Link to="/produtos" search={{ promocao: true }}>
                <Button variant="outlineGold" size="xl">
                  Ver ofertas
                </Button>
              </Link>
            </div>
            <p className="pt-4 text-xs tracking-[0.4em] text-muted-foreground">
              ESTILO • QUALIDADE • ATITUDE
            </p>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="container-dk py-20">
        <header className="mb-10 flex flex-col gap-2">
          <p className="eyebrow">Navegue</p>
          <h2 className="text-3xl sm:text-4xl">Categorias</h2>
        </header>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/produtos"
              search={{ categoria: c.slug }}
              className="group relative flex aspect-square flex-col items-center justify-center gap-2 border border-border/70 bg-card p-3 text-center transition-all duration-500 hover:border-primary hover:shadow-lux"
            >
              <span className="font-display text-lg transition-colors group-hover:text-primary">
                {c.name}
              </span>
              <span className="h-px w-8 bg-gradient-gold opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="container-dk pb-20">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Seleção DK</p>
            <h2 className="text-3xl sm:text-4xl">Produtos em destaque</h2>
          </div>
          <Link to="/produtos" search={{}}>
            <Button variant="minimal">Ver tudo</Button>
          </Link>
        </header>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* OFERTAS */}
      {sale.length > 0 && (
        <section className="border-y border-border/70 bg-graphite py-20">
          <div className="container-dk">
            <header className="mb-10">
              <p className="eyebrow">Tempo limitado</p>
              <h2 className="text-3xl sm:text-4xl">Ofertas DKIMPORTS</h2>
            </header>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {sale.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BENEFÍCIOS */}
      <section className="container-dk py-20">
        <header className="mb-10 text-center">
          <p className="eyebrow">Diferenciais</p>
          <h2 className="text-3xl sm:text-4xl">Por que comprar na DKIMPORTS?</h2>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="border border-border/70 bg-card p-8 text-center transition-colors hover:border-primary/60"
            >
              <b.icon className="mx-auto mb-4 h-7 w-7 text-primary" />
              <h3 className="text-lg">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </section>
    </StoreLayout>
  );
}
