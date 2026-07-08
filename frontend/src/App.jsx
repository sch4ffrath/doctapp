import {
  ArrowLeft,
  ChevronRight,
  Copy,
  LockKeyhole,
  LogOut,
  MessageCircle,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Stethoscope,
  UserRound
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import {
  adminLogin,
  getAdminConversation,
  getAdminConversations,
  sendMessage,
  startChat
} from './api/client.js';

const quickPrompts = [
  'Dor de cabeça',
  'Febre',
  'Dor abdominal',
  'Tontura'
];

function PillButton({ children, className = '', ...props }) {
  return (
    <button
      className={`rounded-full px-5 py-3 font-semibold shadow-md transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function AppShell({ children, className = '' }) {
  return (
    <main className={`min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,rgba(110,231,183,0.38),transparent_28rem),linear-gradient(135deg,#ECFDF5_0%,#FFFFFF_48%,#F0FDFA_100%)] text-doctText ${className}`}>
      {children}
    </main>
  );
}

function LogoMark() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-emeraldLight to-medicalGreen text-white shadow-soft">
      <Stethoscope className="h-6 w-6" aria-hidden="true" />
    </div>
  );
}

function ReturnToDashboardButton({ label = 'Voltar', intent = 'neutral', onClick }) {
  const styles = intent === 'danger'
    ? 'bg-red-50 text-red-600 hover:bg-red-100'
    : 'bg-white/85 text-medicalGreen hover:bg-white';

  return (
    <button
      className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold shadow-md transition ${styles}`}
      onClick={onClick}
      type="button"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function PatientLogin() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const cleanName = name.trim();

    if (cleanName.length < 2) {
      setError('Digite seu nome para continuar.');
      return;
    }

    sessionStorage.setItem('patient_name', cleanName);
    navigate('/dashboard');
  }

  return (
    <AppShell className="flex items-center justify-center px-5 py-8">
      <section className="flex min-h-[520px] w-full max-w-md flex-col justify-between rounded-[2rem] bg-white/90 p-7 shadow-premium backdrop-blur">
        <div className="flex items-center gap-4">
          <LogoMark />
          <div>
            <h1 className="text-3xl font-bold tracking-normal text-doctText">DoctAPP</h1>
            <p className="text-sm text-slate-500">Triagem inteligente</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-600">Nome</span>
            <input
              className="w-full rounded-full border border-emerald-100 bg-white px-5 py-4 text-base outline-none shadow-sm transition focus:border-medicalGreen focus:ring-4 focus:ring-emerald-100"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Digite seu nome"
              autoComplete="name"
            />
          </label>

          {error && <p className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <PillButton className="flex w-full items-center justify-center gap-2 bg-medicalGreen text-white hover:bg-emerald-600">
            Entrar
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </PillButton>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <button className="font-semibold text-medicalGreen" onClick={() => navigate('/qrcode')} type="button">
            QR Code
          </button>
          <button className="font-semibold text-slate-500" onClick={() => navigate('/admin')} type="button">
            Painel DoctAPP
          </button>
        </div>
      </section>
    </AppShell>
  );
}

function PatientDashboard() {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');
  const patientName = sessionStorage.getItem('patient_name');

  async function handleStartChat() {
    if (!patientName) {
      navigate('/');
      return;
    }

    setIsStarting(true);
    setError('');

    try {
      const session = await startChat(patientName);
      sessionStorage.setItem('triage_session', JSON.stringify(session));
      navigate('/chat');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsStarting(false);
    }
  }

  function handlePatientLogout() {
    sessionStorage.removeItem('patient_name');
    sessionStorage.removeItem('triage_session');
    navigate('/', { replace: true });
  }

  if (!patientName) return <Navigate to="/" replace />;

  return (
    <AppShell className="flex min-h-screen flex-col px-5 py-6">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-1 flex-col gap-6">
        <header className="flex items-center justify-between gap-4 rounded-[2rem] bg-white p-5 shadow-md">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-500">Olá,</p>
            <h1 className="break-words text-2xl font-bold text-gray-800">{patientName}</h1>
          </div>
          <div className="shrink-0">
            <LogoMark />
          </div>
        </header>

        <div className="flex min-h-[430px] flex-1 flex-col justify-between rounded-[2.25rem] bg-gradient-to-br from-medicalGreen to-emeraldLight p-8 text-white shadow-premium sm:min-h-[470px] sm:p-10">
          <div className="space-y-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-emerald-50">Consulta IA</p>
                <h2 className="mt-3 text-4xl font-bold leading-tight">Como você está se sentindo?</h2>
              </div>
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-9 w-9" aria-hidden="true" />
              </span>
            </div>
            <p className="max-w-xs text-lg leading-8 text-emerald-50">
              Inicie uma conversa objetiva para registrar sintomas, receber perguntas de triagem e gerar uma hipótese simulada.
            </p>
          </div>
          <div className="mt-8 rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold leading-6 text-amber-900 shadow-md">
            ⚠️ Atenção: A triagem a seguir é realizada por Inteligência Artificial. Ela fornece apenas hipóteses simuladas e NÃO substitui o diagnóstico de um médico real. Em caso de sintomas graves, procure um hospital imediatamente.
          </div>
          <PillButton
            className="mt-10 flex w-full items-center justify-center gap-3 bg-white px-7 py-5 text-lg text-medicalGreen"
            disabled={isStarting}
            onClick={handleStartChat}
            type="button"
          >
            {isStarting ? 'Iniciando...' : 'Iniciar Consulta'}
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </PillButton>
        </div>

        {error && <p className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <footer className="mt-auto pt-3">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-gray-600 shadow-md ring-1 ring-gray-100 transition hover:bg-gray-50 hover:text-gray-800"
            onClick={handlePatientLogout}
            type="button"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </footer>
      </section>
    </AppShell>
  );
}

function renderBoldMarkdown(text) {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong className="font-bold" key={`${part}-${index}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

function MessageBubble({ message }) {
  const isUser = message.remetente === 'usuario';

  return (
    <article className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[86%] rounded-[1.5rem] px-4 py-3 shadow-md md:max-w-[70%] ${
          isUser
            ? 'bg-medicalGreen text-white'
            : 'bg-white text-doctText'
        }`}
      >
        <p className="whitespace-pre-wrap text-[15px] leading-6">{renderBoldMarkdown(message.texto)}</p>
      </div>
    </article>
  );
}

function ChatPage() {
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const [session, setSession] = useState(() => {
    const raw = sessionStorage.getItem('triage_session');
    return raw ? JSON.parse(raw) : null;
  });
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const messages = session?.historico_mensagens || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isSending]);

  async function handleSend(event) {
    event?.preventDefault();
    const cleanMessage = message.trim();

    if (!cleanMessage || !session || isSending) return;

    setMessage('');
    setIsSending(true);
    setError('');

    const optimistic = {
      id: `local-${Date.now()}`,
      remetente: 'usuario',
      texto: cleanMessage,
      data_envio: new Date().toISOString()
    };

    setSession((current) => ({
      ...current,
      historico_mensagens: [...current.historico_mensagens, optimistic]
    }));

    try {
      const data = await sendMessage(session.id_sessao, cleanMessage);
      setSession(data.conversa);
      sessionStorage.setItem('triage_session', JSON.stringify(data.conversa));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSending(false);
    }
  }

  function handleEndConsultation() {
    sessionStorage.removeItem('triage_session');
    setSession(null);
    navigate('/dashboard', { replace: true });
  }

  if (!session) return <Navigate to="/dashboard" replace />;

  return (
    <AppShell className="flex h-[100dvh] flex-col">
      <header className="shrink-0 bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <ReturnToDashboardButton label="Voltar" onClick={handleEndConsultation} />
            <LogoMark />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm text-slate-500">{session.nome_usuario}</p>
              <h1 className="truncate text-lg font-bold text-doctText">Consulta DoctAPP</h1>
            </div>
          </div>
          <button
            className="rounded-full bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-100"
            onClick={handleEndConsultation}
            type="button"
          >
            Encerrar Consulta
          </button>
        </div>
        <div className="border-t border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium leading-5 text-amber-900">
          ⚠️ IMPORTANTE: Esta é uma simulação de IA. Diagnósticos reais exigem exames físicos. Procure um médico imediatamente.
        </div>
      </header>

      <section className="scrollbar-thin mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.map((item) => (
          <MessageBubble key={item.id} message={item} />
        ))}

        {isSending && (
          <div className="flex w-fit items-center gap-1 rounded-full bg-white px-4 py-3 shadow-md">
            <span className="h-2 w-2 animate-bounce rounded-full bg-medicalGreen [animation-delay:-0.2s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-medicalGreen [animation-delay:-0.1s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-medicalGreen" />
          </div>
        )}

        {error && <p className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        <div ref={bottomRef} />
      </section>

      <div className="mx-auto flex w-full max-w-3xl gap-2 overflow-x-auto px-4 pb-2">
        {quickPrompts.map((prompt) => (
          <button
            className="shrink-0 rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-medicalGreen shadow-sm"
            key={prompt}
            onClick={() => setMessage(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form className="safe-bottom shrink-0 bg-white/95 px-4 pt-3 shadow-[0_-10px_30px_rgba(16,185,129,0.08)]" onSubmit={handleSend}>
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            className="max-h-32 min-h-12 flex-1 resize-none rounded-[1.5rem] border border-emerald-100 px-5 py-3 outline-none transition focus:border-medicalGreen focus:ring-4 focus:ring-emerald-100"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Descreva seus sintomas"
            rows={1}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-medicalGreen text-white shadow-md transition hover:bg-emerald-600 disabled:opacity-60"
            type="submit"
            disabled={!message.trim() || isSending}
            aria-label="Enviar"
          >
            <Send className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </form>
    </AppShell>
  );
}

function QRCodePage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const patientUrl = import.meta.env.VITE_PATIENT_URL || `${window.location.origin}/`;

  async function handleCopy() {
    await navigator.clipboard.writeText(patientUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <AppShell className="flex flex-col px-5 py-5">
      <header className="mx-auto flex w-full max-w-md items-center justify-between">
        <ReturnToDashboardButton label="Voltar" onClick={() => navigate('/dashboard', { replace: true })} />
        <div className="flex items-center gap-2 rounded-full bg-white/85 px-4 py-2.5 font-bold text-doctText shadow-md">
          <QrCode className="h-5 w-5 text-medicalGreen" aria-hidden="true" />
          DoctAPP QR
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center rounded-[2rem] py-7 text-center">
        <div className="rounded-[2rem] bg-white p-6 shadow-premium">

          <div className="mx-auto mb-5 w-fit rounded-[2rem] bg-gradient-to-br from-emerald-50 to-white p-5 shadow-md">
            <QRCodeSVG value={patientUrl} size={220} level="M" includeMargin />
          </div>

          <p className="break-all rounded-3xl bg-emerald-50 px-4 py-3 text-sm font-medium text-slate-600">
            {patientUrl}
          </p>

          <PillButton
            className="mt-4 flex w-full items-center justify-center gap-2 bg-medicalGreen text-white"
            onClick={handleCopy}
            type="button"
          >
            <Copy className="h-5 w-5" aria-hidden="true" />
            {copied ? 'Copiado' : 'Copiar link'}
          </PillButton>
        </div>
      </section>
    </AppShell>
  );
}

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@doctapp.com');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await adminLogin(email, senha);
      sessionStorage.setItem('admin_token', data.token);
      navigate('/admin/dashboard');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppShell className="flex flex-col px-5 py-5">
      <header className="mx-auto flex w-full max-w-md items-center justify-between">
        <ReturnToDashboardButton
          label="Voltar"
          onClick={() => {
            sessionStorage.removeItem('admin_token');
            navigate('/dashboard', { replace: true });
          }}
        />
        <div className="rounded-full bg-white/85 px-4 py-2.5 text-sm font-bold text-doctText shadow-md">
          DoctAPP Admin
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-md flex-1 items-center py-7">
        <div className="w-full rounded-[2rem] bg-white p-7 shadow-premium">
        <div className="mb-6 flex items-center gap-4">
          <LogoMark />
          <div>
            <h1 className="text-2xl font-bold">DoctAPP Admin</h1>
            <p className="text-sm text-slate-500">Painel DoctAPP</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-full border border-emerald-100 px-5 py-4 outline-none focus:border-medicalGreen focus:ring-4 focus:ring-emerald-100"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            placeholder="E-mail"
          />
          <input
            className="w-full rounded-full border border-emerald-100 px-5 py-4 outline-none focus:border-medicalGreen focus:ring-4 focus:ring-emerald-100"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="Senha"
          />

          {error && <p className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <PillButton className="flex w-full items-center justify-center gap-2 bg-medicalGreen text-white" disabled={isLoading}>
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
            {isLoading ? 'Entrando...' : 'Entrar'}
          </PillButton>
        </form>
        </div>
      </section>
    </AppShell>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function AdminDashboard() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('admin_token');
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((conversation) => conversation.nome_usuario.toLowerCase().includes(term));
  }, [conversations, search]);

  const stats = useMemo(() => {
    const totalPatients = conversations.length;
    const totalMessages = conversations.reduce((total, conversation) => {
      const messageCount = Number(conversation.total_mensagens ?? conversation.historico_mensagens?.length ?? 0);
      return total + messageCount;
    }, 0);

    return { totalPatients, totalMessages };
  }, [conversations]);

  async function loadConversations({ silent = false } = {}) {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError('');

    try {
      const data = await getAdminConversations(token);
      setConversations(data);

      const selectedStillExists = selected && data.some((conversation) => conversation.id_sessao === selected.id_sessao);
      const nextSelectedId = selectedStillExists ? selected.id_sessao : data[0]?.id_sessao;

      if (nextSelectedId) {
        setSelected(await getAdminConversation(token, nextSelectedId));
      } else {
        setSelected(null);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }

  function handleRefresh() {
    if (!isRefreshing) {
      loadConversations({ silent: true });
    }
  }

  async function handleSelect(idSessao) {
    setError('');

    try {
      setSelected(await getAdminConversation(token, idSessao));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_token');
    navigate('/dashboard', { replace: true });
  }

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token) return <Navigate to="/admin" replace />;

  return (
    <AppShell className="flex flex-col gap-4 px-4 py-4 lg:px-6">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <ReturnToDashboardButton label="Voltar" onClick={handleLogout} />
        <div className="rounded-full bg-white/85 px-4 py-2.5 text-sm font-bold text-doctText shadow-md">
          Painel DoctAPP
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-6rem)] w-full max-w-7xl overflow-hidden rounded-[2rem] bg-white shadow-premium lg:grid-cols-[360px,1fr]">
        <aside className="flex min-h-0 flex-col border-b border-emerald-100 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-emerald-100 p-5">
            <div className="flex min-w-0 items-center gap-3">
              <LogoMark />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold">Painel DoctAPP</h1>
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm text-slate-500">Históricos salvos</p>
                  <button
                    aria-label="Atualizar históricos"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-medicalGreen transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isRefreshing}
                    onClick={handleRefresh}
                    title="Atualizar históricos"
                    type="button"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-medicalGreen"
              onClick={handleLogout}
              type="button"
              aria-label="Sair"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <label className="flex items-center gap-2 rounded-full border border-emerald-100 px-4 py-3 focus-within:border-medicalGreen focus-within:ring-4 focus-within:ring-emerald-100">
              <Search className="h-4 w-4 text-medicalGreen" aria-hidden="true" />
              <input
                className="w-full bg-transparent text-sm outline-none"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar usuário"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-green-50 p-2.5 text-green-700 ring-1 ring-green-100">
                <p className="text-xs font-bold">👥 {stats.totalPatients} Pacientes</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-2.5 text-slate-700 ring-1 ring-slate-100">
                <p className="text-xs font-bold">💬 {stats.totalMessages} Mensagens</p>
              </div>
            </div>
          </div>

          <div className="scrollbar-thin max-h-80 flex-1 overflow-y-auto px-3 pb-4 lg:max-h-none">
            {isLoading && <p className="px-3 py-4 text-sm text-slate-500">Carregando...</p>}
            {!isLoading && filtered.length === 0 && <p className="px-3 py-4 text-sm text-slate-500">Nenhum histórico.</p>}

            {filtered.map((conversation) => (
              <button
                className={`mb-2 flex w-full items-center gap-3 rounded-[1.5rem] p-3 text-left transition ${
                  selected?.id_sessao === conversation.id_sessao
                    ? 'bg-emerald-50 ring-1 ring-emerald-100'
                    : 'hover:bg-slate-50'
                }`}
                key={conversation.id_sessao}
                onClick={() => handleSelect(conversation.id_sessao)}
                type="button"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-medicalGreen text-white shadow-md">
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold">{conversation.nome_usuario}</span>
                  <span className="text-xs text-slate-500">{conversation.total_mensagens} mensagens</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-gradient-to-br from-white to-emerald-50/50">
          <header className="border-b border-emerald-100 p-5">
            {selected ? (
              <>
                <p className="text-sm font-semibold text-medicalGreen">Histórico completo</p>
                <h2 className="text-2xl font-bold">{selected.nome_usuario}</h2>
                <p className="text-sm text-slate-500">Início em {formatDate(selected.data_inicio)}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-medicalGreen">DoctAPP Admin</p>
                <h2 className="text-2xl font-bold">Selecione um usuário</h2>
              </>
            )}
          </header>

          {error && <p className="m-4 rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

          <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
            {selected && (
              <div className="mx-auto flex max-w-3xl flex-col gap-3">
                {selected.historico_mensagens.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function AdminGuard() {
  return sessionStorage.getItem('admin_token') ? <AdminDashboard /> : <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PatientLogin />} />
      <Route path="/dashboard" element={<PatientDashboard />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/qrcode" element={<QRCodePage />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminGuard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
