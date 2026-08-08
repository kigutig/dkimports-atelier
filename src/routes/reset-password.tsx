import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha | DKIMPORTS" },
      { name: "description", content: "Defina uma nova senha para sua conta DKIMPORTS." },
      { property: "og:title", content: "Redefinir senha | DKIMPORTS" },
      { property: "og:description", content: "Defina uma nova senha com segurança." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const parsed = z.string().min(6, "Mínimo de 6 caracteres").max(72).safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível atualizar a senha. Abra novamente o link do e-mail.");
      return;
    }
    setDone(true);
    toast.success("Senha atualizada!");
  };

  return (
    <StoreLayout>
      <div className="container-dk flex justify-center py-24">
        <div className="w-full max-w-md border border-border/70 bg-card p-8">
          <h1 className="mb-6 text-3xl">Nova senha</h1>
          {done ? (
            <p className="text-muted-foreground">
              Senha alterada com sucesso. Você já pode usar sua conta normalmente.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nova senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button variant="gold" size="lg" className="w-full" disabled={loading} onClick={() => void submit()}>
                Salvar nova senha
              </Button>
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
}
