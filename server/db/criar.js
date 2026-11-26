// Cria o banco e as tabelas (se ainda não existirem). Uso: npm run db:criar
import { arquivoDoBanco, db } from "./conexao.js";

const tabelas = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
console.log("Banco pronto em: " + arquivoDoBanco);
console.log("Tabelas: " + tabelas.map((t) => t.name).join(", "));
