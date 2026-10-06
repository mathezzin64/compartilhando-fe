# Correções de estabilidade — 6 de outubro de 2026

## Inicialização da API

O servidor agora abre `0.0.0.0:$PORT` antes de tentar conectar ao MongoDB.
Uma falha inicial de conexão gera nova tentativa com espera progressiva.
Os logs indicam códigos de diagnóstico, sem imprimir a conexão ou credenciais.

`/live` confirma apenas o processo HTTP. `/health` continua sendo a verificação
do Render e retorna **503** enquanto o banco não estiver pronto, e **200**
quando a API puder atender contas e publicações. A publicação não deve ser
considerada funcional somente porque uma porta foi aberta. Não foi alterada
a verificação do Render para ocultar falhas de banco.

Enquanto o banco estiver indisponível, as rotas de dados retornam 503 com uma
mensagem explícita em vez de enfileirar consultas indefinidamente.

Se a implantação ainda falhar, procurar nos novos logs:

- `DATABASE_CONFIGURATION_MISSING`: falta configurar `MONGODB_URI` no serviço.
- `DATABASE_AUTH_FAILED`: conferir usuário e senha no MongoDB.
- `DATABASE_NETWORK_ERROR`: conferir DNS, estado do cluster e acesso de rede.
- `DATABASE_CONNECTION_FAILED`: conferir os demais parâmetros do banco.

Esses códigos são diagnósticos a verificar, não confirmação de que uma dessas
condições ocorreu em produção. Não enviar a URI ou senhas em mensagens.

## Aplicativo

- Falha de conexão da comunidade, busca ou perfil não aparece como lista vazia.
- O início oferece uma tentativa de recarregamento quando a comunidade falha.
- Uma busca antiga não sobrescreve o resultado de uma busca mais recente.
- A saída limpa a sessão local imediatamente, mesmo com o servidor fora do ar.
  A tentativa de revogação no servidor continua; falha nessa confirmação é
  informada sem restaurar a sessão local.
- Respostas atrasadas de sessão não restauram uma conta encerrada nem apagam
  um login mais recente.
- Dados locais inválidos e armazenamento bloqueado não derrubam o app.
- O tempo limite cobre também a leitura do corpo da resposta HTTP.
- Fechar o diálogo interrompe a solicitação local e impede login tardio.

## Verificação

- 14 testes no backend (incluindo porta, prontidão, repetição de conexão e
  autenticação) e 10 testes de sessão no frontend, incluindo falta de espaço
  para gravar dados no navegador.
- Testes de navegador com respostas simuladas: falha/recuperação, respostas
  fora de ordem, perfil indisponível, logout offline e armazenamento bloqueado.
- Compilação de produção do frontend.

Os testes locais não comprovam as credenciais nem o acesso de rede do MongoDB
no Render. Essa confirmação depende de `/health` em produção retornar 200.
