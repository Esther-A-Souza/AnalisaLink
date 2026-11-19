// Testes automáticos da API: npm test
// Liga o servidor em outra porta, com um banco temporário, e faz requisições reais.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORTA = 3101;
const BASE = "http://localhost:" + PORTA;
let processo;

async function chamar(metodo, caminho, corpo) {
  const opcoes = { method: metodo };
  if (corpo !== undefined) {
    opcoes.headers = { "Content-Type": "application/json" };
    opcoes.body = typeof corpo === "string" ? corpo : JSON.stringify(corpo);
  }
  const resposta = await fetch(BASE + caminho, opcoes);
  const texto = await resposta.text();
  return { status: resposta.status, headers: resposta.headers, corpo: texto ? JSON.parse(texto) : null };
}

before(async () => {
  const arquivo = join(mkdtempSync(join(tmpdir(), "analisalink-")), "db.json");
  writeFileSync(arquivo, JSON.stringify({ analises: [] }));
  processo = spawn(process.execPath, ["server/server.js"], { env: { ...process.env, PORT: String(PORTA), DB_FILE: arquivo } });
  await new Promise((resolve) => processo.stdout.on("data", resolve));
});

after(() => processo.kill());

test("POST /analises cria (201) e calcula a análise no servidor", async () => {
  const r = await chamar("POST", "/analises", { url: "http://192.168.0.10/login", observacao: "teste" });
  assert.equal(r.status, 201);
  assert.equal(r.headers.get("location"), "/analises/" + r.corpo.id);
  assert.equal(r.corpo.score, 55);
  assert.equal(r.corpo.classification, "Suspeita");
  assert.equal(r.corpo.observacao, "teste");
});

test("POST ignora campos calculados enviados pelo cliente", async () => {
  const r = await chamar("POST", "/analises", { url: "https://www.exemplo.com.br", score: 99, id: 500, classification: "Suspeita" });
  assert.equal(r.status, 201);
  assert.equal(r.corpo.score, 0);
  assert.equal(r.corpo.classification, "Baixa atenção");
  assert.notEqual(r.corpo.id, 500);
});

test("GET /analises lista (200), mais recentes primeiro, com filtros", async () => {
  const todas = await chamar("GET", "/analises");
  assert.equal(todas.status, 200);
  assert.equal(todas.corpo.length, 2);
  assert.ok(todas.corpo[0].id > todas.corpo[1].id);
  const filtradas = await chamar("GET", "/analises?classificacao=Suspeita&busca=login");
  assert.equal(filtradas.corpo.length, 1);
  const asc = await chamar("GET", "/analises?ordem=asc");
  assert.ok(asc.corpo[0].id < asc.corpo[1].id);
});

test("GET /analises com filtro inválido responde 400", async () => {
  const r = await chamar("GET", "/analises?classificacao=Perigosa&ordem=xyz");
  assert.equal(r.status, 400);
  assert.equal(r.corpo.erro.codigo, "VALIDACAO");
  assert.equal(r.corpo.erro.detalhes.length, 2);
});

test("GET /analises/:id devolve uma análise (200)", async () => {
  const r = await chamar("GET", "/analises/1");
  assert.equal(r.status, 200);
  assert.equal(r.corpo.id, 1);
});

test("PUT substitui a url e recalcula a análise (200)", async () => {
  const r = await chamar("PUT", "/analises/1", { url: "https://www.exemplo.com.br/conta", observacao: "revisada" });
  assert.equal(r.status, 200);
  assert.equal(r.corpo.score, 10);
  assert.equal(r.corpo.observacao, "revisada");
  assert.ok(r.corpo.atualizadoEm);
});

test("PUT sem url responde 400", async () => {
  const r = await chamar("PUT", "/analises/1", { observacao: "sem url" });
  assert.equal(r.status, 400);
});

test("PATCH altera só a observação (200) e mantém o resto", async () => {
  const antes = (await chamar("GET", "/analises/1")).corpo;
  const r = await chamar("PATCH", "/analises/1", { observacao: "só a nota" });
  assert.equal(r.status, 200);
  assert.equal(r.corpo.observacao, "só a nota");
  assert.equal(r.corpo.url, antes.url);
  assert.equal(r.corpo.score, antes.score);
});

test("PATCH vazio ou com tipo errado responde 400", async () => {
  assert.equal((await chamar("PATCH", "/analises/1", {})).status, 400);
  assert.equal((await chamar("PATCH", "/analises/1", { observacao: 123 })).status, 400);
});

test("POST com url inválida responde 400 com detalhes", async () => {
  for (const url of ["", "exemplo.com", "ftp://exemplo.com", 42]) {
    const r = await chamar("POST", "/analises", { url });
    assert.equal(r.status, 400, "url: " + url);
    assert.equal(r.corpo.erro.codigo, "VALIDACAO");
    assert.equal(r.corpo.erro.detalhes[0].campo, "url");
  }
});

test("POST com JSON quebrado responde 400; sem corpo responde 400", async () => {
  const quebrado = await chamar("POST", "/analises", "{url:");
  assert.equal(quebrado.status, 400);
  assert.equal(quebrado.corpo.erro.codigo, "JSON_INVALIDO");
  const vazio = await chamar("POST", "/analises");
  assert.equal(vazio.status, 400);
  assert.equal(vazio.corpo.erro.codigo, "CORPO_INVALIDO");
});

test("POST sem Content-Type JSON responde 415", async () => {
  const resposta = await fetch(BASE + "/analises", { method: "POST", headers: { "Content-Type": "text/plain" }, body: '{"url":"https://a.com"}' });
  assert.equal(resposta.status, 415);
});

test("id inexistente responde 404 e id inválido responde 400", async () => {
  assert.equal((await chamar("GET", "/analises/999")).status, 404);
  assert.equal((await chamar("DELETE", "/analises/999")).status, 404);
  assert.equal((await chamar("GET", "/analises/abc")).status, 400);
  assert.equal((await chamar("GET", "/analises/-1")).status, 400);
});

test("rota inexistente responde 404 e método errado responde 405 com Allow", async () => {
  const r = await chamar("GET", "/usuarios");
  assert.equal(r.status, 404);
  assert.equal(r.corpo.erro.codigo, "ROTA_NAO_ENCONTRADA");
  const m = await chamar("DELETE", "/analises");
  assert.equal(m.status, 405);
  assert.equal(m.headers.get("allow"), "GET, POST");
});

test("CORS: OPTIONS responde 204 com os cabeçalhos", async () => {
  const resposta = await fetch(BASE + "/analises", { method: "OPTIONS" });
  assert.equal(resposta.status, 204);
  assert.equal(resposta.headers.get("access-control-allow-origin"), "*");
  assert.match(resposta.headers.get("access-control-allow-methods"), /PATCH/);
});

test("DELETE exclui (204, sem corpo) e depois o recurso não existe mais", async () => {
  const r = await chamar("DELETE", "/analises/1");
  assert.equal(r.status, 204);
  assert.equal(r.corpo, null);
  assert.equal((await chamar("GET", "/analises/1")).status, 404);
  assert.equal((await chamar("GET", "/analises")).corpo.length, 1);
});

test("o formato de todos os erros é { erro: { status, codigo, mensagem } }", async () => {
  const r = await chamar("GET", "/analises/999");
  assert.deepEqual(Object.keys(r.corpo.erro).sort(), ["codigo", "mensagem", "status"]);
  assert.equal(r.corpo.erro.status, 404);
});
