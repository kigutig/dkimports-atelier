import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { StoreLayout } from "@/components/store/StoreLayout";
import { fetchSettings } from "@/services/catalog";

const PAGES: Record<string, { title: string; body: string }> = {
  sobre: {
    title: "Sobre a DKIMPORTS",
    body: "A DKIMPORTS nasceu para vestir quem tem atitude. Selecionamos peça a peça, com foco em caimento, acabamento e durabilidade. Estilo, qualidade e atitude em cada detalhe.",
  },
  privacidade: {
    title: "Política de privacidade",
    body: "Seus dados são utilizados exclusivamente para processar pedidos, entregas e atendimento. Não compartilhamos informações pessoais com terceiros sem sua autorização, e todo o tráfego é criptografado.",
  },
  termos: {
    title: "Termos de uso",
    body: "Ao utilizar a loja DKIMPORTS você concorda com nossas condições de compra, prazos de entrega, política de trocas e uso responsável da plataforma.",
  },
  trocas: {
    title: "Trocas e devoluções",
    body: "Você tem até 30 dias corridos após o recebimento para solicitar troca ou devolução. A peça deve estar sem uso, com etiqueta e embalagem originais.",
  },
  atendimento: {
    title: "Atendimento",
    body: "Nosso time atende de segunda a sábado, das 9h às 18h. Fale conosco por e-mail ou WhatsApp e responderemos o mais rápido possível.",
  },
};

export const Route = createFileRoute("/institucional/$slug")({
  head: ({ params }) => {
    const page = PAGES[params.slug];
    const title = `${page?.title ?? "Institucional"} | DKIMPORTS`;
    return {
      meta: [
        { title },
        { name: "description", content: page?.body.slice(0, 155) ?? "Informações institucionais DKIMPORTS." },
        { property: "og:title", content: title },
        { property: "og:description", content: page?.body.slice(0, 155) ?? "Informações institucionais DKIMPORTS." },
      ],
    };
  },
  component: InstitutionalPage,
});

function InstitutionalPage() {
  const { slug } = Route.useParams();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const page = PAGES[slug];

  const custom =
    slug === "privacidade"
      ? settings?.privacy_policy
      : slug === "termos"
        ? settings?.terms
        : slug === "trocas"
          ? settings?.exchange_policy
          : null;

  return (
    <StoreLayout>
      <div className="container-dk max-w-3xl py-20">
        <p className="eyebrow mb-3">Institucional</p>
        <h1 className="mb-8 text-4xl">{page?.title ?? "Página institucional"}</h1>
        <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
          {custom || page?.body || "Conteúdo em breve."}
        </p>
        {slug === "atendimento" && (
          <ul className="mt-8 space-y-2 text-sm text-muted-foreground">
            <li>E-mail: {settings?.email}</li>
            <li>Telefone: {settings?.phone}</li>
            <li>Endereço: {settings?.address}</li>
            <li>CNPJ: {settings?.cnpj}</li>
          </ul>
        )}
      </div>
    </StoreLayout>
  );
}
