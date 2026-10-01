
const CHAVE = "analisalink-historico";

//localStorage
function getHistory() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE));
    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    return []; 
  }
}

function saveHistory(lista) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
    return true;
  } catch (erro) {
    return false;
  }
}

//Análise

function classify(pontos) {
  if (pontos >= 50) return "Suspeita";
  if (pontos >= 25) return "Atenção moderada";
  return "Baixa atenção";
}


function analyzeUrl(texto) {
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


function escapar(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

//Tela inicial

function setupForm() {
  const form = document.querySelector("#form-url");
  if (!form) return;

  const campo = document.querySelector("#url-user");
  const mensagem = document.querySelector("#mensagem");

  campo.addEventListener("input", function () {
    mensagem.textContent = "";
    mensagem.className = "";
  });

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const analise = analyzeUrl(campo.value.trim());
    if (!analise.valid) {
      mensagem.textContent = analise.message;
      mensagem.className = "notice";
      campo.focus();
      return;
    }

    analise.id = Date.now().toString();
    analise.date = new Date().toLocaleString("pt-BR");

    const historico = getHistory();
    historico.unshift(analise);
    if (!saveHistory(historico)) {
      mensagem.textContent = "Não foi possível salvar a análise neste navegador.";
      mensagem.className = "notice";
      return;
    }
    window.location.href = "resultado.html?id=" + analise.id;
  });
}

//Resultado

function renderResult() {
  const alvo = document.querySelector("#resultado");
  if (!alvo) return;

  const id = new URLSearchParams(window.location.search).get("id");
  const a = getHistory().find(function (item) {
    return item.id === id;
  });

  if (!a) {
    alvo.innerHTML =
      '<div class="empty"><h2>Nenhuma análise selecionada</h2>' +
      "<p>Analise uma URL na página inicial ou escolha uma análise no histórico.</p>" +
      '<a class="button" href="tela-inicial.html">Analisar uma URL</a></div>';
    return;
  }

  const itens = a.signals.length === 0
    ? "<li>Nenhum sinal de atenção foi encontrado.</li>"
    : a.signals.map(function (s) {
        return "<li>" + escapar(s.texto) + " (+" + escapar(s.pontos) + ")</li>";
      }).join("");

      alvo.innerHTML = `
    <h2>Resultado da análise</h2>

    <div style="display: grid; gap: 20px;">
      <article class="history-item">
        <h3>Informações da URL</h3>
        <p><strong>URL analisada:</strong> ${escapar(a.url)}</p>
        <p><strong>Protocolo:</strong> ${escapar(a.protocol)}</p>
        <p><strong>Domínio:</strong> ${escapar(a.domain)}</p>
        <p><strong>Caminho:</strong> ${escapar(a.path)}</p>
        <p><strong>Data:</strong> ${escapar(a.date)}</p>
      </article>

      <article class="history-item">
        <h3>Classificação</h3>
        <p><strong>Pontuação de atenção:</strong> ${escapar(a.score)}/100</p>
        <p><strong>Classificação:</strong> ${escapar(a.classification)}</p>
      </article>

      <article class="history-item">
        <h3>Sinais encontrados</h3>
        <ul>${itens}</ul>
      </article>
    </div>

    <p class="notice" style="margin-top: 20px;">Este é apenas um resultado demonstrativo: não garante que a URL seja segura ou maliciosa.</p>`;
}

//Histórico

function renderHistory() {
  const lista = document.querySelector("#lista");
  if (!lista) return;

  const filtro = document.querySelector("#filtro").value.trim().toLowerCase();
  const contagem = document.querySelector("#contagem");
  const todas = getHistory();

  const visiveis = todas.filter(function (a) {
    return (a.url + " " + a.classification).toLowerCase().includes(filtro);
  });

  if (todas.length === 0) {
    contagem.textContent = "O histórico está vazio.";
  } else if (visiveis.length === 0) {
    contagem.textContent = "Nenhuma análise corresponde ao filtro.";
  } else {
    contagem.textContent = "Exibindo " + visiveis.length + " de " + todas.length + " análise(s).";
  }

  lista.innerHTML = visiveis.map(function (a) {
    return `
      <article class="history-item">
        <h3>${escapar(a.url)}</h3>
        <p><strong>Data:</strong> ${escapar(a.date)}</p>
        <p><strong>Pontuação:</strong> ${escapar(a.score)}/100</p>
        <p><strong>Classificação:</strong> ${escapar(a.classification)}</p>
        <div class="history-actions">
  <a class="button" href="resultado.html?id=${encodeURIComponent(a.id)}">Ver detalhes</a>
  <button type="button" data-id="${escapar(a.id)}">Excluir</button>
</div>
      </article>`;
  }).join("");
}

function setupHistory() {
  const lista = document.querySelector("#lista");
  if (!lista) return;

  document.querySelector("#filtro").addEventListener("input", renderHistory);

  
  lista.addEventListener("click", function (evento) {
    const botao = evento.target.closest("button[data-id]");
    if (!botao) return;
    if (!window.confirm("Excluir esta análise?")) return;
    saveHistory(getHistory().filter(function (a) {
      return a.id !== botao.dataset.id;
    }));
    renderHistory();
  });

  document.querySelector("#limpar").addEventListener("click", function () {
    if (getHistory().length === 0) {
      alert("O histórico já está vazio.");
      return;
    }
    if (window.confirm("Deseja apagar todo o histórico?")) {
      saveHistory([]);
      renderHistory();
    }
  });

  renderHistory();
}

//Início

setupForm();
renderResult();
setupHistory();
