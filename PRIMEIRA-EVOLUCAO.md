# Meu Revigório — primeira evolução

Esta entrega implementa o primeiro pacote do documento-mestre: autenticação,
navegação em cinco áreas e uma tela inicial útil mesmo sem cadastro.

- Início: sete reflexões em rotação diária, referência bíblica, oração, pequeno
  passo, acesso a conteúdo educativo e publicações públicas da comunidade.
- Fé: devocional breve do dia e orações por temas. As passagens são referências
  para leitura na Bíblia do usuário; esta versão não inclui uma Bíblia completa.
- Mente: dois conteúdos educativos com fontes do NIMH e do NHLBI, identificados
  separadamente das reflexões religiosas.
- Comunidade: feed público, seguindo, filtros, busca e criação de publicações.
- Perfil: preserva foto, seguidores e publicações existentes.

## Contas existentes

Os usuários precisam entrar novamente após a atualização. A senha existente
continua funcionando: após um login válido, o registro antigo em SHA-256 é
convertido para scrypt com salt aleatório. Novas senhas têm de 8 a 128 caracteres.

As sessões duram sete dias, têm tokens aleatórios de 256 bits e armazenam apenas
o hash do token no MongoDB. A expiração é validada em cada requisição, além do
índice TTL. Sair revoga a sessão no servidor. O navegador mantém o token no
sessionStorage, portanto não o recupera automaticamente em uma nova sessão de
navegação. Os registros de sessão são a única nova coleção desta entrega.

Publicar, excluir, seguir e alterar foto exigem sessão válida. A identidade do
autor vem da sessão, nunca de um ID enviado pelo navegador. Nenhum diário ou
check-in emocional é coletado nesta versão.

## Verificação e publicação

Execute `npm --prefix backend test` e `npm --prefix frontend run build`.
Os testes de API usam repositórios em memória e não acessam o banco real.
O Render continua usando os dois serviços definidos em `render.yaml`, sem novas
variáveis secretas. `/health` retorna `release: meu-revigorio-1` nesta entrega.

A implantação não exige apagar usuários ou publicações. Depois que uma senha for
migrada para scrypt, não reverta o backend para uma versão anterior que só aceite
SHA-256. Eventuais correções devem preservar o suporte aos dois formatos.

Biblioteca completa, trilhas, diário privado, check-in, reação de oração,
moderação e IA continuam sendo próximas etapas do documento-mestre.
