import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const { data: customers = [] } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ["admin-newsletter"],
    queryFn: async () => {
      const { data } = await supabase.from("newsletter").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Relacionamento</p>
        <h1 className="text-3xl">Clientes</h1>
      </header>

      <div className="overflow-x-auto border border-border/70 bg-card">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b border-border/70 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Telefone</th>
              <th className="p-3">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-border/50">
                <td className="p-3">{c.full_name ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{c.email ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{c.phone ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{formatDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section>
        <h2 className="mb-3 text-xl">Newsletter ({subscribers.length})</h2>
        <div className="flex flex-wrap gap-2">
          {subscribers.map((s) => (
            <span key={s.id} className="border border-border/70 bg-card px-3 py-1 text-xs text-muted-foreground">
              {s.email}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
