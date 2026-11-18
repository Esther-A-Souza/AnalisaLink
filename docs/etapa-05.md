# Etapa 05 — Modularização e comunicação assíncrona

## O que foi feito

- **Módulos** (`src/js/`): `analyzer.js` (regras de análise), `api.js` (chamadas `fetch`) e `main.js` (código das páginas), ligados com `export` e `import`. O antigo `script.js` foi dividido nesses arquivos.
- **Serviço simulado:** `json-server` com o arquivo `db.json` (`npm run api`, em `http://localhost:3000/analises`, com atraso de 800 ms para o carregamento ficar visível). Ele substitui o `localStorage`.
- **Fetch com async/await:** `listarAnalises()`, `buscarAnalise()`, `criarAnalise()` e `excluirAnalise()` em `api.js`.
- A interface (HTML e CSS) não mudou; só o script das páginas agora é `js/main.js`.

## Como demonstrar

| O que mostrar | Como | Onde está no código |
|---|---|---|
| Consulta | Abrir o **Histórico** (lista vinda do servidor) e o **Resultado** | `listarAnalises()` e `buscarAnalise()` (GET) |
| Operação enviada ao servidor | Digitar uma URL e clicar em **Analisar**; ou **Excluir** / **Limpar histórico** | `criarAnalise()` (POST) e `excluirAnalise()` (DELETE) |
| Carregamento | "Carregando histórico...", "Carregando resultado...", "Analisando...", "Excluindo...", "Apagando histórico..." | `main.js` |
| Sucesso | Redirecionamento ao resultado; lista atualizada | `main.js` |
| Erro | Parar a API (Ctrl+C) e abrir o Histórico ou analisar uma URL: "Não foi possível conectar ao servidor..." | `api.js` (`catch` do `fetch` e `resposta.ok`) |

## Executar

1. `npm install` e `npm run api` em um terminal.
2. Abrir `src/tela-inicial.html` com o Live Server.
