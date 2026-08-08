import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brl, formatDate, ORDER_STATUS } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  component: AdminOrders;
});

function AdminOrders() {
  return null;
}
