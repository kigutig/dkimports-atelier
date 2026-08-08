import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products"> & {
  product_images?: Tables<"product_images">[];
  categories?: Pick<Tables<"categories">, "name" | "slug"> | null;
};
export type Category = Tables<"categories">;
export type Banner = Tables<"banners">;
export type Settings = Tables<"settings">;
export type Order = Tables<"orders"> & { order_items?: Tables<"order_items">[] };

const PRODUCT_SELECT = "*, product_images(*), categories(name, slug)";

export const productImage = (p: Product) => {
  const imgs = p.product_images ?? [];
  const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
  return primary?.url ?? null;
};

export async function fetchProducts(options?: {
  categorySlug?: string | undefined;
  featured?: boolean | undefined;
  onSale?: boolean | undefined;
  limit?: number | undefined;
  activeOnly?: boolean | undefined;
}) {
  try {
    let query = supabase.from("products").select(PRODUCT_SELECT);
    if (options?.activeOnly !== false) query = query.eq("active", true);
    if (options?.featured) query = query.eq("featured", true);
    if (options?.onSale) query = query.eq("on_sale", true);
    if (options?.limit) query = query.limit(options.limit);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.warn("[Catalog] fetchProducts error:", error.message);
      return [];
    }
    let list = (data ?? []) as Product[];
    if (options?.categorySlug) {
      list = list.filter((p) => p.categories?.slug === options.categorySlug);
    }
    return list;
  } catch (e) {
    console.warn("[Catalog] fetchProducts exception:", e);
    return [];
  }
}

export async function fetchProductBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      console.warn("[Catalog] fetchProductBySlug error:", error.message);
      return null;
    }
    return data as Product | null;
  } catch (e) {
    console.warn("[Catalog] fetchProductBySlug exception:", e);
    return null;
  }
}

export async function fetchCategories() {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      console.warn("[Catalog] fetchCategories error:", error.message);
      return [];
    }
    return data as Category[];
  } catch (e) {
    console.warn("[Catalog] fetchCategories exception:", e);
    return [];
  }
}

export async function fetchBanner() {
  try {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn("[Catalog] fetchBanner error:", error.message);
      return null;
    }
    return data as Banner | null;
  } catch (e) {
    console.warn("[Catalog] fetchBanner exception:", e);
    return null;
  }
}

export async function fetchSettings() {
  try {
    const { data, error } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
    if (error) {
      console.warn("[Catalog] fetchSettings error:", error.message);
      return null;
    }
    return data as Settings | null;
  } catch (e) {
    console.warn("[Catalog] fetchSettings exception:", e);
    return null;
  }
}
