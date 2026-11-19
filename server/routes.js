// Tabela de rotas: método HTTP + caminho -> função que trata a requisição.
import { raiz, listar, buscar, criar, substituir, atualizar, excluir } from "./controller.js";

export const rotas = [
  { metodo: "GET",    caminho: "/",             funcao: raiz },
  { metodo: "GET",    caminho: "/analises",     funcao: listar },
  { metodo: "GET",    caminho: "/analises/:id", funcao: buscar },
  { metodo: "POST",   caminho: "/analises",     funcao: criar },
  { metodo: "PUT",    caminho: "/analises/:id", funcao: substituir },
  { metodo: "PATCH",  caminho: "/analises/:id", funcao: atualizar },
  { metodo: "DELETE", caminho: "/analises/:id", funcao: excluir }
];
