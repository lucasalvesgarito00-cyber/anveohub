import { useState, type ReactNode } from "react";
import { currentLeadOwner, db, type LeadRow } from "@/lib/crm-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const stages = ["Novo Lead", "Contato realizado", "Qualificado", "Proposta", "Negociação", "Ganho", "Perdido"];
const priorities = [{ value: "baixa", label: "Baixa" }, { value: "media", label: "Média" }, { value: "alta", label: "Alta" }, { value: "urgente", label: "Urgente" }];
const emptyForm = { nome_contato: "", nome_empresa: "", telefone_whatsapp: "", email: "", segmento: "", origem: "", etapa: "Novo Lead", valor_potencial: "", prioridade: "media", observacoes: "" };

type LeadForm = typeof emptyForm;

export function LeadDialog({ trigger, onCreated }: { trigger: ReactNode; onCreated: (lead: LeadRow) => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (field: keyof LeadForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  async function save() {
    setError("");
    if (!form.nome_contato.trim() && !form.nome_empresa.trim()) {
      setError("Informe o nome do contato ou da empresa.");
      return;
    }
    const value = form.valor_potencial.trim() ? Number(form.valor_potencial.replace(/\./g, "").replace(",", ".")) : null;
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      setError("Informe um valor potencial válido.");
      return;
    }
    setSaving(true);
    try {
      const owner = await currentLeadOwner();
      const payload = {
        user_id: owner.user_id,
        workspace_id: owner.workspace_id,
        nome_contato: form.nome_contato.trim() || null,
        nome_empresa: form.nome_empresa.trim() || null,
        telefone_whatsapp: form.telefone_whatsapp.trim() || null,
        email: form.email.trim() || null,
        segmento: form.segmento.trim() || null,
        origem: form.origem.trim() || null,
        etapa: form.etapa,
        valor_potencial: value,
        prioridade: form.prioridade,
        observacoes: form.observacoes.trim() || null,
      };
      const result = await db.from("leads").insert(payload).select("*").single();
      if (result.error) throw result.error;
      await onCreated(result.data as LeadRow);
      setForm(emptyForm);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar o lead.");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = "h-10 rounded-md border border-input bg-surface px-3 text-sm";
  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setError(""); }}><DialogTrigger asChild>{trigger}</DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Novo lead</DialogTitle><DialogDescription>Cadastre uma nova oportunidade no pipeline comercial.</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><div className="grid gap-4 sm:grid-cols-2"><Field label="Nome do contato"><Input value={form.nome_contato} onChange={(event) => update("nome_contato", event.target.value)} /></Field><Field label="Empresa"><Input value={form.nome_empresa} onChange={(event) => update("nome_empresa", event.target.value)} /></Field><Field label="Telefone/WhatsApp"><Input type="tel" value={form.telefone_whatsapp} onChange={(event) => update("telefone_whatsapp", event.target.value)} /></Field><Field label="E-mail"><Input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} /></Field><Field label="Segmento"><Input value={form.segmento} onChange={(event) => update("segmento", event.target.value)} /></Field><Field label="Origem"><Input value={form.origem} onChange={(event) => update("origem", event.target.value)} /></Field><Field label="Etapa"><select value={form.etapa} onChange={(event) => update("etapa", event.target.value)} className={fieldClass}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></Field><Field label="Prioridade"><select value={form.prioridade} onChange={(event) => update("prioridade", event.target.value)} className={fieldClass}>{priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}</select></Field></div><Field label="Valor potencial"><Input inputMode="decimal" value={form.valor_potencial} onChange={(event) => update("valor_potencial", event.target.value)} placeholder="0,00" /></Field><Field label="Observações"><textarea value={form.observacoes} onChange={(event) => update("observacoes", event.target.value)} className="min-h-24 rounded-md border border-input bg-surface p-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring" /></Field>{error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}</div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar lead"}</Button></DialogFooter></DialogContent></Dialog>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}