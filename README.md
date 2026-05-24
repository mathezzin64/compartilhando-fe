# COMPARTILHANDO FÉ

Aplicativo independente para compartilhar versículos, experiências, testemunhos e pedidos de oração.

## Estrutura

- `frontend`: React + Vite
- `backend`: Node.js + Express + MongoDB

## Configuração do banco

Copie `backend/.env.example` para `backend/.env` e informe uma conexão MongoDB separada do AD EBD.

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

## Publicação

O projeto inclui `render.yaml` com dois serviços independentes:

- `compartilhando-fe-api`: backend Node/Express
- `compartilhando-fe`: frontend estático React/Vite

No Render, configure a variável secreta `MONGODB_URI` no serviço da API usando um banco exclusivo para este app.

Passos:

1. Publique este projeto em um repositório GitHub próprio.
2. No Render, clique em **New +** e escolha **Blueprint**.
3. Selecione o repositório do **COMPARTILHANDO FÉ**.
4. Quando o Render pedir variáveis secretas, preencha `MONGODB_URI`.
5. Confirme a criação dos serviços.

URLs esperadas:

- Frontend: `https://compartilhando-fe.onrender.com`
- API: `https://compartilhando-fe-api.onrender.com`

## APK online

O APK usa Capacitor e abre a URL publicada do frontend:

```txt
https://compartilhando-fe.onrender.com
```

Assim, depois que o app estiver publicado no Render, novas alterações enviadas ao site aparecem automaticamente no APK.

Para gerar APK debug:

```bash
cd frontend
npm run apk:debug
```

Arquivo gerado:

```txt
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```
