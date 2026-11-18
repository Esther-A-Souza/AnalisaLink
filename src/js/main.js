import { analyzeUrl, escapar } from "./analyzer.js";
import { listarAnalises, buscarAnalise, criarAnalise, excluirAnalise } from "./api.js";

//Tela inicial

function setupForm() {
  const form = document.querySelector("#form-url");
  if (!form) return;

  const campo = document.querySelector("#url-user");
  const mensagem = document.querySelector("#mensagem");
  const botao = form.querySelector("button");

  campo.addEventListener("input", function () {
    mensagem.textContent = "";
    mensagem.className = "";
  });

  form.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const analise = analyzeUrl(campo.value.trim());
    if (!analise.valid) {
      mensagem.textContent = analise.message;
      mensagem.className = "notice";
      campo.focus();
      return;
    }

    analise.date = new Date().toLocaleString("pt-BR");

    // Carregando
    botao.disabled = true;
    botao.textContent = "Analisando...";
    mensagem.textContent = "Enviando a análise ao servidor...";
    mensagem.className = "notice";

    try {
      const salva = await criarAnalise(analise);                // o servidor gera o id
      window.location.href = "resultado.html?id=" + salva.id;   // sucesso
    } catch (erro) {
      mensagem.textContent = erro.message;                      // erro
      mensagem.className = "notice";
      botao.disabled = false;
      botao.textContent = "Analisar";
    }
  });
}

//Resultado

async function renderResult() {
  const alvo = document.querySelector("#resultado");
  if (!alvo) return;

  const id = new URLSearchParams(window.location.search).get("id");

  if (!id) {
    alvo.innerHTML =
      '<div class="empty"><h2>Nenhuma análise selecionada</h2>' +
      "<p>Analise uma URL na página inicial ou escolha uma análise no histórico.</p>" +
      '<a class="button" href="tela-inicial.html">Analisar uma URL</a></div>';
    return;
  }

  alvo.innerHTML = '<p class="notice">Carregando resultado...</p>';   // carregando

  try {
    const a = await buscarAnalise(id);                                // sucesso

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
  } catch (erro) {
    alvo.innerHTML =                                                  // erro
      '<div class="empty"><h2>Não foi possível carregar o resultado</h2>' +
      "<p>" + escapar(erro.message) + "</p>" +
      '<a class="button" href="tela-inicial.html">Analisar uma URL</a></div>';
  }
}

//Histórico

let todas = []; // análises recebidas do servidor

// Desenha a lista na tela (aplica o filtro; não fala com o servidor)
function renderHistory() {
  const lista = document.querySelector("#lista");
  const contagem = document.querySelector("#contagem");
  const filtro = document.querySelector("#filtro").value.trim().toLowerCase();

  const visiveis = todas.filter(function (a) {
    return (a.url + " " + a.classification).toLowerCase().includes(filtro);
  });

  contagem.className = "";
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

// Busca as análises no servidor e desenha a lista
async function carregarHistorico() {
  const lista = document.querySelector("#lista");
  const contagem = document.querySelector("#contagem");

  lista.innerHTML = "";
  contagem.textContent = "Carregando histórico...";   // carregando
  contagem.className = "notice";

  try {
    todas = await listarAnalises();                   // sucesso
    renderHistory();
  } catch (erro) {
    todas = [];
    contagem.textContent = erro.message;              // erro
    contagem.className = "notice";
  }
}

function setupHistory() {
  const lista = document.querySelector("#lista");
  if (!lista) return;

  const contagem = document.querySelector("#contagem");

  document.querySelector("#filtro").addEventListener("input", renderHistory);

  lista.addEventListener("click", async function (evento) {
    const botao = evento.target.closest("button[data-id]");
    if (!botao) return;
    if (!window.confirm("Excluir esta análise?")) return;

    botao.disabled = true;
    botao.textContent = "Excluindo...";
    try {
      await excluirAnalise(botao.dataset.id);
      await carregarHistorico();
    } catch (erro) {
      contagem.textContent = erro.message;
      contagem.className = "notice";
      botao.disabled = false;
      botao.textContent = "Excluir";
    }
  });

  document.querySelector("#limpar").addEventListener("click", async function () {
    if (todas.length === 0) {
      alert("O histórico já está vazio.");
      return;
    }
    if (!window.confirm("Deseja apagar todo o histórico?")) return;

    contagem.textContent = "Apagando histórico...";
    contagem.className = "notice";
    try {
      await Promise.all(todas.map(function (a) {
        return excluirAnalise(a.id);
      }));
      await carregarHistorico();
    } catch (erro) {
      contagem.textContent = erro.message;
      contagem.className = "notice";
    }
  });

  carregarHistorico();
}

//Início

setupForm();
renderResult();
setupHistory();
