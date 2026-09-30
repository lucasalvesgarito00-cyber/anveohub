import { ClientOnly, createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Redefinir senha — ANVEO HUB" },
    { name: "description", content: "Defina uma nova senha para sua conta ANVEO HUB." },
    { property: "og:title", content: "Redefinir senha — ANVEO HUB" },
    { property: "og:description", content: "Defina uma nova senha para sua conta ANVEO HUB." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <ClientOnly fallback={<main className="fine-grid grid min-h-screen place-items-center bg-background"><LoaderCircle className="size-6 animate-spin text-primary" /></main>}><ResetPasswordPage /></ClientOnly>,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const recovery = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    supabase.auth.getSession().then(({ data }) => setReady(recovery || Boolean(data.session)));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    setBusy(true); setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) { setError(updateError.message); return; }
    setDone(true);
  }

  return <main className="fine-grid relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10 text-foreground"><div className="absolute inset-0 bg-background/85"/><section className="panel relative z-10 w-full max-w-md p-6 shadow-2xl sm:p-8"><div className="mb-6 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground"><KeyRound className="size-5"/></span><div><h1 className="text-xl font-semibold">Defina uma nova senha</h1><p className="text-sm text-muted-foreground">Proteja o acesso à sua operação.</p></div></div>{done ? <div className="space-y-4"><div className="flex gap-2 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success"><CheckCircle2 className="size-5 shrink-0"/>Sua senha foi atualizada.</div><Button className="w-full" onClick={() => navigate({ to: "/dashboard", replace: true })}>Continuar para o Hub</Button></div> : ready ? <form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-2"><Label htmlFor="new-password">Nova senha</Label><div className="relative"><Input id="new-password" type={show ? "text" : "password"} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className="pr-10" required/><Button type="button" variant="ghost" size="icon-sm" className="absolute right-1 top-0.5" onClick={() => setShow((value) => !value)} aria-label={show ? "Ocultar senha" : "Mostrar senha"}>{show ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}</Button></div></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirme a nova senha</Label><Input id="confirm-password" type={show ? "text" : "password"} minLength={8} value={confirm} onChange={(event) => setConfirm(event.target.value)} required/></div>{error && <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}<Button type="submit" className="w-full" disabled={busy}>{busy && <LoaderCircle className="size-4 animate-spin"/>}Atualizar senha</Button></form> : <div className="space-y-4"><p className="text-sm text-muted-foreground">Este link não é válido ou já expirou. Solicite uma nova redefinição.</p><Button variant="outline" className="w-full" onClick={() => navigate({ to: "/auth" })}>Voltar ao acesso</Button></div>}</section></main>;
}