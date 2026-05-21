# COMPARTILHANDO FE

Aplicativo independente para compartilhar versiculos, experiencias, testemunhos e pedidos de oracao.

## Estrutura

- `frontend`: React + Vite
- `backend`: Node.js + Express + MongoDB

## Configuracao do banco

Copie `backend/.env.example` para `backend/.env` e informe uma conexao MongoDB separada do AD EBD.

```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/compartilhando-fe?retryWrites=true&w=majority
PORT=3002
```

## Rodar localmente

```bash
cd frontend
npm install
npm run dev
```

```bash
cd backend
npm install
npm run dev
```

## Publicacao

O projeto inclui `render.yaml` com dois servicos independentes:

- `compartilhando-fe-api`: backend Node/Express
- `compartilhando-fe`: frontend estatico React/Vite

No Render, configure a variavel secreta `MONGODB_URI` no servico da API usando um banco exclusivo para este app.

Passos:

1. Publique este projeto em um repositorio GitHub proprio.
2. No Render, clique em **New +** e escolha **Blueprint**.
3. Selecione o repositorio do **COMPARTILHANDO FE**.
4. Quando o Render pedir variaveis secretas, preencha `MONGODB_URI`.
5. Confirme a criacao dos servicos.

URLs esperadas:

- Frontend: `https://compartilhando-fe.onrender.com`
- API: `https://compartilhando-fe-api.onrender.com`

## APK online

O APK usa Capacitor e abre a URL publicada do frontend:

```txt
https://compartilhando-fe.onrender.com
```

Assim, depois que o app estiver publicado no Render, novas alteracoes enviadas ao site aparecem automaticamente no APK.

Para gerar APK debug:

```bash
cd frontend
npm run apk:debug
```

Arquivo gerado:

```txt
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```
