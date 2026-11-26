// Insere análises de exemplo (somente se o banco estiver vazio). Uso: npm run db:exemplo
import { analyzeUrl } from "../../src/js/analyzer.js";
import { listar, criar } from "../repository.js";

if (listar().length > 0) {
  console.log("O banco já tem dados; nada foi inserido.");
} else {
  for (const url of ["http://192.168.0.10/login", "https://www.exemplo.com.br", "http://banco@site-falso.com/conta/verify"]) {
    const { valid, message, ...dados } = analyzeUrl(url);
    const analise = criar({ ...dados, observacao: "" });
    console.log("Inserida #" + analise.id + ": " + analise.url + " (" + analise.score + ", " + analise.classification + ")");
  }
}
