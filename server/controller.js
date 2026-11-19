// Regras de cada operação da API. Cada função recebe { params, query, body }
// e devolve { status, corpo, headers } ou lança ErroHttp.
import { analyzeUrl } from "../src/js/analyzer.js";   // mesmas regras do front-end
import { carregar, salvar } from "./repository.js";
import { ErroHttp } from "./erros.js";

const CLASSIFICACOES = ["Baixa atenção", "Atenção moderada", "Suspeita"];
const LIMITE_OBSERVACAO = 200;

/* ---------- funções auxiliares ---------- */

function agora() {
  return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function lerId(params) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErroHttp(400, "ID_INVALIDO", "O id deve ser um número inteiro positivo.");
  }
  return id;
}

function naoEncontrada(id) {
  return new ErroHttp(404, "NAO_ENCONTRADO", "Análise " + id + " não encontrada.");
}

function exigirObjeto(corpo) {
  if (corpo === null || typeof corpo !== "object" || Array.isArray(corpo)) {
    throw new ErroHttp(400, "CORPO_INVALIDO", "O corpo da requisição deve ser um objeto JSON.");
  }
}

// Valida url (obrigatória no POST e no PUT) e observacao (opcional).
function validarCampos(corpo, urlObrigatoria) {
  const detalhes = [];

  if (urlObrigatoria || "url" in corpo) {
    if (typeof corpo.url !== "string" || corpo.url.trim() === "") {
      detalhes.push({ campo: "url", mensagem: "A url é obrigatória e deve ser um texto." });
    } else {
      const resultado = analyzeUrl(corpo.url.trim());
      if (!resultado.valid) detalhes.push({ campo: "url", mensagem: resultado.message });
    }
  }

  if ("observacao" in corpo) {
    if (typeof corpo.observacao !== "string" || corpo.observacao.length > LIMITE_OBSERVACAO) {
      detalhes.push({ campo: "observacao", mensagem: "A observação deve ser um texto de até " + LIMITE_OBSERVACAO + " caracteres." });
    }
  }

  if (detalhes.length > 0) {
    throw new ErroHttp(400, "VALIDACAO", "Dados inválidos.", detalhes);
  }
}

// O servidor calcula protocolo, domínio, caminho, pontuação, classificação e sinais.
function montarAnalise(url) {
  const { valid, message, ...dados } = analyzeUrl(url);
  return dados;
}

/* ---------- operações ---------- */

export function raiz() {
  return { status: 200, corpo: { nome: "AnalisaLink API", versao: "1.0.0", recursos: { analises: "/analises" } } };
}

// GET /analises
export function listar({ query }) {
  const { busca, classificacao, ordem = "desc" } = query;
  const detalhes = [];
  if (classificacao !== undefined && !CLASSIFICACOES.includes(classificacao)) {
    detalhes.push({ campo: "classificacao", mensagem: "Use um destes valores: " + CLASSIFICACOES.join(", ") + "." });
  }
  if (ordem !== "asc" && ordem !== "desc") {
    detalhes.push({ campo: "ordem", mensagem: "Use asc ou desc." });
  }
  if (detalhes.length > 0) {
    throw new ErroHttp(400, "VALIDACAO", "Parâmetros de consulta inválidos.", detalhes);
  }

  let lista = carregar().analises;
  if (busca) {
    const termo = busca.toLowerCase();
    lista = lista.filter((a) => (a.url + " " + a.classification).toLowerCase().includes(termo));
  }
  if (classificacao) {
    lista = lista.filter((a) => a.classification === classificacao);
  }
  lista = [...lista].sort((a, b) => (ordem === "asc" ? a.id - b.id : b.id - a.id));
  return { status: 200, corpo: lista };
}

// GET /analises/:id
export function buscar({ params }) {
  const id = lerId(params);
  const analise = carregar().analises.find((a) => a.id === id);
  if (!analise) throw naoEncontrada(id);
  return { status: 200, corpo: analise };
}

// POST /analises
export function criar({ body }) {
  exigirObjeto(body);
  validarCampos(body, true);

  const bd = carregar();
  const id = bd.analises.reduce((maior, a) => Math.max(maior, a.id), 0) + 1;
  const nova = { id, ...montarAnalise(body.url.trim()), observacao: body.observacao ?? "", date: agora() };

  bd.analises.push(nova);
  salvar(bd);
  return { status: 201, corpo: nova, headers: { Location: "/analises/" + id } };
}

// PUT /analises/:id  (substitui os dados editáveis: url e observacao)
export function substituir({ params, body }) {
  const id = lerId(params);
  exigirObjeto(body);
  validarCampos(body, true);

  const bd = carregar();
  const indice = bd.analises.findIndex((a) => a.id === id);
  if (indice === -1) throw naoEncontrada(id);

  const nova = {
    id,
    ...montarAnalise(body.url.trim()),
    observacao: body.observacao ?? "",
    date: bd.analises[indice].date,
    atualizadoEm: agora()
  };
  bd.analises[indice] = nova;
  salvar(bd);
  return { status: 200, corpo: nova };
}

// PATCH /analises/:id  (altera só o que for enviado: url e/ou observacao)
export function atualizar({ params, body }) {
  const id = lerId(params);
  exigirObjeto(body);
  if (!("url" in body) && !("observacao" in body)) {
    throw new ErroHttp(400, "VALIDACAO", "Dados inválidos.", [
      { campo: "url, observacao", mensagem: "Informe ao menos um campo para alterar: url ou observacao." }
    ]);
  }
  validarCampos(body, false);

  const bd = carregar();
  const indice = bd.analises.findIndex((a) => a.id === id);
  if (indice === -1) throw naoEncontrada(id);

  let nova = { ...bd.analises[indice], atualizadoEm: agora() };
  if ("url" in body) nova = { ...nova, ...montarAnalise(body.url.trim()) };
  if ("observacao" in body) nova.observacao = body.observacao;

  bd.analises[indice] = nova;
  salvar(bd);
  return { status: 200, corpo: nova };
}

// DELETE /analises/:id
export function excluir({ params }) {
  const id = lerId(params);
  const bd = carregar();
  if (!bd.analises.some((a) => a.id === id)) throw naoEncontrada(id);

  bd.analises = bd.analises.filter((a) => a.id !== id);
  salvar(bd);
  return { status: 204 };
}
