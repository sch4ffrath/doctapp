# DoctAPP

DoctAPP e um projeto full-stack com React 18 + Vite no frontend e Node.js + Express no backend. A identidade visual segue o estilo Medical Green, com verde vibrante, cards elevados, inputs arredondados e fluxo mobile-first para pacientes.

## Estrutura

```text
DoctAPP/
├── backend/
│   ├── server.js
│   ├── supabase.sql
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── package.json
└── README.md
```

## Rodar Local

```bash
npm install
npm run dev:backend
npm run dev:frontend
```

URLs:

- Paciente: `http://localhost:5173`
- QR Code: `http://localhost:5173/qrcode`
- Admin: `http://localhost:5173/admin`

Login administrativo:

- E-mail: `admin@doctapp.com`
- Senha: `12345678`

## Supabase Gratis

1. Crie um projeto em `https://supabase.com`.
2. Abra o SQL Editor e rode o conteudo de `backend/supabase.sql`.
3. Em Project Settings > API, copie:
   - `Project URL` para `SUPABASE_URL`
   - `Publishable key` para `SUPABASE_PUBLISHABLE_KEY`
   - `Secret key` para `SUPABASE_SECRET_KEY`
   - `JWKS URL` para `SUPABASE_JWKS_URL`
4. No Render, coloque essas variaveis no backend. Nao use a secret key no frontend.

## Gemini Gratis

1. Acesse `https://aistudio.google.com`.
2. Clique em Get API Key.
3. Crie e copie a chave.
4. Defina `GEMINI_API_KEY` no backend.

## Variaveis de Ambiente

Backend (`backend/.env`):

```env
PORT=3333
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_JWKS_URL=
ADMIN_EMAIL=admin@doctapp.com
ADMIN_PASSWORD=12345678
ADMIN_SESSION_TOKEN=troque-este-token-em-producao
```

Frontend (`frontend/.env`):

```env
VITE_API_URL=http://localhost:3333
VITE_PATIENT_URL=http://localhost:5173
```

## Deploy Facil

Frontend no Vercel:

1. Suba o repositorio no GitHub.
2. No Vercel, importe o repositorio.
3. Configure Root Directory como `frontend`.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Environment Variables:
   - `VITE_API_URL=https://seu-backend.onrender.com`
   - `VITE_PATIENT_URL=https://seu-frontend.vercel.app`

Backend no Render:

1. Crie um Web Service no Render a partir do GitHub.
2. Root Directory: `backend`.
3. Build Command: `npm install`.
4. Start Command: `npm start`.
5. Environment Variables:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL=gemini-2.5-flash`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `SUPABASE_JWKS_URL`
   - `CORS_ORIGIN=https://seu-frontend.vercel.app`
   - `ADMIN_EMAIL=admin@doctapp.com`
   - `ADMIN_PASSWORD=12345678`
   - `ADMIN_SESSION_TOKEN` com um valor forte.
