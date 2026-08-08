import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { z } from "zod";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard, ProductCardSkeleton } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { fetchCategories, fetchProducts, type Product } from "@/services/catalog";
import { brl, effectivePrice } from "@/lib/format";

const searchSchema = z.object({
  q: z.string().optional(),
  categoria: z.string().optional(),
  promocao: z.boolean().optional(),
});

export const Route = createFileRoute("/produtos")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Catálogo DKIMPORTS | Roupas e acessórios premium" },
      {
        name: "description",
        content:
          "Explore o catálogo completo DKIMPORTS: filtre por categoria, tamanho, cor, marca, preço e disponibilidade.",
      },
      { property: "og:title", content: "Catálogo DKIMPORTS" },
      {
        property: "og:description",
        content: "Camisetas, moletons, calças, bermudas e acessórios premium DKIMPORTS.",
      },
    ],
  }),
  component: Catalog,
});

type CatalogSearch = z.infer<typeof searchSchema>;

type SortKey = "recentes" | "vendidos" | "menor" | "maior" | "avaliacao";

function Catalog() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => fetchProducts({}),
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<SortKey>("recentes");

  const allSizes = useMemo(
    () => [...new Set(products.flatMap((p) => p.sizes ?? []))].sort(),
    [products],
  );
  const allColors = useMemo(
    () => [...new Set(products.flatMap((p) => p.colors ?? []))].sort(),
    [products],
  );
  const allBrands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean) as string[])],
    [products],
  );

  const toggleIn = (list: string[], setter: (v: string[]) => void, value: string) =>
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const filtered = useMemo(() => {
    let list: Product[] = [...products];
    if (search.q) {
      const term = search.q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.description ?? "").toLowerCase().includes(term) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(term)),
      );
    }
    if (search.categoria) list = list.filter((p) => p.categories?.slug === search.categoria);
    if (search.promocao) list = list.filter((p) => p.on_sale);
    if (sizes.length) list = list.filter((p) => (p.sizes ?? []).some((s) => sizes.includes(s)));
    if (colors.length) list = list.filter((p) => (p.colors ?? []).some((c) => colors.includes(c)));
    if (brands.length) list = list.filter((p) => brands.includes(p.brand ?? ""));
    if (inStock) list = list.filter((p) => p.stock > 0);
    list = list.filter((p) => effectivePrice(Number(p.price), p.sale_price) <= maxPrice);

    switch (sort) {
      case "menor":
        return list.sort(
          (a, b) =>
            effectivePrice(Number(a.price), a.sale_price) -
            effectivePrice(Number(b.price), b.sale_price),
        );
      case "maior":
        return list.sort(
          (a, b) =>
            effectivePrice(Number(b.price), b.sale_price) -
            effectivePrice(Number(a.price), a.sale_price),
        );
      case "vendidos":
        return list.sort((a, b) => b.sales_count - a.sales_count);
      case "avaliacao":
        return list.sort((a, b) => Number(b.rating) - Number(a.rating));
      default:
        return list;
    }
  }, [products, search, sizes, colors, brands, inStock, maxPrice, sort]);

  const Filters = (
    <div className="space-y-8">
      <div>
        <h3 className="eyebrow mb-3">Categoria</h3>
        <div className="space-y-2">
          <button
            onClick={() => void navigate({ search: (s: CatalogSearch) => ({ ...s, categoria: undefined }) })}
            className={`block text-sm ${!search.categoria ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => void navigate({ search: (s: CatalogSearch) => ({ ...s, categoria: c.slug }) })}
              className={`block text-sm ${search.categoria === c.slug ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="eyebrow mb-3">Tamanho</h3>
        <div className="flex flex-wrap gap-2">
          {allSizes.map((s) => (
            <button
              key={s}
              onClick={() => toggleIn(sizes, setSizes, s)}
              className={`min-w-11 border px-3 py-2 text-xs transition-colors ${
                sizes.includes(s)
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:border-primary/60"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="eyebrow mb-3">Cor</h3>
        <div className="flex flex-wrap gap-2">
          {allColors.map((c) => (
            <button
              key={c}
              onClick={() => toggleIn(colors, setColors, c)}
              className={`border px-3 py-2 text-xs transition-colors ${
                colors.includes(c)
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:border-primary/60"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="eyebrow mb-3">Preço até {brl(maxPrice)}</h3>
        <Slider
          value={[maxPrice]}
          min={50}
          max={1000}
          step={10}
          onValueChange={(v) => setMaxPrice(v[0] ?? 1000)}
        />
      </div>

      <div>
        <h3 className="eyebrow mb-3">Marca</h3>
        <div className="space-y-2">
          {allBrands.map((b) => (
            <label key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={brands.includes(b)}
                onCheckedChange={() => toggleIn(brands, setBrands, b)}
              />
              {b}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="eyebrow mb-3">Outros</h3>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={inStock} onCheckedChange={(v) => setInStock(Boolean(v))} />
          Somente disponíveis
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={Boolean(search.promocao)}
            onCheckedChange={(v) =>
              void navigate({ search: (s: CatalogSearch) => ({ ...s, promocao: v ? true : undefined }) })
            }
          />
          Somente em promoção
        </label>
      </div>
    </div>
  );

  return (
    <StoreLayout>
      <div className="container-dk py-10">
        <header className="mb-8 space-y-2">
          <p className="eyebrow">Catálogo</p>
          <h1 className="text-4xl">
            {search.categoria
              ? (categories.find((c) => c.slug === search.categoria)?.name ?? "Produtos")
              : search.promocao
                ? "Ofertas"
                : "Todos os produtos"}
          </h1>
        </header>

        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <Input
            defaultValue={search.q ?? ""}
            placeholder="Buscar na loja..."
            className="h-11"
            onChange={(e) =>
              void navigate({ search: (s: CatalogSearch) => ({ ...s, q: e.target.value || undefined }) })
            }
          />
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-11 w-full md:w-56">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recentes">Mais recentes</SelectItem>
              <SelectItem value="vendidos">Mais vendidos</SelectItem>
              <SelectItem value="menor">Menor preço</SelectItem>
              <SelectItem value="maior">Maior preço</SelectItem>
              <SelectItem value="avaliacao">Melhor avaliação</SelectItem>
            </SelectContent>
          </Select>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="minimal" className="h-11 lg:hidden">
                <SlidersHorizontal className="h-4 w-4" /> Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto bg-background">
              <div className="p-5">
                <Label className="eyebrow">Filtros</Label>
                <div className="mt-6">{Filters}</div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">{Filters}</aside>
          <div>
            <p className="mb-4 text-xs text-muted-foreground">
              {filtered.length} produto(s) encontrado(s)
            </p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            {!isLoading && filtered.length === 0 && (
              <p className="py-20 text-center text-muted-foreground">
                Nenhum produto encontrado com esses filtros.
              </p>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
