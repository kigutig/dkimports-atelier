import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useFavorites() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("product_id");
      if (error) throw error;
      return data.map((d) => d.product_id);
    },
  });

  const toggle = async (productId: string) => {
    if (!user) {
      toast.error("Entre na sua conta para salvar favoritos.");
      return;
    }
    if (favorites.includes(productId)) {
      await supabase.from("favorites").delete().eq("product_id", productId).eq("user_id", user.id);
      toast.success("Removido dos favoritos");
    } else {
      await supabase.from("favorites").insert({ product_id: productId, user_id: user.id });
      toast.success("Adicionado aos favoritos");
    }
    void qc.invalidateQueries({ queryKey: ["favorites"] });
  };

  return { favorites, toggle, isFavorite: (id: string) => favorites.includes(id) };
}
