import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

const GOLD = "#d4a63a";

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-border/70 bg-card p-5">
      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-primary">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)");
      if (error) throw error;
      return data;
    },
  });
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name)");
      if (error) throw error;
      return data;
    },
  });
  const { data: customers = 0 } = useQuery({
    queryKey: ["admin-customers-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const month = new Date().getMonth();
    const valid = orders.filter((o) => o.status !== "cancelado");
    const salesToday = valid
      .filter((o) => new Date(o.created_at).toDateString() === today)
      .reduce((s, o) => s + Number(o.total), 0);
    const salesMonth = valid
      .filter((o) => new Date(o.created_at).getMonth() === month)
      .reduce((s, o) => s + Number(o.total), 0);
    const revenue = valid.reduce((s, o) => s + Number(o.total), 0);
    return {
      salesToday,
      salesMonth,
      orders: orders.length,
      customers,
      products: products.length,
      ticket: valid.length ? revenue / valid.length : 0,
      lowStock: products.filter((p) => p.stock > 0 && p.stock <= p.min_stock).length,
      outOfStock: products.filter((p) => p.stock <= 0).length,
    };
  }, [orders, products, customers]);

  const last30 = useMemo(() => {
    const days: { dia: string; vendas: number; pedidos: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const dayOrders = orders.filter(
        (o) => new Date(o.created_at).toDateString() === key && o.status !== "cancelado",
      );
      days.push({
        dia: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        vendas: dayOrders.reduce((s, o) => s + Number(o.total), 0),
        pedidos: dayOrders.length,
      });
    }
    return days;
  }, [orders]);

  const topProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.sales_count - a.sales_count)
        .slice(0, 5)
        .map((p) => ({ nome: p.name, vendas: p.sales_count })),
    [products],
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const name = (p.categories as { name?: string } | null)?.name ?? "Outras";
      map.set(name, (map.get(name) ?? 0) + p.sales_count);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [products]);

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Visão geral</p>
        <h1 className="text-3xl">Dashboard</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Vendas hoje" value={brl(stats.salesToday)} />
        <Card label="Vendas no mês" value={brl(stats.salesMonth)} />
        <Card label="Pedidos" value={String(stats.orders)} />
        <Card label="Clientes" value={String(stats.customers)} />
        <Card label="Produtos" value={String(stats.products)} />
        <Card label="Ticket médio" value={brl(stats.ticket)} />
        <Card label="Estoque baixo" value={String(stats.lowStock)} hint="Abaixo do mínimo" />
        <Card label="Esgotados" value={String(stats.outOfStock)} />
      </div>

      <section className="border border-border/70 bg-card p-5">
        <h2 className="mb-4 text-xl">Faturamento — últimos 30 dias</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last30}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="dia" stroke="#888" fontSize={11} interval={4} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "#181818", border: "1px solid #333" }}
                formatter={(v: number) => brl(v)}
              />
              <Line type="monotone" dataKey="vendas" stroke={GOLD} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-border/70 bg-card p-5">
          <h2 className="mb-4 text-xl">Pedidos por dia</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last30.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="dia" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#181818", border: "1px solid #333" }} />
                <Bar dataKey="pedidos" fill={GOLD} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="border border-border/70 bg-card p-5">
          <h2 className="mb-4 text-xl">Categorias mais vendidas</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={90}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={i % 2 ? "#8a6a1f" : GOLD} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#181818", border: "1px solid #333" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="border border-border/70 bg-card p-5">
        <h2 className="mb-4 text-xl">Produtos mais vendidos</h2>
        <ol className="space-y-2">
          {topProducts.map((p, i) => (
            <li key={p.nome} className="flex items-center justify-between border-b border-border/60 pb-2 text-sm">
              <span className="min-w-0 truncate">
                <span className="mr-2 text-primary">{i + 1}.</span>
                {p.nome}
              </span>
              <span className="shrink-0 text-muted-foreground">{p.vendas} vendas</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
