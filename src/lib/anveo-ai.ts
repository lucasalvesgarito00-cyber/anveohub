import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const fallbackAnswer = (question: string, context: { leads: LeadContext[]; tasks: TaskContext[]; clients: ClientContext[] }) => {
  const normalized = question.toLowerCase();
  const overdueTasks = context.tasks.filter((task) => task.status !== "concluida" && task.data < new Date().toISOString().slice(0, 10));
  const priorityLeads = context.leads.filter((lead) => ["alta", "urgente"].includes(String(lead.prioridade).toLowerCase()));
  const inactiveLeads = context.leads.filter((lead) => !lead.proximo_follow_up);

  if (normalized.includes("planejamento") || normalized.includes("planeje") || normalized.includes("dia")) {
    return `Planejamento sugerido: revisar ${overdueTasks.length} tarefa(s) atrasada(s), priorizar ${priorityLeads.length} lead(s) de alta prioridade e criar follow-ups para ${inactiveLeads.length} lead(s) sem próximo contato. Nenhuma ação foi executada automaticamente.`;
  }
  if (normalized.includes("sem atividade") || normalized.includes("inativo") || normalized.includes("inativa")) {
    return inactiveLeads.length ? `Identifiquei ${inactiveLeads.length} lead(s) sem próximo follow-up registrado. Recomendo revisar esses contatos e criar tarefas de acompanhamento após confirmar cada ação.` : "Todos os leads atuais possuem um próximo follow-up registrado.";
  }
  if (normalized.includes("follow") || normalized.includes("tarefa") || normalized.includes("atrasad")) {
    if (!overdueTasks.length) return "Não encontrei tarefas atrasadas entre os seus dados atuais. Posso ajudar a revisar os próximos follow-ups.";
    return `Encontrei ${overdueTasks.length} tarefa(s) atrasada(s). Priorize as atividades mais antigas e registre o próximo contato após cada retorno. Esta é uma análise baseada nos dados reais da sua conta; nenhuma ação foi executada automaticamente.`;
  }
  if (normalized.includes("lead") || normalized.includes("prior") || normalized.includes("oportun")) {
    if (!priorityLeads.length) return `Você tem ${context.leads.length} lead(s) cadastrado(s), mas nenhum marcado com prioridade alta ou urgente.`;
    const names = priorityLeads.slice(0, 3).map((lead) => lead.nome_contato || lead.nome_empresa || "Lead sem nome").join(", ");
    return `Há ${priorityLeads.length} lead(s) com prioridade alta ou urgente. Comece por ${names}. Recomendo revisar o último contato, o valor potencial e o próximo follow-up antes de abordar cada oportunidade.`;
  }
  if (normalized.includes("mensagem") || normalized.includes("e-mail") || normalized.includes("email")) {
    return "Posso gerar uma mensagem personalizada com base nos dados permitidos. Você poderá copiá-la ou criar uma tarefa de envio, mas nenhum canal externo será acionado automaticamente.";
  }
  if (normalized.includes("cliente") || normalized.includes("venda")) {
    return `Sua base tem ${context.clients.length} cliente(s) e ${context.leads.length} lead(s). Use o CRM para comparar oportunidades abertas com clientes já fechados. Esta resposta é uma análise, não uma ação automática.`;
  }
  return `Analisei ${context.leads.length} lead(s), ${context.tasks.length} tarefa(s) e ${context.clients.length} cliente(s) da sua conta. Posso ajudar a priorizar leads, planejar o dia, encontrar follow-ups atrasados ou preparar mensagens. Nenhuma ação foi executada sem sua confirmação.`;
};

type LeadContext = { nome_contato: string | null; nome_empresa: string | null; etapa: string | null; prioridade: string | null; valor_potencial: number | null; proximo_follow_up: string | null };
type TaskContext = { titulo: string; data: string; status: string; prioridade: string };
type ClientContext = { nome: string; empresa: string | null; status: string; valor_fechado: number | null };
type AiRequest = { conversationId: string; question: string };
type ActionPayload = Record<string, unknown>;

const injectionPattern = /(ignore\s+(all|previous|above)|system\s+prompt|developer\s+message|reveal\s+(your|the)\s+instructions|desconsidere\s+(todas|as)\s+instruções|prompt\s+injection)/i;

function interpretAction(question: string): { action_type: string; entity_type: string; payload: ActionPayload } | null {
  const normalized = question.toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  const amountMatch = question.match(/(?:r\$\s*)?([0-9]+(?:[.,][0-9]{2})?)/i);
  const asksTask = /(crie| criar|adicione|agende|planeje).*(tarefa|follow[- ]?up)|tarefa.*(criar|nova)|follow[- ]?up.*(criar|agendar)/i.test(question);
  if (asksTask) {
    const cleanTitle = question.replace(/^(crie|criar|adicione|agende|planeje)\s+(uma\s+)?(tarefa|follow[- ]?up)?\s*/i, "").trim();
    return { action_type: "create_task", entity_type: "tarefas", payload: { titulo: cleanTitle.slice(0, 160) || "Novo follow-up", descricao: "Criada a partir de uma recomendação do Command Center.", data: date, horario: null, tipo: normalized.includes("follow") ? "follow_up" : "tarefa", prioridade: normalized.includes("urgente") ? "urgente" : "media" } };
  }
  if (/(registre|crie|adicione).*(atividade|observação|observacao)/i.test(question)) {
    return { action_type: "create_activity", entity_type: "atividades", payload: { tipo: "observacao", titulo: question.slice(0, 120), descricao: question.slice(0, 500), data: date, status: "registrada" } };
  }
  if (/(lance|registre|crie|adicione).*(receita|despesa|movimenta)/i.test(question) && amountMatch) {
    const value = Number(amountMatch[1].replace(".", "").replace(",", "."));
    const tipo = normalized.includes("despesa") ? "Despesa" : "Receita";
    return { action_type: "create_financial_movement", entity_type: "movimentacoes_financeiras", payload: { tipo, categoria: "Operacional", descricao: question.slice(0, 160), valor: value, data: date, status: tipo === "Receita" ? "Pendente" : "Pendente", recorrente: false } };
  }
  return null;
}

export const askAnveoAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: AiRequest) => data)
  .handler(async ({ data, context }) => {
    const question = data.question.trim();
    if (!question) throw new Error("Digite uma pergunta para continuar.");
    if (question.length > 4000) throw new Error("A pergunta excede o limite permitido.");
    const db = context.supabase as any;
    const userId = context.userId;
    const { data: conversation, error: conversationError } = await db.from("ai_conversations").select("id, title").eq("id", data.conversationId).eq("user_id", userId).maybeSingle();
    if (conversationError) throw conversationError;
    if (!conversation) throw new Error("Conversa não encontrada.");
    const { error: userMessageError } = await db.from("ai_messages").insert({ conversation_id: conversation.id, user_id: userId, role: "user", content: question });
    if (userMessageError) throw userMessageError;
    const [{ data: leads }, { data: tasks }, { data: clients }] = await Promise.all([
      db.from("leads").select("nome_contato,nome_empresa,etapa,prioridade,valor_potencial,proximo_follow_up").eq("user_id", userId).order("updated_at", { ascending: false }).limit(50),
      db.from("tarefas").select("titulo,data,status,prioridade").eq("user_id", userId).order("data", { ascending: true }).limit(50),
      db.from("clientes").select("nome,empresa,status,valor_fechado").eq("user_id", userId).order("updated_at", { ascending: false }).limit(50),
    ]);
    const contextData = { leads: (leads || []) as LeadContext[], tasks: (tasks || []) as TaskContext[], clients: (clients || []) as ClientContext[] };
    const action = injectionPattern.test(question) ? null : interpretAction(question);
    let answer = injectionPattern.test(question)
      ? "Não posso seguir instruções que tentem alterar minhas regras de segurança ou acessar instruções internas. Posso ajudar usando somente os dados autorizados da sua conta."
      : fallbackAnswer(question, contextData);
    let savedAction: any = null;
    if (action) {
      const result = await db.from("ai_actions").insert({ user_id: userId, conversation_id: conversation.id, action_type: action.action_type, entity_type: action.entity_type, payload: action.payload, status: "proposed" }).select("*").single();
      if (result.error) throw result.error;
      savedAction = result.data;
      answer = `Preparei uma ação segura: ${action.action_type === "create_task" ? "criar uma tarefa" : action.action_type === "create_activity" ? "registrar uma atividade" : "criar uma movimentação financeira"}. Revise os dados e confirme no card antes de executar. Nenhuma alteração foi feita ainda.`;
    }
    const { data: assistantMessage, error: assistantError } = await db.from("ai_messages").insert({ conversation_id: conversation.id, user_id: userId, role: "assistant", content: answer }).select("id,conversation_id,user_id,role,content,created_at").single();
    if (assistantError) throw assistantError;
    await db.from("ai_conversations").update({ updated_at: new Date().toISOString(), title: conversation.title || question.slice(0, 80) }).eq("id", conversation.id).eq("user_id", userId);
    return { message: assistantMessage, action: savedAction };
  });

export const listAnveoActions = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await (context.supabase as any).from("ai_actions").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(30);
  if (error) throw error;
  return data || [];
});

export const updateAnveoAction = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data: { actionId: string; operation: "confirm" | "cancel" }) => data).handler(async ({ data, context }) => {
  const db = context.supabase as any;
  const { data: action, error } = await db.from("ai_actions").select("*").eq("id", data.actionId).eq("user_id", context.userId).maybeSingle();
  if (error) throw error;
  if (!action) throw new Error("Ação não encontrada.");
  if (action.status !== "proposed" && !(data.operation === "confirm" && action.status === "confirmed")) throw new Error("Esta ação não pode mais ser alterada.");
  if (data.operation === "cancel") {
    const result = await db.from("ai_actions").update({ status: "cancelled" }).eq("id", action.id).eq("user_id", context.userId).select("*").single();
    if (result.error) throw result.error;
    return result.data;
  }
  const confirmed = await db.from("ai_actions").update({ status: "confirmed" }).eq("id", action.id).eq("user_id", context.userId).eq("status", "proposed").select("*").single();
  if (confirmed.error) throw confirmed.error;
  try {
    const payload = action.payload as ActionPayload;
    let table = "";
    if (action.action_type === "create_task") table = "tarefas";
    else if (action.action_type === "create_activity") table = "atividades";
    else if (action.action_type === "create_financial_movement") table = "movimentacoes_financeiras";
    else throw new Error("Tipo de ação não permitido.");
    const { error: insertError } = await db.from(table).insert({ ...payload, user_id: context.userId });
    if (insertError) throw insertError;
    const result = await db.from("ai_actions").update({ status: "executed", executed_at: new Date().toISOString() }).eq("id", action.id).eq("user_id", context.userId).select("*").single();
    if (result.error) throw result.error;
    return result.data;
  } catch (executionError) {
    await db.from("ai_actions").update({ status: "failed" }).eq("id", action.id).eq("user_id", context.userId);
    throw executionError;
  }
});