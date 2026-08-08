import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Boxes,
  Image as ImageIcon,
  LayoutGrid,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { claimFirstAdmin } from "@/lib/admin.functions";
import { Logo } from "@/components/store/Header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo | DKIMPORTS" },
      { name: "description", content: "Gerencie produtos, pedidos, clientes e configurações da loja DKIMPORTS." },
      { property: "og:title", content: "Painel administrativo | DKIMPORTS" },
      { property: "og:description", content: "Administração da loja DKIMPORTS." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/estoque", label: "Estoque", icon: Boxes },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/cupons", label: "Cupons", icon: Tag },
  { to: "/admin/categorias", label: "Categorias", icon: LayoutGrid },
  { to: "/admin/banners", label: "Banners e Home", icon: ImageIcon },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

function AdminLayout() {
  const { isAdmin, loading, refreshRole } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [claiming, setClaiming] = useState(false);

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Carregando…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="max-w-md space-y-4 border border-border/70 bg-card p-8 text-center">
          <h1 className="text-2xl">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">
            Esta área é exclusiva para administradores da DKIMPORTS.
          </p>
          <Button
            variant="outlineGold"
            disabled={claiming}
            onClick={async () => {
              setClaiming(true);
              try {
                const result = await claimFirstAdmin();
                if (result.ok) {
                  await refreshRole();
                  toast.success("Você agora é administrador da loja.");
                } else {
                  toast.error(result.reason ?? "Não foi possível.");
                }
              } catch {
                toast.error("Não foi possível concluir a solicitação.");
              } finally {
                setClaiming(false);
              }
            }}
          >
            Sou o dono da loja (configuração inicial)
          </Button>
          <Link to="/" className="block text-xs text-muted-foreground hover:text-primary">
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="container-dk grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Logo compact />
            <span className="truncate text-xs uppercase tracking-[0.28em] text-primary">
              Painel administrativo
            </span>
          </div>
          <Link to="/" className="shrink-0">
            <Button variant="minimal" size="sm">
              Ver loja
            </Button>
          </Link>
        </div>
        <nav className="border-t border-border/70">
          <div className="container-dk flex gap-1 overflow-x-auto py-2">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex shrink-0 items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.16em] transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="container-dk py-8">
        <Outlet />
      </main>
    </div>
  );
}
