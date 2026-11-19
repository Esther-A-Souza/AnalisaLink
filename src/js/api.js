// Comunicação com a API REST do projeto (server/).

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
  if (!resposta.ok) {
    let mensagem = "O servidor respondeu com erro " + resposta.status + ".";
    try {
      const corpo = await resposta.json();
      if (corpo.erro) mensagem = corpo.erro.mensagem;   // mensagem enviada pela API
    } catch (erro) {
      // resposta sem JSON: mantém a mensagem padrão
    }
    throw new Error(mensagem);
  }
  if (resposta.status === 204) return null;             // DELETE responde sem corpo
  return resposta.json();
}

// CONSULTA: lista as análises (mais recentes primeiro)
export function listarAnalises() {
  return requisicao(URL_API);   // a API já devolve os mais recentes primeiro
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
