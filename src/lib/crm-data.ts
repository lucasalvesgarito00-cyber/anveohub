import { supabase } from "@/integrations/supabase/client";

export type LeadRow = {
  id: string;
  user_id: string;
  nome_contato: string | null;
  nome_empresa: string | null;
  telefone_whatsapp: string | null;
  email: string | null;
  segmento: string | null;
  origem: string | null;
  responsavel: string | null;
  etapa: string | null;
  valor_potencial: number | null;
  prioridade: string | null;
  observacoes: string | null;
  proximo_follow_up: string | null;
  created_at: string;
  updated_at: string;
};

export type ClienteRow = {
  id: string;
  user_id: string;
  lead_id: string | null;
  nome: string;
  empresa: string | null;
  email: string | null;
  telefone: string | null;
  status: "ativo" | "inativo" | "fechado";
  valor_fechado: number | null;
  data_fechamento: string | null;
  created_at: string;
  updated_at: string;
};

export type TarefaRow = {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string | null;
  lead_id: string | null;
  cliente_id: string | null;
  tipo: "ligacao" | "email" | "reuniao" | "follow_up" | "tarefa" | "outro";
  data: string;
  horario: string | null;
  prioridade: "baixa" | "media" | "alta" | "urgente";
  status: "pendente" | "em_andamento" | "concluida" | "cancelada";
  created_at: string;
  updated_at: string;
};

export type AtividadeRow = {
  id: string;
  user_id: string;
  lead_id: string | null;
  cliente_id: string | null;
  tarefa_id: string | null;
  tipo: string;
  titulo: string | null;
  descricao: string | null;
  data: string;
  horario: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};

export const db = supabase as any;

export async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sessão expirada");
  return data.user.id as string;
}

export async function currentLeadOwner() {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", user_id)
    .maybeSingle();
  if (error) throw error;
  return { user_id, workspace_id: data?.workspace_id ?? null };
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function initials(value: string | null | undefined) {
  return (value || "Cliente")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`));
}

export function money(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value || 0);
}

export async function ensureClienteFromLead(lead: LeadRow) {
  const user_id = await currentUserId();
  const { data: existing, error: findError } = await db
    .from("clientes")
    .select("id")
    .eq("user_id", user_id)
    .eq("lead_id", lead.id)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing.id as string;
  const { data, error } = await db
    .from("clientes")
    .insert({
      user_id,
      lead_id: lead.id,
      nome: lead.nome_contato || lead.nome_empresa || "Cliente sem nome",
      empresa: lead.nome_empresa,
      email: lead.email,
      telefone: lead.telefone_whatsapp,
      status: "fechado",
      valor_fechado: lead.valor_potencial,
      data_fechamento: today(),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}
