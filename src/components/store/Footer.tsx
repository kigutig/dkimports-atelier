import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { fetchSettings } from "@/services/catalog";
import { Logo } from "./Header";

export function Footer() {
  const [email, setEmail] = useState("");
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    const { error } = await supabase.from("newsletter").insert({ email: email.trim() });
    if (error && !error.message.includes("duplicate")) {
      toast.error("Não foi possível cadastrar agora.");
      return;
    }
    setEmail("");
    toast.success("Pronto! Você receberá nossas novidades.");
  };

  return (
    <footer className="border-t border-border/70 bg-graphite">
      <div className="container-dk grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            DKIMPORTS — Estilo, qualidade e atitude. Peças premium selecionadas para quem quer se
            destacar.
          </p>
          <div className="flex gap-3">
            <a
              href={settings?.instagram ? `https://instagram.com/${settings.instagram.replace("@", "")}` : "#"}
              aria-label="Instagram"
              className="grid h-10 w-10 place-items-center border border-border transition-colors hover:border-primary hover:text-primary"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="grid h-10 w-10 place-items-center border border-border transition-colors hover:border-primary hover:text-primary"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="eyebrow mb-4">Categorias</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {["camisetas", "calcas", "moletons", "bermudas", "acessorios"].map((slug) => (
              <li key={slug}>
                <Link
                  to="/produtos"
                  search={{ categoria: slug }}
                  className="capitalize transition-colors hover:text-primary"
                >
                  {slug === "calcas" ? "calças" : slug === "acessorios" ? "acessórios" : slug}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-4">Institucional</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/institucional/$slug" params={{ slug: "sobre" }} className="hover:text-primary">
                Sobre a DKIMPORTS
              </Link>
            </li>
            <li>
              <Link to="/institucional/$slug" params={{ slug: "privacidade" }} className="hover:text-primary">
                Política de privacidade
              </Link>
            </li>
            <li>
              <Link to="/institucional/$slug" params={{ slug: "termos" }} className="hover:text-primary">
                Termos de uso
              </Link>
            </li>
            <li>
              <Link to="/institucional/$slug" params={{ slug: "trocas" }} className="hover:text-primary">
                Trocas e devoluções
              </Link>
            </li>
            <li>
              <Link to="/institucional/$slug" params={{ slug: "atendimento" }} className="hover:text-primary">
                Atendimento
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="eyebrow">Newsletter</h3>
          <p className="text-sm text-muted-foreground">
            Receba lançamentos e ofertas exclusivas antes de todo mundo.
          </p>
          <form onSubmit={subscribe} className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-11"
            />
            <Button type="submit" variant="gold" className="h-11">
              Assinar
            </Button>
          </form>
          <ul className="space-y-2 pt-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> {settings?.email ?? "contato@dkimports.com.br"}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> {settings?.phone ?? "(11) 99999-0000"}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> {settings?.address ?? "São Paulo - SP"}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="container-dk flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} DKIMPORTS. Todos os direitos reservados.</p>
          <p className="flex flex-wrap justify-center gap-3">
            {(settings?.payment_methods ?? ["PIX", "Cartão de crédito", "Cartão de débito"]).map(
              (m) => (
                <span key={m} className="border border-border px-2 py-1">
                  {m}
                </span>
              ),
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
