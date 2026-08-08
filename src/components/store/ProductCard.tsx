import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { brl, discountPercent, effectivePrice, PLACEHOLDER_IMAGE } from "@/lib/format";
import { productImage, type Product } from "@/services/catalog";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const price = effectivePrice(Number(product.price), product.sale_price);
  const off = discountPercent(Number(product.price), product.sale_price);
  const image = productImage(product) ?? PLACEHOLDER_IMAGE;
  const soldOut = product.stock <= 0;

  return (
    <article className="group relative flex flex-col overflow-hidden border border-border/60 bg-card transition-all duration-500 hover:border-primary/50 hover:shadow-lux">
      <Link
        to="/produto/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-[3/4] overflow-hidden bg-graphite"
      >
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {off > 0 && (
          <span className="absolute left-0 top-3 bg-gradient-gold px-3 py-1 text-[0.65rem] font-semibold tracking-[0.2em] text-primary-foreground">
            -{off}%
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-background/85 py-2 text-center text-xs tracking-[0.3em] text-muted-foreground">
            ESGOTADO
          </span>
        )}
      </Link>

      <button
        type="button"
        aria-label="Favoritar"
        onClick={() => void toggle(product.id)}
        className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-background/70 backdrop-blur transition-colors hover:border-primary"
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            isFavorite(product.id) ? "fill-primary text-primary" : "text-muted-foreground",
          )}
        />
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-1 text-primary">
          <Star className="h-3 w-3 fill-primary" />
          <span className="text-xs text-muted-foreground">
            {Number(product.rating).toFixed(1)} ({product.reviews_count})
          </span>
        </div>
        <Link
          to="/produto/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 text-sm font-medium tracking-wide transition-colors group-hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="mt-auto space-y-1">
          {off > 0 && (
            <p className="text-xs text-muted-foreground line-through">{brl(product.price)}</p>
          )}
          <p className="text-lg font-semibold text-primary">{brl(price)}</p>
          <p className="text-[0.7rem] text-muted-foreground">
            ou 10x de {brl(price / 10)} sem juros
          </p>
        </div>
        <Button
          variant="gold"
          size="sm"
          disabled={soldOut}
          onClick={() => {
            add({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              image,
              price,
              size: product.sizes?.[0] ?? null,
              color: product.colors?.[0] ?? null,
              quantity: 1,
            });
            toast.success("Adicionado à sacola");
          }}
        >
          <ShoppingBag className="h-4 w-4" /> Adicionar
        </Button>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse border border-border/60 bg-card">
      <div className="aspect-[3/4] bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-2/3 bg-muted" />
        <div className="h-3 w-1/2 bg-muted" />
        <div className="h-9 w-full bg-muted" />
      </div>
    </div>
  );
}
