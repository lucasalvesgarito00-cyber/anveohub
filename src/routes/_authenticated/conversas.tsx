import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCheck,
  ChevronDown,
  FileText,
  Instagram,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { askAnveoAi } from "@/lib/anveo-ai";
import { currentUserId, db, today, type LeadRow } from "@/lib/crm-data";
import { Badge, EmptyState, PageHeader } from "@/components/anveo/page";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/conversas")({
  head: () => ({
    meta: [
      { title: "Conversas — ANVEO HUB" },
      { name: "description", content: "Inbox comercial conectado ao CRM." },
    ],
  }),
  component: Conversations,
});

type Conversation = {
  id: string;
  user_id: string;
  title: string | null;
  workspace_id: string | null;
  lead_id: string | null;
  cliente_id: string | null;
  channel: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: string;
  unread_count: number;
  last_message_at: string | null;
  updated_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
  direction: string | null;
  delivery_status: string | null;
};

type Template = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  categoria: string;
  titulo: string;
  conteudo: string;
  created_at: string;
  updated_at: string;
};

const channels = ["Todos", "WhatsApp", "Instagram", "E-mail", "Webchat"];
const emptyTemplate = { categoria: "Geral", titulo: "", conteudo: "" };

function Conversations() {
  const [tab, setTab] = useState<"inbox" | "templates">("inbox");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [messageText, setMessageText] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileConversation, setMobileConversation] = useState(false);
  const [templateEditing, setTemplateEditing] = useState<Template | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);

  const selected = conversations.find((item) => item.id === selectedId) ?? null;
  const selectedLead = selected?.lead_id ? leads.find((lead) => lead.id === selected.lead_id) ?? null : null;

  async function loadBase() {
    const userId = await currentUserId();
    const [conversationResult, leadResult, templateResult] = await Promise.all([
      db.from("ai_conversations").select("*").eq("user_id", userId).order("last_message_at", { ascending: false, nullsFirst: false }).order("updated_at", { ascending: false }),
      db.from("leads").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
      db.from("message_templates").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    ]);
    if (conversationResult.error) throw conversationResult.error;
    if (leadResult.error) throw leadResult.error;
    if (templateResult.error) throw templateResult.error;
    const rows = (conversationResult.data ?? []) as Conversation[];
    setConversations(rows);
    setLeads((leadResult.data ?? []) as LeadRow[]);
    setTemplates((templateResult.data ?? []) as Template[]);
    setSelectedId((current) => current && rows.some((row) => row.id === current) ? current : rows[0]?.id ?? null);
  }

  async function loadMessages(conversationId: string) {
    const result = await db.from("ai_messages").select("id,conversation_id,role,content,created_at,direction,delivery_status").eq("conversation_id", conversationId).order("created_at", { ascending: true });
    if (result.error) throw result.error;
    setMessages((result.data ?? []) as Message[]);
  }

  useEffect(() => {
    loadBase().catch((error) => setNotice(error.message));
    const channelSubscription = supabase
      .channel("ai-conversations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ai_conversations" }, () => loadBase().catch(() => undefined))
      .on("postgres_changes", { event: "*", schema: "public", table: "ai_messages" }, () => {
        if (selectedId) loadMessages(selectedId).catch(() => undefined);
        loadBase().catch(() => undefined);
      })
      .subscribe();
    return () => { supabase.removeChannel(channelSubscription); };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadMessages(selectedId).catch((error) => setNotice(error.message)).finally(() => setLoading(false));
  }, [selectedId]);

  const visibleConversations = useMemo(() => conversations.filter((conversation) => {
    const searchable = `${conversation.contact_name ?? ""} ${conversation.contact_phone ?? ""} ${conversation.contact_email ?? ""} ${conversation.title ?? ""}`.toLowerCase();
    return searchable.includes(query.toLowerCase()) && (channel === "Todos" || conversation.channel === channel) && (status === "Todos" || conversation.status === status.toLowerCase());
  }), [conversations, query, channel, status]);

  async function sendMessage() {
    if (!selected || !messageText.trim()) return;
    const userId = await currentUserId();
    const content = messageText.trim();
    const result = await db.from("ai_messages").insert({ conversation_id: selected.id, user_id: userId, role: "user", content, channel: selected.channel, direction: "outbound", delivery_status: "draft" });
    if (result.error) return setNotice(result.error.message);
    await db.from("ai_conversations").update({ last_message_at: new Date().toISOString(), last_outbound_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", selected.id).eq("user_id", userId);
    setMessageText("");
    await loadMessages(selected.id);
  }

  async function requestAi(kind: "summary" | "reply" | "opportunity") {
    if (!selected) return;
    const prompt = kind === "summary" ? "Resuma esta conversa e destaque os próximos passos, sem executar nenhuma ação." : kind === "reply" ? "Sugira uma resposta curta para esta conversa. Entregue apenas um rascunho e não envie nada." : "Analise esta conversa e sugira oportunidades comerciais como rascunho, sem alterar dados.";
    try {
      await askAnveoAi({ data: { conversationId: selected.id, question: prompt } });
      await loadMessages(selected.id);
      setNotice("Rascunho gerado pela ANVEO AI. Nenhuma mensagem foi enviada e nenhuma ação foi executada.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível gerar a sugestão.");
    }
  }

  async function createLead() {
    if (!selected) return;
    const userId = await currentUserId();
    const result = await db.from("leads").insert({ user_id: userId, nome_contato: selected.contact_name, telefone_whatsapp: selected.contact_phone, email: selected.contact_email, origem: selected.channel, etapa: "Novo" }).select("*").single();
    if (result.error) return setNotice(result.error.message);
    await db.from("ai_conversations").update({ lead_id: result.data.id }).eq("id", selected.id).eq("user_id", userId);
    setNotice("Lead criado e vinculado à conversa.");
    await loadBase();
  }

  async function createCrmAction(action: "task" | "followup" | "note") {
    if (!selected) return;
    const userId = await currentUserId();
    let result;
    if (action === "note") {
      result = await db.from("atividades").insert({ user_id: userId, lead_id: selected.lead_id, cliente_id: selected.cliente_id, tipo: "observacao", titulo: `Observação da conversa com ${selected.contact_name || "contato"}`, descricao: "Observação criada a partir da página Conversas.", data: today(), status: "registrada" });
    } else {
      result = await db.from("tarefas").insert({ user_id: userId, titulo: action === "followup" ? `Follow-up: ${selected.contact_name || "contato"}` : `Acompanhar conversa: ${selected.contact_name || "contato"}`, descricao: "Criada a partir da página Conversas.", lead_id: selected.lead_id, cliente_id: selected.cliente_id, tipo: action === "followup" ? "follow_up" : "tarefa", data: today(), prioridade: "media", status: "pendente" });
    }
    if (result.error) return setNotice(result.error.message);
    setNotice(action === "note" ? "Observação adicionada ao CRM." : action === "followup" ? "Follow-up criado em Tarefas." : "Tarefa criada em Tarefas.");
  }

  async function removeTemplate(template: Template) {
    if (!window.confirm("Excluir este template?")) return;
    const result = await db.from("message_templates").delete().eq("id", template.id);
    if (result.error) return setNotice(result.error.message);
    setTemplates((items) => items.filter((item) => item.id !== template.id));
  }

  return <div className="mx-auto max-w-[1600px]">
    <PageHeader eyebrow="Atendimento comercial" title="Conversas" description="Inbox comercial conectado ao CRM, sem mensagens fictícias." actions={<div className="flex gap-2"><Button variant={tab === "inbox" ? "default" : "outline"} onClick={() => setTab("inbox")}><MessageCircle className="size-4" />Inbox</Button><Button variant={tab === "templates" ? "default" : "outline"} onClick={() => setTab("templates")}><FileText className="size-4" />Templates</Button></div>} />
    {notice && <div className="mb-4 flex items-center justify-between rounded-md border border-primary/20 bg-primary/10 p-3 text-sm text-foreground"><span>{notice}</span><button onClick={() => setNotice("")}><X className="size-4" /></button></div>}
    {tab === "templates" ? <Templates templates={templates} query={query} setQuery={setQuery} onNew={() => { setTemplateEditing(null); setTemplateOpen(true); }} onEdit={(template) => { setTemplateEditing(template); setTemplateOpen(true); }} onDelete={removeTemplate} onSaved={async () => { setTemplateOpen(false); await loadBase(); }} open={templateOpen} editing={templateEditing} /> : <>
      <div className="mb-3 flex flex-col gap-2 md:flex-row"><label className="flex h-10 flex-1 items-center gap-2 rounded-md border border-input bg-surface px-3"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Buscar por nome, telefone ou e-mail" /></label><select value={channel} onChange={(event) => setChannel(event.target.value)} className="h-10 rounded-md border border-input bg-surface px-3 text-sm">{channels.map((item) => <option key={item}>{item}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-input bg-surface px-3 text-sm"><option>Todos</option><option value="open">Abertas</option><option value="closed">Encerradas</option></select></div>
      <div className="mb-3 rounded-md border border-warning/30 bg-warning/10 p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium">WhatsApp ainda não conectado</p><p className="mt-1 text-xs text-muted-foreground">As conversas exibidas dependem dos registros existentes no Hub. Nenhum provedor ou credencial foi inventado.</p></div><Button variant="outline" asChild><Link to="/integracoes">Configurar integração</Link></Button></div></div>
      <div className="panel grid min-h-[580px] overflow-hidden md:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <aside className={`${mobileConversation ? "hidden" : "block"} border-r border-border md:block`}><div className="border-b border-border p-3"><p className="text-xs text-muted-foreground">{visibleConversations.length} conversa(s)</p></div>{visibleConversations.map((conversation) => <button key={conversation.id} onClick={() => { setSelectedId(conversation.id); setMobileConversation(true); }} className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] gap-3 border-b border-border p-3 text-left ${selectedId === conversation.id ? "bg-accent" : "hover:bg-accent/40"}`}><span className="grid size-9 place-items-center rounded bg-secondary text-xs font-semibold">{(conversation.contact_name || "?").split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><span className="min-w-0"><b className="block truncate text-xs">{conversation.contact_name || conversation.title || "Conversa sem nome"}</b><span className="block truncate text-[11px] text-muted-foreground">{conversation.channel || "Canal não informado"} · {conversation.status === "open" ? "Aberta" : "Encerrada"}</span></span>{conversation.unread_count > 0 && <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{conversation.unread_count}</span>}</button>)}{visibleConversations.length === 0 && <div className="p-4"><EmptyState icon={<MessageCircle className="size-4" />} title="Nenhuma conversa" text="As conversas reais aparecerão aqui quando existirem registros para sua conta." /></div>}</aside>
        <main className={`${mobileConversation ? "flex" : "hidden"} min-w-0 flex-col md:flex`}>{selected ? <><header className="flex min-h-16 items-center justify-between gap-3 border-b border-border px-4"><div className="flex min-w-0 items-center gap-3"><button className="md:hidden" onClick={() => setMobileConversation(false)}><X className="size-5" /></button><div className="min-w-0"><b className="block truncate text-sm">{selected.contact_name || selected.title || "Conversa sem nome"}</b><span className="text-xs text-muted-foreground">{selected.channel || "Canal não informado"}{selected.contact_phone ? ` · ${selected.contact_phone}` : ""}</span></div></div><div className="flex items-center gap-1"><Button variant="ghost" size="icon" onClick={() => requestAi("summary")} title="Resumir conversa"><RefreshCw className="size-4" /></Button><Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button></div></header><div className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6">{loading ? <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Carregando mensagens...</div> : messages.length === 0 ? <EmptyState icon={<MessageCircle className="size-4" />} title="Nenhuma mensagem registrada" text="Esta conversa ainda não possui mensagens no Supabase." /> : <div className="mx-auto w-full max-w-2xl space-y-3">{messages.map((message) => { const mine = message.role === "user" || message.direction === "outbound"; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-lg p-3 text-xs leading-5 ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}><p className="whitespace-pre-wrap">{message.content}</p><span className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(message.created_at).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" })}{mine && <CheckCheck className="size-3" />}</span></div></div>; })}</div>}</div><div className="border-t border-border p-3"><div className="mb-2 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => requestAi("reply")}><Sparkles className="size-3" />Sugerir resposta</Button><Button variant="outline" size="sm" onClick={() => requestAi("opportunity")}><Bot className="size-3" />Sugerir oportunidade</Button></div><div className="flex items-end gap-2 rounded-md border border-input bg-surface p-2"><textarea value={messageText} onChange={(event) => setMessageText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} rows={1} className="min-h-9 flex-1 resize-none bg-transparent py-2 text-xs outline-none" placeholder="Rascunhar mensagem..." /><Button size="icon" onClick={sendMessage} title="Salvar rascunho"><Send className="size-4" /></Button></div><p className="mt-1 text-[10px] text-muted-foreground">O envio externo não está conectado. O conteúdo é salvo como rascunho.</p></div></> : <div className="grid flex-1 place-items-center p-6"><EmptyState icon={<MessageCircle className="size-4" />} title="Selecione uma conversa" text="Escolha uma conversa existente para visualizar suas mensagens." /></div>}</main>
        <CommercialPanel conversation={selected} lead={selectedLead} onCreateLead={createLead} onAction={createCrmAction} />
      </div>
    </>}</div>;
}

function CommercialPanel({ conversation, lead, onCreateLead, onAction }: { conversation: Conversation | null; lead: LeadRow | null; onCreateLead: () => void; onAction: (action: "task" | "followup" | "note") => void }) {
  if (!conversation) return <aside className="hidden border-l border-border p-4 xl:block"><EmptyState icon={<UserPlus className="size-4" />} title="Sem contato selecionado" text="O painel comercial será exibido ao selecionar uma conversa." /></aside>;
  return <aside className="hidden border-l border-border p-4 xl:block"><div className="text-center"><span className="mx-auto grid size-14 place-items-center rounded-lg bg-secondary font-semibold">{(conversation.contact_name || "?").split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><h3 className="mt-3 text-sm font-semibold">{conversation.contact_name || "Contato sem nome"}</h3><p className="text-xs text-muted-foreground">{conversation.contact_email || conversation.contact_phone || "Sem dados de contato"}</p></div><div className="mt-5 rounded-md border border-border p-3"><p className="text-[10px] font-semibold uppercase text-primary">Vínculo CRM</p>{lead ? <><p className="mt-2 text-sm font-medium">{lead.nome_contato || lead.nome_empresa || "Lead sem nome"}</p><p className="mt-1 text-xs text-muted-foreground">{lead.etapa || "Etapa não informada"}</p><Link className="mt-3 inline-flex text-xs text-primary" to="/leads/$leadId" params={{ leadId: lead.id }}>Ver lead</Link></> : <><p className="mt-2 text-xs text-muted-foreground">Esta conversa ainda não está vinculada a um lead.</p><Button className="mt-3 w-full" size="sm" onClick={onCreateLead}><UserPlus className="size-3" />Adicionar como lead</Button></>}</div><div className="mt-4 grid gap-2"><p className="text-[10px] font-semibold uppercase text-muted-foreground">Ações comerciais</p><Button variant="outline" size="sm" onClick={() => onAction("task")}><Plus className="size-3" />Criar tarefa</Button><Button variant="outline" size="sm" onClick={() => onAction("followup")}><ChevronDown className="size-3" />Criar follow-up</Button><Button variant="outline" size="sm" onClick={() => onAction("note")}><FileText className="size-3" />Adicionar observação</Button></div></aside>;
}

function Templates({ templates, query, setQuery, onNew, onEdit, onDelete, open, editing, onSaved }: { templates: Template[]; query: string; setQuery: (value: string) => void; onNew: () => void; onEdit: (template: Template) => void; onDelete: (template: Template) => void; open: boolean; editing: Template | null; onSaved: () => Promise<void> }) {
  const visible = templates.filter((template) => `${template.titulo} ${template.categoria} ${template.conteudo}`.toLowerCase().includes(query.toLowerCase()));
  return <><div className="mb-4 flex flex-col gap-2 sm:flex-row"><label className="flex h-10 flex-1 items-center gap-2 rounded-md border border-input bg-surface px-3"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Pesquisar templates..." /></label><Button onClick={onNew}><Plus className="size-4" />Novo template</Button></div><section className="panel overflow-hidden">{visible.length === 0 ? <EmptyState icon={<FileText className="size-4" />} title="Nenhum template encontrado" text="Crie templates internos para respostas recorrentes da operação." /> : <div className="divide-y divide-border">{visible.map((template) => <article key={template.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="text-sm font-semibold">{template.titulo}</h2><Badge>{template.categoria}</Badge></div><p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{template.conteudo}</p></div><div className="flex shrink-0 gap-1"><Button variant="outline" size="sm" onClick={() => onEdit(template)}>Editar</Button><Button variant="ghost" size="icon" onClick={() => onDelete(template)} aria-label="Excluir template"><Trash2 className="size-4 text-destructive" /></Button></div></article>)}</div>}</section>{open && <TemplateForm initial={editing} onClose={() => onSaved()} onSaved={onSaved} />}</>;
}

function TemplateForm({ initial, onClose, onSaved }: { initial: Template | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState(initial ? { categoria: initial.categoria, titulo: initial.titulo, conteudo: initial.conteudo } : emptyTemplate);
  const [error, setError] = useState("");
  async function save() {
    if (!form.titulo.trim() || !form.conteudo.trim()) return setError("Título e conteúdo são obrigatórios.");
    const userId = await currentUserId();
    const payload = { user_id: userId, categoria: form.categoria.trim() || "Geral", titulo: form.titulo.trim(), conteudo: form.conteudo.trim(), updated_at: new Date().toISOString() };
    const result = initial ? await db.from("message_templates").update(payload).eq("id", initial.id).eq("user_id", userId) : await db.from("message_templates").insert(payload);
    if (result.error) return setError(result.error.message);
    await onSaved();
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-background/75 p-4"><div className="w-full max-w-lg rounded-lg border border-border bg-popover p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-semibold">{initial ? "Editar template" : "Novo template"}</h2><Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button></div><div className="mt-4 grid gap-3"><input value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value })} className="h-10 rounded-md border border-input bg-surface px-3 text-sm" placeholder="Categoria" /><input value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} className="h-10 rounded-md border border-input bg-surface px-3 text-sm" placeholder="Título" /><textarea value={form.conteudo} onChange={(event) => setForm({ ...form, conteudo: event.target.value })} className="min-h-32 rounded-md border border-input bg-surface p-3 text-sm" placeholder="Conteúdo do template" />{error && <p className="text-xs text-destructive">{error}</p>}<Button onClick={save}>{initial ? "Salvar alterações" : "Criar template"}</Button></div></div></div>;
}
