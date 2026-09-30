import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, Check, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { PageHeader, Badge } from "@/components/anveo/page";
import { Button } from "@/components/ui/button";
import { financeDb, financeDate, financeMoney, financeUserId, emptyFinancialForm, movementPayload, movementToForm, type FinancialForm, type FinancialMovement, type MovementStatus, type MovementType } from "@/lib/finance-data";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — ANVEO HUB" }, { name: "description", content: "Gestão financeira integrada ao CRM." }] }),
  component: Financeiro,
});

type Contact = { id: string; nome?: string; nome_contato?: string | null; nome_empresa?: string | null };

function Financeiro() {
  const [rows, setRows] = useState<FinancialMovement[]>([]);
  const [clients, setClients] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<"todos" | "mes" | "trimestre">("mes");
  const [type, setType] = useState<"todos" | MovementType>("todos");
  const [status, setStatus] = useState<"todos" | MovementStatus>("todos");
  const [editing, setEditing] = useState<FinancialMovement | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const user_id = await financeUserId();
      const [movements, clientRows, leadRows] = await Promise.all([
        financeDb.from("movimentacoes_financeiras").select("*").eq("user_id", user_id).order("data", { ascending: false }).order("created_at", { ascending: false }),
        financeDb.from("clientes").select("id,nome,empresa").eq("user_id", user_id).order("nome"),
        financeDb.from("leads").select("id,nome_contato,nome_empresa,etapa,valor_potencial").eq("user_id", user_id).order("created_at", { ascending: false }),
      ]);
      if (movements.error) throw movements.error;
      if (clientRows.error) throw clientRows.error;
      if (leadRows.error) throw leadRows.error;
      setRows(movements.data || []);
      setClients(clientRows.data || []);
      setLeads(leadRows.data || []);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Não foi possível carregar o financeiro.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const now = new Date();
    return rows.filter((row) => {
      const rowDate = new Date(`${row.data}T12:00:00`);
      const matchesPeriod = period === "todos" || (period === "mes" && rowDate.getMonth() === now.getMonth() && rowDate.getFullYear() === now.getFullYear()) || (period === "trimestre" && rowDate >= new Date(now.getFullYear(), now.getMonth() - 2, 1));
      const text = `${row.categoria} ${row.descricao || ""} ${row.observacoes || ""}`.toLowerCase();
      return matchesPeriod && (type === "todos" || row.tipo === type) && (status === "todos" || row.status === status) && text.includes(query.toLowerCase());
    });
  }, [rows, query, period, type, status]);

  const totals = useMemo(() => ({
    receitas: visible.filter((row) => row.tipo === "Receita" && row.status !== "Cancelado").reduce((sum, row) => sum + Number(row.valor), 0),
    despesas: visible.filter((row) => row.tipo === "Despesa" && row.status !== "Cancelado").reduce((sum, row) => sum + Number(row.valor), 0),
    pendentes: visible.filter((row) => row.status === "Pendente").reduce((sum, row) => sum + Number(row.valor), 0),
  }), [visible]);

  async function remove(row: FinancialMovement) {
    if (!window.confirm(`Excluir a movimentação "${row.descricao || row.categoria}"?`)) return;
    const result = await financeDb.from("movimentacoes_financeiras").delete().eq("id", row.id);
    if (result.error) return setError(result.error.message);
    setMessage("Movimentação excluída.");
    load();
  }

  async function changeStatus(row: FinancialMovement, next: MovementStatus) {
    const result = await financeDb.from("movimentacoes_financeiras").update({ status: next, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (result.error) return setError(result.error.message);
    setMessage("Status atualizado.");
    load();
  }

  async function syncWonLeads() {
    setError("");
    try {
      const user_id = await financeUserId();
      const won = leads.filter((lead: any) => lead.etapa === "Ganho");
      let created = 0;
      for (const lead of won as any[]) {
        const marker = `Venda CRM: ${lead.id}`;
        const existing = await financeDb.from("movimentacoes_financeiras").select("id").eq("user_id", user_id).eq("descricao", marker).maybeSingle();
        if (existing.error) throw existing.error;
        if (existing.data) continue;
        const client = clients.find((item: any) => item.lead_id === lead.id);
        const result = await financeDb.from("movimentacoes_financeiras").insert({ user_id, tipo: "Receita", categoria: "Vendas", descricao: marker, valor: Number(lead.valor_potencial || 0), data: new Date().toISOString().slice(0, 10), status: "Recebido", cliente_id: client?.id || null, lead_id: lead.id, recorrente: false });
        if (result.error) throw result.error;
        created++;
      }
      setMessage(created ? `${created} venda(s) do CRM integrada(s) ao financeiro.` : "Nenhuma nova venda ganha para integrar.");
      load();
    } catch (value) { setError(value instanceof Error ? value.message : "Não foi possível sincronizar as vendas."); }
  }

  return <div className="mx-auto max-w-[1600px]">
    <PageHeader eyebrow="Controle financeiro" title="Financeiro" description="Receitas, despesas e vendas conectadas ao CRM." actions={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={syncWonLeads}><RefreshCw className="size-4" />Sincronizar vendas</Button><Button onClick={() => { setCreating(true); setEditing(null); }}><Plus className="size-4" />Nova movimentação</Button></div>} />
    {(message || error) && <div className={`mb-4 flex items-center justify-between rounded-md p-3 text-sm ${error ? "bg-destructive/10 text-destructive" : "bg-primary/10"}`}><span>{error || message}</span><button onClick={() => { setError(""); setMessage(""); }}><X className="size-4" /></button></div>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Receitas" value={financeMoney(totals.receitas)} icon={<ArrowUpRight className="size-4 text-success" />} /><Metric label="Despesas" value={financeMoney(totals.despesas)} icon={<ArrowDownRight className="size-4 text-destructive" />} /><Metric label="Resultado" value={financeMoney(totals.receitas - totals.despesas)} icon={<BarChart3 className="size-4 text-primary" />} /><Metric label="Pendentes" value={financeMoney(totals.pendentes)} icon={<RefreshCw className="size-4 text-warning" />} /></section>
    <section className="panel mt-4 overflow-hidden"><div className="flex flex-wrap gap-2 border-b border-border p-3"><label className="flex h-10 min-w-56 flex-1 items-center gap-2 rounded-md border border-input bg-background px-3"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Buscar categoria ou descrição" /></label><select value={period} onChange={(event) => setPeriod(event.target.value as typeof period)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="mes">Este mês</option><option value="trimestre">Último trimestre</option><option value="todos">Todos os períodos</option></select><select value={type} onChange={(event) => setType(event.target.value as typeof type)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="todos">Todos os tipos</option><option value="Receita">Receitas</option><option value="Despesa">Despesas</option></select><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="todos">Todos os status</option><option value="Pendente">Pendentes</option><option value="Recebido">Recebidos</option><option value="Pago">Pagos</option><option value="Cancelado">Cancelados</option></select></div>{loading ? <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">Carregando movimentações...</div> : visible.length === 0 ? <div className="flex min-h-56 flex-col items-center justify-center gap-2 p-6 text-center"><BarChart3 className="size-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhuma movimentação encontrada neste período.</p><Button variant="outline" onClick={() => { setCreating(true); setEditing(null); }}>Cadastrar primeira movimentação</Button></div> : <div className="divide-y divide-border">{visible.map((row) => <MovementRow key={row.id} row={row} clients={clients} leads={leads} onEdit={() => { setEditing(row); setCreating(false); }} onDelete={() => remove(row)} onStatus={(next) => changeStatus(row, next)} />)}</div>}</section>
    {(creating || editing) && <MovementForm initial={editing ? movementToForm(editing) : emptyFinancialForm()} clients={clients} leads={leads} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => { setCreating(false); setEditing(null); setMessage("Movimentação salva com sucesso."); load(); }} onError={setError} />}
  </div>;
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <article className="panel p-4"><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{label}</span>{icon}</div><strong className="mt-3 block text-xl font-semibold">{value}</strong></article>; }

function MovementRow({ row, clients, leads, onEdit, onDelete, onStatus }: { row: FinancialMovement; clients: Contact[]; leads: Contact[]; onEdit: () => void; onDelete: () => void; onStatus: (status: MovementStatus) => void }) { const contact = clients.find((item) => item.id === row.cliente_id) || leads.find((item) => item.id === row.lead_id); const statusOptions: MovementStatus[] = row.tipo === "Receita" ? ["Pendente", "Recebido", "Cancelado"] : ["Pendente", "Pago", "Cancelado"]; return <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_130px_130px_150px_auto] lg:items-center"><div className="min-w-0"><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${row.tipo === "Receita" ? "bg-success" : "bg-destructive"}`} /><h3 className="truncate text-sm font-semibold">{row.descricao || row.categoria}</h3>{row.recorrente && <Badge tone="blue">Recorrente</Badge>}</div><p className="mt-1 truncate text-xs text-muted-foreground">{row.categoria}{contact ? ` · ${contact.nome || contact.nome_contato || contact.nome_empresa}` : ""}{row.observacoes ? ` · ${row.observacoes}` : ""}</p></div><span className="text-xs text-muted-foreground">{financeDate(row.data)}</span><strong className={row.tipo === "Receita" ? "text-sm text-success" : "text-sm text-destructive"}>{row.tipo === "Receita" ? "+" : "−"}{financeMoney(row.valor)}</strong><select value={row.status} onChange={(event) => onStatus(event.target.value as MovementStatus)} className="h-9 rounded-md border border-input bg-background px-2 text-xs">{statusOptions.map((item) => <option key={item}>{item}</option>)}</select><div className="flex gap-1 lg:justify-end"><Button variant="ghost" size="icon" onClick={onEdit} aria-label="Editar"><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" onClick={onDelete} aria-label="Excluir"><Trash2 className="size-4 text-destructive" /></Button></div></div>; }

function MovementForm({ initial, clients, leads, onClose, onSaved, onError }: { initial: FinancialForm; clients: Contact[]; leads: Contact[]; onClose: () => void; onSaved: () => void; onError: (message: string) => void }) { const [form, setForm] = useState(initial); const [saving, setSaving] = useState(false); const update = <K extends keyof FinancialForm>(key: K, value: FinancialForm[K]) => setForm((current) => ({ ...current, [key]: value })); async function save() { if (!form.categoria.trim() || !form.valor || Number(form.valor) <= 0 || !form.data) return onError("Preencha categoria, valor e data com valores válidos."); if (form.recorrente && (!form.valor_mensal || Number(form.valor_mensal) <= 0 || !form.data_inicio)) return onError("Preencha valor mensal e data de início da recorrência."); setSaving(true); try { const user_id = await financeUserId(); const payload = movementPayload(form, user_id); const result = initial && (initial as any).id ? await financeDb.from("movimentacoes_financeiras").update(payload).eq("id", (initial as any).id) : await financeDb.from("movimentacoes_financeiras").insert(payload); if (result.error) throw result.error; onSaved(); } catch (value) { onError(value instanceof Error ? value.message : "Não foi possível salvar a movimentação."); } finally { setSaving(false); } } return <div className="fixed inset-0 z-50 grid place-items-center bg-background/75 p-4"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-popover p-5 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="font-semibold">{(initial as any).id ? "Editar movimentação" : "Nova movimentação"}</h2><p className="text-xs text-muted-foreground">Os dados serão persistidos no Supabase.</p></div><Button variant="ghost" size="icon" onClick={onClose}><X className="size-4" /></Button></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Field label="Tipo"><select value={form.tipo} onChange={(event) => update("tipo", event.target.value as MovementType)} className="field"><option>Receita</option><option>Despesa</option></select></Field><Field label="Status"><select value={form.status} onChange={(event) => update("status", event.target.value as MovementStatus)} className="field">{(form.tipo === "Receita" ? ["Pendente", "Recebido", "Cancelado"] : ["Pendente", "Pago", "Cancelado"]).map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Categoria"><input value={form.categoria} onChange={(event) => update("categoria", event.target.value)} className="field" placeholder="Vendas, equipe, ferramentas..." /></Field><Field label="Valor"><input type="number" min="0.01" step="0.01" value={form.valor} onChange={(event) => update("valor", event.target.value)} className="field" placeholder="0,00" /></Field><Field label="Data"><input type="date" value={form.data} onChange={(event) => update("data", event.target.value)} className="field" /></Field><Field label="Descrição"><input value={form.descricao} onChange={(event) => update("descricao", event.target.value)} className="field" placeholder="Descrição da movimentação" /></Field><Field label="Cliente"><select value={form.cliente_id} onChange={(event) => update("cliente_id", event.target.value)} className="field"><option value="">Sem cliente</option>{clients.map((client: any) => <option key={client.id} value={client.id}>{client.nome}{client.empresa ? ` · ${client.empresa}` : ""}</option>)}</select></Field><Field label="Lead"><select value={form.lead_id} onChange={(event) => update("lead_id", event.target.value)} className="field"><option value="">Sem lead</option>{leads.map((lead: any) => <option key={lead.id} value={lead.id}>{lead.nome_contato || lead.nome_empresa || "Lead sem nome"}</option>)}</select></Field><Field label="Observações" full><textarea value={form.observacoes} onChange={(event) => update("observacoes", event.target.value)} className="field min-h-20 py-2" placeholder="Informações adicionais" /></Field><label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={form.recorrente} onChange={(event) => update("recorrente", event.target.checked)} />Esta é uma receita recorrente</label>{form.recorrente && <><Field label="Valor mensal"><input type="number" min="0.01" step="0.01" value={form.valor_mensal} onChange={(event) => update("valor_mensal", event.target.value)} className="field" /></Field><Field label="Data de início"><input type="date" value={form.data_inicio} onChange={(event) => update("data_inicio", event.target.value)} className="field" /></Field><Field label="Status da recorrência"><select value={form.status_recorrencia} onChange={(event) => update("status_recorrencia", event.target.value as FinancialForm["status_recorrencia"])} className="field"><option>Ativa</option><option>Pausada</option><option>Encerrada</option></select></Field></>}</div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? "Salvando..." : <><Check className="size-4" />Salvar movimentação</>}</Button></div></div></div>; }

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) { return <label className={`grid gap-1.5 ${full ? "sm:col-span-2" : ""}`}><span className="text-xs font-medium">{label}</span>{children}</label>; }
