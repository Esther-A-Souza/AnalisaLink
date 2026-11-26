// Conexão com o banco SQLite. É o único arquivo que sabe ONDE o banco está e COMO abri-lo.
import { mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// node:sqlite vem com o Node.js (a partir da versão 22.13), sem instalar nada.
let DatabaseSync;
try {
  ({ DatabaseSync } = await import("node:sqlite"));
} catch (erro) {
  console.error("Este projeto usa o módulo node:sqlite, disponível a partir do Node.js 22.13.");
  console.error("Versão encontrada: " + process.version + ". Instale uma versão mais nova em nodejs.org.");
  process.exit(1);
}

export const arquivoDoBanco = process.env.DB_FILE || fileURLToPath(new URL("../../data/analisalink.db", import.meta.url));
const SCHEMA = readFileSync(new URL("./schema.sql", import.meta.url), "utf-8");

function abrir() {
  try {
    mkdirSync(dirname(arquivoDoBanco), { recursive: true });
    const conexao = new DatabaseSync(arquivoDoBanco);
    conexao.exec("PRAGMA foreign_keys = ON");   // sem isso o SQLite ignora as chaves estrangeiras
    conexao.exec(SCHEMA);                       // cria as tabelas se ainda não existirem
    return conexao;
  } catch (erro) {
    console.error("Não foi possível abrir o banco de dados em " + arquivoDoBanco);
    console.error("Motivo: " + erro.message);
    process.exit(1);
  }
}

export const db = abrir();

// Executa várias alterações como uma só: ou todas acontecem, ou nenhuma (ROLLBACK).
export function transacao(operacao) {
  db.exec("BEGIN");
  try {
    const resultado = operacao();
    db.exec("COMMIT");
    return resultado;
  } catch (erro) {
    db.exec("ROLLBACK");
    throw erro;
  }
}
