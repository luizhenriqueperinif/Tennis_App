// Cliente do protótipo MatchPoint: uma SPA simples, com rotas por hash (#/prof, #/aluno/ranking...).
// A sessão fica no sessionStorage da aba, então dá para abrir o professor numa aba e o aluno em outra.
'use strict';

const HORA = 3600 * 1000;
const FUNDAMENTOS = [['saque', 'Saque'], ['forehand', 'Forehand'], ['backhand', 'Backhand'], ['voleio', 'Voleio'], ['movimentacao', 'Movimentação']];
const ICONES = {
  inicio: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  alunos: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.5c2 .6 3.5 2.6 3.5 5.5"/>',
  agenda: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  bola: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6c3.2 3.2 3.2 9.6 0 12.8M18.4 5.6c-3.2 3.2-3.2 9.6 0 12.8"/>',
  desempenho: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  ranking: '<path d="M3 21h18"/><path d="M9 21V9h6v12"/><path d="M3 21v-7h6M15 21v-4h6v4"/>'
};

const ui = {
  sid: lerSessao(),
  estado: null,
  turmaSel: null,
  cancelando: false,
  contestando: null,
  ultimoJson: ''
};

function lerSessao() { try { return sessionStorage.getItem('sid'); } catch { return null; } }
function gravarSessao(v) { try { v ? sessionStorage.setItem('sid', v) : sessionStorage.removeItem('sid'); } catch { /* sem storage: só vale até recarregar */ } }

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
function svg(nomeIcone) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONES[nomeIcone] + '</svg>'; }

// ---------- API ----------
async function api(caminho, corpo) {
  const res = await fetch('/api/' + caminho, {
    method: corpo === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(ui.sid ? { 'X-Sessao': ui.sid } : {}) },
    body: corpo === undefined ? undefined : JSON.stringify(corpo)
  });
  const dados = await res.json().catch(() => ({}));
  if (res.status === 401 && caminho !== 'login') { sair(false); throw new Error(dados.erro || 'Sessão expirada.'); }
  if (!res.ok) throw new Error(dados.erro || 'Erro inesperado.');
  return dados;
}

async function acao(tipo, dados) {
  try {
    const r = await api('acao', { tipo, ...dados });
    ui.estado = r.estado;
    ui.ultimoJson = JSON.stringify({ ...r.estado, agora: "" });
    aviso(r.mensagem);
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
    const r = await api('login', { email, senha });
    ui.sid = r.sid;
    gravarSessao(r.sid);
    ui.estado = r.estado;
    ui.ultimoJson = JSON.stringify({ ...r.estado, agora: "" });
    location.hash = r.estado.usuario.papel === 'professor' ? '#/prof' : '#/aluno';
    render();
  } catch (e) { aviso(e.message, true); }
}

function sair(chamarApi = true) {
  if (chamarApi && ui.sid) api('logout', {}).catch(() => {});
  ui.sid = null; ui.estado = null; ui.turmaSel = null;
  gravarSessao(null);
  location.hash = '#/login';
  render();
}

// Atualização "em tempo real": a cada 3s busca o estado; só redesenha se mudou e ninguém está digitando.
setInterval(async () => {
  if (!ui.sid || !ui.estado) return;
  try {
    const e = await api('estado');
    const j = JSON.stringify({ ...e, agora: '' });
    if (j === ui.ultimoJson) return;
    ui.ultimoJson = j;
    ui.estado = e;
    const foco = document.activeElement;
    if (foco && ['INPUT', 'TEXTAREA', 'SELECT'].includes(foco.tagName)) return;
    render();
  } catch { /* servidor fora do ar: tenta de novo no próximo ciclo */ }
}, 3000);

// ---------- componentes ----------
function topo(titulo, { sub, voltar, direita } = {}) {
  return '<header class="topo"><div>' +
    (sub ? '<div class="sub">' + sub + '</div>' : '') +
    '<div class="topo-linha">' + (voltar ? '<a class="voltar" href="' + voltar + '" aria-label="Voltar">‹</a>' : '') +
    '<h1>' + esc(titulo) + '</h1></div></div>' + (direita || '') + '</header>';
}

function nav(itens, atual) {
  return '<nav class="nav" aria-label="Navegação principal">' + itens.map(([rota, rotulo, icone]) =>
    '<a href="' + rota + '"' + (rota === atual ? ' class="on" aria-current="page"' : '') + '><span class="ic">' + svg(icone) + '</span>' + rotulo + '</a>'
  ).join('') + '</nav>';
}
const NAV_PROF = [['#/prof', 'Início', 'inicio'], ['#/prof/alunos', 'Alunos', 'alunos'], ['#/prof/aulas', 'Aulas', 'agenda'], ['#/prof/partidas', 'Partidas', 'bola']];
const NAV_ALUNO = [['#/aluno', 'Início', 'inicio'], ['#/aluno/agenda', 'Agenda', 'agenda'], ['#/aluno/desempenho', 'Desempenho', 'desempenho'], ['#/aluno/ranking', 'Ranking', 'ranking']];

function chipsTurma() {
  const ts = ui.estado.turmas;
  if (ts.length < 2) return '';
  const atual = turmaAtual();
  return '<div class="chips" role="group" aria-label="Turma">' + ts.map((t) =>
    '<button type="button" class="chip' + (t.id === atual.id ? ' on' : '') + '" data-acao="turma" data-id="' + t.id + '">' + esc(t.nome) + '</button>'
  ).join('') + '</div>';
}

function seloPresenca(p) {
  const s = p ? p.status : 'pendente';
  if (s === 'confirmado') return '<span class="selo ok">Confirmado</span>';
  if (s === 'presente') return '<span class="selo ok">Presente</span>';
  if (s === 'ausente') return '<span class="selo erro">Ausente</span>';
  if (s === 'cancelado') return '<span class="selo erro">Cancelou</span>';
  return '<span class="selo pend">Status incerto</span>';
}

function seloPartida(p) {
  if (p.status === 'confirmada') return '<span class="selo ok">' + (p.validadoPeloProfessor ? 'Validada' : p.confirmadoAutomaticamente ? 'Confirmada (24h)' : 'Confirmada') + '</span>';
  if (p.status === 'disputa') return '<span class="selo erro">Em disputa</span>';
  return '<span class="selo pend">Pendente</span>';
}

function camposSets(nomeA, nomeB, sets = []) {
  let h = '<div class="sets"><span></span><span class="cab">' + esc(nomeA) + '</span><span class="cab">' + esc(nomeB) + '</span>';
  for (let i = 0; i < 3; i++) {
    const s = sets[i] || ['', ''];
    h += '<span>Set ' + (i + 1) + (i === 2 ? ' (se houver)' : '') + '</span>' +
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
  return '<div class="login">' +
    '<div class="marca"><div class="logo"><svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#D7F05A" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' + ICONES.bola + '</svg></div>' +
    '<div class="nome-app">MatchPoint</div><div class="muted" style="font-size:15px">Aulas, desafios e ranking do seu grupo de tênis</div></div>' +
    '<form data-form="login" style="display:flex;flex-direction:column;gap:14px">' +
    '<label class="campo">E-mail<input name="email" type="email" autocomplete="username" required></label>' +
    '<label class="campo">Senha<input name="senha" type="password" autocomplete="current-password" required></label>' +
    '<button class="btn" type="submit">Entrar</button></form>' +
    '<div class="teste"><span class="muted">Usuários de teste</span>' +
    '<button type="button" class="btn sec pequeno" data-acao="login-teste" data-email="professor@matchpoint.app" data-senha="prof123">Entrar como professor (Carlos)</button>' +
    '<button type="button" class="btn sec pequeno" data-acao="login-teste" data-email="aluno@matchpoint.app" data-senha="aluno123">Entrar como aluno (João)</button></div>' +
    '<button type="button" class="link" data-acao="reset">Reiniciar dados da demonstração</button>' +
    '</div>';
}

// ----- Professor -----
function profDashboard() {
  const e = ui.estado;
  const prox = e.aulas.find((a) => Date.parse(a.inicio) > agora());
  const disputas = e.partidas.filter((p) => p.status === 'disputa');
  const pendentes = e.partidas.filter((p) => p.status === 'pendente');
  let h = topo('Olá, ' + e.usuario.nome, { sub: '<span class="ao-vivo">Atualiza sozinho</span>', direita: '<button class="sair" data-acao="sair">Sair</button>' }) + '<main class="conteudo">';
  if (prox) {
    const t = e.turmas.find((x) => x.id === prox.turmaId);
    const conf = t.membros.filter((m) => ocupaVaga(prox.presencas[m])).length;
    h += '<section class="card"><div class="linha"><h2>Próxima aula</h2><span class="selo bola">' + dataHora(prox.inicio) + '</span></div>' +
      '<span class="muted">' + esc(t.nome) + ' · ' + esc(prox.quadra) + (prox.tema ? ' · ' + esc(prox.tema) : '') + '</span>' +
      '<div class="linha" style="font-size:13px"><span>Presenças confirmadas</span><strong>' + conf + ' de ' + prox.vagas + '</strong></div>' +
      '<div class="barra"><span style="width:' + Math.round(conf / prox.vagas * 100) + '%"></span></div>' +
      '<ul class="lista">' + t.membros.map((m) => {
        const p = prox.presencas[m];
        return '<li><div class="nome"><strong>' + esc(nome(m)) + '</strong>' + (p && p.motivo ? '<span class="muted">Motivo: ' + esc(p.motivo) + '</span>' : '') + '</div>' + seloPresenca(p) +
          '<button class="btn sec pequeno" data-acao="marcar" data-aula="' + prox.id + '" data-aluno="' + m + '" data-status="presente" aria-label="Marcar ' + esc(nome(m)) + ' presente">P</button>' +
          '<button class="btn perigo pequeno" data-acao="marcar" data-aula="' + prox.id + '" data-aluno="' + m + '" data-status="ausente" aria-label="Marcar ' + esc(nome(m)) + ' ausente">A</button></li>';
      }).join('') + '</ul><span class="muted">P = presente, A = ausente. Quem não confirmou até 4h antes aparece como "Status incerto".</span></section>';
  }
  h += '<section class="card"><h2>Pendências</h2>' +
    (disputas.length ? disputas.map((p) => '<a class="linha" href="#/prof/partidas" style="text-decoration:none;color:inherit;min-height:44px"><span><strong style="color:var(--erro);font-weight:500">Placar em disputa</strong><br><span class="muted">' + esc(nome(p.a)) + ' x ' + esc(nome(p.b)) + '</span></span><span aria-hidden="true">›</span></a>').join('') : '') +
    (pendentes.length ? '<a class="linha" href="#/prof/partidas" style="text-decoration:none;color:inherit;min-height:44px"><span><strong style="font-weight:500">' + pendentes.length + ' placar(es) aguardando o adversário</strong><br><span class="muted">Confirmação automática em 24h</span></span><span aria-hidden="true">›</span></a>' : '') +
    (!disputas.length && !pendentes.length ? '<span class="vazio">Nenhuma pendência.</span>' : '') +
    '</section><a class="btn" href="#/prof/aulas">+ Nova aula</a></main>' + nav(NAV_PROF, '#/prof');
  return h;
}

function profAlunos() {
  const t = turmaAtual();
  const c = t.codigo;
  const ativo = c.ativo && Date.parse(c.expira) > agora();
  let h = topo('Alunos') + '<main class="conteudo">' + chipsTurma() +
    '<section class="card codigo"><span class="muted">Código de convite · ' + esc(t.nome) + '</span>' +
    '<div class="valor" style="' + (ativo ? '' : 'text-decoration:line-through;opacity:.6') + '">' + esc(c.valor) + '</div>' +
    '<span class="muted">' + (ativo ? 'Válido até ' + so_data(c.expira) + ' às 23:00 · uso ilimitado · entrada direta' : 'Código revogado. Gere um novo para convidar alunos.') + '</span>' +
    '<div class="botoes"><button class="btn sec pequeno" data-acao="gerar-codigo" data-turma="' + t.id + '">Gerar novo</button>' +
    (ativo ? '<button class="btn sec pequeno" data-acao="revogar-codigo" data-turma="' + t.id + '">Revogar</button>' : '') + '</div></section>' +
    '<section class="card"><h2>' + t.membros.length + ' alunos · toque para avaliar</h2><ul class="lista">' +
    t.ranking.map((r) => '<li><a class="item" href="#/prof/avaliar/' + r.id + '"><span class="avatar">' + iniciais(r.nome) + '</span><span class="nome"><strong>' + esc(r.nome) + '</strong><span class="muted">' + esc(ui.estado.alunos[r.id].nivel) + ' · ' + r.pontos + ' pts · ' + r.v + 'V ' + r.d + 'D</span></span><span aria-hidden="true">›</span></a></li>').join('') +
    '</ul></section></main>' + nav(NAV_PROF, '#/prof/alunos');
  return h;
}

function profAvaliar(alunoId) {
  const al = ui.estado.alunos[alunoId];
  if (!al) return profAlunos();
  return topo('Avaliar aluno', { voltar: '#/prof/alunos' }) + '<main class="conteudo">' +
    '<div class="linha" style="justify-content:flex-start"><span class="avatar" style="width:48px;height:48px;font-size:16px">' + iniciais(al.nome) + '</span><div class="nome"><strong style="font-size:18px">' + esc(al.nome) + '</strong>' +
    '<span class="muted">' + (al.avaliadoEm ? 'Última avaliação em ' + so_data(al.avaliadoEm) : 'Ainda não avaliado') + '</span></div></div>' +
    '<form data-form="avaliar" data-aluno="' + al.id + '" style="display:flex;flex-direction:column;gap:14px">' +
    '<label class="campo">Nível do aluno<select name="nivel">' + ['Iniciante', 'Intermediário', 'Avançado'].map((n) => '<option' + (n === al.nivel ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>' +
    '<section class="card"><h2>Fundamentos <span class="muted">(1 a 5)</span></h2>' +
    FUNDAMENTOS.map(([k, rotulo]) => '<fieldset style="border:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px"><legend style="font-size:14px;font-weight:500;padding:0;margin-bottom:6px">' + rotulo + '</legend><div class="notas">' +
      [1, 2, 3, 4, 5].map((v) => '<input type="radio" id="' + k + v + '" name="' + k + '" value="' + v + '"' + (al.fundamentos[k] === v ? ' checked' : '') + '><label for="' + k + v + '">' + v + '</label>').join('') +
      '</div></fieldset>').join('') + '</section>' +
    '<label class="campo">Comentário para o aluno<textarea name="comentario" rows="3">' + esc(al.comentario) + '</textarea></label>' +
    '<button class="btn" type="submit">Salvar avaliação</button></form></main>';
}

function profAulas() {
  const e = ui.estado;
  const amanha = new Date(agora() + 24 * HORA).toISOString().slice(0, 10);
  const futuras = e.aulas.filter((a) => Date.parse(a.inicio) > agora());
  const passadas = e.aulas.filter((a) => Date.parse(a.inicio) <= agora()).reverse();
  return topo('Aulas') + '<main class="conteudo">' +
    '<form class="card" data-form="criar-aula"><h2>Nova aula</h2>' +
    '<label class="campo">Turma<select name="turmaId">' + e.turmas.map((t) => '<option value="' + t.id + '">' + esc(t.nome) + '</option>').join('') + '</select></label>' +
    '<div class="grade2"><label class="campo">Data<input name="data" type="date" value="' + amanha + '" required></label><label class="campo">Horário<input name="hora" type="time" value="18:00" required></label></div>' +
    '<div class="grade2"><label class="campo">Quadra<select name="quadra"><option>Quadra 1</option><option selected>Quadra 2</option><option>Quadra 3</option></select></label>' +
    '<label class="campo">Limite de alunos<input name="vagas" type="number" min="1" max="6" value="6" required></label></div>' +
    '<span class="muted">Máximo de 6 alunos por quadra e horário.</span>' +
    '<label class="campo">Tema<input name="tema" value="Saque e devolução"></label>' +
    '<button class="btn" type="submit">Salvar e avisar alunos</button></form>' +
    '<h2 class="titulo-secao">Próximas aulas</h2>' + (futuras.length ? futuras.map((a) => cardAulaProf(a)).join('') : '<p class="vazio">Nenhuma aula agendada.</p>') +
    '<h2 class="titulo-secao">Aulas realizadas</h2>' + passadas.map((a) => cardAulaProf(a, true)).join('') +
    '</main>' + nav(NAV_PROF, '#/prof/aulas');
}
function cardAulaProf(a, passada) {
  const t = ui.estado.turmas.find((x) => x.id === a.turmaId);
  const vals = Object.values(a.presencas);
  const conf = vals.filter((p) => p.status === (passada ? 'presente' : 'confirmado')).length;
  return '<div class="card"><div class="linha"><strong style="font-weight:500">' + dataHora(a.inicio) + '</strong><span class="selo ' + (passada ? 'ok' : 'pend') + '">' + conf + (passada ? ' presentes' : ' de ' + a.vagas + ' confirmados') + '</span></div>' +
    '<span class="muted">' + esc(t ? t.nome : '') + ' · ' + esc(a.quadra) + (a.tema ? ' · ' + esc(a.tema) : '') + '</span>' +
    (a.comentario ? '<span class="muted">Comentário: ' + esc(a.comentario) + '</span>' : '') + '</div>';
}

function profPartidas() {
  const e = ui.estado;
  const disputas = e.partidas.filter((p) => p.status === 'disputa');
  const pendentes = e.partidas.filter((p) => p.status === 'pendente');
  const confirmadas = e.partidas.filter((p) => p.status === 'confirmada').slice(0, 5);
  const t = turmaAtual();
  let h = topo('Partidas') + '<main class="conteudo"><h2 class="titulo-secao">Em disputa</h2>';
  h += disputas.length ? disputas.map((p) => '<form class="card" data-form="validar" data-partida="' + p.id + '">' +
    '<div class="linha"><h2>' + esc(nome(p.a)) + ' x ' + esc(nome(p.b)) + '</h2>' + seloPartida(p) + '</div>' +
    '<span class="muted"><strong style="color:var(--texto);font-weight:500">' + esc(nome(p.registradoPor)) + ' registrou:</strong> ' + placar(p) + '</span>' +
    '<span class="muted"><strong style="color:var(--texto);font-weight:500">Contestação:</strong> “' + esc(p.motivo) + '”</span>' +
    '<span style="font-size:13px;font-weight:500">Placar final (set a set)</span>' + camposSets(nome(p.a), nome(p.b), p.sets) +
    '<button class="btn" type="submit">Validar placar final</button></form>').join('') : '<p class="vazio">Nenhuma disputa.</p>';
  h += '<h2 class="titulo-secao">Aguardando o adversário</h2>' + (pendentes.length ? pendentes.map((p) =>
    '<div class="card"><div class="linha"><h2>' + esc(nome(p.a)) + ' x ' + esc(nome(p.b)) + '</h2>' + seloPartida(p) + '</div><span class="muted">' + esc(nome(p.registradoPor)) + ' registrou ' + placar(p) + '. Confirmação automática em ' + horasRestantes(p) + '.</span></div>'
  ).join('') : '<p class="vazio">Nada pendente.</p>');
  h += '<form class="card" data-form="lancar"><h2>Lançar placar de treino</h2>' + chipsTurma() +
    '<input type="hidden" name="turmaId" value="' + t.id + '">' +
    '<div class="grade2"><label class="campo">Jogador 1<select name="a">' + t.membros.map((m, i) => '<option value="' + m + '"' + (i === 0 ? ' selected' : '') + '>' + esc(nome(m)) + '</option>').join('') + '</select></label>' +
    '<label class="campo">Jogador 2<select name="b">' + t.membros.map((m, i) => '<option value="' + m + '"' + (i === 1 ? ' selected' : '') + '>' + esc(nome(m)) + '</option>').join('') + '</select></label></div>' +
    camposSets('Jogador 1', 'Jogador 2') + '<button class="btn sec" type="submit">Lançar placar</button></form>';
  h += '<h2 class="titulo-secao">Confirmadas recentes</h2>' + confirmadas.map((p) =>
    '<div class="card"><div class="linha"><strong style="font-weight:500">' + esc(nome(p.a)) + ' x ' + esc(nome(p.b)) + '</strong>' + seloPartida(p) + '</div><span class="muted">' + placar(p) + ' · vencedor: ' + esc(nome(vencedor(p))) + '</span></div>'
  ).join('');
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
    return topo('Olá, ' + e.usuario.nome.split(' ')[0], { direita: '<button class="sair" data-acao="sair">Sair</button>' }) +
      '<main class="conteudo"><p class="vazio">Você ainda não está em nenhuma turma.</p><a class="btn" href="#/aluno/convite">Entrar com código de convite</a></main>' + nav(NAV_ALUNO, '#/aluno');
  }
  const t = e.turmas[0];
  const { pos, linha } = minhaPosicao(t);
  const prox = e.aulas.find((a) => Date.parse(a.inicio) > agora());
  const paraConfirmar = e.partidas.filter((p) => p.status === 'pendente' && (p.a === eu || p.b === eu) && p.registradoPor !== eu);
  const aguardando = e.partidas.filter((p) => p.status === 'pendente' && p.registradoPor === eu);
  const minhasDisputas = e.partidas.filter((p) => p.status === 'disputa' && (p.a === eu || p.b === eu));
  const desafios = e.desafios.filter((d) => d.para === eu || d.de === eu);

  let h = topo('Olá, ' + e.usuario.nome.split(' ')[0], {
    sub: esc(t.nome) + ' · ' + pos + 'º no ranking',
    direita: '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px"><button class="sair" data-acao="sair">Sair</button><span class="pill-pts">' + linha.pontos + ' pts</span></div>'
  }) + '<main class="conteudo">';

  if (prox) {
    const minha = prox.presencas[eu];
    const status = minha ? minha.status : 'pendente';
    const limite = Date.parse(prox.inicio) - 4 * HORA;
    const pode = agora() < limite;
    const hl = new Date(limite).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const conf = Object.values(prox.presencas).filter(ocupaVaga).length;
    h += '<section class="card"><div class="linha"><h2>Próxima aula</h2><span class="selo bola">' + dataHora(prox.inicio) + '</span></div>' +
      '<span class="muted">' + esc(prox.quadra) + (prox.tema ? ' · ' + esc(prox.tema) : '') + ' · ' + conf + ' de ' + prox.vagas + ' vagas</span>';
    if (status === 'confirmado' && !ui.cancelando) {
      h += '<div class="botoes"><span class="selo ok" style="display:flex;align-items:center;justify-content:center;height:44px;border-radius:22px;font-size:14px">Presença confirmada</span>' +
        '<button class="btn sec pequeno" style="height:44px" data-acao="cancelar-presenca"' + (pode ? '' : ' disabled') + '>Cancelar</button></div>';
    } else if (ui.cancelando) {
      h += '<form data-form="cancelar" data-aula="' + prox.id + '" style="display:flex;flex-direction:column;gap:10px"><label class="campo">Motivo (opcional)<input name="motivo" placeholder="Ex.: consulta médica"></label>' +
        '<div class="botoes"><button type="button" class="btn sec pequeno" data-acao="desistir-cancelar">Voltar</button><button class="btn perigo pequeno" type="submit">Cancelar presença</button></div></form>';
    } else {
      h += '<button class="btn" data-acao="presenca" data-aula="' + prox.id + '"' + (pode ? '' : ' disabled') + '>' + (status === 'cancelado' ? 'Confirmar presença de novo' : 'Confirmar presença') + '</button>';
    }
    h += '<span class="muted">' + (pode ? 'Confirme ou cancele até ' + hl + ' (4h antes da aula).' : 'Prazo encerrado. O professor marca a presença no dia.') + '</span></section>';
  }

  for (const p of paraConfirmar) {
    const reg = p.registradoPor;
    h += '<section class="card"><div class="linha"><h2>Placar para confirmar</h2>' + seloPartida(p) + '</div>' +
      '<span>' + esc(nome(reg)) + ' registrou: <strong>' + esc(nome(p.a)) + ' ' + placar(p) + ' ' + esc(nome(p.b)) + '</strong></span>' +
      '<span class="muted">Vencedor: ' + esc(nome(vencedor(p))) + '. Restam ' + horasRestantes(p) + '; sem resposta, o placar é confirmado automaticamente.</span>';
    if (ui.contestando === p.id) {
      h += '<form data-form="contestar" data-partida="' + p.id + '" style="display:flex;flex-direction:column;gap:10px"><label class="campo">O que estava errado?<input name="motivo" required placeholder="Ex.: o segundo set foi 6-4 para mim"></label>' +
        '<div class="botoes"><button type="button" class="btn sec pequeno" data-acao="desistir-contestar">Voltar</button><button class="btn perigo pequeno" type="submit">Enviar contestação</button></div></form>';
    } else {
      h += '<div class="botoes"><button class="btn perigo pequeno" style="height:44px" data-acao="contestar" data-id="' + p.id + '">Contestar</button><button class="btn pequeno" style="height:44px" data-acao="confirmar-placar" data-id="' + p.id + '">Confirmar</button></div>';
    }
    h += '</section>';
  }
  for (const p of minhasDisputas) {
    h += '<section class="card"><div class="linha"><h2>' + esc(nome(p.a)) + ' x ' + esc(nome(p.b)) + '</h2>' + seloPartida(p) + '</div><span class="muted">O professor vai decidir o placar final.</span></section>';
  }
  for (const p of aguardando) {
    const adv = p.a === eu ? p.b : p.a;
    h += '<section class="card"><div class="linha"><h2>Você x ' + esc(nome(adv)) + '</h2>' + seloPartida(p) + '</div><span class="muted">' + placar(p) + ' · aguardando ' + esc(nome(adv)) + ' (' + horasRestantes(p) + ')</span></section>';
  }
  if (desafios.length) {
    h += '<section class="card"><h2>Desafios</h2>' + desafios.map((d) => '<span class="muted">' + (d.de === eu ? 'Você desafiou ' + esc(nome(d.para)) : esc(nome(d.de)) + ' te desafiou') + ' · ' + so_data(d.criadoEm) + '</span>').join('') + '</section>';
  }
  h += '<div class="atalhos"><a class="atalho cheio" href="#/aluno/ranking">Desafiar colega</a><a class="atalho vazio2" href="#/aluno/registrar">Registrar resultado</a></div>' +
    '<a class="btn sec" href="#/aluno/convite">Entrar em outra turma</a></main>' + nav(NAV_ALUNO, '#/aluno');
  return h;
}

function alunoAgenda() {
  const e = ui.estado;
  const eu = e.usuario.id;
  const futuras = e.aulas.filter((a) => Date.parse(a.inicio) > agora());
  const passadas = e.aulas.filter((a) => Date.parse(a.inicio) <= agora()).reverse();
  const card = (a) => {
    const t = e.turmas.find((x) => x.id === a.turmaId);
    return '<div class="card"><div class="linha"><strong style="font-weight:500">' + dataHora(a.inicio) + '</strong>' + seloPresenca(a.presencas[eu]) + '</div>' +
      '<span class="muted">' + esc(t ? t.nome : '') + ' · ' + esc(a.quadra) + (a.tema ? ' · ' + esc(a.tema) : '') + '</span>' +
      (a.comentario ? '<span class="muted" style="background:var(--fundo);border-radius:10px;padding:10px">Professor: “' + esc(a.comentario) + '”</span>' : '') + '</div>';
  };
  return topo('Agenda') + '<main class="conteudo"><h2 class="titulo-secao">Próximas aulas</h2>' +
    (futuras.length ? futuras.map(card).join('') : '<p class="vazio">Nenhuma aula agendada.</p>') +
    '<h2 class="titulo-secao">Aulas anteriores</h2>' + (passadas.length ? passadas.map(card).join('') : '<p class="vazio">Nenhuma aula ainda.</p>') +
    '</main>' + nav(NAV_ALUNO, '#/aluno/agenda');
}

function alunoDesempenho() {
  const e = ui.estado;
  const eu = e.usuario.id;
  const t = turmaAtual();
  const { linha } = t ? minhaPosicao(t) : { linha: { pontos: 0, v: 0, d: 0 } };
  const minhas = e.partidas.filter((p) => p.status === 'confirmada' && (p.a === eu || p.b === eu)).slice(0, 6);
  return topo('Meu desempenho') + '<main class="conteudo">' + chipsTurma() +
    '<div class="stats"><div class="stat"><strong style="color:var(--verde)">' + linha.pontos + '</strong><span>Pontos</span></div><div class="stat"><strong>' + linha.v + '</strong><span>Vitórias</span></div><div class="stat"><strong>' + linha.d + '</strong><span>Derrotas</span></div></div>' +
    '<section class="card"><div class="linha"><h2>Avaliação por fundamentos</h2><span class="selo ok">' + esc(e.eu.nivel) + '</span></div>' +
    FUNDAMENTOS.map(([k, rotulo]) => '<div class="fund"><span>' + rotulo + '</span><div class="barra"><span style="width:' + e.eu.fundamentos[k] * 20 + '%"></span></div><strong style="text-align:right">' + e.eu.fundamentos[k] + '</strong></div>').join('') +
    (e.eu.comentario ? '<span class="muted" style="background:var(--fundo);border-radius:10px;padding:10px">Professor: “' + esc(e.eu.comentario) + '”</span>' : '') +
    '<span class="muted">' + (e.eu.avaliadoEm ? 'Avaliado em ' + so_data(e.eu.avaliadoEm) : 'Ainda não avaliado') + '</span></section>' +
    '<section class="card"><h2>Últimas partidas</h2><ul class="lista">' + (minhas.length ? minhas.map((p) => {
      const ganhei = vencedor(p) === eu;
      const adv = p.a === eu ? p.b : p.a;
      return '<li><span class="avatar" style="' + (ganhei ? '' : 'background:var(--erro-claro);color:#8C1D18') + '">' + (ganhei ? 'V' : 'D') + '</span><span class="nome"><strong>vs ' + esc(nome(adv)) + '</strong><span class="muted">' + placar(p) + ' · ' + so_data(p.criadoEm) + '</span></span><span class="pts">' + (ganhei ? '+10' : '+0') + '</span></li>';
    }).join('') : '<li class="vazio">Nenhuma partida confirmada.</li>') + '</ul></section></main>' + nav(NAV_ALUNO, '#/aluno/desempenho');
}

function alunoRanking() {
  const e = ui.estado;
  const eu = e.usuario.id;
  const t = turmaAtual();
  if (!t) return alunoHome();
  const desafiados = new Set(e.desafios.filter((d) => d.de === eu).map((d) => d.para));
  return topo('Ranking') + '<main class="conteudo">' + chipsTurma() +
    '<p class="muted" style="margin:0">' + esc(t.nome) + ' · vitória +10 · derrota 0 · só contam partidas confirmadas</p>' +
    '<section class="card" style="padding:8px 12px"><ul class="lista">' + t.ranking.map((r, i) =>
      '<li class="' + (r.id === eu ? 'eu' : '') + '"><span class="pos' + (i === 0 ? ' primeiro' : '') + '">' + (i + 1) + '</span><span class="nome"><strong>' + esc(r.nome) + (r.id === eu ? ' (você)' : '') + '</strong><span class="muted">' + r.v + 'V · ' + r.d + 'D</span></span><span class="pts">' + r.pontos + ' pts</span>' +
      (r.id === eu ? '' : desafiados.has(r.id) ? '<span class="selo ok">Enviado</span>' : '<button class="btn sec pequeno" data-acao="desafiar" data-id="' + r.id + '" data-turma="' + t.id + '" aria-label="Desafiar ' + esc(r.nome) + '">Desafiar</button>') + '</li>'
    ).join('') + '</ul></section>' +
    '<p class="muted" style="margin:0">Desafios só entre alunos da mesma turma.</p>' +
    '<button class="link" data-acao="sair-turma" data-turma="' + t.id + '">Sair da turma ' + esc(t.nome) + '</button>' +
    '</main>' + nav(NAV_ALUNO, '#/aluno/ranking');
}

function alunoConvite() {
  return topo('Entrar em uma turma', { voltar: '#/aluno' }) + '<main class="conteudo">' +
    '<p style="margin:0;color:var(--cinza);line-height:1.45">Digite o código que seu professor compartilhou. Pelo código você entra direto, sem aprovação.</p>' +
    '<form data-form="codigo" style="display:flex;flex-direction:column;gap:14px"><label class="campo">Código de convite<input name="codigo" maxlength="6" required style="font-size:24px;font-weight:700;letter-spacing:6px;text-transform:uppercase;height:56px" placeholder="ABC123"></label>' +
    '<span class="muted">Para testar: INI456 (entra na turma Iniciante B) ou XYZ789 (código expirado).</span>' +
    '<button class="btn" type="submit">Entrar na turma</button></form></main>' + nav(NAV_ALUNO, '');
}

function alunoRegistrar() {
  const e = ui.estado;
  const eu = e.usuario.id;
  const t = turmaAtual();
  if (!t) return alunoHome();
  const outros = t.membros.filter((m) => m !== eu);
  return topo('Registrar resultado', { voltar: '#/aluno' }) + '<main class="conteudo">' + chipsTurma() +
    '<form class="card" data-form="registrar"><input type="hidden" name="turmaId" value="' + t.id + '">' +
    '<label class="campo">Adversário<select name="adversarioId">' + outros.map((m) => '<option value="' + m + '">' + esc(nome(m)) + '</option>').join('') + '</select></label>' +
    camposSets('Você', 'Adversário') +
    '<span class="muted">O adversário tem 24h para confirmar ou contestar. Sem resposta, o placar vale automaticamente.</span>' +
    '<button class="btn" type="submit">Enviar para confirmação</button></form></main>' + nav(NAV_ALUNO, '');
}

// ---------- roteamento ----------
function render() {
  const app = document.getElementById('app');
  const rota = location.hash.replace(/^#/, '') || '/login';
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
    case 'login-teste': entrar(d.email, d.senha); break;
    case 'reset': fetch('/api/reset', { method: 'POST' }).then(() => aviso('Dados da demonstração reiniciados.')); break;
    case 'sair': sair(); break;
    case 'turma': ui.turmaSel = d.id; render(); break;
    case 'marcar': acao('marcar_presenca', { aulaId: d.aula, alunoId: d.aluno, status: d.status }); break;
    case 'gerar-codigo': acao('gerar_codigo', { turmaId: d.turma }); break;
    case 'revogar-codigo': acao('revogar_codigo', { turmaId: d.turma }); break;
    case 'presenca': acao('presenca', { aulaId: d.aula, status: 'confirmado' }); break;
    case 'cancelar-presenca': ui.cancelando = true; render(); break;
    case 'desistir-cancelar': ui.cancelando = false; render(); break;
    case 'confirmar-placar': acao('placar_confirmar', { partidaId: d.id }); break;
    case 'contestar': ui.contestando = d.id; render(); break;
    case 'desistir-contestar': ui.contestando = null; render(); break;
    case 'desafiar': acao('desafiar', { paraId: d.id, turmaId: d.turma }); break;
    case 'sair-turma': acao('sair_turma', { turmaId: d.turma }).then((ok) => { if (ok) { ui.turmaSel = null; location.hash = '#/aluno'; } }); break;
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
      if (await acao('avaliar', { alunoId: d.aluno, nivel: fd.get('nivel'), fundamentos, comentario: fd.get('comentario') })) location.hash = '#/prof/alunos';
      break;
    }
    case 'criar-aula':
      acao('criar_aula', { turmaId: fd.get('turmaId'), data: fd.get('data'), hora: fd.get('hora'), quadra: fd.get('quadra'), tema: fd.get('tema'), vagas: Number(fd.get('vagas')) });
      break;
    case 'validar': acao('validar_placar', { partidaId: d.partida, sets: lerSets(fd) }); break;
    case 'lancar': acao('lancar_placar', { turmaId: fd.get('turmaId'), a: fd.get('a'), b: fd.get('b'), sets: lerSets(fd) }); break;
    case 'cancelar': ui.cancelando = false; acao('presenca', { aulaId: d.aula, status: 'cancelado', motivo: fd.get('motivo') }); break;
    case 'contestar': ui.contestando = null; acao('placar_contestar', { partidaId: d.partida, motivo: fd.get('motivo') }); break;
    case 'codigo':
      if (await acao('entrar_codigo', { codigo: fd.get('codigo') })) location.hash = '#/aluno';
      break;
    case 'registrar':
      if (await acao('registrar_resultado', { adversarioId: fd.get('adversarioId'), turmaId: fd.get('turmaId'), sets: lerSets(fd) })) location.hash = '#/aluno';
      break;
  }
});

// Ao abrir a página: se a aba já tinha sessão, recupera o estado.
(async () => {
  if (ui.sid) {
    try {
      ui.estado = await api('estado');
      ui.ultimoJson = JSON.stringify({ ...ui.estado, agora: '' });
    } catch { ui.estado = null; }
  }
  render();
})();
