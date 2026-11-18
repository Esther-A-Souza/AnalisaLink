// Comunicação com o servidor simulado (json-server).

const URL_API = "http://localhost:3000/analises";

async function requisicao(url, opcoes) {
  let resposta;
  try {
    resposta = await fetch(url, opcoes);
  } catch (erro) {
    // fetch só falha aqui quando não consegue falar com o servidor
    throw new Error("Não foi possível conectar ao servidor. Verifique se a API está ligada (npm run api).");
  }
  // fetch NÃO falha em 404 ou 500: precisamos olhar resposta.ok
  if (resposta.status === 404) {
    throw new Error("Análise não encontrada no servidor.");
  }
  if (!resposta.ok) {
    throw new Error("O servidor respondeu com erro " + resposta.status + ".");
  }
  return resposta.json();
}

// CONSULTA: lista as análises (mais recentes primeiro)
export function listarAnalises() {
  return requisicao(URL_API + "?_sort=id&_order=desc");
}

// CONSULTA: busca uma análise pelo id
export function buscarAnalise(id) {
  return requisicao(URL_API + "/" + encodeURIComponent(id));
}

// ENVIO: salva uma nova análise (POST)
export function criarAnalise(analise) {
  return requisicao(URL_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(analise)
  });
}

// ENVIO: exclui uma análise (DELETE)
export function excluirAnalise(id) {
  return requisicao(URL_API + "/" + encodeURIComponent(id), { method: "DELETE" });
}
