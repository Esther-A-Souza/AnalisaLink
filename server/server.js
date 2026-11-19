// Servidor HTTP da API (Node.js, sem dependências externas).
// Uso: npm start   |   npm run api (com atraso de 800 ms, para demonstrar o "carregando")
import http from "node:http";
import { rotas } from "./routes.js";
import { ErroHttp } from "./erros.js";

const PORTA = Number(process.env.PORT) || 3000;
const LIMITE_CORPO = 100 * 1024; // 100 KB

// Atraso opcional: node server/server.js --delay 800
function lerAtraso(args) {
  const posicao = args.indexOf("--delay");
  const valor = posicao >= 0 ? Number(args[posicao + 1]) : 0;
  return Number.isFinite(valor) && valor > 0 ? valor : 0;
}
const ATRASO = lerAtraso(process.argv);

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Expose-Headers", "Location");
}

function enviar(res, status, corpo, headers = {}) {
  if (status === 204) {
    res.writeHead(204, headers);
    return res.end();
  }
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  res.end(JSON.stringify(corpo));
}

// Lê o corpo da requisição e converte o JSON.
function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let texto = "";
    let tamanho = 0;
    let grande = false;

    req.on("data", (pedaco) => {
      tamanho += pedaco.length;
      if (tamanho > LIMITE_CORPO) grande = true;
      else texto += pedaco;
    });
    req.on("end", () => {
      if (grande) return reject(new ErroHttp(413, "CORPO_GRANDE", "O corpo da requisição excede 100 KB."));
      if (texto.trim() === "") return resolve(undefined);
      if (!(req.headers["content-type"] || "").includes("application/json")) {
        return reject(new ErroHttp(415, "TIPO_NAO_SUPORTADO", "Envie o corpo com o cabeçalho Content-Type: application/json."));
      }
      try {
        resolve(JSON.parse(texto));
      } catch (erro) {
        reject(new ErroHttp(400, "JSON_INVALIDO", "O corpo da requisição não é um JSON válido."));
      }
    });
    req.on("error", reject);
  });
}

// Compara "/analises/:id" com "/analises/5" e devolve { id: "5" } (ou null se não combinar).
function casar(padrao, caminho) {
  const a = padrao.split("/");
  const b = caminho.split("/");
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

function procurarRota(metodo, caminho) {
  const permitidos = [];
  for (const rota of rotas) {
    const params = casar(rota.caminho, caminho);
    if (!params) continue;
    if (rota.metodo === metodo) return { rota, params };
    permitidos.push(rota.metodo);
  }
  return { permitidos };
}

const servidor = http.createServer(async (req, res) => {
  cors(res);
  try {
    if (req.method === "OPTIONS") return enviar(res, 204);   // pré-requisição CORS

    const url = new URL(req.url, "http://localhost");
    const caminho = url.pathname.replace(/\/+$/, "") || "/";
    const achou = procurarRota(req.method, caminho);

    if (!achou.rota) {
      if (achou.permitidos.length > 0) {
        throw new ErroHttp(405, "METODO_NAO_PERMITIDO",
          "O método " + req.method + " não é permitido em " + caminho + ".", undefined,
          { Allow: achou.permitidos.join(", ") });
      }
      throw new ErroHttp(404, "ROTA_NAO_ENCONTRADA", "A rota " + req.method + " " + caminho + " não existe.");
    }

    const body = ["POST", "PUT", "PATCH"].includes(req.method) ? await lerCorpo(req) : undefined;
    if (ATRASO > 0) await new Promise((r) => setTimeout(r, ATRASO));

    const resultado = achou.rota.funcao({ params: achou.params, query: Object.fromEntries(url.searchParams), body });
    enviar(res, resultado.status, resultado.corpo, resultado.headers);
  } catch (erro) {
    if (erro instanceof ErroHttp) {
      const corpo = { erro: { status: erro.status, codigo: erro.codigo, mensagem: erro.message } };
      if (erro.detalhes) corpo.erro.detalhes = erro.detalhes;
      return enviar(res, erro.status, corpo, erro.headers);
    }
    console.error(erro);
    enviar(res, 500, { erro: { status: 500, codigo: "ERRO_INTERNO", mensagem: "Erro interno do servidor." } });
  }
});

servidor.listen(PORTA, () => {
  console.log("API AnalisaLink rodando em http://localhost:" + PORTA + (ATRASO ? " (atraso de " + ATRASO + " ms)" : ""));
});
