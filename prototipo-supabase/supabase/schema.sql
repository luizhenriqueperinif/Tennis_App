-- =====================================================================
-- MatchPoint · banco do protótipo no Supabase
-- Como usar: cole o arquivo inteiro no SQL Editor do Supabase e clique em Run.
-- Antes, crie em Authentication > Users os usuários
--   professor@matchpoint.app e aluno@matchpoint.app (com "Auto Confirm").
-- Pode rodar de novo quantas vezes quiser: apaga e recria tudo.
--
-- Segurança: o RLS está ligado em todas as tabelas e NÃO há política de escrita.
-- Toda escrita passa pelas funções abaixo (security definer), que conferem
-- o perfil do usuário e as regras de negócio (RN01, RN04 a RN10).
-- =====================================================================

drop view if exists public.v_ranking;
drop table if exists public.desafios, public.partidas, public.presencas, public.aulas,
  public.convites, public.turma_alunos, public.turmas, public.alunos, public.perfis cascade;

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------
create table public.perfis (
  id    uuid primary key references auth.users (id) on delete cascade,
  nome  text not null,
  papel text not null check (papel in ('professor', 'aluno'))
);

-- Alunos podem existir sem login (ex.: colegas de turma cadastrados pelo professor).
create table public.alunos (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid unique references auth.users (id) on delete set null,
  nome        text not null,
  nivel       text not null default 'Iniciante' check (nivel in ('Iniciante', 'Intermediário', 'Avançado')),
  fundamentos jsonb not null default '{"saque":3,"forehand":3,"backhand":3,"voleio":3,"movimentacao":3}',
  comentario  text not null default '',
  avaliado_em timestamptz
);

create table public.turmas (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  professor_id uuid not null references public.perfis (id) on delete cascade,
  criada_em    timestamptz not null default clock_timestamp()
);

-- Separado de turmas para o aluno não conseguir ler o código (só o professor lê).
create table public.convites (
  turma_id  uuid primary key references public.turmas (id) on delete cascade,
  codigo    text not null unique,
  expira_em timestamptz not null,
  ativo     boolean not null default true
);

create table public.turma_alunos (
  turma_id    uuid references public.turmas (id) on delete cascade,
  aluno_id    uuid references public.alunos (id) on delete cascade,
  pontos_base int not null default 0,  -- histórico anterior ao app
  v_base      int not null default 0,
  d_base      int not null default 0,
  primary key (turma_id, aluno_id)
);

create table public.aulas (
  id         uuid primary key default gen_random_uuid(),
  turma_id   uuid not null references public.turmas (id) on delete cascade,
  inicio     timestamptz not null,
  quadra     text not null default 'Quadra 1',
  tema       text not null default '',
  vagas      int not null check (vagas between 1 and 6),  -- RN07
  comentario text
);

create table public.presencas (
  aula_id  uuid references public.aulas (id) on delete cascade,
  aluno_id uuid references public.alunos (id) on delete cascade,
  status   text not null check (status in ('pendente', 'confirmado', 'cancelado', 'presente', 'ausente')),
  motivo   text,
  primary key (aula_id, aluno_id)
);

create table public.partidas (
  id                         uuid primary key default gen_random_uuid(),
  turma_id                   uuid not null references public.turmas (id) on delete cascade,
  jogador_a                  uuid not null references public.alunos (id) on delete cascade,
  jogador_b                  uuid not null references public.alunos (id) on delete cascade,
  sets                       jsonb not null,  -- ex.: [[6,4],[3,6],[6,2]], games de A e de B
  status                     text not null check (status in ('pendente', 'confirmada', 'disputa')),
  registrado_por             uuid references public.alunos (id),  -- null = lançado pelo professor
  motivo                     text,
  validado_pelo_professor    boolean not null default false,
  confirmado_automaticamente boolean not null default false,
  historico                  boolean not null default false,  -- já somada nos pontos-base
  criado_em                  timestamptz not null default now(),
  check (jogador_a <> jogador_b)
);

create table public.desafios (
  id        uuid primary key default gen_random_uuid(),
  turma_id  uuid not null references public.turmas (id) on delete cascade,
  de        uuid not null references public.alunos (id) on delete cascade,
  para      uuid not null references public.alunos (id) on delete cascade,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Funções auxiliares (security definer para não cair em recursão de RLS)
-- ---------------------------------------------------------------------
create or replace function public.eh_professor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfis where id = auth.uid() and papel = 'professor');
$$;

create or replace function public.meu_aluno_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from alunos where usuario_id = auth.uid();
$$;

create or replace function public.minhas_turmas() returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from turmas where professor_id = auth.uid()
  union
  select turma_id from turma_alunos where aluno_id = (select id from alunos where usuario_id = auth.uid());
$$;

create or replace function public.exigir(condicao boolean, mensagem text) returns void
language plpgsql as $$
begin
  if not coalesce(condicao, false) then
    raise exception using message = mensagem, errcode = 'P0001';
  end if;
end;
$$;

-- Quem venceu mais sets.
create or replace function public.vencedor(p_sets jsonb, p_a uuid, p_b uuid) returns uuid
language sql immutable as $$
  select case
    when count(*) filter (where (s ->> 0)::int > (s ->> 1)::int)
       > count(*) filter (where (s ->> 1)::int > (s ->> 0)::int) then p_a
    else p_b end
  from jsonb_array_elements(p_sets) s;
$$;

create or replace function public.validar_sets(p_sets jsonb) returns jsonb
language plpgsql immutable as $$
declare s jsonb;
begin
  perform exigir(jsonb_typeof(p_sets) = 'array' and jsonb_array_length(p_sets) between 1 and 3, 'Informe de 1 a 3 sets.');
  for s in select * from jsonb_array_elements(p_sets) loop
    perform exigir(jsonb_typeof(s) = 'array' and jsonb_array_length(s) = 2
      and jsonb_typeof(s -> 0) = 'number' and jsonb_typeof(s -> 1) = 'number'
      and (s ->> 0)::numeric between 0 and 7 and (s ->> 1)::numeric between 0 and 7
      and (s ->> 0)::numeric = trunc((s ->> 0)::numeric) and (s ->> 1)::numeric = trunc((s ->> 1)::numeric),
      'Placar de set inválido (use números de 0 a 7).');
    perform exigir((s ->> 0) <> (s ->> 1), 'Um set não pode terminar empatado.');
  end loop;
  return p_sets;
end;
$$;

-- ---------------------------------------------------------------------
-- Ranking (RN08 e RN09): vitória +10, derrota 0, só partidas confirmadas
-- ---------------------------------------------------------------------
create view public.v_ranking with (security_invoker = true) as
select ta.turma_id, ta.aluno_id, al.nome,
       ta.pontos_base + 10 * coalesce(r.vitorias, 0) as pontos,
       ta.v_base + coalesce(r.vitorias, 0)           as vitorias,
       ta.d_base + coalesce(r.derrotas, 0)           as derrotas
from public.turma_alunos ta
join public.alunos al on al.id = ta.aluno_id
left join lateral (
  select count(*) filter (where public.vencedor(p.sets, p.jogador_a, p.jogador_b) = ta.aluno_id)  as vitorias,
         count(*) filter (where public.vencedor(p.sets, p.jogador_a, p.jogador_b) <> ta.aluno_id) as derrotas
  from public.partidas p
  where p.turma_id = ta.turma_id and p.status = 'confirmada' and not p.historico
    and ta.aluno_id in (p.jogador_a, p.jogador_b)
) r on true;

-- ---------------------------------------------------------------------
-- RLS: cada um só lê o que é das suas turmas. Escrita só pelas funções.
-- ---------------------------------------------------------------------
alter table public.perfis       enable row level security;
alter table public.alunos       enable row level security;
alter table public.turmas       enable row level security;
alter table public.convites     enable row level security;
alter table public.turma_alunos enable row level security;
alter table public.aulas        enable row level security;
alter table public.presencas    enable row level security;
alter table public.partidas     enable row level security;
alter table public.desafios     enable row level security;

create policy "ler o próprio perfil" on public.perfis for select to authenticated
  using (id = auth.uid());
create policy "ler as próprias turmas" on public.turmas for select to authenticated
  using (id in (select public.minhas_turmas()));
create policy "professor lê os convites" on public.convites for select to authenticated
  using (public.eh_professor() and turma_id in (select public.minhas_turmas()));
create policy "ler membros das turmas" on public.turma_alunos for select to authenticated
  using (turma_id in (select public.minhas_turmas()));
create policy "ler colegas de turma" on public.alunos for select to authenticated
  using (id = public.meu_aluno_id()
         or id in (select aluno_id from public.turma_alunos where turma_id in (select public.minhas_turmas())));
create policy "ler aulas das turmas" on public.aulas for select to authenticated
  using (turma_id in (select public.minhas_turmas()));
create policy "ler presenças das aulas" on public.presencas for select to authenticated
  using (aula_id in (select id from public.aulas where turma_id in (select public.minhas_turmas())));
create policy "ler partidas das turmas" on public.partidas for select to authenticated
  using (turma_id in (select public.minhas_turmas()));
create policy "ler desafios das turmas" on public.desafios for select to authenticated
  using (turma_id in (select public.minhas_turmas()));

-- ---------------------------------------------------------------------
-- Ações do aluno
-- ---------------------------------------------------------------------
-- RN06: confirmar ou cancelar até 4h antes; RN07: respeita o limite de vagas.
create or replace function public.presenca(p_aula uuid, p_status text, p_motivo text default null) returns text
language plpgsql security definer set search_path = public as $$
declare v_eu uuid := meu_aluno_id(); v_aula aulas; v_conf int;
begin
  perform exigir(v_eu is not null, 'Ação permitida só para alunos.');
  select * into v_aula from aulas where id = p_aula;
  perform exigir(v_aula.id is not null and v_aula.turma_id in (select minhas_turmas()), 'Aula não encontrada.');
  perform exigir(p_status in ('confirmado', 'cancelado'), 'Status inválido.');
  perform exigir(v_aula.inicio - now() >= interval '4 hours', 'Prazo encerrado: só é possível alterar até 4h antes da aula.');
  if p_status = 'confirmado' then
    select count(*) into v_conf from presencas where aula_id = p_aula and status = 'confirmado' and aluno_id <> v_eu;
    perform exigir(v_conf < v_aula.vagas, 'A aula já está lotada.');
  end if;
  insert into presencas (aula_id, aluno_id, status, motivo)
  values (p_aula, v_eu, p_status, case when p_status = 'cancelado' then nullif(p_motivo, '') end)
  on conflict (aula_id, aluno_id) do update set status = excluded.status, motivo = excluded.motivo;
  return case when p_status = 'confirmado' then 'Presença confirmada.' else 'Presença cancelada.' end;
end;
$$;

create or replace function public.placar_confirmar(p_partida uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_eu uuid := meu_aluno_id(); v_p partidas;
begin
  select * into v_p from partidas where id = p_partida;
  perform exigir(v_p.status = 'pendente', 'Partida não está pendente.');
  perform exigir(v_eu is not null and v_eu in (v_p.jogador_a, v_p.jogador_b) and v_p.registrado_por is distinct from v_eu,
    'Só o adversário confirma o placar.');
  update partidas set status = 'confirmada' where id = p_partida;
  return 'Placar confirmado. Ranking atualizado.';
end;
$$;

-- RN05: contestação vira disputa e o professor decide.
create or replace function public.placar_contestar(p_partida uuid, p_motivo text) returns text
language plpgsql security definer set search_path = public as $$
declare v_eu uuid := meu_aluno_id(); v_p partidas;
begin
  select * into v_p from partidas where id = p_partida;
  perform exigir(v_p.status = 'pendente', 'Partida não está pendente.');
  perform exigir(v_eu is not null and v_eu in (v_p.jogador_a, v_p.jogador_b) and v_p.registrado_por is distinct from v_eu,
    'Só o adversário contesta o placar.');
  update partidas set status = 'disputa', motivo = coalesce(nullif(p_motivo, ''), 'Placar contestado.') where id = p_partida;
  return 'Placar contestado. O professor vai decidir.';
end;
$$;

-- RN04: desafio só entre alunos da mesma turma.
create or replace function public.desafiar(p_para uuid, p_turma uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_eu uuid := meu_aluno_id();
begin
  perform exigir(v_eu is not null and p_para <> v_eu
    and exists (select 1 from turma_alunos where turma_id = p_turma and aluno_id = v_eu)
    and exists (select 1 from turma_alunos where turma_id = p_turma and aluno_id = p_para),
    'Desafios só entre alunos da mesma turma.');
  insert into desafios (turma_id, de, para) values (p_turma, v_eu, p_para);
  return 'Desafio enviado para ' || (select nome from alunos where id = p_para) || '.';
end;
$$;

create or replace function public.registrar_resultado(p_adversario uuid, p_turma uuid, p_sets jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare v_eu uuid := meu_aluno_id();
begin
  perform exigir(v_eu is not null and p_adversario <> v_eu
    and exists (select 1 from turma_alunos where turma_id = p_turma and aluno_id = v_eu)
    and exists (select 1 from turma_alunos where turma_id = p_turma and aluno_id = p_adversario),
    'Escolha um adversário da sua turma.');
  insert into partidas (turma_id, jogador_a, jogador_b, sets, status, registrado_por)
  values (p_turma, v_eu, p_adversario, validar_sets(p_sets), 'pendente', v_eu);
  return 'Resultado registrado. ' || (select nome from alunos where id = p_adversario) || ' tem 24h para confirmar.';
end;
$$;

-- RN01: pelo código a entrada é direta, sem aprovação.
create or replace function public.entrar_codigo(p_codigo text) returns text
language plpgsql security definer set search_path = public as $$
declare v_eu uuid := meu_aluno_id(); v_c convites; v_nome text;
begin
  perform exigir(v_eu is not null, 'Ação permitida só para alunos.');
  select * into v_c from convites where codigo = upper(trim(p_codigo));
  perform exigir(v_c.turma_id is not null and v_c.ativo and v_c.expira_em > now(), 'Código inválido ou expirado.');
  select nome into v_nome from turmas where id = v_c.turma_id;
  perform exigir(not exists (select 1 from turma_alunos where turma_id = v_c.turma_id and aluno_id = v_eu),
    'Você já faz parte da turma ' || v_nome || '.');
  insert into turma_alunos (turma_id, aluno_id) values (v_c.turma_id, v_eu);
  return 'Você entrou na turma ' || v_nome || '.';
end;
$$;

create or replace function public.sair_turma(p_turma uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_eu uuid := meu_aluno_id();
begin
  delete from turma_alunos where turma_id = p_turma and aluno_id = v_eu;
  perform exigir(found, 'Você não está nessa turma.');
  return 'Você saiu da turma ' || (select nome from turmas where id = p_turma) || '.';
end;
$$;

-- ---------------------------------------------------------------------
-- Ações do professor
-- ---------------------------------------------------------------------
create or replace function public.turma_do_professor(p_turma uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from turmas where id = p_turma and professor_id = auth.uid());
$$;

create or replace function public.criar_aula(p_turma uuid, p_inicio timestamptz, p_quadra text, p_tema text, p_vagas int) returns text
language plpgsql security definer set search_path = public as $$
begin
  perform exigir(turma_do_professor(p_turma), 'Turma não encontrada.');
  perform exigir(p_inicio is not null, 'Data ou horário inválido.');
  perform exigir(p_vagas between 1 and 6, 'O limite é de 1 a 6 alunos.');
  insert into aulas (turma_id, inicio, quadra, tema, vagas)
  values (p_turma, p_inicio, coalesce(nullif(p_quadra, ''), 'Quadra 1'), coalesce(p_tema, ''), p_vagas);
  return 'Aula criada. Os alunos da turma foram avisados.';
end;
$$;

create or replace function public.marcar_presenca(p_aula uuid, p_aluno uuid, p_status text) returns text
language plpgsql security definer set search_path = public as $$
begin
  perform exigir(turma_do_professor((select turma_id from aulas where id = p_aula)), 'Aula não encontrada.');
  perform exigir(p_status in ('presente', 'ausente'), 'Dados inválidos.');
  insert into presencas (aula_id, aluno_id, status) values (p_aula, p_aluno, p_status)
  on conflict (aula_id, aluno_id) do update set status = excluded.status;
  return 'Presença de ' || (select nome from alunos where id = p_aluno) || ': ' || p_status || '.';
end;
$$;

create or replace function public.avaliar(p_aluno uuid, p_nivel text, p_fundamentos jsonb, p_comentario text) returns text
language plpgsql security definer set search_path = public as $$
begin
  perform exigir(exists (select 1 from turma_alunos ta where ta.aluno_id = p_aluno and turma_do_professor(ta.turma_id)), 'Aluno não encontrado.');
  perform exigir(p_nivel in ('Iniciante', 'Intermediário', 'Avançado'), 'Nível inválido.');
  perform exigir((select bool_and(jsonb_typeof(p_fundamentos -> k) = 'number' and (p_fundamentos ->> k)::numeric in (1, 2, 3, 4, 5))
                  from unnest(array['saque', 'forehand', 'backhand', 'voleio', 'movimentacao']) k), 'Notas de 1 a 5.');
  update alunos set nivel = p_nivel, fundamentos = p_fundamentos, comentario = coalesce(p_comentario, ''), avaliado_em = now()
  where id = p_aluno;
  return 'Avaliação de ' || (select nome from alunos where id = p_aluno) || ' salva.';
end;
$$;

create or replace function public.validar_placar(p_partida uuid, p_sets jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare v_p partidas;
begin
  select * into v_p from partidas where id = p_partida;
  perform exigir(v_p.id is not null and turma_do_professor(v_p.turma_id) and v_p.status in ('disputa', 'pendente'),
    'Partida não pode ser validada.');
  update partidas set sets = validar_sets(p_sets), status = 'confirmada', validado_pelo_professor = true where id = p_partida;
  return 'Placar validado. Ranking atualizado.';
end;
$$;

-- RN10: o professor pode lançar o placar direto, já confirmado.
create or replace function public.lancar_placar(p_turma uuid, p_a uuid, p_b uuid, p_sets jsonb) returns text
language plpgsql security definer set search_path = public as $$
begin
  perform exigir(turma_do_professor(p_turma) and p_a <> p_b
    and exists (select 1 from turma_alunos where turma_id = p_turma and aluno_id = p_a)
    and exists (select 1 from turma_alunos where turma_id = p_turma and aluno_id = p_b),
    'Escolha dois alunos diferentes da turma.');
  insert into partidas (turma_id, jogador_a, jogador_b, sets, status, registrado_por, validado_pelo_professor)
  values (p_turma, p_a, p_b, validar_sets(p_sets), 'confirmada', null, true);
  return 'Placar lançado. Ranking atualizado.';
end;
$$;

create or replace function public.gerar_codigo(p_turma uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_codigo text;
begin
  perform exigir(turma_do_professor(p_turma), 'Turma não encontrada.');
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
    into v_codigo from generate_series(1, 6);
  insert into convites (turma_id, codigo, expira_em, ativo) values (p_turma, v_codigo, now() + interval '7 days', true)
  on conflict (turma_id) do update set codigo = excluded.codigo, expira_em = excluded.expira_em, ativo = true;
  return 'Novo código gerado: ' || v_codigo || '.';
end;
$$;

create or replace function public.revogar_codigo(p_turma uuid) returns text
language plpgsql security definer set search_path = public as $$
begin
  perform exigir(turma_do_professor(p_turma), 'Turma não encontrada.');
  update convites set ativo = false where turma_id = p_turma;
  return 'Código revogado. Quem já entrou continua na turma.';
end;
$$;

-- ---------------------------------------------------------------------
-- RN05: sem resposta do adversário em 24h, o placar é confirmado sozinho.
-- O app chama esta função ao carregar os dados.
-- ---------------------------------------------------------------------
create or replace function public.aplicar_prazos() returns void
language sql security definer set search_path = public as $$
  update partidas set status = 'confirmada', confirmado_automaticamente = true
  where status = 'pendente' and criado_em < now() - interval '24 hours';
$$;

-- ---------------------------------------------------------------------
-- Dados da demonstração
-- ---------------------------------------------------------------------
create or replace function public.semear_demo() returns void
language plpgsql security definer set search_path = public as $$
declare
  v_prof uuid; v_user uuid;
  a1 uuid; a2 uuid; a3 uuid; a4 uuid; a5 uuid; a6 uuid; a7 uuid;
  t1 uuid; t2 uuid; au1 uuid; au0 uuid;
  v_hoje timestamptz := date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
begin
  select id into v_prof from auth.users where email = 'professor@matchpoint.app';
  select id into v_user from auth.users where email = 'aluno@matchpoint.app';
  if v_prof is null or v_user is null then
    raise exception 'Crie antes os usuários professor@matchpoint.app e aluno@matchpoint.app em Authentication > Users.';
  end if;

  truncate desafios, partidas, presencas, aulas, convites, turma_alunos, turmas, alunos, perfis;

  insert into perfis values (v_prof, 'Prof. Carlos', 'professor'), (v_user, 'João Silva', 'aluno');

  insert into alunos (usuario_id, nome, nivel, fundamentos, comentario, avaliado_em)
  values (v_user, 'João Silva', 'Intermediário', '{"saque":4,"forehand":4,"backhand":3,"voleio":2,"movimentacao":3}',
          'Bom progresso no backhand. Próxima meta: subir à rede depois do saque.', now() - interval '3 days')
  returning id into a1;
  insert into alunos (nome, nivel) values ('Maria Souza', 'Intermediário') returning id into a2;
  insert into alunos (nome, nivel) values ('Pedro Lima', 'Intermediário') returning id into a3;
  insert into alunos (nome, nivel) values ('Lucas Rocha', 'Intermediário') returning id into a4;
  insert into alunos (nome, nivel) values ('Ana Costa', 'Intermediário') returning id into a5;
  insert into alunos (nome, nivel) values ('Bruno Alves', 'Iniciante') returning id into a6;
  insert into alunos (nome, nivel) values ('Carla Mendes', 'Iniciante') returning id into a7;

  insert into turmas (nome, professor_id) values ('Intermediário A', v_prof) returning id into t1;
  insert into turmas (nome, professor_id) values ('Iniciante B', v_prof) returning id into t2;
  insert into convites values (t1, 'ABC123', now() + interval '7 days', true), (t2, 'INI456', now() + interval '7 days', true);

  insert into turma_alunos values
    (t1, a1, 120, 12, 5), (t1, a2, 130, 13, 4), (t1, a3, 90, 9, 6), (t1, a4, 70, 7, 8), (t1, a5, 60, 6, 7),
    (t2, a6, 40, 4, 2), (t2, a7, 30, 3, 3);

  -- Próxima aula sempre ~8h à frente, para a regra das 4h funcionar logo depois de reiniciar a demo.
  insert into aulas (turma_id, inicio, quadra, tema, vagas)
  values (t1, date_trunc('hour', now()) + interval '8 hours', 'Quadra 2', 'Saque e devolução', 6) returning id into au1;
  insert into aulas (turma_id, inicio, quadra, tema, vagas)
  values (t1, v_hoje + interval '4 days 18 hours', 'Quadra 2', 'Voleio', 6);
  insert into aulas (turma_id, inicio, quadra, tema, vagas, comentario)
  values (t1, v_hoje - interval '3 days' + interval '18 hours', 'Quadra 2', 'Backhand cruzado', 6,
          'Bom treino de backhand. Próxima aula: saque.') returning id into au0;

  insert into presencas (aula_id, aluno_id, status, motivo) values
    (au1, a2, 'confirmado', null), (au1, a4, 'confirmado', null), (au1, a5, 'cancelado', 'Consulta médica'),
    (au0, a1, 'presente', null), (au0, a2, 'presente', null), (au0, a3, 'ausente', null);

  insert into partidas (turma_id, jogador_a, jogador_b, sets, status, registrado_por, historico, criado_em, motivo) values
    (t1, a1, a4, '[[6,4],[3,6],[6,2]]', 'confirmada', a1, true,  now() - interval '2 days', null),
    (t1, a2, a1, '[[6,4],[6,3]]',       'confirmada', a2, true,  now() - interval '5 days', null),
    (t1, a3, a1, '[[6,4],[3,6],[6,2]]', 'pendente',   a3, false, now() - interval '6 hours', null),
    (t1, a1, a2, '[[6,4],[6,3]]',       'disputa',    a1, false, now() - interval '20 hours', 'O segundo set foi 6-4 para mim.');
end;
$$;

-- Reiniciar a demonstração pelo app (só o professor).
create or replace function public.resetar_demo() returns text
language plpgsql security definer set search_path = public as $$
begin
  perform exigir(eh_professor(), 'Só o professor pode reiniciar a demonstração.');
  perform semear_demo();
  return 'Dados da demonstração reiniciados.';
end;
$$;

revoke execute on function public.semear_demo() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Tempo real: o app recebe as mudanças destas tabelas na hora.
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table
  public.aulas, public.presencas, public.partidas, public.desafios, public.turma_alunos, public.alunos, public.convites;

select public.semear_demo();
