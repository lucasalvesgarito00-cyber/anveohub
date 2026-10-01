# Correção prioritária da criação de leads

## Objetivo

Corrigir somente o fluxo existente de criação de leads e seus reflexos no CRM e no Dashboard, sem redesenhar telas nem adicionar módulos.

## Implementação

1. Conectar o botão “Novo lead” do CRM e “Adicionar lead” da lista ao mesmo formulário existente.
2. Ajustar o formulário para salvar os campos já suportados pela tabela `leads`, convertendo valores monetários e enviando campos opcionais como `null`.
3. Obter `user_id` exclusivamente da sessão autenticada e usar o `workspace_id` do perfil quando disponível; manter as políticas de acesso atuais.
4. Após o INSERT, fechar o formulário e recarregar os dados reais para o novo lead aparecer imediatamente e permanecer após atualização.
5. Fazer CRM e Dashboard calcularem total de leads, pipeline aberto e vendas com os registros reais, considerando “Ganho” fora do pipeline aberto.
6. Exibir mensagens claras quando autenticação, validação ou banco impedirem a operação.

## Validação

- Criar “Teste Anveo”, valor 1000, etapa “Proposta” e prioridade “Alta”.
- Confirmar o registro no banco e sua permanência após recarregar a página.
- Confirmar aumento de 1 lead e R$ 1.000 no pipeline aberto.
- Alterar para “Ganho” e confirmar a transferência de R$ 1.000 do pipeline aberto para vendas.
- Verificar o fluxo em tela pequena e garantir que as demais funções permaneçam intactas.

## Detalhes técnicos

- Reutilizar a tabela `public.leads` e suas políticas RLS já ativas.
- Não aceitar `user_id` informado pelo formulário.
- Não criar tabela, migração, integração externa ou dados demonstrativos.