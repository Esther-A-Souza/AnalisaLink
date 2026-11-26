// Repositório de análises: a ÚNICA parte do sistema que conhece SQL.
// O controller só usa as funções exportadas aqui (listar, buscarPorId, criar,
// substituir, atualizar, excluir) e recebe objetos no formato da API.
// Trocar o banco (SQLite por outro) exige mudar apenas este arquivo.
import { db, transacao } from "./db/conexao.js";
import { ErroHttp } from "./erros.js";

const AGORA = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";
const ORDENS = { asc: "ASC", desc: "DESC" };
// Campos da API -> colunas do banco (lista fixa: só estes nomes entram no SQL)
const COLUNAS = {
  url: "url", protocol: "protocolo", domain: "dominio", path: "caminho",
  score: "pontuacao", classification: "classificacao", observacao: "observacao"
};

/* ---------- tradução banco <-> API ---------- */

function formatarData(iso) {
  return iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : null;
}

function paraApi(linha, sinais) {
  const analise = {
    id: linha.id,
    url: linha.url,
    protocol: linha.protocolo,
    domain: linha.dominio,
    path: linha.caminho,
    score: linha.pontuacao,
    classification: linha.classificacao,
    signals: sinais.map((s) => ({ texto: s.texto, pontos: s.pontos })),
    observacao: linha.observacao,
    date: formatarData(linha.criada_em)
  };
  if (linha.atualizada_em) analise.atualizadoEm = formatarData(linha.atualizada_em);
  return analise;
}

// Qualquer falha do banco vira um erro 500 genérico; o detalhe fica só no log do servidor.
function executar(operacao) {
  try {
    return operacao();
  } catch (erro) {
    if (erro instanceof ErroHttp) throw erro;
    console.error("Erro de banco de dados:", erro);
    throw new ErroHttp(500, "ERRO_BANCO", "Não foi possível acessar o banco de dados.");
  }
}

/* ---------- auxiliares de SQL ---------- */

// Busca os sinais de várias análises de uma vez (evita uma consulta por análise).
function sinaisDe(ids) {
  const mapa = new Map();
  if (ids.length === 0) return mapa;
  const marcas = ids.map(() => "?").join(", ");
  const linhas = db.prepare("SELECT analise_id, texto, pontos FROM sinais WHERE analise_id IN (" + marcas + ") ORDER BY id").all(...ids);
  for (const s of linhas) {
    if (!mapa.has(s.analise_id)) mapa.set(s.analise_id, []);
    mapa.get(s.analise_id).push(s);
  }
  return mapa;
}

function gravarSinais(analiseId, sinais) {
  const inserir = db.prepare("INSERT INTO sinais (analise_id, texto, pontos) VALUES (?, ?, ?)");
  for (const s of sinais) inserir.run(analiseId, s.texto, s.pontos);
}

function escaparLike(texto) {
  return texto.replace(/[\\%_]/g, "\\$&");   // % e _ são curingas do LIKE; aqui valem como texto comum
}

/* ---------- operações (o "contrato" usado pelo controller) ---------- */

// READ: lista, com filtros opcionais
export function listar({ busca, classificacao, ordem = "desc" } = {}) {
  return executar(() => {
    const filtros = [];
    const valores = [];
    if (busca) {
      filtros.push("lower(url || ' ' || classificacao) LIKE ? ESCAPE '\\'");
      valores.push("%" + escaparLike(busca.toLowerCase()) + "%");
    }
    if (classificacao) {
      filtros.push("classificacao = ?");
      valores.push(classificacao);
    }
    const where = filtros.length > 0 ? " WHERE " + filtros.join(" AND ") : "";
    const linhas = db.prepare("SELECT * FROM analises" + where + " ORDER BY id " + (ORDENS[ordem] || "DESC")).all(...valores);
    const sinais = sinaisDe(linhas.map((l) => l.id));
    return linhas.map((l) => paraApi(l, sinais.get(l.id) || []));
  });
}

// READ: uma análise (ou null)
export function buscarPorId(id) {
  return executar(() => {
    const linha = db.prepare("SELECT * FROM analises WHERE id = ?").get(id);
    if (!linha) return null;
    return paraApi(linha, sinaisDe([id]).get(id) || []);
  });
}

// CREATE: grava a análise e os sinais na mesma transação
export function criar(dados) {
  return executar(() => {
    const id = transacao(() => {
      const r = db.prepare(
        "INSERT INTO analises (url, protocolo, dominio, caminho, pontuacao, classificacao, observacao) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(dados.url, dados.protocol, dados.domain, dados.path, dados.score, dados.classification, dados.observacao ?? "");
      const novoId = Number(r.lastInsertRowid);
      gravarSinais(novoId, dados.signals);
      return novoId;
    });
    return buscarPorId(id);
  });
}

// UPDATE (PUT): substitui os dados e recalcula os sinais. Devolve null se o id não existe.
export function substituir(id, dados) {
  return executar(() => {
    const existe = transacao(() => {
      const r = db.prepare(
        "UPDATE analises SET url = ?, protocolo = ?, dominio = ?, caminho = ?, pontuacao = ?, classificacao = ?, observacao = ?, atualizada_em = " + AGORA + " WHERE id = ?"
      ).run(dados.url, dados.protocol, dados.domain, dados.path, dados.score, dados.classification, dados.observacao ?? "", id);
      if (r.changes === 0) return false;
      db.prepare("DELETE FROM sinais WHERE analise_id = ?").run(id);
      gravarSinais(id, dados.signals);
      return true;
    });
    return existe ? buscarPorId(id) : null;
  });
}

// UPDATE (PATCH): altera só os campos enviados. Devolve null se o id não existe.
export function atualizar(id, parcial) {
  return executar(() => {
    const campos = Object.keys(parcial).filter((c) => c in COLUNAS);
    const existe = transacao(() => {
      const sets = campos.map((c) => COLUNAS[c] + " = ?");
      sets.push("atualizada_em = " + AGORA);
      const r = db.prepare("UPDATE analises SET " + sets.join(", ") + " WHERE id = ?").run(...campos.map((c) => parcial[c]), id);
      if (r.changes === 0) return false;
      if (parcial.signals) {
        db.prepare("DELETE FROM sinais WHERE analise_id = ?").run(id);
        gravarSinais(id, parcial.signals);
      }
      return true;
    });
    return existe ? buscarPorId(id) : null;
  });
}

// DELETE: os sinais são apagados pelo próprio banco (ON DELETE CASCADE). Devolve true/false.
export function excluir(id) {
  return executar(() => db.prepare("DELETE FROM analises WHERE id = ?").run(id).changes > 0);
}
