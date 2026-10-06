# Feedback do beta — 6 de outubro de 2026

## Entrega de interface

- Preferências acessíveis pela engrenagem, inclusive sem login: tema claro,
  escuro ou do aparelho; texto a 100%, 125% ou 150%; alto contraste e redução
  de animações. Preferências locais validadas, com indicação se o navegador
  não permitir persistência.
- Retirado o destaque nativo de toque dos controles. Foco de teclado visível,
  atalho para o conteúdo, campos nomeados e foco contido no diálogo de conta.
- Quatro referências em português do Ministério da Saúde e da Fiocruz. Os
  links foram abertos para conferência do conteúdo; páginas indisponíveis ou
  com redirecionamentos inadequados foram descartadas.
- Publicação de notas sem exigir título; quando omitido, o título usa até
  80 caracteres da primeira linha. Compartilhamento pelo aparelho, com opção
  de copiar texto quando a API nativa não estiver disponível.
- Ajuda e relatos acessível pelas preferências; botão em cada publicação
  leva seu identificador e título ao relato. Não é publicado no feed.

## Conta: correção local e bloqueio de produção

Foi removida a dependência de `AbortSignal.timeout`, indisponível em alguns
WebViews. O cliente usa AbortController e um temporizador com limpeza, mantém
o envio de tokens e não repete automaticamente operações de escrita.
O diálogo distingue timeout, indisponibilidade HTTP e credenciais rejeitadas.

A API pública não respondeu à consulta de saúde nesta análise. A última
implantação registrada no início do trabalho está com falha no Render.
Isso exige verificar os logs do serviço `compartilhando-fe-api`; a falha não
deve ser apresentada como uma limitação normal do beta. O código não contém
Google/Facebook OAuth: a conta usa e-mail e senha.

A integração Render foi sugerida para acesso aos logs, mas ainda depende de
instalação/conexão pelo responsável. Sem esses logs não é possível atribuir a
causa da falha do servidor ou confirmar uma correção do login em produção.

## Contato: configuração pendente

`frontend/.env.example` documenta `VITE_SUPPORT_EMAIL` e `VITE_REPORT_EMAIL`.
Devem conter somente endereços públicos confirmados pelo responsável.
São variáveis de build: depois de configurá-las no frontend do Render, refaça
a implantação. Não coloque senha, token ou credenciais SMTP nesses campos.

Com contato configurado, o usuário abre um e-mail preenchido e confirma o
envio em seu aplicativo. Sem contato, somente prepara/baixa o relato, com
aviso explícito de que nada foi enviado. Ainda não há protocolo de recebimento,
fila de moderação ou promessa de revisão automática.

## Próxima entrega: moderação, fotos e vídeos

1. Definir responsáveis e conta(s) de moderador. Papéis e permissões devem ser
   conferidos pelo servidor; o autor nunca pode conceder o próprio papel.
2. Criar fila privada de denúncias, com protocolo, motivo, publicação, situação,
   moderador responsável e histórico da decisão. Restringir acesso e impedir
   exposição pública dos relatos.
3. Permitir ocultar/restaurar publicações e bloquear autores, preservando a
   trilha de revisão. Atualizar o feed após cada decisão.
4. Adicionar imagens com prévia, descrição alternativa, limites de tamanho e
   tipo validados no servidor e armazenamento próprio para mídia.
5. Adicionar vídeos após definir limites, processamento, armazenamento e custos.
   Não armazenar vídeos em base64 dentro dos documentos de publicação.

Critério de liberação: denúncia chega à fila, moderador autorizado consegue
retirar conteúdo, usuário comum não consegue moderar e mídia retirada deixa
de ser servida publicamente.

## Próxima entrega: Ao vivo

A proposta é viável. Começar por uma tela própria, acessível pelo início e
pela comunidade, com programação, título, responsável, tema e horário local.
Transmitir inicialmente por um provedor externo, com canais e eventos
autorizados pela equipe. Não marcar conteúdos gravados como “ao vivo”.

Antes de abrir transmissões aos usuários, definir quem pode transmitir,
responsáveis pela moderação durante cada evento, forma de encerrar uma
transmissão denunciada e regras do chat. Nenhuma transmissão ou programação
foi inventada nesta entrega.

Critério de liberação: evento real aprovado, estados agendado/ao vivo/encerrado,
player ou link funcional em celular, relato acessível e responsável de plantão.

## Verificação

`npm --prefix frontend test` verifica sessão, timeout, credenciais, dados
locais inválidos e compatibilidade sem `AbortSignal.timeout`.
`npm --prefix frontend run build` verifica a compilação.
Também foram executados testes no navegador com API simulada, telas de 320 e
390 pixels, desktop, temas e texto ampliado. A verificação automática de
acessibilidade não substitui testes com usuários e tecnologias assistivas.
