// Servidor do protótipo MatchPoint. Só usa módulos nativos do Node (sem npm install).
// Os dados ficam em memória: reiniciar o servidor (ou POST /api/reset) volta ao estado inicial.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORTA = Number(process.env.PORT) || 3000;
const PUBLICO = path.join(__dirname, 'public');
const HORA = 60 * 60 * 1000;

const USUARIOS = [
  { id: 'p1', nome: 'Prof. Carlos', email: 'professor@matchpoint.app', senha: 'prof123', papel: 'professor' },
  { id: 'a1', nome: 'João Silva', email: 'aluno@matchpoint.app', senha: 'aluno123', papel: 'aluno' }
];

let db;
const sessoes = new Map();

function inicioDaProximaAula() {
  // Sempre pelo menos 6h no futuro, para a regra das 4h de antecedência funcionar na demo.
  const d = new Date(Date.now() + 6 * HORA);
  d.setMinutes(0, 0, 0);
  return d;
}

function diasAPartirDeHoje(dias, hora) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(hora, 0, 0, 0);
  return d;
}

function criarBanco() {
  const fundamentosPadrao = () => ({ saque: 3, forehand: 3, backhand: 3, voleio: 3, movimentacao: 3 });
  const aluno = (id, nome, nivel, pontos, v, d) => ({ id, nome, nivel, base: { pontos, v, d }, fundamentos: fundamentosPadrao(), comentario: '', avaliadoEm: null });
  const alunos = {
    a1: aluno('a1', 'João Silva', 'Intermediário', 120, 12, 5),
    a2: aluno('a2', 'Maria Souza', 'Intermediário', 130, 13, 4),
    a3: aluno('a3', 'Pedro Lima', 'Intermediário', 90, 9, 6),
    a4: aluno('a4', 'Lucas Rocha', 'Intermediário', 70, 7, 8),
    a5: aluno('a5', 'Ana Costa', 'Intermediário', 60, 6, 7),
    a6: aluno('a6', 'Bruno Alves', 'Iniciante', 40, 4, 2),
    a7: aluno('a7', 'Carla Mendes', 'Iniciante', 30, 3, 3)
  };
  alunos.a1.fundamentos = { saque: 4, forehand: 4, backhand: 3, voleio: 2, movimentacao: 3 };
  alunos.a1.comentario = 'Bom progresso no backhand. Próxima meta: subir à rede depois do saque.';
  alunos.a1.avaliadoEm = diasAPartirDeHoje(-3, 19).toISOString();

  const turmas = {
    t1: { id: 't1', nome: 'Intermediário A', membros: ['a1', 'a2', 'a3', 'a4', 'a5'], codigo: { valor: 'ABC123', expira: diasAPartirDeHoje(7, 23).toISOString(), ativo: true } },
    t2: { id: 't2', nome: 'Iniciante B', membros: ['a6', 'a7'], codigo: { valor: 'INI456', expira: diasAPartirDeHoje(7, 23).toISOString(), ativo: true } }
  };

  const hoje = inicioDaProximaAula();
  const aulas = [
    { id: 'au1', turmaId: 't1', inicio: hoje.toISOString(), quadra: 'Quadra 2', tema: 'Saque e devolução', vagas: 6,
      presencas: { a1: { status: 'pendente' }, a2: { status: 'confirmado' }, a3: { status: 'pendente' }, a4: { status: 'confirmado' }, a5: { status: 'cancelado', motivo: 'Consulta médica' } } },
    { id: 'au2', turmaId: 't1', inicio: diasAPartirDeHoje(4, 18).toISOString(), quadra: 'Quadra 2', tema: 'Voleio', vagas: 6, presencas: {} },
    { id: 'au0', turmaId: 't1', inicio: diasAPartirDeHoje(-3, 18).toISOString(), quadra: 'Quadra 2', tema: 'Backhand cruzado', vagas: 6,
      presencas: { a1: { status: 'presente' }, a2: { status: 'presente' }, a3: { status: 'ausente' } }, comentario: 'Bom treino de backhand. Próxima aula: saque.' }
  ];

  const partidas = [
    // Histórico já contado nos pontos-base (seed: true não soma de novo).
    { id: 'pa0', turmaId: 't1', a: 'a1', b: 'a4', sets: [[6, 4], [3, 6], [6, 2]], status: 'confirmada', registradoPor: 'a1', criadoEm: diasAPartirDeHoje(-2, 20).toISOString(), seed: true },
    { id: 'pa00', turmaId: 't1', a: 'a2', b: 'a1', sets: [[6, 4], [6, 3]], status: 'confirmada', registradoPor: 'a2', criadoEm: diasAPartirDeHoje(-5, 20).toISOString(), seed: true },
    // Pedro registrou vitória sobre João há 6h: João precisa confirmar ou contestar.
    { id: 'pa1', turmaId: 't1', a: 'a3', b: 'a1', sets: [[6, 4], [3, 6], [6, 2]], status: 'pendente', registradoPor: 'a3', criadoEm: new Date(Date.now() - 6 * HORA).toISOString() },
    // João registrou vitória sobre Maria e ela contestou: o professor decide.
    { id: 'pa2', turmaId: 't1', a: 'a1', b: 'a2', sets: [[6, 4], [6, 3]], status: 'disputa', registradoPor: 'a1', criadoEm: new Date(Date.now() - 20 * HORA).toISOString(), motivo: 'O segundo set foi 6-4 para mim.' }
  ];

  return { alunos, turmas, aulas, partidas, desafios: [], codigosExpirados: ['XYZ789'] };
}

function id(prefixo) { return prefixo + crypto.randomBytes(4).toString('hex'); }

function vencedor(p) {
  let a = 0, b = 0;
  for (const [x, y] of p.sets) { if (x > y) a++; else if (y > x) b++; }
  return a > b ? p.a : p.b;
}

// RN05: sem resposta do adversário em 24h, o placar é confirmado automaticamente.
function aplicarPrazos() {
  for (const p of db.partidas) {
    if (p.status === 'pendente' && Date.now() - Date.parse(p.criadoEm) > 24 * HORA) {
      p.status = 'confirmada';
      p.confirmadoAutomaticamente = true;
    }
  }
}

// RN08: vitória +10, derrota 0. Só partidas confirmadas (pelo adversário, automaticamente ou pelo professor).
function ranking(turmaId) {
  const t = db.turmas[turmaId];
  const linhas = t.membros.map((aid) => {
    const al = db.alunos[aid];
    return { id: aid, nome: al.nome, pontos: al.base.pontos, v: al.base.v, d: al.base.d };
  });
  const porId = Object.fromEntries(linhas.map((l) => [l.id, l]));
  for (const p of db.partidas) {
    if (p.turmaId !== turmaId || p.status !== 'confirmada' || p.seed) continue;
    const w = vencedor(p);
    const l = w === p.a ? p.b : p.a;
    if (porId[w]) { porId[w].pontos += 10; porId[w].v++; }
    if (porId[l]) porId[l].d++;
  }
  return linhas.sort((x, y) => y.pontos - x.pontos || y.v - x.v);
}

function turmasDoAluno(aid) {
  return Object.values(db.turmas).filter((t) => t.membros.includes(aid));
}

function estadoPara(usuario) {
  aplicarPrazos();
  const nomes = Object.fromEntries(Object.values(db.alunos).map((a) => [a.id, a.nome]));
  const turmas = usuario.papel === 'professor' ? Object.values(db.turmas) : turmasDoAluno(usuario.id);
  const ids = new Set(turmas.map((t) => t.id));
  const base = {
    agora: new Date().toISOString(),
    usuario: { id: usuario.id, nome: usuario.nome, papel: usuario.papel },
    nomes,
    turmas: turmas.map((t) => ({
      id: t.id, nome: t.nome, membros: t.membros,
      codigo: usuario.papel === 'professor' ? t.codigo : undefined,
      ranking: ranking(t.id)
    })),
    aulas: db.aulas.filter((a) => ids.has(a.turmaId)).sort((x, y) => x.inicio.localeCompare(y.inicio)),
    partidas: db.partidas.filter((p) => ids.has(p.turmaId)).sort((x, y) => y.criadoEm.localeCompare(x.criadoEm)),
    desafios: db.desafios.filter((d) => ids.has(d.turmaId))
  };
  if (usuario.papel === 'professor') {
    base.alunos = db.alunos;
  } else {
    base.eu = db.alunos[usuario.id];
  }
  return base;
}

class ErroRegra extends Error {}
const exigir = (cond, msg) => { if (!cond) throw new ErroRegra(msg); };

function setsValidos(sets) {
  exigir(Array.isArray(sets) && sets.length >= 1 && sets.length <= 3, 'Informe de 1 a 3 sets.');
  for (const s of sets) {
    exigir(Array.isArray(s) && s.length === 2 && s.every((n) => Number.isInteger(n) && n >= 0 && n <= 7), 'Placar de set inválido (use números de 0 a 7).');
    exigir(s[0] !== s[1], 'Um set não pode terminar empatado.');
  }
  return sets;
}

const ACOES = {
  aluno: {
    presenca(u, { aulaId, status, motivo }) {
      const aula = db.aulas.find((a) => a.id === aulaId);
      exigir(aula, 'Aula não encontrada.');
      exigir(['confirmado', 'cancelado'].includes(status), 'Status inválido.');
      // RN06: confirmar ou cancelar até 4h antes do início.
      exigir(Date.parse(aula.inicio) - Date.now() >= 4 * HORA, 'Prazo encerrado: só é possível alterar até 4h antes da aula.');
      if (status === 'confirmado') {
        const confirmados = Object.values(aula.presencas).filter((p) => p.status === 'confirmado').length;
        exigir(confirmados < aula.vagas, 'A aula já está lotada.');
      }
      aula.presencas[u.id] = { status, motivo: status === 'cancelado' ? (motivo || '') : undefined };
      return status === 'confirmado' ? 'Presença confirmada.' : 'Presença cancelada.';
    },
    placar_confirmar(u, { partidaId }) {
      const p = db.partidas.find((x) => x.id === partidaId);
      exigir(p && p.status === 'pendente', 'Partida não está pendente.');
      exigir(p.registradoPor !== u.id && (p.a === u.id || p.b === u.id), 'Só o adversário confirma o placar.');
      p.status = 'confirmada';
      return 'Placar confirmado. Ranking atualizado.';
    },
    placar_contestar(u, { partidaId, motivo }) {
      const p = db.partidas.find((x) => x.id === partidaId);
      exigir(p && p.status === 'pendente', 'Partida não está pendente.');
      exigir(p.registradoPor !== u.id && (p.a === u.id || p.b === u.id), 'Só o adversário contesta o placar.');
      p.status = 'disputa';
      p.motivo = motivo || 'Placar contestado.';
      return 'Placar contestado. O professor vai decidir.';
    },
    desafiar(u, { paraId, turmaId }) {
      const t = db.turmas[turmaId];
      // RN04: desafio só entre alunos do mesmo grupo.
      exigir(t && t.membros.includes(u.id) && t.membros.includes(paraId), 'Desafios só entre alunos da mesma turma.');
      exigir(paraId !== u.id, 'Você não pode se desafiar.');
      db.desafios.push({ id: id('d'), turmaId, de: u.id, para: paraId, criadoEm: new Date().toISOString() });
      return 'Desafio enviado para ' + db.alunos[paraId].nome + '.';
    },
    registrar_resultado(u, { adversarioId, turmaId, sets }) {
      const t = db.turmas[turmaId];
      exigir(t && t.membros.includes(u.id) && t.membros.includes(adversarioId) && adversarioId !== u.id, 'Escolha um adversário da sua turma.');
      db.partidas.push({ id: id('pa'), turmaId, a: u.id, b: adversarioId, sets: setsValidos(sets), status: 'pendente', registradoPor: u.id, criadoEm: new Date().toISOString() });
      return 'Resultado registrado. ' + db.alunos[adversarioId].nome + ' tem 24h para confirmar.';
    },
    entrar_codigo(u, { codigo }) {
      const c = String(codigo || '').trim().toUpperCase();
      const t = Object.values(db.turmas).find((x) => x.codigo.valor === c);
      exigir(t && t.codigo.ativo && Date.parse(t.codigo.expira) > Date.now(), 'Código inválido ou expirado.');
      exigir(!t.membros.includes(u.id), 'Você já faz parte da turma ' + t.nome + '.');
      // RN01: pelo código a entrada é direta, sem aprovação.
      t.membros.push(u.id);
      return 'Você entrou na turma ' + t.nome + '.';
    },
    sair_turma(u, { turmaId }) {
      const t = db.turmas[turmaId];
      exigir(t && t.membros.includes(u.id), 'Você não está nessa turma.');
      t.membros = t.membros.filter((m) => m !== u.id);
      return 'Você saiu da turma ' + t.nome + '.';
    }
  },
  professor: {
    criar_aula(u, { turmaId, data, hora, quadra, tema, vagas }) {
      exigir(db.turmas[turmaId], 'Turma não encontrada.');
      const inicio = new Date(data + 'T' + hora + ':00');
      exigir(!Number.isNaN(inicio.getTime()), 'Data ou horário inválido.');
      const v = Number(vagas);
      // RN07: limite fixo de até 6 alunos por quadra/horário.
      exigir(Number.isInteger(v) && v >= 1 && v <= 6, 'O limite é de 1 a 6 alunos.');
      db.aulas.push({ id: id('au'), turmaId, inicio: inicio.toISOString(), quadra: quadra || 'Quadra 1', tema: tema || '', vagas: v, presencas: {} });
      return 'Aula criada. Os alunos da turma foram avisados.';
    },
    marcar_presenca(u, { aulaId, alunoId, status }) {
      const aula = db.aulas.find((a) => a.id === aulaId);
      exigir(aula && ['presente', 'ausente'].includes(status), 'Dados inválidos.');
      aula.presencas[alunoId] = { ...(aula.presencas[alunoId] || {}), status };
      return db.alunos[alunoId].nome + ' marcado como ' + status + '.';
    },
    avaliar(u, { alunoId, nivel, fundamentos, comentario }) {
      const al = db.alunos[alunoId];
      exigir(al, 'Aluno não encontrado.');
      exigir(['Iniciante', 'Intermediário', 'Avançado'].includes(nivel), 'Nível inválido.');
      for (const k of ['saque', 'forehand', 'backhand', 'voleio', 'movimentacao']) {
        exigir(Number.isInteger(fundamentos[k]) && fundamentos[k] >= 1 && fundamentos[k] <= 5, 'Notas de 1 a 5.');
      }
      Object.assign(al, { nivel, fundamentos, comentario: comentario || '', avaliadoEm: new Date().toISOString() });
      return 'Avaliação de ' + al.nome + ' salva.';
    },
    validar_placar(u, { partidaId, sets }) {
      const p = db.partidas.find((x) => x.id === partidaId);
      exigir(p && (p.status === 'disputa' || p.status === 'pendente'), 'Partida não pode ser validada.');
      p.sets = setsValidos(sets);
      p.status = 'confirmada';
      p.validadoPeloProfessor = true;
      return 'Placar validado. Ranking atualizado.';
    },
    lancar_placar(u, { turmaId, a, b, sets }) {
      const t = db.turmas[turmaId];
      exigir(t && t.membros.includes(a) && t.membros.includes(b) && a !== b, 'Escolha dois alunos diferentes da turma.');
      // RN10: o professor pode lançar o placar direto, já confirmado.
      db.partidas.push({ id: id('pa'), turmaId, a, b, sets: setsValidos(sets), status: 'confirmada', registradoPor: u.id, validadoPeloProfessor: true, criadoEm: new Date().toISOString() });
      return 'Placar lançado. Ranking atualizado.';
    },
    gerar_codigo(u, { turmaId }) {
      const t = db.turmas[turmaId];
      exigir(t, 'Turma não encontrada.');
      const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const valor = Array.from(crypto.randomBytes(6), (b) => letras[b % letras.length]).join('');
      t.codigo = { valor, expira: diasAPartirDeHoje(7, 23).toISOString(), ativo: true };
      return 'Novo código gerado: ' + valor + '.';
    },
    revogar_codigo(u, { turmaId }) {
      const t = db.turmas[turmaId];
      exigir(t, 'Turma não encontrada.');
      t.codigo.ativo = false;
      return 'Código revogado. Quem já entrou continua na turma.';
    }
  }
};

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', (c) => { s += c; if (s.length > 1e5) req.destroy(); });
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function json(res, status, dados, extras = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extras });
  res.end(JSON.stringify(dados));
}

function usuarioDaSessao(req) {
  const m = /(?:^|;\s*)sid=([a-f0-9]+)/.exec(req.headers.cookie || '');
  return m ? sessoes.get(m[1]) : undefined;
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };

function servirArquivo(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const alvo = path.normalize(path.join(PUBLICO, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)));
  if (!alvo.startsWith(PUBLICO)) { res.writeHead(403); return res.end(); }
  fs.readFile(alvo, (err, dados) => {
    if (err) { res.writeHead(404); return res.end('Não encontrado'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(alvo)] || 'application/octet-stream' });
    res.end(dados);
  });
}

const servidor = http.createServer(async (req, res) => {
  try {
    if (!req.url.startsWith('/api/')) return servirArquivo(req, res);

    if (req.method === 'POST' && req.url === '/api/login') {
      const { email, senha } = await lerCorpo(req);
      const u = USUARIOS.find((x) => x.email === String(email || '').trim().toLowerCase() && x.senha === senha);
      if (!u) return json(res, 401, { erro: 'E-mail ou senha incorretos.' });
      const sid = crypto.randomBytes(16).toString('hex');
      // Cada aba guarda o próprio sid (cookie de sessão por caminho não serve para duas contas no mesmo navegador),
      // então o cliente envia o sid também no cabeçalho X-Sessao.
      sessoes.set(sid, u);
      return json(res, 200, { sid, estado: estadoPara(u) });
    }
    if (req.method === 'POST' && req.url === '/api/reset') {
      db = criarBanco();
      return json(res, 200, { ok: true });
    }

    const sid = req.headers['x-sessao'];
    const u = (sid && sessoes.get(sid)) || usuarioDaSessao(req);
    if (!u) return json(res, 401, { erro: 'Faça login novamente.' });

    if (req.method === 'POST' && req.url === '/api/logout') {
      sessoes.delete(sid);
      return json(res, 200, { ok: true });
    }
    if (req.method === 'GET' && req.url === '/api/estado') return json(res, 200, estadoPara(u));
    if (req.method === 'POST' && req.url === '/api/acao') {
      const { tipo, ...dados } = await lerCorpo(req);
      const acao = ACOES[u.papel][tipo];
      if (!acao) return json(res, 400, { erro: 'Ação não permitida para o perfil ' + u.papel + '.' });
      try {
        const mensagem = acao(u, dados);
        return json(res, 200, { mensagem, estado: estadoPara(u) });
      } catch (e) {
        if (e instanceof ErroRegra) return json(res, 422, { erro: e.message });
        throw e;
      }
    }
    json(res, 404, { erro: 'Rota não encontrada.' });
  } catch (e) {
    console.error(e);
    json(res, 500, { erro: 'Erro no servidor.' });
  }
});

db = criarBanco();
servidor.listen(PORTA, () => {
  console.log('');
  console.log('  MatchPoint rodando em http://localhost:' + PORTA);
  console.log('');
  console.log('  Professor: professor@matchpoint.app / prof123');
  console.log('  Aluno:     aluno@matchpoint.app / aluno123');
  console.log('');
  console.log('  Ctrl+C para parar.');
});
