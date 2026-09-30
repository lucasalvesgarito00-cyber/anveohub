import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, Mail } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — ANVEO HUB" },
      { name: "description", content: "Entre com segurança no ANVEO HUB." },
      { property: "og:title", content: "Entrar — ANVEO HUB" },
      { property: "og:description", content: "Entre com segurança no ANVEO HUB." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function GoogleMark() {
  return <span aria-hidden className="grid size-5 place-items-center rounded-sm bg-foreground text-xs font-bold text-background">G</span>;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function ensureProfile(userId: string, displayName?: string) {
    await supabase.from("profiles").upsert(
      { id: userId, display_name: displayName?.trim() || null },
      { onConflict: "id", ignoreDuplicates: true },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setNotice("Enviamos as instruções de redefinição para o seu e-mail.");
        return;
      }

      if (mode === "signup") {
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() }, emailRedirectTo: window.location.origin },
        });
        if (signupError) throw signupError;
        if (data.user) await ensureProfile(data.user.id, name);
        if (!data.session) {
          setNotice("Conta criada. Confirme seu e-mail para acessar o ANVEO HUB.");
          return;
        }
      } else {
        const { data, error: signinError } = await supabase.auth.signInWithPassword({ email, password });
        if (signinError) throw signinError;
        await ensureProfile(data.user.id, data.user.user_metadata["display_name"] as string | undefined);
      }
      await navigate({ to: "/dashboard", replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível concluir o acesso.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setError(result.error.message);
      setBusy(false);
      return;
    }
    if (!result.redirected) await navigate({ to: "/dashboard", replace: true });
  }

  const title = mode === "signup" ? "Crie sua conta" : mode === "forgot" ? "Recupere seu acesso" : "Bem-vindo de volta";
  const description = mode === "signup" ? "Comece a organizar sua operação comercial." : mode === "forgot" ? "Informe seu e-mail para receber as instruções." : "Entre para continuar no seu workspace.";

  return (
    <main className="fine-grid relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div className="absolute inset-0 bg-background/85" />
      <section className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-primary text-lg font-bold text-primary-foreground">A</span>
          <div><div className="text-lg font-bold">ANVEO <span className="text-primary">HUB</span></div><div className="text-[10px] uppercase text-muted-foreground">Revenue OS</div></div>
        </div>
        <div className="panel p-6 shadow-2xl sm:p-8">
          <div className="mb-6"><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
          {mode !== "forgot" && <Button type="button" variant="outline" className="h-10 w-full" onClick={handleGoogle} disabled={busy}><GoogleMark />Continuar com Google</Button>}
          {mode !== "forgot" && <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-border"/><span className="text-[10px] uppercase text-muted-foreground">ou use seu e-mail</span><span className="h-px flex-1 bg-border"/></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" required /></div>}
            <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@empresa.com.br" required /></div>
            {mode !== "forgot" && <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Senha</Label>{mode === "signin" && <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => { setMode("forgot"); setError(""); setNotice(""); }}>Esqueci minha senha</Button>}</div><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" className="pr-10" required/><Button type="button" variant="ghost" size="icon-sm" className="absolute right-1 top-0.5" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}</Button></div></div>}
            {error && <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
            {notice && <div className="flex gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-xs text-success"><CheckCircle2 className="mt-0.5 size-4 shrink-0"/>{notice}</div>}
            <Button type="submit" className="h-10 w-full" disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin"/> : mode === "forgot" ? <Mail className="size-4"/> : <ArrowRight className="size-4"/>}{mode === "signup" ? "Criar conta" : mode === "forgot" ? "Enviar instruções" : "Entrar"}</Button>
          </form>
          <div className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "signin" ? <>Ainda não tem conta? <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => setMode("signup")}>Criar conta</Button></> : <>Já tem uma conta? <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => setMode("signin")}>Voltar para o acesso</Button></>}
          </div>
        </div>
        <p className="mt-5 text-center text-[11px] text-muted-foreground">Acesso protegido para sua operação comercial.</p>
      </section>
    </main>
  );
}