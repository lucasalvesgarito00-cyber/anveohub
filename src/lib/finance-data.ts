import { supabase } from "@/integrations/supabase/client";

export type MovementType = "Receita" | "Despesa";
export type MovementStatus = "Pendente" | "Recebido" | "Pago" | "Cancelado";

export type FinancialMovement = {
  id: string;
  user_id: string;
  tipo: MovementType;
  categoria: string;
  descricao: string | null;
  valor: number;
  data: string;
  status: MovementStatus;
  cliente_id: string | null;
  lead_id: string | null;
  observacoes: string | null;
  recorrente: boolean;
  valor_mensal: number | null;
  data_inicio: string | null;
  status_recorrencia: "Ativa" | "Pausada" | "Encerrada" | null;
  created_at: string;
  updated_at: string;
};

export type FinancialForm = {
  tipo: MovementType;
  categoria: string;
  descricao: string;
  valor: string;
  data: string;
  status: MovementStatus;
  cliente_id: string;
  lead_id: string;
  observacoes: string;
  recorrente: boolean;
  valor_mensal: string;
  data_inicio: string;
  status_recorrencia: "Ativa" | "Pausada" | "Encerrada";
};

export const financeDb = supabase as any;

export async function financeUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sessão expirada");
  return data.user.id;
}

export function financeMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

export function financeDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`));
}

export function emptyFinancialForm(): FinancialForm {
  return {
    tipo: "Receita",
    categoria: "Vendas",
    descricao: "",
    valor: "",
    data: new Date().toISOString().slice(0, 10),
    status: "Pendente",
    cliente_id: "",
    lead_id: "",
    observacoes: "",
    recorrente: false,
    valor_mensal: "",
    data_inicio: new Date().toISOString().slice(0, 10),
    status_recorrencia: "Ativa",
  };
}

export function movementToForm(row: FinancialMovement): FinancialForm {
  return {
    tipo: row.tipo,
    categoria: row.categoria,
    descricao: row.descricao || "",
    valor: String(row.valor),
    data: row.data,
    status: row.status,
    cliente_id: row.cliente_id || "",
    lead_id: row.lead_id || "",
    observacoes: row.observacoes || "",
    recorrente: row.recorrente,
    valor_mensal: row.valor_mensal ? String(row.valor_mensal) : "",
    data_inicio: row.data_inicio || new Date().toISOString().slice(0, 10),
    status_recorrencia: row.status_recorrencia || "Ativa",
  };
}

export function movementPayload(form: FinancialForm, user_id: string) {
  const recorrente = form.recorrente;
  return {
    user_id,
    tipo: form.tipo,
    categoria: form.categoria.trim(),
    descricao: form.descricao.trim() || null,
    valor: Number(form.valor),
    data: form.data,
    status: form.tipo === "Despesa" && form.status === "Recebido" ? "Pago" : form.status,
    cliente_id: form.cliente_id || null,
    lead_id: form.lead_id || null,
    observacoes: form.observacoes.trim() || null,
    recorrente,
    valor_mensal: recorrente ? Number(form.valor_mensal) : null,
    data_inicio: recorrente ? form.data_inicio : null,
    status_recorrencia: recorrente ? form.status_recorrencia : null,
    updated_at: new Date().toISOString(),
  };
}
