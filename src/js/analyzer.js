// Regras de análise (módulo). Não depende da página nem do servidor.

export function classify(pontos) {
  if (pontos >= 50) return "Suspeita";
  if (pontos >= 25) return "Atenção moderada";
  return "Baixa atenção";
}


export function analyzeUrl(texto) {
  if (texto === "") {
    return { valid: false, message: "Digite uma URL para analisar." };
  }

  let url;
  try {
    url = new URL(texto);
  } catch (erro) {
    return { valid: false, message: "URL inválida. Use o formato completo, como https://exemplo.com" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { valid: false, message: "Use uma URL que comece com http:// ou https://" };
  }

  const sinais = []; 
  const minusculo = texto.toLowerCase();
  const ehIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(url.hostname);

  if (url.protocol === "http:") {
    sinais.push({ texto: "Usa HTTP em vez de HTTPS.", pontos: 15 });
  }
  if (texto.includes("@")) {
    sinais.push({ texto: "Contém o caractere @.", pontos: 25 });
  }
  if (ehIp) {
    sinais.push({ texto: "Usa um endereço IP no lugar de um domínio.", pontos: 30 });
  }
  if (texto.length > 75) {
    sinais.push({ texto: "A URL é muito longa.", pontos: 10 });
  }
  if (!ehIp && url.hostname.split(".").length - 2 > 3) {
    sinais.push({ texto: "Tem subdomínios em excesso.", pontos: 15 });
  }
  ["login", "senha", "conta", "verify", "urgente"].forEach(function (palavra) {
    if (minusculo.includes(palavra)) {
      sinais.push({ texto: 'Contém a palavra "' + palavra + '".', pontos: 10 });
    }
  });
  [".exe", ".bat", ".scr", ".apk"].forEach(function (extensao) {
    if (url.pathname.toLowerCase().endsWith(extensao)) {
      sinais.push({ texto: 'Aponta para um arquivo "' + extensao + '".', pontos: 30 });
    }
  });

  let pontos = 0;
  sinais.forEach(function (sinal) {
    pontos += sinal.pontos;
  });
  pontos = Math.min(pontos, 100);

  return {
    valid: true,
    url: texto,
    protocol: url.protocol.replace(":", ""),
    domain: url.hostname,
    path: url.pathname + url.search + url.hash,
    score: pontos,
    classification: classify(pontos),
    signals: sinais
  };
}


export function escapar(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
