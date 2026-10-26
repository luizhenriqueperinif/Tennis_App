// Cliente do protótipo MatchPoint (versão Supabase): uma SPA simples, com rotas por hash (#/prof, #/aluno/ranking...).
// Fala direto com o Supabase. As regras de negócio ficam nas funções do banco (supabase/schema.sql).
// A sessão fica no sessionStorage da aba, então dá para abrir o professor numa aba e o aluno em outra.
'use strict';

// Modo apresentação: com ?duo=1 a página mostra dois celulares lado a lado, cada um num iframe
// (?f=professor e ?f=aluno) com login próprio. Fora disso, é o app normal.
const PARAMS = new URLSearchParams(location.search);
const QUADRO = ['professor', 'aluno'].includes(PARAMS.get('f')) ? PARAMS.get('f') : null;
const DUO = PARAMS.has('duo') && !QUADRO;

// Painel lateral escondido ou não: preferência de quem está apresentando, guardada neste navegador.
function painelFechado() { try { return localStorage.getItem('mp-painel') === 'fechado'; } catch { return false; } }
function mostrarPainel(fechado) {
  document.body.classList.toggle('sem-painel', fechado);
  const b = document.querySelector('.recolher');
  if (b) { b.setAttribute('aria-expanded', String(!fechado)); b.setAttribute('aria-label', fechado ? 'Mostrar painel lateral' : 'Esconder painel lateral'); b.title = fechado ? 'Mostrar painel' : 'Esconder painel'; }
  try { localStorage.setItem('mp-painel', fechado ? 'fechado' : 'aberto'); } catch { /* sem storage: vale só até recarregar */ }
}
if (!QUADRO && painelFechado()) mostrarPainel(true);

// URL e chave publicável do projeto: podem ficar no navegador, quem protege os dados é o RLS.
const SUPABASE_URL = 'https://nytsdrjlrzyduraicqey.supabase.co';
const SUPABASE_CHAVE = 'sb_publishable_5YLKhTVfZTefwNqPEf6RVA_0nIu9UL4';

const HORA = 3600 * 1000;
const FUNDAMENTOS = [['saque', 'Saque'], ['forehand', 'Forehand'], ['backhand', 'Backhand'], ['voleio', 'Voleio'], ['movimentacao', 'Movimentação']];
// Ícones do protótipo do Gabriel (traço de 1.8, estilo Material).
const ICONES = {
  inicio: '<path d="m3 11 9-7 9 7"/><path d="M5.5 10v10h13V10M10 20v-6h4v6"/>',
  alunos: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 19c.5-4 2.5-6 5.5-6s5 2 5.5 6m.5-5c2.8.2 4.5 1.8 5 4.5"/>',
  agenda: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4m8-4v4M3.5 10h17"/>',
  bola: '<circle cx="12" cy="12" r="9"/><path d="M5.5 6.2c3 1 4.4 3.3 4.4 5.8s-1.4 4.8-4.4 5.8M18.5 6.2c-3 1-4.4 3.3-4.4 5.8s1.4 4.8 4.4 5.8"/>',
  desempenho: '<path d="M5 19V9m7 10V5m7 14v-7"/>',
  ranking: '<path d="M8 20v-8h8v8M4 20v-5h4v5m8 0V8h4v12"/><path d="m12 3 .8 1.7 1.9.2-1.4 1.3.4 1.8-1.7-.9-1.7.9.4-1.8-1.4-1.3 1.9-.2Z"/>',
  seta: '<path d="M5 12h13m-5-5 5 5-5 5"/>',
  voltar: '<path d="m15 18-6-6 6-6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  sair: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="m10 16-4-4 4-4M6 12h10"/>',
  alerta: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>',
  convite: '<path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4Z"/><path d="M14 8v8"/>',
  coroa: '<path d="m4 8 4 4 4-7 4 7 4-4-2 10H6Z"/>'
};

const ui = {
  estado: null,
  turmaSel: null,
  cancelando: false,
  contestando: null,
  ultimoJson: ''
};

function armazenamento() { try { sessionStorage.setItem('_t', '1'); sessionStorage.removeItem('_t'); return sessionStorage; } catch { return undefined; } }
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_CHAVE, { auth: { storage: armazenamento(), persistSession: true, autoRefreshToken: true, ...(QUADRO ? { storageKey: 'mp-' + QUADRO } : {}) } });

// ---------- utilidades ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
function dataHora(iso) {
  const d = new Date(iso);
  const hoje = new Date(ui.estado ? ui.estado.agora : Date.now());
  const mesmoDia = d.toDateString() === hoje.toDateString();
  const hm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return (mesmoDia ? 'Hoje' : SEMANA[d.getDay()] + ' ' + d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })) + ' · ' + hm;
}
const so_data = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const iniciais = (nome) => nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
const agora = () => Date.parse(ui.estado.agora);
const nome = (id) => ui.estado.nomes[id] || 'Professor';
// Na barra de presenças conta quem confirmou e quem o professor já marcou como presente.
const ocupaVaga = (p) => !!p && ['confirmado', 'presente'].includes(p.status);
const placar = (p) => p.sets.map((s) => s.join('-')).join(' · ');
function vencedor(p) {
  let a = 0, b = 0;
  for (const [x, y] of p.sets) { if (x > y) a++; else if (y > x) b++; }
  return a > b ? p.a : p.b;
}
function horasRestantes(p) {
  const h = Math.max(0, Math.ceil((Date.parse(p.criadoEm) + 24 * HORA - agora()) / HORA));
  return h + 'h';
}
function turmaAtual() {
  const ts = ui.estado.turmas;
  return ts.find((t) => t.id === ui.turmaSel) || ts[0];
}
function svg(nomeIcone, tam = 20) { return '<svg class="ic" width="' + tam + '" height="' + tam + '" viewBox="0 0 24 24" aria-hidden="true">' + ICONES[nomeIcone] + '</svg>'; }
const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
// "Hoje", "Amanhã" ou "Sex 24/10"
function diaCurto(iso) {
  const d = new Date(iso);
  const hoje = new Date(agora());
  const amanha = new Date(agora() + 24 * HORA);
  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  if (d.toDateString() === amanha.toDateString()) return 'Amanhã';
  return SEMANA[d.getDay()] + ' ' + so_data(iso);
}
const decimal = (n) => n.toFixed(1).replace('.', ',');
function media(fundamentos) {
  const notas = FUNDAMENTOS.map(([k]) => fundamentos && fundamentos[k]).filter(Number.isFinite);
  return notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : 0;
}
// Cor do avatar fixa por pessoa (as quatro cores do protótipo do Gabriel).
function avatar(id, nomePessoa, extra = '') {
  const cor = [...String(id)].reduce((s, c) => s + c.charCodeAt(0), 0) % 4 + 1;
  return '<span class="avatar cor' + cor + (extra ? ' ' + extra : '') + '" aria-hidden="true">' + esc(iniciais(nomePessoa)) + '</span>';
}
const primeiroNome = (n) => n.replace(/^Prof\.\s*/, '').split(' ')[0];
function setsGanhos(p) {
  let a = 0, b = 0;
  for (const [x, y] of p.sets) { if (x > y) a++; else if (y > x) b++; }
  return [a, b];
}

// ---------- Supabase ----------
const json = (estado) => JSON.stringify({ ...estado, agora: '' });

function checar(r) {
  if (r.error) throw new Error(r.error.message || 'Erro inesperado.');
  return r.data;
}

// Busca tudo o que o usuário pode ver (o RLS filtra) e monta o mesmo formato de estado do protótipo local.
async function carregarEstado() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  await sb.rpc('aplicar_prazos');  // RN05: confirma placares sem resposta há 24h
  const uid = session.user.id;
  const [perfil, turmas, membros, alunos, convites, ranking, aulas, presencas, partidas, desafios] = (await Promise.all([
    sb.from('perfis').select('*').eq('id', uid).maybeSingle(),
    sb.from('turmas').select('id, nome').order('criada_em'),
    sb.from('turma_alunos').select('turma_id, aluno_id'),
    sb.from('alunos').select('*'),
    sb.from('convites').select('*'),
    sb.from('v_ranking').select('*'),
    sb.from('aulas').select('*').order('inicio'),
    sb.from('presencas').select('*'),
    sb.from('partidas').select('*').order('criado_em', { ascending: false }),
    sb.from('desafios').select('*')
  ])).map(checar);
  if (!perfil) throw new Error('Usuário sem perfil. Rode o schema.sql no Supabase.');

  const ficha = (a) => ({ id: a.id, nome: a.nome, nivel: a.nivel, fundamentos: a.fundamentos, comentario: a.comentario, avaliadoEm: a.avaliado_em });
  const eu = alunos.find((a) => a.usuario_id === uid);
  const professor = perfil.papel === 'professor';
  const estado = {
    agora: new Date().toISOString(),
    usuario: { id: professor ? uid : eu && eu.id, nome: perfil.nome, papel: perfil.papel },
    nomes: Object.fromEntries(alunos.map((a) => [a.id, a.nome])),
    turmas: turmas.map((t) => {
      const linhas = ranking.filter((r) => r.turma_id === t.id)
        .map((r) => ({ id: r.aluno_id, nome: r.nome, pontos: r.pontos, v: r.vitorias, d: r.derrotas }))
        .sort((x, y) => y.pontos - x.pontos || y.v - x.v);
      const c = convites.find((x) => x.turma_id === t.id);
      return {
        id: t.id, nome: t.nome,
        membros: linhas.map((l) => l.id).filter((id) => membros.some((m) => m.turma_id === t.id && m.aluno_id === id)),
        codigo: professor ? (c ? { valor: c.codigo, expira: c.expira_em, ativo: c.ativo } : { valor: '—', expira: 0, ativo: false }) : undefined,
        ranking: linhas
      };
    }),
    aulas: aulas.map((a) => ({
      id: a.id, turmaId: a.turma_id, inicio: a.inicio, quadra: a.quadra, tema: a.tema, vagas: a.vagas, comentario: a.comentario,
      presencas: Object.fromEntries(presencas.filter((p) => p.aula_id === a.id).map((p) => [p.aluno_id, { status: p.status, motivo: p.motivo }]))
    })),
    partidas: partidas.map((p) => ({
      id: p.id, turmaId: p.turma_id, a: p.jogador_a, b: p.jogador_b, sets: p.sets, status: p.status, registradoPor: p.registrado_por,
      criadoEm: p.criado_em, motivo: p.motivo, seed: p.historico, validadoPeloProfessor: p.validado_pelo_professor,
      confirmadoAutomaticamente: p.confirmado_automaticamente
    })),
    desafios: desafios.map((d) => ({ id: d.id, turmaId: d.turma_id, de: d.de, para: d.para, criadoEm: d.criado_em }))
  };
  if (professor) estado.alunos = Object.fromEntries(alunos.map((a) => [a.id, ficha(a)]));
  else estado.eu = eu ? ficha(eu) : null;
  return estado;
}

// Recarrega e só redesenha se algo mudou e ninguém está digitando.
async function atualizar(forcar) {
  const e = await carregarEstado();
  if (!e) { if (ui.estado) sair(false); return; }
  const j = json(e);
  if (!forcar && j === ui.ultimoJson) return;
  ui.ultimoJson = j;
  ui.estado = e;
  const foco = document.activeElement;
  if (!forcar && foco && ['INPUT', 'TEXTAREA', 'SELECT'].includes(foco.tagName)) return;
  render();
}

// Cada ação chama uma função do banco, que confere o perfil e as regras e devolve a mensagem.
async function acao(funcao, parametros) {
  try {
    const mensagem = checar(await sb.rpc(funcao, parametros));
    await atualizar(true);
    aviso(mensagem);
    return true;
  } catch (e) {
    aviso(e.message, true);
    return false;
  } finally {
    render();
  }
}

let timerAviso;
function aviso(msg, erro) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (erro ? ' erro' : '');
  el.hidden = false;
  clearTimeout(timerAviso);
  timerAviso = setTimeout(() => { el.hidden = true; }, 3200);
}

async function entrar(email, senha) {
  try {
    const { error } = await sb.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
    await atualizar(true);
    location.hash = ui.estado.usuario.papel === 'professor' ? '#/prof' : '#/aluno';
    ouvirMudancas().catch(() => {});
  } catch (e) { aviso(e.message, true); }
}

function sair(chamarApi = true) {
  // scope 'local': sai só desta aba, sem derrubar o mesmo usuário em outros aparelhos.
  if (chamarApi) sb.auth.signOut({ scope: 'local' }).catch(() => {});
  canalAtual = null;
  clearTimeout(timerReconexao);
  sb.removeAllChannels();
  ui.estado = null; ui.turmaSel = null; ui.ultimoJson = '';
  location.hash = '#/login';
  render();
}

// Tempo real: o Supabase avisa quando uma tabela muda e a tela recarrega (agrupando avisos próximos).
let timerRecarga, timerReconexao, canalAtual = null;
async function ouvirMudancas() {
  clearTimeout(timerReconexao);
  canalAtual = null;
  await sb.removeAllChannels();
  // O canal precisa do token do usuário logado: com a chave publicável o servidor recusa a inscrição.
  const { data: { session } } = await sb.auth.getSession();
  if (!session || !ui.estado) return;
  await sb.realtime.setAuth(session.access_token);
  // Nome novo a cada vez: com o mesmo nome a biblioteca devolveria o canal antigo, ainda com erro.
  const canal = sb.channel('mudancas-' + Date.now())
    .on('postgres_changes', { event: '*', schema: 'public' }, () => {
      clearTimeout(timerRecarga);
      timerRecarga = setTimeout(() => atualizar().catch(() => {}), 300);
    })
    .subscribe((status) => {
      // Se o canal cair (rede, token renovado...), tenta de novo em 3s e recarrega o que perdeu.
      // Avisos de canais antigos (fechados por nós mesmos) são ignorados.
      if (canal !== canalAtual || !['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status) || !ui.estado) return;
      clearTimeout(timerReconexao);
      timerReconexao = setTimeout(() => { if (ui.estado) { ouvirMudancas().catch(() => {}); atualizar().catch(() => {}); } }, 3000);
    });
  canalAtual = canal;
}

// Reserva: se o tempo real cair, a tela ainda se atualiza a cada 10s.
setInterval(() => { if (ui.estado) atualizar().catch(() => {}); }, 10000);

// ---------- componentes ----------
function topo(titulo, { voltar } = {}) {
  return '<header class="top-bar">' +
    (voltar ? '<a class="icone-btn" href="' + voltar + '" aria-label="Voltar">' + svg('voltar') + '</a>' : '<span class="marca-mini" aria-hidden="true">' + svg('bola', 19) + '</span>') +
    '<h1>' + esc(titulo) + '</h1>' +
    '<button type="button" class="icone-btn" data-acao="sair" aria-label="Sair" title="Sair">' + svg('sair') + '</button></header>';
}

function nav(itens, atual) {
  return '<nav class="nav" aria-label="Navegação principal">' + itens.map(([rota, rotulo, icone]) =>
    '<a href="' + rota + '"' + (rota === atual ? ' class="on" aria-current="page"' : '') + '><span class="nav-ic">' + svg(icone, 22) + '</span>' + rotulo + '</a>'
  ).join('') + '</nav>';
}
const NAV_PROF = [['#/prof', 'Início', 'inicio'], ['#/prof/alunos', 'Alunos', 'alunos'], ['#/prof/aulas', 'Aulas', 'agenda'], ['#/prof/partidas', 'Partidas', 'bola']];
const NAV_ALUNO = [['#/aluno', 'Início', 'inicio'], ['#/aluno/agenda', 'Agenda', 'agenda'], ['#/aluno/desempenho', 'Desempenho', 'desempenho'], ['#/aluno/ranking', 'Ranking', 'ranking']];

function secao(titulo, link, rotulo) {
  return '<div class="secao"><h3>' + titulo + '</h3>' + (link ? '<a href="' + link + '">' + rotulo + '</a>' : '') + '</div>';
}
function atalho(rota, icone, rotulo) {
  return '<a class="atalho" href="' + rota + '"><span>' + svg(icone) + '</span>' + rotulo + svg('seta', 16) + '</a>';
}
function metrica(valor, rotulo) { return '<div class="metrica"><strong>' + valor + '</strong><span>' + rotulo + '</span></div>'; }
function aviso_card(icone, titulo, texto, tipo = '', rota) {
  const tag = rota ? 'a' : 'div';
  return '<' + tag + ' class="aviso-card ' + tipo + '"' + (rota ? ' href="' + rota + '"' : '') + '><span class="insight-ic">' + svg(icone) + '</span><span><strong>' + titulo + '</strong>' + texto + '</span>' + (rota ? svg('chevron', 18) : '') + '</' + tag + '>';
}

function chipsTurma() {
  const ts = ui.estado.turmas;
  if (ts.length < 2) return '';
  const atual = turmaAtual();
  return '<div class="chips" role="group" aria-label="Turma">' + ts.map((t) =>
    '<button type="button" class="chip' + (t.id === atual.id ? ' on' : '') + '" data-acao="turma" data-id="' + t.id + '"' + (t.id === atual.id ? ' aria-pressed="true"' : '') + '>' + esc(t.nome) + '</button>'
  ).join('') + '</div>';
}

// Sem resposta: antes do prazo de 4h ainda dá para confirmar; depois, o status fica incerto (RN06).
function seloPresenca(p, aula) {
  const s = p ? p.status : 'pendente';
  if (s === 'confirmado') return '<span class="selo ok">Confirmado</span>';
  if (s === 'presente') return '<span class="selo ok">Presente</span>';
  if (s === 'ausente') return '<span class="selo erro">Ausente</span>';
  if (s === 'cancelado') return '<span class="selo erro">Cancelou</span>';
  if (aula && agora() < Date.parse(aula.inicio) - 4 * HORA) return '<span class="selo pend">A confirmar</span>';
  return '<span class="selo pend">Status incerto</span>';
}

function seloPartida(p) {
  if (p.status === 'confirmada') return '<span class="selo ok">' + (p.validadoPeloProfessor ? 'Validada' : p.confirmadoAutomaticamente ? 'Confirmada (24h)' : 'Confirmada') + '</span>';
  if (p.status === 'disputa') return '<span class="selo erro">Em disputa</span>';
  return '<span class="selo pend">Pendente</span>';
}

// Placar grande no estilo do protótipo do Gabriel: sets ganhos por jogador e o placar set a set embaixo.
function placarBox(p) {
  const [a, b] = setsGanhos(p);
  return '<div class="placar-box"><div><span class="' + (a > b ? 'venc' : '') + '">' + esc(nome(p.a)) + '</span><strong>' + a + '</strong></div><span class="x">×</span>' +
    '<div><span class="' + (b > a ? 'venc' : '') + '">' + esc(nome(p.b)) + '</span><strong>' + b + '</strong></div></div>' +
    '<div class="sets-mini">' + placar(p) + '</div>';
}

function camposSets(nomeA, nomeB, sets = []) {
  let h = '<div class="sets"><span></span><span class="cab">' + esc(nomeA) + '</span><span class="cab">' + esc(nomeB) + '</span>';
  for (let i = 0; i < 3; i++) {
    const s = sets[i] || ['', ''];
    h += '<span class="set-nome">SET ' + (i + 1) + (i === 2 ? ' <span style="font-weight:400;letter-spacing:0">(se houver)</span>' : '') + '</span>' +
      '<input name="s' + i + 'a" inputmode="numeric" maxlength="1" value="' + s[0] + '" aria-label="Set ' + (i + 1) + ' ' + esc(nomeA) + '">' +
      '<input name="s' + i + 'b" inputmode="numeric" maxlength="1" value="' + s[1] + '" aria-label="Set ' + (i + 1) + ' ' + esc(nomeB) + '">';
  }
  return h + '</div>';
}
function lerSets(fd) {
  const sets = [];
  for (let i = 0; i < 3; i++) {
    const a = fd.get('s' + i + 'a'), b = fd.get('s' + i + 'b');
    if (a === '' && b === '') continue;
    sets.push([Number(a), Number(b)]);
  }
  return sets;
}

// ---------- telas ----------
function telaLogin() {
  return '<div class="auth"><div class="auth-arte"><div class="marca-q">' + svg('bola', 32) + '</div>' +
    '<div class="wordmark">MatchPoint</div><p>Aulas, desafios e ranking do seu grupo de tênis.</p></div>' +
    '<div class="auth-form"><div><h2>Boas-vindas</h2><p class="muted" style="margin-top:4px">Entre para ver suas aulas e o ranking da turma.</p></div>' +
    '<form data-form="login" style="display:flex;flex-direction:column;gap:12px">' +
    '<label class="campo">E-mail<input name="email" type="email" autocomplete="username" required></label>' +
    '<label class="campo">Senha<input name="senha" type="password" autocomplete="current-password" required></label>' +
    '<button class="btn" type="submit">' + svg('seta', 18) + 'Entrar</button></form>' +
    '<div class="teste"><span class="muted">Usuários de teste (preenche o e-mail)</span>' +
    (QUADRO && QUADRO !== 'professor' ? '' : '<button type="button" class="btn sec pequeno" data-acao="login-teste" data-email="professor@matchpoint.app">Professor (Carlos)</button>') +
    (QUADRO && QUADRO !== 'aluno' ? '' : '<button type="button" class="btn sec pequeno" data-acao="login-teste" data-email="aluno@matchpoint.app">Aluno (João)</button>') + '</div>' +
    '</div></div>';
}

// ----- Professor -----
function profDashboard() {
  const e = ui.estado;
  const futuras = e.aulas.filter((a) => Date.parse(a.inicio) > agora());
  const prox = futuras[0];
  const disputas = e.partidas.filter((p) => p.status === 'disputa');
  const pendentes = e.partidas.filter((p) => p.status === 'pendente');
  const hoje = new Date(agora());
  const aulasHoje = futuras.filter((a) => new Date(a.inicio).toDateString() === hoje.toDateString()).length;
  const totalAlunos = new Set(e.turmas.flatMap((t) => t.membros)).size;
  const dataHoje = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' }).replace('-feira', '').replace('.', '');

  let h = topo('Olá, ' + primeiroNome(e.usuario.nome)) + '<main class="conteudo">' +
    '<section class="hero-card"><span class="eyebrow">' + esc(dataHoje) + '</span><h2>Pronto para a quadra?</h2>' +
    '<p>' + (aulasHoje ? 'Você tem ' + aulasHoje + (aulasHoje > 1 ? ' aulas' : ' aula') + ' hoje.' : futuras.length + (futuras.length === 1 ? ' aula agendada.' : ' aulas agendadas.')) + '</p>' +
    '<div class="hero-bola" aria-hidden="true">' + svg('bola', 56) + '</div></section>';

  if (prox) {
    const t = e.turmas.find((x) => x.id === prox.turmaId);
    const conf = t.membros.filter((m) => ocupaVaga(prox.presencas[m])).length;
    h += secao('Próxima aula', '#/prof/aulas', 'Ver aulas') +
      '<div class="aula-card"><div class="hora"><strong>' + hora(prox.inicio) + '</strong><span>' + diaCurto(prox.inicio) + '</span></div>' +
      '<div class="aula-info"><strong>' + esc(t.nome) + '</strong><span>' + esc(prox.quadra) + (prox.tema ? ' · ' + esc(prox.tema) : '') + '</span></div>' +
      '<span class="selo ' + (conf ? 'ok' : 'pend') + '">' + conf + '/' + t.membros.length + '</span></div>' +
      '<section class="card"><div class="linha"><h3 style="font-size:15px">' + conf + ' de ' + t.membros.length + ' alunos confirmaram</h3></div>' +
      '<div class="barra"><span style="width:' + (t.membros.length ? Math.round(conf / t.membros.length * 100) : 0) + '%"></span></div>' +
      '<span class="muted" style="font-size:12px;margin-top:-4px">Aula com ' + prox.vagas + ' vagas · ' + esc(t.nome) + ' tem ' + t.membros.length + (t.membros.length === 1 ? ' aluno' : ' alunos') + '</span>' +
      '<ul class="lista">' + t.membros.map((m) => {
        const p = prox.presencas[m];
        return '<li>' + avatar(m, nome(m), 'mini') + '<div class="nome"><strong>' + esc(nome(m)) + '</strong><span>' + seloPresenca(p, prox) + '</span>' + (p && p.motivo ? '<span class="muted">Motivo: ' + esc(p.motivo) + '</span>' : '') + '</div>' +
          '<button class="btn sec pequeno" data-acao="marcar" data-aula="' + prox.id + '" data-aluno="' + m + '" data-status="presente" aria-label="Marcar ' + esc(nome(m)) + ' presente">P</button>' +
          '<button class="btn perigo pequeno" data-acao="marcar" data-aula="' + prox.id + '" data-aluno="' + m + '" data-status="ausente" aria-label="Marcar ' + esc(nome(m)) + ' ausente">A</button></li>';
      }).join('') + '</ul><span class="muted">P = presente, A = ausente. Quem não confirmou até 4h antes aparece como "Status incerto".</span></section>';
  }

  h += '<div class="atalhos">' + atalho('#/prof/aulas', 'mais', 'Nova aula') + atalho('#/prof/alunos', 'alunos', 'Alunos e convite') +
    atalho('#/prof/alunos', 'desempenho', 'Avaliar') + atalho('#/prof/partidas', 'bola', 'Partidas') + '</div>';

  h += secao('Pendências') +
    disputas.map((p) => aviso_card('alerta', 'Placar em disputa', esc(nome(p.a)) + ' x ' + esc(nome(p.b)) + ' · você decide o placar final', '', '#/prof/partidas')).join('') +
    (pendentes.length ? aviso_card('relogio', pendentes.length + (pendentes.length > 1 ? ' placares aguardando' : ' placar aguardando') + ' o adversário', 'Confirmação automática em 24h', 'neutro', '#/prof/partidas') : '') +
    (!disputas.length && !pendentes.length ? aviso_card('check', 'Tudo em dia', 'Nenhuma pendência no momento.', 'ok') : '');

  h += secao('Resumo') + '<div class="metricas">' + metrica(e.turmas.length, e.turmas.length === 1 ? 'Turma' : 'Turmas') + metrica(totalAlunos, 'Alunos') + metrica(futuras.length, 'Aulas agendadas') + '</div>' +
    '<button type="button" class="link" data-acao="reset">Reiniciar dados da demonstração</button></main>' + nav(NAV_PROF, '#/prof');
  return h;
}

function profAlunos() {
  const t = turmaAtual();
  const c = t.codigo;
  const ativo = c.ativo && Date.parse(c.expira) > agora();
  return topo('Alunos') + '<main class="conteudo">' + chipsTurma() +
    '<section class="convite-card"><span class="eyebrow">Código de convite · ' + esc(t.nome) + '</span>' +
    '<div class="codigo" style="' + (ativo ? '' : 'text-decoration:line-through;opacity:.5') + '">' + esc(c.valor) + '</div>' +
    '<span class="muted">' + (ativo ? 'Válido até ' + so_data(c.expira) + ' às 23:00 · uso ilimitado · entrada direta' : 'Código revogado. Gere um novo para convidar alunos.') + '</span>' +
    '<div class="botoes"><button class="btn sec pequeno" data-acao="gerar-codigo" data-turma="' + t.id + '">Gerar novo</button>' +
    (ativo ? '<button class="btn sec pequeno" data-acao="revogar-codigo" data-turma="' + t.id + '">Revogar</button>' : '') + '</div></section>' +
    secao('Seus alunos · ' + t.membros.length) + '<p class="muted" style="margin-top:-10px">Toque em um aluno para avaliar.</p>' +
    '<div class="lista">' + t.ranking.map((r) => '<a class="item" href="#/prof/avaliar/' + r.id + '">' + avatar(r.id, r.nome) +
      '<span class="nome"><strong>' + esc(r.nome) + '</strong><span class="muted">' + esc(ui.estado.alunos[r.id].nivel) + ' · ' + r.pontos + ' pts · ' + r.v + 'V ' + r.d + 'D</span></span>' + svg('chevron') + '</a>').join('') +
    '</div></main>' + nav(NAV_PROF, '#/prof/alunos');
}

function profAvaliar(alunoId) {
  const al = ui.estado.alunos[alunoId];
  if (!al) return profAlunos();
  const m = media(al.fundamentos);
  return topo('Avaliação', { voltar: '#/prof/alunos' }) + '<main class="conteudo">' +
    '<div class="perfil">' + avatar(al.id, al.nome, 'grande') + '<div><h2>' + esc(al.nome) + '</h2><p>' + esc(al.nivel) + ' · ' + (al.avaliadoEm ? 'última avaliação em ' + so_data(al.avaliadoEm) : 'ainda não avaliado') + '</p></div></div>' +
    '<section class="nota-card"><span>MÉDIA DOS FUNDAMENTOS</span><strong>' + (m ? decimal(m) : '–') + ' <small>de 5</small></strong>' +
    '<div class="barra clara"><span style="width:' + Math.round(m * 20) + '%"></span></div><p>Média das notas de 1 a 5 abaixo.</p></section>' +
    '<form data-form="avaliar" data-aluno="' + al.id + '" style="display:flex;flex-direction:column;gap:16px">' +
    '<label class="campo">Nível do aluno<select name="nivel">' + ['Iniciante', 'Intermediário', 'Avançado'].map((n) => '<option' + (n === al.nivel ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>' +
    secao('Fundamentos') +
    FUNDAMENTOS.map(([k, rotulo]) => '<fieldset class="fund-campo"><legend>' + rotulo + '</legend><div class="notas">' +
      [1, 2, 3, 4, 5].map((v) => '<input type="radio" id="' + k + v + '" name="' + k + '" value="' + v + '"' + (al.fundamentos[k] === v ? ' checked' : '') + '><label for="' + k + v + '">' + v + '</label>').join('') +
      '</div></fieldset>').join('') +
    '<label class="campo">Comentário para o aluno<textarea name="comentario" rows="3">' + esc(al.comentario) + '</textarea></label>' +
    '<button class="btn" type="submit">' + svg('check', 18) + 'Salvar avaliação</button></form></main>';
}

function profAulas() {
  const e = ui.estado;
  const amanha = new Date(agora() + 24 * HORA).toISOString().slice(0, 10);
  const futuras = e.aulas.filter((a) => Date.parse(a.inicio) > agora());
  const passadas = e.aulas.filter((a) => Date.parse(a.inicio) <= agora()).reverse();
  return topo('Aulas') + '<main class="conteudo">' +
    '<form data-form="criar-aula" style="display:flex;flex-direction:column;gap:12px">' +
    '<div><span class="eyebrow">Nova aula</span><h2 style="margin-top:4px">Detalhes da aula</h2><p class="muted" style="margin-top:4px">Defina turma, data e local. Os alunos veem na agenda na hora.</p></div>' +
    '<label class="campo">Turma<select name="turmaId">' + e.turmas.map((t) => '<option value="' + t.id + '">' + esc(t.nome) + '</option>').join('') + '</select></label>' +
    '<div class="grade2"><label class="campo">Data<input name="data" type="date" value="' + amanha + '" required></label><label class="campo">Horário<input name="hora" type="time" value="18:00" required></label></div>' +
    '<div class="grade2"><label class="campo">Quadra<select name="quadra"><option>Quadra 1</option><option selected>Quadra 2</option><option>Quadra 3</option></select></label>' +
    '<label class="campo">Limite de alunos<input name="vagas" type="number" min="1" max="6" value="6" required></label></div>' +
    '<label class="campo">Tema<input name="tema" value="Saque e devolução"></label>' +
    aviso_card('alunos', 'Até 6 alunos por aula', 'Limite por quadra e horário.', 'neutro') +
    '<button class="btn" type="submit">' + svg('check', 18) + 'Salvar e avisar alunos</button></form>' +
    secao('Próximas aulas') + (futuras.length ? futuras.map((a) => cardAulaProf(a)).join('') : '<p class="vazio">Nenhuma aula agendada.</p>') +
    secao('Aulas realizadas') + (passadas.length ? passadas.map((a) => cardAulaProf(a, true)).join('') : '<p class="vazio">Nenhuma aula ainda.</p>') +
    '</main>' + nav(NAV_PROF, '#/prof/aulas');
}
function cardAulaProf(a, passada) {
  const t = ui.estado.turmas.find((x) => x.id === a.turmaId);
  const membros = t ? t.membros : [];
  // Aula passada: quem esteve presente. Próxima aula: quem da turma já ocupa vaga.
  const conf = passada ? Object.values(a.presencas).filter((p) => p.status === 'presente').length : membros.filter((m) => ocupaVaga(a.presencas[m])).length;
  return '<div class="aula-card"><div class="hora"><strong>' + hora(a.inicio) + '</strong><span>' + diaCurto(a.inicio) + '</span></div>' +
    '<div class="aula-info"><strong>' + esc(t ? t.nome : '') + '</strong><span>' + esc(a.quadra) + (a.tema ? ' · ' + esc(a.tema) : '') + '</span>' +
    (a.comentario ? '<span>Comentário: ' + esc(a.comentario) + '</span>' : '') + '</div>' +
    '<span class="selo ' + (passada ? 'ok' : 'pend') + '">' + conf + (passada ? ' presentes' : '/' + membros.length) + '</span></div>';
}

function profPartidas() {
  const e = ui.estado;
  const disputas = e.partidas.filter((p) => p.status === 'disputa');
  const pendentes = e.partidas.filter((p) => p.status === 'pendente');
  const confirmadas = e.partidas.filter((p) => p.status === 'confirmada').slice(0, 5);
  const t = turmaAtual();
  let h = topo('Partidas') + '<main class="conteudo">' + secao('Em disputa');
  h += disputas.length ? disputas.map((p) => '<form class="card" data-form="validar" data-partida="' + p.id + '">' +
    '<div class="linha"><span class="eyebrow" style="color:var(--erro)">Contestação</span>' + seloPartida(p) + '</div>' + placarBox(p) +
    '<span class="muted"><strong style="color:var(--texto)">' + esc(nome(p.registradoPor)) + '</strong> registrou o placar acima.</span>' +
    '<span class="comentario" style="background:var(--coral-claro);color:var(--coral-texto)">“' + esc(p.motivo) + '”</span>' +
    '<strong style="font-size:14px">Placar final (set a set)</strong>' + camposSets(nome(p.a), nome(p.b), p.sets) +
    '<button class="btn" type="submit">' + svg('check', 18) + 'Validar placar final</button></form>').join('') : '<p class="vazio">Nenhuma disputa.</p>';
  h += secao('Aguardando o adversário') + (pendentes.length ? pendentes.map((p) =>
    '<div class="card"><div class="linha"><span class="eyebrow">Aguardando</span>' + seloPartida(p) + '</div>' + placarBox(p) +
    '<span class="muted">' + esc(nome(p.registradoPor)) + ' registrou. Confirmação automática em ' + horasRestantes(p) + '.</span></div>'
  ).join('') : '<p class="vazio">Nada pendente.</p>');
  h += '<form class="card" data-form="lancar"><span class="eyebrow">Placar de treino</span><h2>Como foi o jogo?</h2>' + chipsTurma() +
    '<input type="hidden" name="turmaId" value="' + t.id + '">' +
    '<div class="grade2"><label class="campo">Jogador 1<select name="a">' + t.membros.map((m, i) => '<option value="' + m + '"' + (i === 0 ? ' selected' : '') + '>' + esc(nome(m)) + '</option>').join('') + '</select></label>' +
    '<label class="campo">Jogador 2<select name="b">' + t.membros.map((m, i) => '<option value="' + m + '"' + (i === 1 ? ' selected' : '') + '>' + esc(nome(m)) + '</option>').join('') + '</select></label></div>' +
    camposSets('Jogador 1', 'Jogador 2') + '<span class="muted">O placar lançado pelo professor já vale para o ranking.</span><button class="btn" type="submit">' + svg('check', 18) + 'Lançar placar</button></form>';
  h += secao('Confirmadas recentes') + (confirmadas.length ? '<div class="card" style="gap:6px"><ul class="lista">' + confirmadas.map((p) => {
    const [a, b] = setsGanhos(p);
    return '<li><span class="nome"><strong>' + esc(nome(p.a)) + ' ' + a + ' × ' + b + ' ' + esc(nome(p.b)) + '</strong><span class="muted">' + placar(p) + ' · vencedor: ' + esc(nome(vencedor(p))) + '</span></span>' + seloPartida(p) + '</li>';
  }).join('') + '</ul></div>' : '<p class="vazio">Nenhuma partida confirmada.</p>');
  return h + '</main>' + nav(NAV_PROF, '#/prof/partidas');
}

// ----- Aluno -----
function minhaPosicao(t) {
  const i = t.ranking.findIndex((r) => r.id === ui.estado.usuario.id);
  return { pos: i + 1, linha: t.ranking[i] };
}

function alunoHome() {
  const e = ui.estado;
  const eu = e.usuario.id;
  if (!e.turmas.length) {
    return topo('Olá, ' + primeiroNome(e.usuario.nome)) +
      '<main class="conteudo"><section class="hero-card"><span class="eyebrow">Bem-vindo</span><h2>Seu jogo começa aqui.</h2><p>Você ainda não está em nenhuma turma.</p><div class="hero-bola" aria-hidden="true">' + svg('bola', 56) + '</div></section>' +
      '<a class="btn" href="#/aluno/convite">' + svg('convite', 18) + 'Entrar com código de convite</a></main>' + nav(NAV_ALUNO, '#/aluno');
  }
  const t = e.turmas[0];
  const { pos, linha } = minhaPosicao(t);
  const prox = e.aulas.find((a) => Date.parse(a.inicio) > agora());
  const paraConfirmar = e.partidas.filter((p) => p.status === 'pendente' && (p.a === eu || p.b === eu) && p.registradoPor !== eu);
  const aguardando = e.partidas.filter((p) => p.status === 'pendente' && p.registradoPor === eu);
  const minhasDisputas = e.partidas.filter((p) => p.status === 'disputa' && (p.a === eu || p.b === eu));
  const desafios = e.desafios.filter((d) => d.para === eu || d.de === eu);

  let h = topo('Olá, ' + primeiroNome(e.usuario.nome)) + '<main class="conteudo">';

  if (prox) {
    const minha = prox.presencas[eu];
    const status = minha ? minha.status : 'pendente';
    const limite = Date.parse(prox.inicio) - 4 * HORA;
    const pode = agora() < limite;
    const hl = new Date(limite).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const conf = Object.values(prox.presencas).filter(ocupaVaga).length;
    const d = new Date(prox.inicio);
    const tp = e.turmas.find((x) => x.id === prox.turmaId);
    h += '<section class="proxima"><span class="eyebrow">Próxima aula</span>' +
      '<div class="dia"><strong>' + String(d.getDate()).padStart(2, '0') + '</strong><span>' + d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') + '<br>' + diaCurto(prox.inicio).split(' ')[0] + '</span></div>' +
      '<h2>' + esc(prox.tema || (tp ? tp.nome : 'Aula')) + '</h2>' +
      '<span class="info">' + svg('relogio', 17) + hora(prox.inicio) + ' · ' + esc(prox.quadra) + ' · ' + conf + ' de ' + prox.vagas + ' vagas</span>';
    if (status === 'confirmado' && !ui.cancelando) {
      h += '<div class="botoes"><span class="confirmado">' + svg('check', 18) + 'Presença confirmada</span>' +
        '<button class="btn claro pequeno" style="min-height:44px;flex:0 0 auto" data-acao="cancelar-presenca"' + (pode ? '' : ' disabled') + '>Cancelar</button></div>';
    } else if (status === 'presente') {
      h += '<span class="confirmado">' + svg('check', 18) + 'Presença registrada pelo professor</span>';
    } else if (!ui.cancelando) {
      h += '<button class="btn bola" data-acao="presenca" data-aula="' + prox.id + '"' + (pode ? '' : ' disabled') + '>' + svg('check', 18) + (status === 'cancelado' ? 'Confirmar presença de novo' : 'Confirmar presença') + '</button>';
    }
    h += '<span class="prazo">' + (status === 'presente' ? 'Bom treino!' : pode ? 'Confirme ou cancele até ' + hl + ' (4h antes da aula).' : 'Prazo encerrado. O professor marca a presença no dia.') + '</span></section>';
    if (ui.cancelando) {
      h += '<form class="card" data-form="cancelar" data-aula="' + prox.id + '"><h3>Cancelar presença</h3><label class="campo">Motivo (opcional)<input name="motivo" placeholder="Ex.: consulta médica"></label>' +
        '<div class="botoes"><button type="button" class="btn sec pequeno" data-acao="desistir-cancelar">Voltar</button><button class="btn perigo pequeno" type="submit">Cancelar presença</button></div></form>';
    }
  }

  for (const p of paraConfirmar) {
    h += '<section class="card"><div class="linha"><span class="eyebrow">Placar para confirmar</span>' + seloPartida(p) + '</div>' + placarBox(p) +
      '<span class="muted">' + esc(nome(p.registradoPor)) + ' registrou. Restam ' + horasRestantes(p) + '; sem resposta, o placar é confirmado automaticamente.</span>';
    if (ui.contestando === p.id) {
      h += '<form data-form="contestar" data-partida="' + p.id + '" style="display:flex;flex-direction:column;gap:10px"><label class="campo">O que estava errado?<input name="motivo" required placeholder="Ex.: o segundo set foi 6-4 para mim"></label>' +
        '<div class="botoes"><button type="button" class="btn sec pequeno" data-acao="desistir-contestar">Voltar</button><button class="btn perigo pequeno" type="submit">Enviar contestação</button></div></form>';
    } else {
      h += '<div class="botoes"><button class="btn perigo pequeno" style="min-height:44px" data-acao="contestar" data-id="' + p.id + '">Contestar</button><button class="btn pequeno" style="min-height:44px" data-acao="confirmar-placar" data-id="' + p.id + '">' + svg('check', 16) + 'Confirmar</button></div>';
    }
    h += '</section>';
  }
  for (const p of minhasDisputas) {
    h += aviso_card('alerta', 'Placar em disputa', esc(nome(p.a)) + ' x ' + esc(nome(p.b)) + ' · o professor vai decidir o placar final.');
  }
  for (const p of aguardando) {
    const adv = p.a === eu ? p.b : p.a;
    h += aviso_card('relogio', 'Aguardando ' + esc(nome(adv)), placar(p) + ' · confirmação automática em ' + horasRestantes(p) + '.', 'neutro');
  }

  h += secao('Sua posição', '#/aluno/ranking', 'Ver ranking') +
    '<div class="evolucao"><div><span>RANKING · ' + esc(t.nome).toUpperCase() + '</span><strong>' + pos + 'º</strong><small>' + linha.pontos + ' pts · ' + linha.v + 'V ' + linha.d + 'D</small></div>' +
    '<div><span>FUNDAMENTOS</span><strong>' + (e.eu && media(e.eu.fundamentos) ? decimal(media(e.eu.fundamentos)) : '–') + '</strong><small>média de 1 a 5</small></div></div>';

  if (desafios.length) {
    h += secao('Desafios') + desafios.map((d) => aviso_card('bola', d.de === eu ? 'Você desafiou ' + esc(nome(d.para)) : esc(nome(d.de)) + ' te desafiou', 'Enviado em ' + so_data(d.criadoEm), 'ok')).join('');
  }
  h += secao('Atalhos') + '<div class="atalhos">' + atalho('#/aluno/ranking', 'ranking', 'Desafiar colega') + atalho('#/aluno/registrar', 'bola', 'Registrar resultado') +
    atalho('#/aluno/agenda', 'agenda', 'Agenda') + atalho('#/aluno/convite', 'convite', 'Entrar em turma') + '</div></main>' + nav(NAV_ALUNO, '#/aluno');
  return h;
}

function alunoAgenda() {
  const e = ui.estado;
  const eu = e.usuario.id;
  const futuras = e.aulas.filter((a) => Date.parse(a.inicio) > agora());
  const passadas = e.aulas.filter((a) => Date.parse(a.inicio) <= agora()).reverse();
  // Semana atual com um ponto nos dias que têm aula.
  const hoje = new Date(agora());
  const inicioSemana = new Date(hoje); inicioSemana.setHours(0, 0, 0, 0); inicioSemana.setDate(hoje.getDate() - hoje.getDay());
  const dias = Array.from({ length: 7 }, (_, i) => { const d = new Date(inicioSemana); d.setDate(inicioSemana.getDate() + i); return d; });
  const temAula = (d) => e.aulas.some((a) => new Date(a.inicio).toDateString() === d.toDateString());
  const mes = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(' de ', ' ');
  const item = (a, passada) => {
    const t = e.turmas.find((x) => x.id === a.turmaId);
    return '<div class="timeline"><span class="timeline-hora">' + hora(a.inicio) + '</span><div class="timeline-card' + (passada ? ' passada' : '') + '">' +
      '<div class="linha"><span class="eyebrow">' + diaCurto(a.inicio) + ' · ' + esc(t ? t.nome : '') + '</span>' + seloPresenca(a.presencas[eu], a) + '</div>' +
      '<strong>' + esc(a.tema || 'Aula') + '</strong><span class="muted">' + esc(a.quadra) + '</span>' +
      (a.comentario ? '<span class="comentario">Professor: “' + esc(a.comentario) + '”</span>' : '') + '</div></div>';
  };
  return topo('Agenda') + '<main class="conteudo">' +
    '<h2 class="mes">' + mes.charAt(0).toUpperCase() + mes.slice(1) + '</h2>' +
    '<div class="semana">' + SEMANA.map((s) => '<span class="dia-nome">' + s.charAt(0) + '</span>').join('') +
    dias.map((d) => '<span class="dia-num' + (d.toDateString() === hoje.toDateString() ? ' hoje' : '') + '">' + d.getDate() + (temAula(d) ? '<i></i>' : '') + '</span>').join('') + '</div>' +
    secao('Próximas aulas') + (futuras.length ? futuras.map((a) => item(a)).join('') : '<p class="vazio">Nenhuma aula agendada.</p>') +
    secao('Aulas anteriores') + (passadas.length ? passadas.map((a) => item(a, true)).join('') : '<p class="vazio">Nenhuma aula ainda.</p>') +
    '</main>' + nav(NAV_ALUNO, '#/aluno/agenda');
}

function alunoDesempenho() {
  const e = ui.estado;
  const eu = e.usuario.id;
  const t = turmaAtual();
  const { pos, linha } = t ? minhaPosicao(t) : { pos: 0, linha: { pontos: 0, v: 0, d: 0 } };
  const minhas = e.partidas.filter((p) => p.status === 'confirmada' && (p.a === eu || p.b === eu)).slice(0, 6);
  const jogos = linha.v + linha.d;
  return topo('Meu desempenho') + '<main class="conteudo">' + chipsTurma() +
    '<section class="desempenho-hero"><span>' + (t ? esc(t.nome).toUpperCase() : 'SEM TURMA') + '</span>' +
    '<div><strong>' + linha.pontos + '</strong><small>pontos no ranking</small></div><div><strong>' + (pos ? pos + 'º' : '–') + '</strong><small>posição na turma</small></div></section>' +
    '<div class="metricas">' + metrica(jogos, 'Partidas') + metrica(linha.v, 'Vitórias') + metrica(jogos ? Math.round(linha.v / jogos * 100) + '%' : '–', 'Aproveitamento') + '</div>' +
    '<div class="secao"><h3>Fundamentos</h3><span class="selo ok">' + esc(e.eu.nivel) + '</span></div>' +
    '<div class="habilidades">' + FUNDAMENTOS.map(([k, rotulo]) => {
      const n = e.eu.fundamentos[k] || 0;
      return '<div class="habilidade"><div><strong>' + rotulo + '</strong><span>' + n + ' de 5</span></div><div class="barra"><span style="width:' + n * 20 + '%"></span></div></div>';
    }).join('') + '</div>' +
    (e.eu.comentario ? aviso_card('desempenho', 'Comentário do professor', '“' + esc(e.eu.comentario) + '”' + (e.eu.avaliadoEm ? ' · ' + so_data(e.eu.avaliadoEm) : ''), 'ok') : '<p class="muted">' + (e.eu.avaliadoEm ? 'Avaliado em ' + so_data(e.eu.avaliadoEm) : 'Ainda não avaliado') + '</p>') +
    secao('Últimas partidas') + '<div class="card" style="padding:8px 12px"><ul class="lista">' + (minhas.length ? minhas.map((p) => {
      const ganhei = vencedor(p) === eu;
      const adv = p.a === eu ? p.b : p.a;
      return '<li><span class="avatar mini ' + (ganhei ? 'v' : 'd') + '">' + (ganhei ? 'V' : 'D') + '</span><span class="nome"><strong>vs ' + esc(nome(adv)) + '</strong><span class="muted">' + placar(p) + ' · ' + so_data(p.criadoEm) + '</span></span><span class="pts">' + (ganhei ? '+10' : '+0') + '</span></li>';
    }).join('') : '<li class="vazio">Nenhuma partida confirmada.</li>') + '</ul></div></main>' + nav(NAV_ALUNO, '#/aluno/desempenho');
}

function alunoRanking() {
  const e = ui.estado;
  const eu = e.usuario.id;
  const t = turmaAtual();
  if (!t) return alunoHome();
  const desafiados = new Set(e.desafios.filter((d) => d.de === eu).map((d) => d.para));
  const r = t.ranking;
  const { pos, linha } = minhaPosicao(t);
  const podioJogador = (i, classe) => r[i] ? '<div class="podio-jogador ' + classe + '">' + (i === 0 ? '<span class="coroa">' + svg('coroa', 18) + '</span>' : '') + avatar(r[i].id, r[i].nome) +
    '<strong>' + (r[i].id === eu ? 'Você' : esc(primeiroNome(r[i].nome))) + '</strong><small>' + r[i].pontos + ' pts</small><i>' + (i + 1) + '</i></div>' : '';
  const acima = pos > 1 ? r[pos - 2] : null;
  const falta = acima ? acima.pontos - linha.pontos : 0;
  return topo('Ranking') + '<main class="conteudo">' + chipsTurma() +
    '<div class="podio">' + podioJogador(1, 'p2') + podioJogador(0, 'p1') + podioJogador(2, 'p3') + '</div>' +
    '<ul class="ranking-lista">' + r.map((x, i) =>
      '<li class="ranking-linha' + (x.id === eu ? ' eu' : '') + '"><span class="pos">' + (i + 1) + '</span>' + avatar(x.id, x.nome, 'mini') +
      '<span class="nome"><strong>' + esc(x.nome) + (x.id === eu ? ' (você)' : '') + '</strong><span class="muted">' + x.v + 'V · ' + x.d + 'D</span></span><span class="pts">' + x.pontos + ' pts</span>' +
      (x.id === eu ? '<span></span>' : desafiados.has(x.id) ? '<span class="selo ok">Enviado</span>' : '<button class="btn sec pequeno" data-acao="desafiar" data-id="' + x.id + '" data-turma="' + t.id + '" aria-label="Desafiar ' + esc(x.nome) + '">Desafiar</button>') + '</li>'
    ).join('') + '</ul>' +
    (acima ? aviso_card('ranking', falta > 0 ? 'Faltam ' + falta + ' pontos' : 'Empatado em pontos', falta > 0 ? 'para você alcançar o ' + (pos - 1) + 'º lugar. Uma vitória vale 10.' : 'com ' + esc(acima.nome) + '. A próxima vitória te leva para cima.') : pos === 1 ? aviso_card('coroa', 'Você lidera a turma', 'Continue vencendo para manter o 1º lugar.', 'ok') : '') +
    '<p class="muted">' + esc(t.nome) + ' · vitória +10 · derrota 0 · só contam partidas confirmadas. Desafios só entre alunos da mesma turma.</p>' +
    '<button class="link" style="align-self:center" data-acao="sair-turma" data-turma="' + t.id + '">Sair da turma ' + esc(t.nome) + '</button>' +
    '</main>' + nav(NAV_ALUNO, '#/aluno/ranking');
}

function alunoConvite() {
  return '<div class="convite-tela"><div class="quadra-arte"><div class="linhas-quadra"></div><div class="bola-flutuante" aria-hidden="true">' + svg('bola', 78) + '</div>' +
    '<a class="icone-btn" href="#/aluno" aria-label="Voltar">' + svg('voltar') + '</a></div>' +
    '<div class="convite-texto"><span class="eyebrow">Convite da turma</span><h2>Seu jogo começa aqui.</h2>' +
    '<p class="muted">Digite o código que seu professor compartilhou. Pelo código você entra direto, sem aprovação.</p>' +
    '<form data-form="codigo" style="display:flex;flex-direction:column;gap:12px"><label class="codigo-campo"><span>CÓDIGO DO CONVITE</span><input name="codigo" maxlength="6" required placeholder="ABC123" autocomplete="off"></label>' +
    '<span class="muted" style="font-size:12px">Para testar: INI456 (entra na turma Iniciante B) ou XYZ789 (código expirado).</span>' +
    '<button class="btn" type="submit">' + svg('seta', 18) + 'Entrar na turma</button></form></div></div>' + nav(NAV_ALUNO, '');
}

function alunoRegistrar() {
  const e = ui.estado;
  const eu = e.usuario.id;
  const t = turmaAtual();
  if (!t) return alunoHome();
  const outros = t.membros.filter((m) => m !== eu);
  return topo('Registrar partida', { voltar: '#/aluno' }) + '<main class="conteudo">' +
    '<div><span class="eyebrow">Nova partida</span><h2 style="margin-top:4px">Como foi o jogo?</h2><p class="muted" style="margin-top:4px">Registre o resultado. O adversário confirma e o ranking atualiza.</p></div>' + chipsTurma() +
    '<form data-form="registrar" style="display:flex;flex-direction:column;gap:14px"><input type="hidden" name="turmaId" value="' + t.id + '">' +
    '<label class="campo">Adversário<select name="adversarioId">' + outros.map((m) => '<option value="' + m + '">' + esc(nome(m)) + '</option>').join('') + '</select></label>' +
    '<div class="card">' + camposSets('Você', 'Adversário') + '</div>' +
    aviso_card('relogio', '24h para confirmar', 'O adversário confirma ou contesta. Sem resposta, o placar vale automaticamente.', 'neutro') +
    '<button class="btn" type="submit">' + svg('check', 18) + 'Enviar para confirmação</button></form></main>' + nav(NAV_ALUNO, '');
}

// Painel lateral (só aparece no computador): mostra o fluxo do perfil logado, como no protótipo do Gabriel.
const PASSOS = {
  professor: [['#/prof', 'Início e presenças'], ['#/prof/alunos', 'Alunos e convite'], ['#/prof/aulas', 'Criar aula'], ['#/prof/partidas', 'Partidas e disputas']],
  aluno: [['#/aluno', 'Início e presença'], ['#/aluno/agenda', 'Agenda'], ['#/aluno/desempenho', 'Desempenho'], ['#/aluno/ranking', 'Ranking e desafios'], ['#/aluno/registrar', 'Registrar resultado'], ['#/aluno/convite', 'Entrar em turma']]
};
function cartaoModo() {
  return '<a class="modo' + (DUO ? ' on' : '') + '" href="' + (DUO ? location.pathname : '?duo=1') + '" role="switch" aria-checked="' + DUO + '"><span class="chave" aria-hidden="true"></span>' +
    '<span><strong>Modo apresentação</strong>' + (DUO ? 'Dois celulares lado a lado. Clique para voltar a um só.' : 'Mostra professor e aluno lado a lado, cada um com o próprio login.') + '</span></a>';
}
function painel(rota) {
  const papel = ui.estado ? ui.estado.usuario.papel : null;
  const marca = '<div class="marca-painel"><div class="marca-q">' + svg('bola', 28) + '</div><div><strong>MatchPoint</strong><span>Protótipo funcional · FATEC Olímpia</span></div></div>';
  if (DUO) {
    return marca + '<span class="eyebrow" style="color:var(--cinza);margin:0 0 14px 14px">Como apresentar</span>' +
      '<p class="dica texto">1. No celular da esquerda, entre como <strong>professor</strong>.</p><p class="dica texto">2. No da direita, entre como <strong>aluno</strong>.</p>' +
      '<p class="dica texto">3. Confirme presença no aluno e mostre a lista do professor mudando na hora.</p>' + cartaoModo();
  }
  let h = marca +
    '<div class="papel" aria-label="Perfil"><span class="' + (papel === 'professor' ? 'on' : '') + '">Professor</span><span class="' + (papel === 'aluno' ? 'on' : '') + '">Aluno</span></div>';
  if (!papel) {
    return h + '<span class="eyebrow" style="color:var(--cinza);margin:0 0 14px 14px">Como testar</span>' +
      '<p class="dica texto">1. Entre como <strong>professor</strong> nesta janela.</p><p class="dica texto">2. Abra outra janela e entre como <strong>aluno</strong>.</p>' +
      '<p class="dica texto">3. Confirme presença no aluno e veja a lista do professor mudar sozinha.</p>' + cartaoModo();
  }
  const passos = PASSOS[papel];
  const atual = passos.some(([r]) => r === rota) ? rota : rota.startsWith('#/prof/avaliar') ? '#/prof/alunos' : '';
  return h + '<span class="eyebrow" style="color:var(--cinza);margin:0 0 14px 14px">Fluxo ' + papel + '</span><div class="passos">' +
    passos.map(([r, rotulo], i) => (i ? '<div class="passo-linha"></div>' : '') + '<a class="passo' + (r === atual ? ' on' : '') + '" href="' + r + '"><span>' + String(i + 1).padStart(2, '0') + '</span><strong>' + rotulo + '</strong>' + svg('seta', 18) + '</a>').join('') +
    '</div><p class="dica">Abra o professor e o aluno em duas janelas lado a lado: o que um faz aparece na tela do outro.</p>' + cartaoModo();
}

// ---------- roteamento ----------
function montarDuo() {
  document.body.classList.add('duo');
  document.getElementById('painel').innerHTML = painel('');
  document.querySelector('.area-aparelho').innerHTML = '<div class="duo-grade">' + ['professor', 'aluno'].map((p) =>
    '<div class="duo-col"><div class="cab-palco"><div><span class="eyebrow">Modo apresentação</span><h2>' + (p === 'professor' ? 'Professor' : 'Aluno') + '</h2></div><span class="vivo">Tempo real</span></div>' +
    '<div class="aparelho"><div class="status-bar" aria-hidden="true"><span>9:41</span><div><i></i><i></i><i></i></div></div>' +
    '<iframe title="Celular do ' + p + '" src="' + location.pathname + '?f=' + p + '"></iframe><div class="gesture-bar" aria-hidden="true"></div></div></div>'
  ).join('') + '</div>';
}

function render() {
  if (DUO) return;
  const app = document.getElementById('app');
  const rota = location.hash.replace(/^#/, '') || '/login';
  document.getElementById('painel').innerHTML = painel(location.hash || '#/login');
  document.getElementById('jornada').textContent = !ui.estado ? 'Entrar' : ui.estado.usuario.papel === 'professor' ? 'Jornada do professor' : 'Jornada do aluno';
  if (!ui.estado) { app.innerHTML = telaLogin(); return; }
  const papel = ui.estado.usuario.papel;
  if (papel === 'professor' && !rota.startsWith('/prof')) { location.hash = '#/prof'; return; }
  if (papel === 'aluno' && !rota.startsWith('/aluno')) { location.hash = '#/aluno'; return; }
  const partes = rota.split('/').filter(Boolean);
  const telas = {
    'prof': profDashboard, 'prof/alunos': profAlunos, 'prof/aulas': profAulas, 'prof/partidas': profPartidas,
    'aluno': alunoHome, 'aluno/agenda': alunoAgenda, 'aluno/desempenho': alunoDesempenho, 'aluno/ranking': alunoRanking,
    'aluno/convite': alunoConvite, 'aluno/registrar': alunoRegistrar
  };
  const rolagem = (app.querySelector('.conteudo') || {}).scrollTop || 0;
  app.innerHTML = partes[1] === 'avaliar' ? profAvaliar(partes[2]) : (telas[partes.join('/')] || telas[papel === 'professor' ? 'prof' : 'aluno'])();
  const c = app.querySelector('.conteudo');
  if (c && render.ultimaRota === rota) c.scrollTop = rolagem;
  render.ultimaRota = rota;
}

window.addEventListener('hashchange', () => { ui.cancelando = false; ui.contestando = null; render(); });

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-acao]');
  if (!el) return;
  const d = el.dataset;
  switch (d.acao) {
    case 'login-teste': {
      const f = document.querySelector('form[data-form="login"]');
      f.email.value = d.email;
      f.senha.focus();
      break;
    }
    case 'reset': acao('resetar_demo', {}); break;
    case 'sair': sair(); break;
    case 'painel': mostrarPainel(!document.body.classList.contains('sem-painel')); break;
    case 'turma': ui.turmaSel = d.id; render(); break;
    case 'marcar': acao('marcar_presenca', { p_aula: d.aula, p_aluno: d.aluno, p_status: d.status }); break;
    case 'gerar-codigo': acao('gerar_codigo', { p_turma: d.turma }); break;
    case 'revogar-codigo': acao('revogar_codigo', { p_turma: d.turma }); break;
    case 'presenca': acao('presenca', { p_aula: d.aula, p_status: 'confirmado' }); break;
    case 'cancelar-presenca': ui.cancelando = true; render(); break;
    case 'desistir-cancelar': ui.cancelando = false; render(); break;
    case 'confirmar-placar': acao('placar_confirmar', { p_partida: d.id }); break;
    case 'contestar': ui.contestando = d.id; render(); break;
    case 'desistir-contestar': ui.contestando = null; render(); break;
    case 'desafiar': acao('desafiar', { p_para: d.id, p_turma: d.turma }); break;
    case 'sair-turma': acao('sair_turma', { p_turma: d.turma }).then((ok) => { if (ok) { ui.turmaSel = null; location.hash = '#/aluno'; } }); break;
  }
});

document.addEventListener('submit', async (ev) => {
  const f = ev.target.closest('form[data-form]');
  if (!f) return;
  ev.preventDefault();
  const fd = new FormData(f);
  const d = f.dataset;
  switch (d.form) {
    case 'login': entrar(fd.get('email'), fd.get('senha')); break;
    case 'avaliar': {
      const fundamentos = Object.fromEntries(FUNDAMENTOS.map(([k]) => [k, Number(fd.get(k))]));
      if (await acao('avaliar', { p_aluno: d.aluno, p_nivel: fd.get('nivel'), p_fundamentos: fundamentos, p_comentario: fd.get('comentario') })) location.hash = '#/prof/alunos';
      break;
    }
    case 'criar-aula': {
      // Data e hora digitadas no fuso do navegador; o banco guarda em UTC.
      const inicio = new Date(fd.get('data') + 'T' + fd.get('hora') + ':00');
      if (Number.isNaN(inicio.getTime())) { aviso('Data ou horário inválido.', true); break; }
      acao('criar_aula', { p_turma: fd.get('turmaId'), p_inicio: inicio.toISOString(), p_quadra: fd.get('quadra'), p_tema: fd.get('tema'), p_vagas: Number(fd.get('vagas')) });
      break;
    }
    case 'validar': acao('validar_placar', { p_partida: d.partida, p_sets: lerSets(fd) }); break;
    case 'lancar': acao('lancar_placar', { p_turma: fd.get('turmaId'), p_a: fd.get('a'), p_b: fd.get('b'), p_sets: lerSets(fd) }); break;
    case 'cancelar': ui.cancelando = false; acao('presenca', { p_aula: d.aula, p_status: 'cancelado', p_motivo: fd.get('motivo') }); break;
    case 'contestar': ui.contestando = null; acao('placar_contestar', { p_partida: d.partida, p_motivo: fd.get('motivo') }); break;
    case 'codigo':
      if (await acao('entrar_codigo', { p_codigo: fd.get('codigo') })) location.hash = '#/aluno';
      break;
    case 'registrar':
      if (await acao('registrar_resultado', { p_adversario: fd.get('adversarioId'), p_turma: fd.get('turmaId'), p_sets: lerSets(fd) })) location.hash = '#/aluno';
      break;
  }
});

// Ao abrir a página: se a aba já tinha sessão, recupera o estado.
(async () => {
  if (DUO) { montarDuo(); return; }
  try {
    await atualizar(true);
    if (ui.estado) ouvirMudancas().catch(() => {});
  } catch (e) { ui.estado = null; aviso(e.message, true); }
  render();
})();
