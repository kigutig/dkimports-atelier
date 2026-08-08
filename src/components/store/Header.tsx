import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import monogram from "@/assets/dk-monogram.png";

const NAV = [
  { label: "Início", to: "/" as const, search: undefined },
  { label: "Masculino", category: "masculino" },
  { label: "Feminino", category: "feminino" },
  { label: "Camisetas", category: "camisetas" },
  { label: "Calças", category: "calcas" },
  { label: "Moletons", category: "moletons" },
  { label: "Bermudas", category: "bermudas" },
  { label: "Acessórios", category: "acessorios" },
  { label: "Ofertas", sale: true },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <img src={monogram} alt="Monograma DK" width={40} height={40} className="h-9 w-9" />
      {!compact && (
        <span className="font-display text-xl font-semibold tracking-[0.28em] text-foreground">
          DK<span className="text-gradient-gold">IMPORTS</span>
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const navigate = useNavigate();
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const goCatalog = (item: (typeof NAV)[number]) => {
    setMenuOpen(false);
    if (item.to) {
      void navigate({ to: "/" });
      return;
    }
    void navigate({
      to: "/produtos",
      search: {
        categoria: item.category,
        promocao: item.sale ? true : undefined,
      },
    });
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    void navigate({ to: "/produtos", search: { q: term || undefined } });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container-dk grid grid-cols-[auto_1fr_auto] items-center gap-3 py-4">
        <div className="flex items-center gap-2">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm border-border bg-background p-0">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <Logo />
                <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex flex-col p-2">
                {NAV.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => goCatalog(item)}
                    className="px-4 py-3 text-left text-sm tracking-[0.18em] uppercase text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </button>
                ))}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-3 text-left text-sm uppercase tracking-[0.18em] text-primary"
                  >
                    Painel admin
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
          <Logo />
        </div>

        <nav className="hidden items-center justify-center gap-6 lg:flex">
          {NAV.map((item) => (
            <button
              key={item.label}
              onClick={() => goCatalog(item)}
              className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Pesquisar"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Link to={user ? "/conta" : "/auth"} aria-label="Minha conta">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Link
            to="/conta"
            search={{ aba: "favoritos" }}
            aria-label="Favoritos"
            className="hidden sm:block"
          >
            <Button variant="ghost" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/carrinho" aria-label="Carrinho" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingBag className="h-5 w-5" />
            </Button>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-gold px-1 text-[0.65rem] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <form onSubmit={submitSearch} className="border-t border-border/70 bg-card/60">
          <div className="container-dk flex items-center gap-2 py-3">
            <Input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar produtos, categorias..."
              className="h-11"
            />
            <Button type="submit" variant="gold">
              Buscar
            </Button>
          </div>
        </form>
      )}
    </header>
  );
}
