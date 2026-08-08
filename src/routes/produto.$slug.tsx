import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Heart, Minus, Plus, ShieldCheck, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { fetchProductBySlug, fetchProducts, productImage } from "@/services/catalog";
import { brl, discountPercent, effectivePrice, PLACEHOLDER_IMAGE } from "@/lib/format";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produto/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} | DKIMPORTS` },
      {
        name: "description",
        content: "Detalhes, tamanhos, cores e disponibilidade desta peça premium da DKIMPORTS.",
      },
      { property: "og:type", content: "product" },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} | DKIMPORTS` },
      {
        property: "og:description",
        content: "Peça premium DKIMPORTS. Estilo, qualidade e atitude.",
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
  });
  const { data: related = [] } = useQuery({
    queryKey: ["products", "related", product?.categories?.slug],
    enabled: Boolean(product),
    queryFn: () => fetchProducts({ categorySlug: product?.categories?.slug, limit: 8 }),
  });

  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container-dk grid gap-10 py-14 lg:grid-cols-2">
          <div className="aspect-[3/4] animate-pulse bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse bg-muted" />
            <div className="h-6 w-1/3 animate-pulse bg-muted" />
            <div className="h-32 animate-pulse bg-muted" />
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="container-dk py-32 text-center">
          <h1 className="text-3xl">Produto não encontrado</h1>
          <Link to="/produtos" search={{}} className="mt-6 inline-block">
            <Button variant="gold">Voltar ao catálogo</Button>
          </Link>
        </div>
      </StoreLayout>
    );
  }

  const images = (product.product_images ?? []).map((i) => i.url);
  const gallery = images.length ? images : [PLACEHOLDER_IMAGE];
  const price = effectivePrice(Number(product.price), product.sale_price);
  const off = discountPercent(Number(product.price), product.sale_price);
  const soldOut = product.stock <= 0;

  const addToCart = () => {
    if ((product.sizes?.length ?? 0) > 0 && !size) {
      toast.error("Selecione um tamanho.");
      return false;
    }
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: productImage(product) ?? PLACEHOLDER_IMAGE,
      price,
      size: size ?? product.sizes?.[0] ?? null,
      color: color ?? product.colors?.[0] ?? null,
      quantity: qty,
    });
    return true;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand ?? "DKIMPORTS" },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price,
      availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  const handleSelectColor = (selectedColor: string, colorIdx: number) => {
    setColor(selectedColor);
    if (!product?.product_images?.length) return;

    const searchStr = selectedColor.toLowerCase().trim();
    const foundIndex = product.product_images.findIndex(
      (img) =>
        (img.alt && img.alt.toLowerCase().includes(searchStr)) ||
        (img.url && img.url.toLowerCase().includes(searchStr))
    );

    if (foundIndex >= 0) {
      setActiveImage(foundIndex);
    } else if (colorIdx < gallery.length) {
      setActiveImage(colorIdx);
    }
  };

  return (
    <StoreLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container-dk py-10">
        <nav className="mb-8 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            Início
          </Link>{" "}
          /{" "}
          <Link to="/produtos" search={{}} className="hover:text-primary">
            Produtos
          </Link>{" "}
          / <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="group relative aspect-[3/4] overflow-hidden border border-border/70 bg-graphite">
              <img
                src={gallery[activeImage]}
                alt={product.name}
                className="h-full w-full object-cover transition-all duration-300"
              />
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImage((prev) => (prev - 1 + gallery.length) % gallery.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur transition-all opacity-80 group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground hover:scale-110"
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImage((prev) => (prev + 1) % gallery.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur transition-all opacity-80 group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground hover:scale-110"
                    aria-label="Próxima imagem"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <span className="absolute bottom-3 right-3 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur border border-border/50">
                    {activeImage + 1} / {gallery.length}
                  </span>
                </>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {gallery.map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "h-20 w-16 shrink-0 overflow-hidden border transition-all",
                      i === activeImage ? "border-primary ring-1 ring-primary" : "border-border opacity-70 hover:opacity-100",
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <p className="eyebrow">{product.categories?.name ?? "DKIMPORTS"}</p>
              <h1 className="text-3xl sm:text-4xl">{product.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-primary text-primary" />
                {Number(product.rating).toFixed(1)} · {product.reviews_count} avaliações
              </div>
            </div>

            <div className="space-y-1">
              {off > 0 && (
                <p className="text-sm text-muted-foreground line-through">{brl(product.price)}</p>
              )}
              <div className="flex items-end gap-3">
                <p className="text-4xl font-semibold text-primary">{brl(price)}</p>
                {off > 0 && (
                  <span className="mb-2 bg-gradient-gold px-2 py-1 text-[0.7rem] font-bold text-primary-foreground">
                    -{off}%
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                em até 10x de {brl(price / 10)} sem juros
              </p>
              <p className={cn("text-sm", soldOut ? "text-destructive" : "text-primary")}>
                {soldOut ? "Esgotado" : `Disponível · ${product.stock} em estoque`}
              </p>
            </div>

            {(product.sizes?.length ?? 0) > 0 && (
              <div>
                <p className="eyebrow mb-2">Tamanho</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={cn(
                        "min-w-12 border px-4 py-3 text-sm transition-colors",
                        size === s
                          ? "border-primary text-primary"
                          : "border-border text-muted-foreground hover:border-primary/60",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(product.colors?.length ?? 0) > 0 && (
              <div>
                <p className="eyebrow mb-2">Cor</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c, idx) => (
                    <button
                      key={c}
                      onClick={() => handleSelectColor(c, idx)}
                      className={cn(
                        "border px-4 py-3 text-sm transition-colors",
                        color === c
                          ? "border-primary text-primary"
                          : "border-border text-muted-foreground hover:border-primary/60",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border">
                <button
                  className="grid h-12 w-12 place-items-center text-muted-foreground hover:text-primary"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center">{qty}</span>
                <button
                  className="grid h-12 w-12 place-items-center text-muted-foreground hover:text-primary"
                  onClick={() => setQty((q) => q + 1)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => void toggle(product.id)}
                className="grid h-12 w-12 place-items-center border border-border transition-colors hover:border-primary"
                aria-label="Favoritar"
              >
                <Heart
                  className={cn(
                    "h-5 w-5",
                    isFavorite(product.id) ? "fill-primary text-primary" : "text-muted-foreground",
                  )}
                />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="gold"
                size="lg"
                disabled={soldOut}
                onClick={() => {
                  if (addToCart()) void navigate({ to: "/checkout" });
                }}
              >
                Comprar agora
              </Button>
              <Button
                variant="outlineGold"
                size="lg"
                disabled={soldOut}
                onClick={() => {
                  if (addToCart()) toast.success("Adicionado à sacola");
                }}
              >
                Adicionar à sacola
              </Button>
            </div>

            <div className="grid gap-3 border-y border-border/70 py-4 text-sm text-muted-foreground sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" /> Envio em até 24h úteis
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Compra 100% segura
              </p>
            </div>

            <Accordion type="single" collapsible defaultValue="desc">
              <AccordionItem value="desc">
                <AccordionTrigger>Descrição</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {product.description}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="info">
                <AccordionTrigger>Informações do produto</AccordionTrigger>
                <AccordionContent className="space-y-2 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Material:</strong>{" "}
                    {product.material ?? "Consulte a etiqueta"}
                  </p>
                  <p>
                    <strong className="text-foreground">Tamanhos:</strong>{" "}
                    {product.sizes?.join(", ") || "Único"}
                  </p>
                  <p>
                    <strong className="text-foreground">Cuidados:</strong>{" "}
                    {product.care ?? "Lavagem delicada."}
                  </p>
                  <p>
                    <strong className="text-foreground">Prazo de envio:</strong> 24h úteis após a
                    confirmação do pagamento.
                  </p>
                  <p>
                    <strong className="text-foreground">Política de troca:</strong> 30 dias para
                    troca ou devolução.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {related.filter((r) => r.id !== product.id).length > 0 && (
          <section className="py-20">
            <h2 className="mb-8 text-3xl">Você também pode gostar</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {related
                .filter((r) => r.id !== product.id)
                .slice(0, 4)
                .map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
            </div>
          </section>
        )}
      </div>
    </StoreLayout>
  );
}
