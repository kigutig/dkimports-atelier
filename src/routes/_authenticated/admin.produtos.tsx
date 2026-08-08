import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { brl, slugify } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/produtos")({
  component: AdminProducts,
});

type FormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  sale_price: string;
  cost_price: string;
  stock: string;
  min_stock: string;
  sku: string;
  brand: string;
  material: string;
  care: string;
  gender: string;
  category_id: string;
  sizes: string;
  colors: string;
  tags: string;
  images: string;
  active: boolean;
  featured: boolean;
  on_sale: boolean;
};

const EMPTY: FormState = {
  name: "",
  slug: "",
  description: "",
  price: "",
  sale_price: "",
  cost_price: "",
  stock: "0",
  min_stock: "3",
  sku: "",
  brand: "DKIMPORTS",
  material: "",
  care: "",
  gender: "unissex",
  category_id: "",
  sizes: "P, M, G, GG",
  colors: "Preto",
  tags: "",
  images: "",
  active: true,
  featured: false,
  on_sale: false,
};

const list = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

function AdminProducts() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), product_images(url, sort_order, is_primary)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const filtered = useMemo(
    () =>
      products.filter((p) =>
        `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(query.toLowerCase().trim()),
      ),
    [products, query],
  );

  const openNew = () => {
    setForm({ ...EMPTY, category_id: categories[0]?.id ?? "" });
    setOpen(true);
  };

  const openEdit = (p: (typeof products)[number]) => {
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      price: String(p.price),
      sale_price: p.sale_price ? String(p.sale_price) : "",
      cost_price: p.cost_price ? String(p.cost_price) : "",
      stock: String(p.stock),
      min_stock: String(p.min_stock),
      sku: p.sku ?? "",
      brand: p.brand ?? "",
      material: p.material ?? "",
      care: p.care ?? "",
      gender: p.gender ?? "unissex",
      category_id: p.category_id ?? "",
      sizes: p.sizes.join(", "),
      colors: p.colors.join(", "),
      tags: p.tags.join(", "),
      images: (p.product_images ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((i) => i.url)
        .join(", "),
      active: p.active,
      featured: p.featured,
      on_sale: p.on_sale,
    });
    setOpen(true);
  };

  const save = async () => {
    if (form.name.trim().length < 3 || !Number(form.price)) {
      toast.error("Informe nome e preço válidos.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() ? slugify(form.slug) : slugify(form.name),
      description: form.description || null,
      price: Number(form.price),
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      cost_price: form.cost_price ? Number(form.cost_price) : null,
      stock: Number(form.stock) || 0,
      min_stock: Number(form.min_stock) || 0,
      sku: form.sku || null,
      brand: form.brand || null,
      material: form.material || null,
      care: form.care || null,
      gender: form.gender || null,
      category_id: form.category_id || null,
      sizes: list(form.sizes),
      colors: list(form.colors),
      tags: list(form.tags),
      active: form.active,
      featured: form.featured,
      on_sale: form.on_sale,
    };

    let productId = form.id;
    if (productId) {
      const { error } = await supabase.from("products").update(payload).eq("id", productId);
      if (error) {
        setSaving(false);
        toast.error("Erro ao salvar produto.");
        return;
      }
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error || !data) {
        setSaving(false);
        toast.error("Erro ao criar produto.");
        return;
      }
      productId = data.id;
    }

    await supabase.from("product_images").delete().eq("product_id", productId);
    const urls = list(form.images);
    if (urls.length) {
      await supabase.from("product_images").insert(
        urls.map((url, i) => ({
          product_id: productId!,
          url,
          sort_order: i,
          is_primary: i === 0,
          alt: form.name,
        })),
      );
    }

    setSaving(false);
    setOpen(false);
    toast.success("Produto salvo!");
    void qc.invalidateQueries();
  };

  const duplicate = async (p: (typeof products)[number]) => {
    const { id, created_at, updated_at, categories: _c, product_images: imgs, ...rest } = p;
    const { data } = await supabase
      .from("products")
      .insert({ ...rest, name: `${p.name} (cópia)`, slug: `${p.slug}-copia-${Date.now()}`, sales_count: 0 })
      .select("id")
      .single();
    if (data && imgs?.length) {
      await supabase
        .from("product_images")
        .insert(imgs.map((i) => ({ product_id: data.id, url: i.url, sort_order: i.sort_order, is_primary: i.is_primary })));
    }
    toast.success("Produto duplicado.");
    void qc.invalidateQueries();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este produto definitivamente?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível excluir.");
      return;
    }
    toast.success("Produto excluído.");
    void qc.invalidateQueries();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("products").update({ active }).eq("id", id);
    void qc.invalidateQueries();
  };

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Catálogo</p>
          <h1 className="text-3xl">Produtos</h1>
        </div>
        <Button variant="gold" className="shrink-0" onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-11 pl-10"
          placeholder="Buscar por nome ou SKU"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto border border-border/70 bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border/70 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="p-3">Produto</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Preço</th>
              <th className="p-3">Estoque</th>
              <th className="p-3">Ativo</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {p.product_images?.[0] && (
                      <img src={p.product_images[0].url} alt="" loading="lazy" className="h-12 w-9 shrink-0 object-cover" />
                    )}
                    <span className="min-w-0 truncate">{p.name}</span>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">
                  {(p.categories as { name?: string } | null)?.name ?? "—"}
                </td>
                <td className="p-3">{brl(p.on_sale && p.sale_price ? p.sale_price : p.price)}</td>
                <td className={p.stock <= p.min_stock ? "p-3 text-destructive" : "p-3"}>{p.stock}</td>
                <td className="p-3">
                  <Switch checked={p.active} onCheckedChange={(v) => void toggleActive(p.id, v)} />
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => void duplicate(p)} aria-label="Duplicar">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => void remove(p.id)}
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome" className="sm:col-span-2">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Slug (opcional)">
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </Field>
            <Field label="SKU">
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </Field>
            <Field label="Descrição" className="sm:col-span-2">
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <Field label="Preço (R$)">
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="Preço promocional">
              <Input
                type="number"
                value={form.sale_price}
                onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
              />
            </Field>
            <Field label="Custo">
              <Input
                type="number"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
              />
            </Field>
            <Field label="Categoria">
              <select
                className="h-10 w-full border border-input bg-background px-3 text-sm"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estoque">
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </Field>
            <Field label="Estoque mínimo">
              <Input
                type="number"
                value={form.min_stock}
                onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
              />
            </Field>
            <Field label="Tamanhos (vírgula)">
              <Input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} />
            </Field>
            <Field label="Cores (vírgula)">
              <Input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} />
            </Field>
            <Field label="Marca">
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </Field>
            <Field label="Gênero">
              <select
                className="h-10 w-full border border-input bg-background px-3 text-sm"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                {["unissex", "masculino", "feminino", "infantil"].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Material">
              <Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
            </Field>
            <Field label="Cuidados">
              <Input value={form.care} onChange={(e) => setForm({ ...form, care: e.target.value })} />
            </Field>
            <Field label="Tags (vírgula)" className="sm:col-span-2">
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </Field>
            <Field label="URLs das imagens (vírgula, a primeira é a principal)" className="sm:col-span-2">
              <Textarea
                rows={3}
                value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })}
              />
            </Field>
            <div className="flex flex-wrap gap-6 sm:col-span-2">
              {(
                [
                  ["active", "Ativo"],
                  ["featured", "Destaque"],
                  ["on_sale", "Em promoção"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Switch checked={form[key]} onCheckedChange={(v) => setForm({ ...form, [key]: v })} />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <Button variant="gold" disabled={saving} onClick={() => void save()}>
            {saving ? "Salvando…" : "Salvar produto"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
