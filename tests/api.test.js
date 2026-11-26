// Testes automáticos da API: npm test
// Liga o servidor em outra porta, com um banco SQLite temporário, e faz requisições reais.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORTA = 3101;
const BASE = "http://localhost:" + PORTA;
let processo;
let arquivoBanco;

function arquivoTemporario(nome) {
  return join(mkdtempSync(join(tmpdir(), "analisalink-")), nome);
}

// Liga o servidor com um banco específico e espera a mensagem "rodando".
function ligar(porta, arquivo) {
  const proc = spawn(process.execPath, ["server/server.js"], { env: { ...process.env, PORT: String(porta), DB_FILE: arquivo } });
  let saida = "";
  const pronto = new Promise((resolve, reject) => {
    proc.stdout.on("data", (pedaco) => {
      saida += pedaco;
      if (saida.includes("rodando")) resolve();
    });
    proc.on("exit", (codigo) => reject(new Error("o servidor encerrou com código " + codigo)));
  });
  return { proc, pronto };
}

async function desligar(servidor) {
  servidor.proc.kill();
  await once(servidor.proc, "exit");
}

async function abrirBanco(arquivo) {
  const { DatabaseSync } = await import("node:sqlite");
  return new DatabaseSync(arquivo);
}

async function chamar(metodo, caminho, corpo, base = BASE) {
  const opcoes = { method: metodo };
  if (corpo !== undefined) {
    opcoes.headers = { "Content-Type": "application/json" };
    opcoes.body = typeof corpo === "string" ? corpo : JSON.stringify(corpo);
  }
  const resposta = await fetch(base + caminho, opcoes);
  const texto = await resposta.text();
  return { status: resposta.status, headers: resposta.headers, corpo: texto ? JSON.parse(texto) : null };
}

let servidorPrincipal;
before(async () => {
  arquivoBanco = arquivoTemporario("teste.db");
  servidorPrincipal = ligar(PORTA, arquivoBanco);
  processo = servidorPrincipal.proc;
  await servidorPrincipal.pronto;
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

/* ---------- Etapa 07: persistência em banco de dados ---------- */

test("banco: os sinais ficam em outra tabela e são apagados em cascata", async () => {
  const criada = await chamar("POST", "/analises", { url: "http://192.168.0.10/login" });
  assert.equal(criada.corpo.signals.length, 3);   // HTTP, IP e a palavra "login"
  const banco = await abrirBanco(arquivoBanco);
  const contar = () => banco.prepare("SELECT count(*) AS n FROM sinais WHERE analise_id = ?").get(criada.corpo.id).n;
  assert.equal(contar(), 3);
  await chamar("DELETE", "/analises/" + criada.corpo.id);
  assert.equal(contar(), 0);
  banco.close();
});

test("banco: PATCH com nova url troca os sinais gravados", async () => {
  const criada = await chamar("POST", "/analises", { url: "http://192.168.0.10/login" });
  const r = await chamar("PATCH", "/analises/" + criada.corpo.id, { url: "https://www.exemplo.com.br" });
  assert.equal(r.corpo.score, 0);
  assert.equal(r.corpo.signals.length, 0);
  const banco = await abrirBanco(arquivoBanco);
  assert.equal(banco.prepare("SELECT count(*) AS n FROM sinais WHERE analise_id = ?").get(criada.corpo.id).n, 0);
  banco.close();
  await chamar("DELETE", "/analises/" + criada.corpo.id);
});

test("banco: ids não são reaproveitados depois de excluir o último registro", async () => {
  const a = await chamar("POST", "/analises", { url: "https://a.com" });
  await chamar("DELETE", "/analises/" + a.corpo.id);
  const b = await chamar("POST", "/analises", { url: "https://b.com" });
  assert.ok(b.corpo.id > a.corpo.id);
  await chamar("DELETE", "/analises/" + b.corpo.id);
});

test("banco: a busca trata % e _ como texto comum, e não como curingas", async () => {
  const c = await chamar("POST", "/analises", { url: "https://exemplo.com/50%25_off" });
  const porcento = await chamar("GET", "/analises?busca=" + encodeURIComponent("%"));
  assert.deepEqual(porcento.corpo.map((a) => a.id), [c.corpo.id]);
  const sublinhado = await chamar("GET", "/analises?busca=" + encodeURIComponent("_"));
  assert.deepEqual(sublinhado.corpo.map((a) => a.id), [c.corpo.id]);
  await chamar("DELETE", "/analises/" + c.corpo.id);
});

test("banco: o próprio banco recusa dados inválidos (CHECK e chave estrangeira)", async () => {
  const banco = await abrirBanco(arquivoBanco);
  banco.exec("PRAGMA foreign_keys = ON");
  assert.throws(() => banco.prepare(
    "INSERT INTO analises (url, protocolo, dominio, caminho, pontuacao, classificacao) VALUES ('x', 'http', 'x', '/', 150, 'Suspeita')").run(), /CHECK/);
  assert.throws(() => banco.prepare("INSERT INTO sinais (analise_id, texto, pontos) VALUES (9999, 'x', 5)").run(), /FOREIGN KEY/);
  banco.close();
});

test("persistência: os dados continuam no banco depois de reiniciar o servidor", async () => {
  const arquivo = arquivoTemporario("persistencia.db");
  const base = "http://localhost:3102";

  const primeiro = ligar(3102, arquivo);
  await primeiro.pronto;
  const criada = await chamar("POST", "/analises", { url: "http://192.168.0.10/login", observacao: "sobrevive" }, base);
  await desligar(primeiro);

  const segundo = ligar(3102, arquivo);
  await segundo.pronto;
  const lida = await chamar("GET", "/analises/" + criada.corpo.id, undefined, base);
  assert.equal(lida.status, 200);
  assert.equal(lida.corpo.observacao, "sobrevive");
  assert.equal(lida.corpo.signals.length, 3);
  await desligar(segundo);
});

test("erro de persistência: arquivo de banco inválido impede o servidor de subir, com mensagem clara", async () => {
  const arquivo = arquivoTemporario("quebrado.db");
  writeFileSync(arquivo, "isto não é um banco SQLite, é só texto");
  const proc = spawn(process.execPath, ["server/server.js"], { env: { ...process.env, PORT: "3103", DB_FILE: arquivo } });
  let erro = "";
  proc.stderr.on("data", (pedaco) => (erro += pedaco));
  const [codigo] = await once(proc, "exit");
  assert.equal(codigo, 1);
  assert.match(erro, /Não foi possível abrir o banco de dados/);
});

test("erro de persistência: falha do banco em funcionamento vira 500 genérico, sem vazar detalhes", async () => {
  const arquivo = arquivoTemporario("falha.db");
  const base = "http://localhost:3104";
  const servidor = ligar(3104, arquivo);
  await servidor.pronto;
  await chamar("POST", "/analises", { url: "https://a.com" }, base);

  const banco = await abrirBanco(arquivo);   // outra conexão apaga uma tabela "por baixo" da API
  banco.exec("DROP TABLE sinais");
  banco.close();

  const r = await chamar("GET", "/analises", undefined, base);
  assert.equal(r.status, 500);
  assert.equal(r.corpo.erro.codigo, "ERRO_BANCO");
  assert.ok(!/sinais|sqlite|no such table/i.test(r.corpo.erro.mensagem));
  await desligar(servidor);
});
