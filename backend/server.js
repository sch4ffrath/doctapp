import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import morgan from 'morgan';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3333;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@doctapp.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '12345678';
const ADMIN_TOKEN = process.env.ADMIN_SESSION_TOKEN || 'doctapp-admin-local-token';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

const allowedOrigins = process.env.CORS_ORIGIN?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

let memoryConversations = [];

const LEGAL_NOTICE = '⚠️ IMPORTANTE: Esta é uma simulação de IA. Diagnósticos reais exigem exames físicos. Procure um médico imediatamente.';
const OVERLOAD_MESSAGE = 'Desculpe, o sistema está sobrecarregado no momento. Aguarde alguns segundos e tente novamente.';
const MAX_PATIENT_INTERACTIONS = 7;
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 15000);

const CONCISE_TRIAGE_SYSTEM_PROMPT = `
Você é um Médico Especialista altamente experiente atuando em uma triagem virtual inteligente. Sua função é descobrir qual sintoma o paciente tem e deduzir a doença.
Analise os sintomas fornecidos. Faça perguntas cirúrgicas e investigativas, uma de cada vez, baseadas EXCLUSIVAMENTE nas respostas anteriores do paciente para afunilar o diagnóstico.
Você tem total autonomia. Quando tiver certeza médica (geralmente entre 2 a 5 perguntas), interrompa a investigação e forneça o diagnóstico.
Formato final obrigatório: Escreva em destaque '**Hipótese Provável:** [Nome da Doença/Condição]' seguida de uma brevíssima explicação do porquê, e finalize com o alerta de que é uma IA e ele deve buscar um médico real.

Regras adicionais:
- Não reinicie a conversa nem repita perguntas já feitas.
- Não use o nome do paciente depois da primeira mensagem de boas-vindas.
- Não repita literalmente os sintomas que o paciente acabou de informar.
- Faça no máximo uma pergunta por resposta.
- Não envie o alerta legal enquanto ainda estiver investigando.
- Nunca prescreva medicamentos, doses ou tratamentos.
- Se houver sinal de emergência, oriente atendimento presencial imediato.
- Não mostre raciocínio interno, lista de hipóteses, opções, análise ou justificativas longas.
- Quando fizer pergunta, escreva somente a pergunta final.
- Quando concluir, escreva somente a hipótese provável e o alerta final.
- Responda sempre em português do Brasil.
- O alerta final obrigatório deve ser exatamente: "${LEGAL_NOTICE}"
`;

app.use(
  cors({
    origin: allowedOrigins?.length ? allowedOrigins : true,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

function normalizeConversation(row) {
  return {
    id_sessao: row.id_sessao,
    nome_usuario: row.nome_usuario,
    data_inicio: row.data_inicio,
    historico_mensagens: row.historico_mensagens || []
  };
}

function createMessage(remetente, texto) {
  return {
    id: randomUUID(),
    remetente,
    texto: texto.trim(),
    data_envio: new Date().toISOString()
  };
}

function assertText(value, label, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min) {
    const error = new Error(`${label} invalido`);
    error.statusCode = 400;
    throw error;
  }

  return value.trim();
}

async function createConversation(nomeUsuario) {
  const idSessao = randomUUID();
  const now = new Date().toISOString();
  const firstMessage = createMessage(
    'ia',
    `Ola, ${nomeUsuario.split(' ')[0]}. Sou o DoctAPP. Me conte qual sintoma esta incomodando voce hoje.`
  );

  const conversation = {
    id_sessao: idSessao,
    nome_usuario: nomeUsuario,
    data_inicio: now,
    historico_mensagens: [firstMessage]
  };

  if (!supabase) {
    memoryConversations.unshift(conversation);
    return conversation;
  }

  const { data, error } = await supabase
    .from('conversas')
    .insert(conversation)
    .select()
    .single();

  if (error) throw error;
  return normalizeConversation(data);
}

async function getConversation(idSessao) {
  if (!supabase) {
    return memoryConversations.find((conversation) => conversation.id_sessao === idSessao) || null;
  }

  const { data, error } = await supabase
    .from('conversas')
    .select('id_sessao,nome_usuario,data_inicio,historico_mensagens')
    .eq('id_sessao', idSessao)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeConversation(data) : null;
}

async function saveConversation(conversation) {
  if (!supabase) {
    memoryConversations = memoryConversations.map((item) =>
      item.id_sessao === conversation.id_sessao ? conversation : item
    );
    return conversation;
  }

  const { data, error } = await supabase
    .from('conversas')
    .update({
      historico_mensagens: conversation.historico_mensagens,
      updated_at: new Date().toISOString()
    })
    .eq('id_sessao', conversation.id_sessao)
    .select()
    .single();

  if (error) throw error;
  return normalizeConversation(data);
}

async function appendMessage(idSessao, remetente, texto) {
  const conversation = await getConversation(idSessao);

  if (!conversation) {
    const error = new Error('Sessao nao encontrada');
    error.statusCode = 404;
    throw error;
  }

  conversation.historico_mensagens.push(createMessage(remetente, texto));
  return saveConversation(conversation);
}

async function listConversations() {
  let rows = memoryConversations;

  if (supabase) {
    const { data, error } = await supabase
      .from('conversas')
      .select('id_sessao,nome_usuario,data_inicio,historico_mensagens')
      .order('data_inicio', { ascending: false });

    if (error) throw error;
    rows = data;
  }

  if (!rows) return [];

  return rows.map((row) => {
    const conversation = normalizeConversation(row);
    const lastMessage = conversation.historico_mensagens.at(-1);

    return {
      id_sessao: conversation.id_sessao,
      nome_usuario: conversation.nome_usuario,
      data_inicio: conversation.data_inicio,
      total_mensagens: conversation.historico_mensagens.length,
      ultima_mensagem_em: lastMessage?.data_envio || conversation.data_inicio
    };
  });
}

function getPatientMessageCount(history) {
  return history.filter((message) => message.remetente === 'usuario').length;
}

function shouldForceDiagnosis(history) {
  return getPatientMessageCount(history) >= MAX_PATIENT_INTERACTIONS;
}

function buildChatHistory(history) {
  const previousMessages = history.slice(0, -1);
  const chatHistory = [
    {
      role: 'user',
      parts: [
        {
          text: 'Contexto: esta é uma triagem médica virtual já iniciada. Continue usando todo o histórico, sem reiniciar a conversa.'
        }
      ]
    }
  ];

  for (const message of previousMessages) {
    chatHistory.push({
      role: message.remetente === 'ia' ? 'model' : 'user',
      parts: [{ text: message.texto }]
    });
  }

  return chatHistory;
}

function buildLatestPatientPrompt(history, forceDiagnosis = false) {
  const latestPatientMessage = [...history]
    .reverse()
    .find((message) => message.remetente === 'usuario')?.texto || '';

  const instruction = forceDiagnosis
    ? `\n\nO paciente já respondeu ${MAX_PATIENT_INTERACTIONS} vezes. Esta é a etapa máxima de segurança: não faça novas perguntas; use todo o histórico e forneça a hipótese provável no formato final obrigatório.`
    : '\n\nResponda agora apenas com a próxima fala do médico especialista. Se ainda faltar dado essencial, faça uma única pergunta cirúrgica; se já houver base suficiente, finalize com a hipótese provável.';

  return `${latestPatientMessage}${instruction}`;
}

async function withTimeout(promise, timeoutMs = AI_TIMEOUT_MS) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      const error = new Error('AI request timed out');
      error.status = 'timeout';
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeGeminiReply(reply) {
  return reply.replace(/\n{3,}/g, '\n\n').trim();
}

function logGeminiError(error) {
  const message = error?.message || String(error);
  const status = error?.status || error?.code || 'unknown';
  console.error(`Gemini request failed (${status}): ${message}`);
}

async function getGeminiReply(history) {
  const forceDiagnosis = shouldForceDiagnosis(history);

  if (!genAI) {
    return OVERLOAD_MESSAGE;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: CONCISE_TRIAGE_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 700
      }
    });

    const chat = model.startChat({
      history: buildChatHistory(history)
    });

    const result = await withTimeout(chat.sendMessage(buildLatestPatientPrompt(history, forceDiagnosis)));
    const reply = result.response.text();

    return reply ? normalizeGeminiReply(reply) : OVERLOAD_MESSAGE;
  } catch (error) {
    logGeminiError(error);
    return OVERLOAD_MESSAGE;
  }
}

function requireAdmin(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (token !== ADMIN_TOKEN) {
    const error = new Error('Acesso administrativo nao autorizado');
    error.statusCode = 401;
    next(error);
    return;
  }

  next();
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'doctapp-backend',
    database: supabase ? 'supabase' : 'memory',
    ai: genAI ? GEMINI_MODEL : 'unavailable',
    jwks: process.env.SUPABASE_JWKS_URL ? 'configured' : 'not-configured'
  });
});

app.post('/api/chat/iniciar', async (req, res, next) => {
  try {
    const nomeUsuario = assertText(req.body.nome_usuario || req.body.nome, 'Nome', 2);
    const conversation = await createConversation(nomeUsuario);
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
});

app.post('/api/chat/mensagem', async (req, res, next) => {
  try {
    const idSessao = assertText(req.body.id_sessao, 'ID da sessao');
    const mensagem = assertText(req.body.mensagem, 'Mensagem');

    await appendMessage(idSessao, 'usuario', mensagem);
    let conversation = await getConversation(idSessao);

    if (!conversation) {
      const error = new Error('Sessao nao encontrada');
      error.statusCode = 404;
      throw error;
    }

    const resposta = await getGeminiReply(conversation.historico_mensagens);

    if (resposta === OVERLOAD_MESSAGE) {
      res.json({
        resposta,
        conversa: {
          ...conversation,
          historico_mensagens: [
            ...conversation.historico_mensagens,
            createMessage('ia', resposta)
          ]
        }
      });
      return;
    }

    conversation = await appendMessage(idSessao, 'ia', resposta);

    res.json({ resposta, conversa: conversation });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/login', (req, res, next) => {
  try {
    const { email, senha } = req.body;

    if (email === ADMIN_EMAIL && senha === ADMIN_PASSWORD) {
      res.json({ ok: true, nome: 'DoctAPP Admin', token: ADMIN_TOKEN });
      return;
    }

    const error = new Error('E-mail ou senha invalidos');
    error.statusCode = 401;
    throw error;
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/conversas', requireAdmin, async (_req, res, next) => {
  try {
    res.json(await listConversations());
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/conversas/:id', requireAdmin, async (req, res, next) => {
  try {
    const conversation = await getConversation(req.params.id);

    if (!conversation) {
      const error = new Error('Conversa nao encontrada');
      error.statusCode = 404;
      throw error;
    }

    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada', path: req.originalUrl });
});

app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: err.message || 'Erro interno do servidor'
  });
});

app.listen(port, () => {
  console.log(`DoctAPP API running on http://localhost:${port}`);
});
