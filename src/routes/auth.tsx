import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta | DKIMPORTS" },
      { name: "description", content: "Acesse sua conta DKIMPORTS para acompanhar pedidos, favoritos e dados pessoais." },
      { property: "og:title", content: "Entrar ou criar conta | DKIMPORTS" },
      { property: "og:description", content: "Sua conta DKIMPORTS: pedidos, favoritos e endereços." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("E-mail inválido").max(255);
const passwordSchema = z.string().min(6, "A senha deve ter ao menos 6 caracteres").max(72);

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (user) void navigate({ to: redirect === "/checkout" ? "/checkout" : "/conta", search: redirect === "/checkout" ? {} : { aba: "dados" } });
  }, [user, navigate, redirect]);

  const validate = () => {
    const e = emailSchema.safeParse(email);
    const p = passwordSchema.safeParse(password);
    if (!e.success) {
      toast.error(e.error.issues[0]?.message);
      return false;
    }
    if (!p.success) {
      toast.error(p.error.issues[0]?.message);
      return false;
    }
    return true;
  };

  const signIn = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      toast.error("E-mail ou senha inválidos.");
      return;
    }
    toast.success("Bem-vindo de volta!");
  };

  const signUp = async () => {
    if (!validate()) return;
    if (name.trim().length < 3) {
      toast.error("Informe seu nome completo.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name.trim() },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("already") ? "E-mail já cadastrado." : "Não foi possível criar a conta.");
      return;
    }
    if (!data.session) {
      toast.success("Conta criada! Confirme seu e-mail para acessar.");
      return;
    }
    toast.success("Conta criada com sucesso!");
  };

  const resetPassword = async () => {
    const e = emailSchema.safeParse(email);
    if (!e.success) {
      toast.error("Informe seu e-mail para recuperar a senha.");
      return;
    }
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    toast.success("Enviamos um link de recuperação para seu e-mail.");
  };

  return (
    <StoreLayout>
      <div className="container-dk flex justify-center py-20">
        <div className="w-full max-w-md border border-border/70 bg-card p-8">
          <p className="eyebrow mb-2">DKIMPORTS</p>
          <h1 className="mb-8 text-3xl">Sua conta</h1>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 pt-6">
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button variant="gold" size="lg" className="w-full" disabled={loading} onClick={() => void signIn()}>
                Entrar
              </Button>
              <button
                onClick={() => void resetPassword()}
                className="w-full text-center text-xs text-muted-foreground hover:text-primary"
              >
                Esqueci minha senha
              </button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 pt-6">
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button variant="gold" size="lg" className="w-full" disabled={loading} onClick={() => void signUp()}>
                Criar conta
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </StoreLayout>
  );
}
