# Plano: acesso seguro ao ANVEO HUB

## Objetivo
Adicionar autenticação real ao aplicativo existente sem alterar sua identidade visual ou reorganizar seus módulos.

## Implementação
- Criar tela pública de acesso no mesmo tema escuro, com e-mail/senha e Google.
- Incluir cadastro, recuperação e redefinição de senha, com mensagens claras de sucesso e erro.
- Manter a sessão ativa entre visitas e enviar usuários autenticados diretamente ao sistema.
- Proteger todas as páginas atuais por uma barreira única de autenticação.
- Adicionar saída segura no menu da conta, limpando dados temporários antes de voltar ao acesso.
- Criar perfis vinculados às contas, com nome, avatar e vínculo de workspace preparado para o uso multiempresa.
- Atualizar o cabeçalho para mostrar os dados da conta autenticada sem mudar a composição visual.

## Segurança e validação
- Cada usuário poderá visualizar e editar apenas o próprio perfil.
- A proteção será aplicada também às futuras operações privadas do servidor, não apenas à interface.
- Validar acesso, cadastro, persistência, recuperação, saída e bloqueio de páginas em desktop e celular.

## Escopo preservado
- Nenhuma mudança nas cores, tipografia, sidebar, cards ou estrutura visual dos módulos existentes.
- Os dados demonstrativos e módulos comerciais permanecem como estão; esta etapa cobre autenticação e perfis.
