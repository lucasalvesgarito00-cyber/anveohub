import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { PageHeader, Badge } from "@/components/anveo/page";
import { Button } from "@/components/ui/button";
import { db, currentUserId, formatDate, today, type ClienteRow, type LeadRow, type TarefaRow } from "@/lib/crm-data";

export const Route = createFileRoute("/_authenticated/tarefas")({
  head: () => ({ meta: [{ title: "Tarefas — ANVEO HUB" }] }),
  component: Tasks,
});

const filters = ["Hoje", "Atrasadas", "Próximas", "Concluídas", "Todas"] as const;
const emptyForm = { titulo: "", descricao: "", data: today(), horario: "", tipo: "tarefa", prioridade: "media", lead_id: "", cliente_id: "" };

function Tasks() {
  const [rows, setRows] = useState<TarefaRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]>("Hoje");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<TarefaRow | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const user_id = await currentUserId();
    const [tasks, leadRows, clientRows] = await Promise.all([
      db.from("tarefas").select("*").eq("user_id", user_id).order("data", { ascending: true }).order("horario", { ascending: true }),
      db.from("leads").select("*").eq("user_id", user_id).order("nome_contato"),
      db.from("clientes").select("*").eq("user_id", user_id).order("nome"),
    ]);
    if (tasks.error) throw tasks.error;
    setRows(tasks.data || []);
    setLeads(leadRows.data || []);
    setClientes(clientRows.data || []);
  }
  useEffect(() => { load().catch((error) => setMessage(error.message)); }, []);

  const visible = useMemo(() => {
    const now = today();
    return rows.filter((row) => {
      const text = `${row.titulo} ${row.descricao || ""}`.toLowerCase();
      if (!text.includes(query.toLowerCase())) return false;
      if (filter === "Concluídas") return row.status === "concluida";
      if (filter === "Atrasadas") return row.status !== "concluida" && row.data < now;
      if (filter === "Hoje") return row.data === now && row.status !== "concluida";
      if (filter === "Próximas") return row.data > now && row.status !== "concluida";
      return true;
    });
  }, [rows, filter, query]);

  async function setStatus(row: TarefaRow, status: TarefaRow["status"]) {
    const { error } = await db.from("tarefas").update({ status, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (error) return setMessage(error.message);
    await load();
  }
  async function remove(row: TarefaRow) {
    if (!window.confirm("Excluir esta tarefa?")) return;
    const { error } = await db.from("tarefas").delete().eq("id", row.id);
    if (error) return setMessage(error.message);
    await load();
  }

  return <div className="mx-auto max-w-6xl">
    <PageHeader eyebrow="Atividades" title="Tarefas e follow-ups" description="Organize ações comerciais usando dados reais da operação." actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4" />Criar tarefa</Button>} />
    {message && <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{message}</div>}
    <div className="mb-4 flex flex-col gap-2 sm:flex-row"><label className="flex h-10 flex-1 items-center gap-2 rounded-md border border-input bg-surface px-3"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Pesquisar tarefas..." /></label><div className="flex gap-1 overflow-x-auto rounded-md bg-muted/40 p-1">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded px-3 py-2 text-xs ${filter === item ? "bg-surface-raised font-medium shadow-sm" : "text-muted-foreground"}`}>{item}</button>)}</div></div>
    <section className="panel overflow-hidden"><div className="border-b border-border p-4"><h2 className="text-sm font-semibold">{filter}</h2><p className="text-xs text-muted-foreground">{visible.length} tarefa(s) encontrada(s)</p></div>{visible.length === 0 ? <div className="flex min-h-56 flex-col items-center justify-center gap-2 p-6 text-center"><Check className="size-8 text-muted-foreground" /><h3 className="text-sm font-semibold">Nenhuma tarefa aqui</h3><p className="text-xs text-muted-foreground">Crie uma tarefa ou ajuste o filtro para continuar.</p></div> : <div className="divide-y divide-border">{visible.map((row) => { const late = row.status !== "concluida" && row.data < today(); const relation = row.lead_id ? leads.find((lead) => lead.id === row.lead_id) : row.cliente_id ? clientes.find((client) => client.id === row.cliente_id) : null; return <div key={row.id} className={`grid gap-3 p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] ${row.status === "concluida" ? "opacity-60" : ""}`}><button onClick={() => setStatus(row, row.status === "concluida" ? "pendente" : "concluida")} className={`mt-1 grid size-5 place-items-center rounded-full border ${row.status === "concluida" ? "border-success bg-success text-background" : "border-muted-foreground"}`}>{row.status === "concluida" && <Check className="size-3" />}</button><div className="min-w-0"><p className={`text-sm font-medium ${row.status === "concluida" ? "line-through" : ""}`}>{row.titulo}</p>{row.descricao && <p className="mt-1 text-xs text-muted-foreground">{row.descricao}</p>}<p className="mt-2 text-xs text-muted-foreground">{relation ? <>Relacionado a <Link className="text-primary" to={row.lead_id ? "/leads/$leadId" : "/clientes"} params={row.lead_id ? { leadId: row.lead_id } : undefined}>{"nome_contato" in relation ? relation.nome_contato || relation.nome_empresa : relation.nome}</Link></> : "Sem relacionamento"}</p></div><div className="flex items-center gap-2 md:justify-end"><div className="text-right"><Badge tone={late ? "red" : row.status === "concluida" ? "green" : "neutral"}>{late ? "Atrasada" : row.status === "concluida" ? "Concluída" : row.tipo}</Badge><span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground"><Clock3 className="size-3" />{formatDate(row.data)}{row.horario ? ` · ${row.horario.slice(0, 5)}` : ""}</span></div><Button variant="ghost" size="icon" onClick={() => { setEditing(row); setOpen(true); }} aria-label="Editar"><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" onClick={() => remove(row)} aria-label="Excluir"><Trash2 className="size-4 text-destructive" /></Button></div></div>; })}</div>}</section>
    {open && <TaskForm initial={editing} leads={leads} clientes={clientes} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />}
  </div>;
}

function TaskForm({ initial, leads, clientes, onClose, onSaved }: { initial: TarefaRow | null; leads: LeadRow[]; clientes: ClienteRow[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(initial ? { ...initial } : emptyForm);
  const [error, setError] = useState("");
  const update = (key: string, value: string) => setForm((current: any) => ({ ...current, [key]: value }));
  async function save() {
    if (!form.titulo || !form.data) return setError("Título e data são obrigatórios.");
    const user_id = await currentUserId();
    const payload = { user_id, titulo: form.titulo, descricao: form.descricao || null, data: form.data, horario: form.horario || null, tipo: form.tipo, prioridade: form.prioridade, lead_id: form.lead_id || null, cliente_id: form.cliente_id || null, status: initial?.status || "pendente" };
    const result = initial ? await db.from("tarefas").update(payload).eq("id", initial.id) : await db.from("tarefas").insert(payload);
    if (result.error) return setError(result.error.message);
    onSaved();
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-background/75 p-4"><div className="w-full max-w-lg rounded-lg border border-border bg-popover p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-semibold">{initial ? "Editar tarefa" : "Nova tarefa"}</h2><Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button></div><div className="mt-4 grid gap-3"><input value={form.titulo} onChange={(e) => update("titulo", e.target.value)} className="h-10 rounded-md border border-input bg-surface px-3 text-sm" placeholder="Título" /><textarea value={form.descricao || ""} onChange={(e) => update("descricao", e.target.value)} className="min-h-20 rounded-md border border-input bg-surface p-3 text-sm" placeholder="Descrição" /><div className="grid gap-3 sm:grid-cols-2"><input type="date" value={form.data} onChange={(e) => update("data", e.target.value)} className="h-10 rounded-md border border-input bg-surface px-3 text-sm" /><input type="time" value={form.horario || ""} onChange={(e) => update("horario", e.target.value)} className="h-10 rounded-md border border-input bg-surface px-3 text-sm" /></div><div className="grid gap-3 sm:grid-cols-2"><select value={form.tipo} onChange={(e) => update("tipo", e.target.value)} className="h-10 rounded-md border border-input bg-surface px-3 text-sm">{["ligacao", "email", "reuniao", "follow_up", "tarefa", "outro"].map((item) => <option key={item}>{item}</option>)}</select><select value={form.prioridade} onChange={(e) => update("prioridade", e.target.value)} className="h-10 rounded-md border border-input bg-surface px-3 text-sm">{["baixa", "media", "alta", "urgente"].map((item) => <option key={item}>{item}</option>)}</select></div><select value={form.lead_id || ""} onChange={(e) => update("lead_id", e.target.value)} className="h-10 rounded-md border border-input bg-surface px-3 text-sm"><option value="">Sem lead relacionado</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.nome_contato || lead.nome_empresa || "Lead"}</option>)}</select><select value={form.cliente_id || ""} onChange={(e) => update("cliente_id", e.target.value)} className="h-10 rounded-md border border-input bg-surface px-3 text-sm"><option value="">Sem cliente relacionado</option>{clientes.map((client) => <option key={client.id} value={client.id}>{client.nome}</option>)}</select>{error && <p className="text-xs text-destructive">{error}</p>}<Button onClick={save}>{initial ? "Salvar alterações" : "Criar tarefa"}</Button></div></div></div>;
}
