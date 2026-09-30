import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const fallbackAnswer = (question: string, context: { leads: LeadContext[]; tasks: TaskContext[]; clients: ClientContext[] }) => {
  const normalized = question.toLowerCase();
  const overdueTasks = context.tasks.filter((task) => task.status !== "concluida" && task.data < new Date().toISOString().slice(0, 10));
  const priorityLeads = context.leads.filter((lead) => ["alta", "urgente"].includes(String(lead.prioridade).toLowerCase()));

  if (normalized.includes("follow") || normalized.includes("tarefa") || normalized.includes("atrasad")) {
    if (!overdueTasks.length) return "Não encontrei tarefas atrasadas entre os seus dados atuais. Posso ajudar a revisar os próximos follow-ups.";
    return `Encontrei ${overdueTasks.length} tarefa(s) atrasada(s). Priorize as atividades mais antigas e registre o próximo contato após cada retorno. Esta é uma análise baseada nos dados reais da sua conta; nenhuma ação foi executada automaticamente.`;
  }

  if (normalized.includes("lead") || normalized.includes("prior") || normalized.includes("oportun")) {
    if (!priorityLeads.length) return `Você tem ${context.leads.length} lead(s) cadastrado(s), mas nenhum marcado com prioridade alta ou urgente.`;
    const names = priorityLeads.slice(0, 3).map((lead) => lead.nome_contato || lead.nome_empresa || "Lead sem nome").join(", ");
    return `Há ${priorityLeads.length} lead(s) com prioridade alta ou urgente. Comece por ${names}. Recomendo revisar o último contato, o valor potencial e o próximo follow-up antes de abordar cada oportunidade.`;
  }

  if (normalized.includes("cliente") || normalized.includes("venda")) {
    return `Sua base tem ${context.clients.length} cliente(s) e ${context.leads.length} lead(s). Use o CRM para comparar oportunidades abertas com clientes já fechados e identificar novas possibilidades de expansão. Esta resposta é uma análise, não uma ação automática.`;
  }

  return `Analisei ${context.leads.length} lead(s), ${context.tasks.length} tarefa(s) e ${context.clients.length} cliente(s) da sua conta. Posso ajudar a priorizar leads, encontrar follow-ups atrasados ou resumir a operação comercial. As informações acima são dados e análises; nenhuma ação foi executada sem sua confirmação.`;
};

type LeadContext = { nome_contato: string | null; nome_empresa: string | null; etapa: string | null; prioridade: string | null; valor_potencial: number | null; proximo_follow_up: string | null };
type TaskContext = { titulo: string; data: string; status: string; prioridade: string };
type ClientContext = { nome: string; empresa: string | null; status: string; valor_fechado: number | null };

type AiRequest = { conversationId: string; question: string };

export const askAnveoAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: AiRequest) => data)
  .handler(async ({ data, context }) => {
    const question = data.question.trim();
    if (!question) throw new Error("Digite uma pergunta para continuar.");
    if (question.length > 4000) throw new Error("A pergunta excede o limite permitido.");

    const db = context.supabase as any;
    const userId = context.userId;
    const { data: conversation, error: conversationError } = await db
      .from("ai_conversations")
      .select("id, title")
      .eq("id", data.conversationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (conversationError) throw conversationError;
    if (!conversation) throw new Error("Conversa não encontrada.");

    const { error: userMessageError } = await db.from("ai_messages").insert({
      conversation_id: conversation.id,
      user_id: userId,
      role: "user",
      content: question,
    });
    if (userMessageError) throw userMessageError;

    const [{ data: leads }, { data: tasks }, { data: clients }] = await Promise.all([
      db.from("leads").select("nome_contato,nome_empresa,etapa,prioridade,valor_potencial,proximo_follow_up").eq("user_id", userId).order("updated_at", { ascending: false }).limit(50),
      db.from("tarefas").select("titulo,data,status,prioridade").eq("user_id", userId).order("data", { ascending: true }).limit(50),
      db.from("clientes").select("nome,empresa,status,valor_fechado").eq("user_id", userId).order("updated_at", { ascending: false }).limit(50),
    ]);

    const contextData = { leads: (leads || []) as LeadContext[], tasks: (tasks || []) as TaskContext[], clients: (clients || []) as ClientContext[] };
    let answer = "";
    const apiKey = process.env["ANVEO_AI_API_KEY"] || process.env["OPENAI_API_KEY"];
    const apiUrl = process.env["ANVEO_AI_API_URL"] || "https://api.openai.com/v1/chat/completions";
    const model = process.env["ANVEO_AI_MODEL"] || "gpt-4o-mini";

    if (apiKey) {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: "system", content: "Você é o ANVEO AI. Responda em português, seja objetivo, diferencie dados reais de análises, use somente o contexto fornecido e nunca execute ações. Não invente números ou registros." },
            { role: "user", content: JSON.stringify({ pergunta: question, dados: contextData }) },
          ],
        }),
      });
      if (response.ok) {
        const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        answer = result.choices?.[0]?.message?.content?.trim() || "";
      }
    }
    if (!answer) answer = fallbackAnswer(question, contextData);

    const { data: assistantMessage, error: assistantError } = await db
      .from("ai_messages")
      .insert({ conversation_id: conversation.id, user_id: userId, role: "assistant", content: answer })
      .select("id,conversation_id,user_id,role,content,created_at")
      .single();
    if (assistantError) throw assistantError;

    await db.from("ai_conversations").update({ updated_at: new Date().toISOString(), title: conversation.title || question.slice(0, 80) }).eq("id", conversation.id).eq("user_id", userId);
    return assistantMessage;
  });
