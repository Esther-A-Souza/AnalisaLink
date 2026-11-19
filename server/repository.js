// Persistência em arquivo JSON (db.json). Leitura e gravação síncronas,
// para que duas requisições não alterem o arquivo ao mesmo tempo.
import fs from "node:fs";

const ARQUIVO = process.env.DB_FILE || new URL("../db.json", import.meta.url);

export function carregar() {
  if (!fs.existsSync(ARQUIVO)) return { analises: [] };
  try {
    const dados = JSON.parse(fs.readFileSync(ARQUIVO, "utf-8"));
    return Array.isArray(dados.analises) ? dados : { analises: [] };
  } catch (erro) {
    throw new Error("Não foi possível ler o banco de dados (db.json).");
  }
}

export function salvar(bd) {
  fs.writeFileSync(ARQUIVO, JSON.stringify(bd, null, 2) + "\n");
}
