# Etapa 04 — Interatividade com JavaScript

## Objetivo

Adicionar comportamento dinâmico ao AnalisaLink utilizando JavaScript, transformando as interfaces anteriores em uma aplicação com interação, validação e atualização dinâmica de dados.

## Funcionalidades interativas

### 1. Análise e validação de URL

Na tela inicial, o usuário digita uma URL e clica em **Analisar**. O JavaScript intercepta o envio do formulário, valida a entrada com `analyzeUrl()`, verifica o protocolo, procura os sinais de atenção, calcula a pontuação, classifica o resultado com `classify()`, salva a análise no `localStorage` e redireciona para a página de resultado. Se a entrada for inválida, uma mensagem aparece abaixo do campo e some quando o usuário volta a digitar.

**Arquivos:** `src/tela-inicial.html`, `src/script.js` (`setupForm()`, `analyzeUrl()`, `classify()`, `getHistory()`, `saveHistory()`).

### 2. Exibição dinâmica do resultado

`resultado.html` lê o parâmetro `id` da URL, localiza a análise no `localStorage` e monta a página com três cards empilhados: informações da URL (com data), classificação (pontuação e classe) e sinais encontrados. Se não houver análise correspondente, é exibido um estado vazio com link para a tela inicial.

**Arquivos:** `src/resultado.html`, `src/script.js` (`renderResult()`).

### 3. Histórico com filtro, exclusão e limpeza

`historico.html` lista os registros salvos. O usuário pode filtrar por URL ou classificação (a lista atualiza a cada letra digitada), abrir os detalhes, excluir um registro ou limpar todo o histórico, sempre com confirmação. Um texto de contagem informa quantos registros estão sendo exibidos.

**Arquivos:** `src/historico.html`, `src/script.js` (`renderHistory()`, `setupHistory()`).

## Conceitos de programação utilizados

- Manipulação do DOM com `querySelector`, `textContent` e `innerHTML`;
- tratamento de eventos com `addEventListener` (`submit`, `input`, `click`), incluindo delegação de eventos na lista do histórico;
- funções para separar responsabilidades;
- arrays para o histórico e para os sinais encontrados;
- métodos de iteração `forEach`, `filter`, `map` e `find`;
- `localStorage` para persistência local;
- `URL` e `URLSearchParams`;
- estruturas condicionais;
- tratamento de exceções com `try/catch`;
- template strings para montar o HTML dinâmico, com a função `escapar()` para evitar que o texto digitado seja interpretado como HTML.

## Regras de análise

A função `analyzeUrl()` soma os pontos abaixo (máximo de 100):

| Sinal | Pontos |
|---|---|
| HTTP em vez de HTTPS | 15 |
| Caractere `@` | 25 |
| Endereço IP no lugar do domínio | 30 |
| URL com mais de 75 caracteres | 10 |
| Mais de 3 subdomínios | 15 |
| Cada palavra: `login`, `senha`, `conta`, `verify`, `urgente` | 10 |
| Extensão `.exe`, `.bat`, `.scr` ou `.apk` no caminho | 30 |

A função `classify()` define: 0–24 **Baixa atenção**, 25–49 **Atenção moderada**, 50–100 **Suspeita**.

## Validações implementadas

- Campo vazio;
- texto que não pode ser interpretado como URL (ex.: `exemplo.com`);
- protocolo diferente de HTTP/HTTPS (ex.: `ftp://`, `javascript:`).

## Situações inválidas tratadas

- `localStorage` com dados corrompidos: `getHistory()` devolve lista vazia;
- `localStorage` indisponível: `saveHistory()` devolve `false` e a tela mostra um aviso;
- resultado inexistente ou página de resultado aberta sem `id`: estado vazio com link para a tela inicial;
- histórico vazio e filtro sem resultados: mensagens diferentes;
- tentativa de limpar um histórico que já está vazio: aviso ao usuário;
- texto digitado com caracteres HTML: escapado por `escapar()` antes de ser exibido.

## Matriz de evidências

| Requisito | Funcionalidade relacionada | Arquivo(s) | Evidência |
|---|---|---|---|
| Manipulação do DOM | Resultado e histórico dinâmicos | `src/script.js` | `querySelector`, `textContent` e `innerHTML` em `renderResult()` e `renderHistory()` |
| Tratamento de eventos | Formulário, filtro e botões | `src/script.js` | `addEventListener` para `submit`, `input` e `click` em `setupForm()` e `setupHistory()` |
| Validação de formulários | Análise de URL | `src/tela-inicial.html`, `src/script.js` | `novalidate` no formulário; validação em `analyzeUrl()`; mensagem exibida em `setupForm()` |
| Alteração dinâmica da interface | Resultado, histórico e mensagens | `src/script.js` | `renderResult()`, `renderHistory()` e mensagem de erro no formulário |
| Uso de funções | Todas | `src/script.js` | `analyzeUrl()`, `classify()`, `getHistory()`, `saveHistory()`, `escapar()` |
| Uso de arrays | Histórico e sinais | `src/script.js` | lista do histórico (`getHistory()`) e array `sinais` em `analyzeUrl()` |
| Métodos de iteração | Pontuação, filtro e renderização | `src/script.js` | `forEach` (palavras, extensões, soma), `filter` (filtro e exclusão), `map` (cartões), `find` (busca por id) |
| Tratamento de situações inválidas | Validação e estados vazios | `src/script.js` | `try/catch` em `getHistory()`, `saveHistory()` e `analyzeUrl()`; mensagens e estados vazios |

## Evidências do funcionamento

As capturas de tela estão em `docs/evidencias/etapa-04/`:

- `01-validacao-url.png` — URL inválida e mensagem apresentada;
- `02-resultado-dinamico.png` — resultado de análise válida (ex.: `http://192.168.0.10/login`);
- `03-historico.png` — histórico com registros;
- `04-filtro.png` — filtro funcionando;
- `05-exclusao.png` — exclusão de registro;
- `06-historico-vazio.png` — estado sem registros.

## Instruções de execução e teste

1. Abra `src/tela-inicial.html` no navegador (de preferência com a extensão Live Server do VS Code).
2. Clique em **Analisar** com o campo vazio e depois digite `exemplo.com`: aparecem mensagens de erro.
3. Digite `http://192.168.0.10/login` e clique em **Analisar**: o resultado mostra 55/100, "Suspeita" e os sinais (HTTP, IP e a palavra `login`).
4. Digite `https://www.exemplo.com.br`: resultado "Baixa atenção", sem sinais.
5. Acesse **Histórico** e digite `login` ou `suspeita` no filtro.
6. Clique em **Ver detalhes** e depois em **Excluir** (confirmando no aviso).
7. Clique em **Limpar histórico** para apagar tudo e ver o estado vazio.
8. Abra `src/resultado.html?id=123`: aparece o estado vazio.


## Resultado da etapa

O AnalisaLink passou de uma interface estrutural para uma aplicação com comportamento dinâmico no navegador, integrando análise, validação, resultados e gerenciamento do histórico local.

**Tag da entrega:** `etapa-04`
