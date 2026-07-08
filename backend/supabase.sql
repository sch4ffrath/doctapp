create table if not exists public.conversas (
  id_sessao uuid primary key,
  nome_usuario text not null,
  data_inicio timestamptz not null default now(),
  historico_mensagens jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversas_data_inicio_idx
  on public.conversas (data_inicio desc);

