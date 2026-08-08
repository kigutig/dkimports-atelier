export const brl = (value: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value ?? 0),
  );

export const discountPercent = (price: number, sale?: number | null) => {
  if (!sale || sale >= price) return 0;
  return Math.round(((price - sale) / price) * 100);
};

export const effectivePrice = (price: number, sale?: number | null) =>
  sale && sale > 0 && sale < price ? sale : price;

export const installments = (total: number, times = 10) =>
  `${times}x de ${brl(total / times)} sem juros`;

export const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString("pt-BR") : "-";

export const ORDER_STATUS: Record<string, string> = {
  pedido_realizado: "Pedido realizado",
  pagamento_aprovado: "Pagamento aprovado",
  preparando: "Preparando pedido",
  enviado: "Enviado",
  em_transito: "Em trânsito",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80";

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
