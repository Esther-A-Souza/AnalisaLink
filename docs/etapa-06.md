# Etapa 06 — API REST da aplicação

## Visão geral

O AnalisaLink agora tem um servidor próprio. A API foi feita em **Node.js** (módulo `http`, sem dependências externas) e disponibiliza o recurso principal **análises** em JSON. Ela substitui o `json-server` da Etapa 5 e usa a mesma porta (`3000`) e as mesmas rotas, então o front-end continua funcionando.

As regras de análise (`analyzeUrl`) são as mesmas do front-end: o servidor importa `src/js/analyzer.js`. Ao criar ou alterar uma análise, **o servidor calcula** protocolo, domínio, caminho, pontuação, classificação e sinais, e não confia em valores enviados pelo cliente.

## Como executar

Requisito: Node.js 18 ou superior. Não há dependências, então **não é preciso rodar `npm install`**.

```bash
npm start        # API em http://localhost:3000
npm run api      # igual, com atraso de 800 ms (para demonstrar o "carregando" no front-end)
npm test         # 17 testes automáticos (usam outra porta e um banco temporário)
```

Os dados ficam no arquivo `db.json`. Para usar o front-end, abra `src/tela-inicial.html` com o Live Server.

## Estrutura

```text
server/
├── server.js       # servidor HTTP: CORS, leitura do JSON, despacho das rotas, tratamento de erros
├── routes.js       # tabela de rotas (método + caminho -> função)
├── controller.js   # regras e validações de cada operação
├── repository.js   # leitura e gravação do db.json
└── erros.js        # classe ErroHttp (status, código, mensagem)
tests/api.test.js   # testes automáticos
docs/postman/       # coleção do Postman/Insomnia
```

## Recurso: análise

| Campo | Tipo | Quem define | Descrição |
|---|---|---|---|
| `id` | inteiro | servidor | Identificador gerado automaticamente |
| `url` | texto | **cliente** | URL analisada (obrigatória; só `http` ou `https`) |
| `observacao` | texto | **cliente** | Anotação opcional (até 200 caracteres) |
| `protocol`, `domain`, `path` | texto | servidor | Partes da URL |
| `score` | inteiro | servidor | Pontuação de atenção (0 a 100) |
| `classification` | texto | servidor | `Baixa atenção`, `Atenção moderada` ou `Suspeita` |
| `signals` | lista | servidor | Sinais encontrados, cada um com `texto` e `pontos` |
| `date` | texto | servidor | Data e hora da criação |
| `atualizadoEm` | texto | servidor | Data e hora da última alteração (só aparece após PUT ou PATCH) |

Campos calculados enviados pelo cliente são **ignorados**.

## Endpoints

| Método | Rota | Operação | Sucesso |
|---|---|---|---|
| GET | `/analises` | Listar (com filtros opcionais) | `200 OK` |
| GET | `/analises/:id` | Consultar uma análise | `200 OK` |
| POST | `/analises` | Criar | `201 Created` + cabeçalho `Location` |
| PUT | `/analises/:id` | Substituir `url` e `observacao` (obrigatório enviar `url`) | `200 OK` |
| PATCH | `/analises/:id` | Alterar só o que for enviado (`url` e/ou `observacao`) | `200 OK` |
| DELETE | `/analises/:id` | Excluir | `204 No Content` (sem corpo) |
| GET | `/` | Informações da API | `200 OK` |

Parâmetros de consulta do `GET /analises` (todos opcionais): `busca` (texto contido na URL ou na classificação), `classificacao` (valor exato) e `ordem` (`desc`, padrão, ou `asc`, por `id`).

## Validações

| Entrada | Regra | Resposta se falhar |
|---|---|---|
| Corpo (POST, PUT, PATCH) | Deve ser JSON (`Content-Type: application/json`) e um objeto | `400` (`JSON_INVALIDO`, `CORPO_INVALIDO`) ou `415` |
| Corpo | No máximo 100 KB | `413` |
| `url` | Obrigatória no POST e no PUT; texto não vazio; URL válida; apenas `http://` ou `https://` | `400` `VALIDACAO` |
| `observacao` | Se enviada, texto de até 200 caracteres | `400` `VALIDACAO` |
| PATCH | Pelo menos um entre `url` e `observacao` | `400` `VALIDACAO` |
| `:id` | Inteiro positivo | `400` `ID_INVALIDO` |
| `classificacao`, `ordem` | Valores permitidos | `400` `VALIDACAO` |

## Códigos HTTP usados

| Código | Quando |
|---|---|
| 200 OK | Consulta, PUT e PATCH bem-sucedidos |
| 201 Created | Análise criada |
| 204 No Content | Análise excluída |
| 400 Bad Request | JSON inválido, dados inválidos, id inválido, parâmetros inválidos |
| 404 Not Found | Análise ou rota inexistente |
| 405 Method Not Allowed | Método não aceito na rota (com o cabeçalho `Allow`) |
| 413 Payload Too Large | Corpo maior que 100 KB |
| 415 Unsupported Media Type | Corpo enviado sem `Content-Type: application/json` |
| 500 Internal Server Error | Falha inesperada no servidor |

## Formato padrão dos erros

Todos os erros têm a mesma estrutura:

```json
{
  "erro": {
    "status": 400,
    "codigo": "VALIDACAO",
    "mensagem": "Dados inválidos.",
    "detalhes": [ { "campo": "url", "mensagem": "..." } ]
  }
}
```

`detalhes` aparece apenas nos erros de validação.

## Exemplos de requisição e resposta

Os exemplos abaixo foram gerados executando a API de verdade, começando com o banco vazio. Eles estão em ordem: cada um depende dos anteriores. No Windows (CMD), troque as aspas do `-d` por aspas duplas escapadas (`-d "{\"url\":\"https://exemplo.com\"}"`) ou use a coleção do Postman.

### Criar uma análise (POST)

**Requisição**

```bash
curl -i -X POST http://localhost:3000/analises -H "Content-Type: application/json" -d '{"url": "http://192.168.0.10/login", "observacao": "Recebido por e-mail"}'
```

**Resposta**

```http
HTTP/1.1 201 Created
Location: /analises/1
Content-Type: application/json; charset=utf-8

{
  "id": 1,
  "url": "http://192.168.0.10/login",
  "protocol": "http",
  "domain": "192.168.0.10",
  "path": "/login",
  "score": 55,
  "classification": "Suspeita",
  "signals": [
    {
      "texto": "Usa HTTP em vez de HTTPS.",
      "pontos": 15
    },
    {
      "texto": "Usa um endereço IP no lugar de um domínio.",
      "pontos": 30
    },
    {
      "texto": "Contém a palavra \"login\".",
      "pontos": 10
    }
  ],
  "observacao": "Recebido por e-mail",
  "date": "18/11/2026, 19:58:41"
}
```

### Criar outra análise (POST)

**Requisição**

```bash
curl -i -X POST http://localhost:3000/analises -H "Content-Type: application/json" -d '{"url": "https://www.exemplo.com.br"}'
```

**Resposta**

```http
HTTP/1.1 201 Created
Location: /analises/2
Content-Type: application/json; charset=utf-8

{
  "id": 2,
  "url": "https://www.exemplo.com.br",
  "protocol": "https",
  "domain": "www.exemplo.com.br",
  "path": "/",
  "score": 0,
  "classification": "Baixa atenção",
  "signals": [],
  "observacao": "",
  "date": "18/11/2026, 19:58:41"
}
```

### Listar todas (GET)

**Requisição**

```bash
curl -i -X GET http://localhost:3000/analises
```

**Resposta**

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

[
  {
    "id": 2,
    "url": "https://www.exemplo.com.br",
    "protocol": "https",
    "domain": "www.exemplo.com.br",
    "path": "/",
    "score": 0,
    "classification": "Baixa atenção",
    "signals": [],
    "observacao": "",
    "date": "18/11/2026, 19:58:41"
  },
  {
    "id": 1,
    "url": "http://192.168.0.10/login",
    "protocol": "http",
    "domain": "192.168.0.10",
    "path": "/login",
    "score": 55,
    "classification": "Suspeita",
    "signals": [
      {
        "texto": "Usa HTTP em vez de HTTPS.",
        "pontos": 15
      },
      {
        "texto": "Usa um endereço IP no lugar de um domínio.",
        "pontos": 30
      },
      {
        "texto": "Contém a palavra \"login\".",
        "pontos": 10
      }
    ],
    "observacao": "Recebido por e-mail",
    "date": "18/11/2026, 19:58:41"
  }
]
```

### Listar com filtros (GET)

**Requisição**

```bash
curl -i -X GET 'http://localhost:3000/analises?classificacao=Suspeita&busca=login&ordem=asc'
```

**Resposta**

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

[
  {
    "id": 1,
    "url": "http://192.168.0.10/login",
    "protocol": "http",
    "domain": "192.168.0.10",
    "path": "/login",
    "score": 55,
    "classification": "Suspeita",
    "signals": [
      {
        "texto": "Usa HTTP em vez de HTTPS.",
        "pontos": 15
      },
      {
        "texto": "Usa um endereço IP no lugar de um domínio.",
        "pontos": 30
      },
      {
        "texto": "Contém a palavra \"login\".",
        "pontos": 10
      }
    ],
    "observacao": "Recebido por e-mail",
    "date": "18/11/2026, 19:58:41"
  }
]
```

### Consultar uma análise (GET)

**Requisição**

```bash
curl -i -X GET http://localhost:3000/analises/1
```

**Resposta**

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "id": 1,
  "url": "http://192.168.0.10/login",
  "protocol": "http",
  "domain": "192.168.0.10",
  "path": "/login",
  "score": 55,
  "classification": "Suspeita",
  "signals": [
    {
      "texto": "Usa HTTP em vez de HTTPS.",
      "pontos": 15
    },
    {
      "texto": "Usa um endereço IP no lugar de um domínio.",
      "pontos": 30
    },
    {
      "texto": "Contém a palavra \"login\".",
      "pontos": 10
    }
  ],
  "observacao": "Recebido por e-mail",
  "date": "18/11/2026, 19:58:41"
}
```

### Substituir (PUT)

**Requisição**

```bash
curl -i -X PUT http://localhost:3000/analises/1 -H "Content-Type: application/json" -d '{"url": "http://banco@site-falso.com/conta/verify", "observacao": "URL corrigida"}'
```

**Resposta**

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "id": 1,
  "url": "http://banco@site-falso.com/conta/verify",
  "protocol": "http",
  "domain": "site-falso.com",
  "path": "/conta/verify",
  "score": 60,
  "classification": "Suspeita",
  "signals": [
    {
      "texto": "Usa HTTP em vez de HTTPS.",
      "pontos": 15
    },
    {
      "texto": "Contém o caractere @.",
      "pontos": 25
    },
    {
      "texto": "Contém a palavra \"conta\".",
      "pontos": 10
    },
    {
      "texto": "Contém a palavra \"verify\".",
      "pontos": 10
    }
  ],
  "observacao": "URL corrigida",
  "date": "18/11/2026, 19:58:41",
  "atualizadoEm": "18/11/2026, 19:58:41"
}
```

### Alterar parcialmente (PATCH)

**Requisição**

```bash
curl -i -X PATCH http://localhost:3000/analises/1 -H "Content-Type: application/json" -d '{"observacao": "Confirmado como golpe"}'
```

**Resposta**

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "id": 1,
  "url": "http://banco@site-falso.com/conta/verify",
  "protocol": "http",
  "domain": "site-falso.com",
  "path": "/conta/verify",
  "score": 60,
  "classification": "Suspeita",
  "signals": [
    {
      "texto": "Usa HTTP em vez de HTTPS.",
      "pontos": 15
    },
    {
      "texto": "Contém o caractere @.",
      "pontos": 25
    },
    {
      "texto": "Contém a palavra \"conta\".",
      "pontos": 10
    },
    {
      "texto": "Contém a palavra \"verify\".",
      "pontos": 10
    }
  ],
  "observacao": "Confirmado como golpe",
  "date": "18/11/2026, 19:58:41",
  "atualizadoEm": "18/11/2026, 19:58:41"
}
```

### Excluir (DELETE)

**Requisição**

```bash
curl -i -X DELETE http://localhost:3000/analises/2
```

**Resposta**

```http
HTTP/1.1 204 No Content
```

### Erros

### Erro: URL inválida (400)

**Requisição**

```bash
curl -i -X POST http://localhost:3000/analises -H "Content-Type: application/json" -d '{"url": "exemplo.com"}'
```

**Resposta**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{
  "erro": {
    "status": 400,
    "codigo": "VALIDACAO",
    "mensagem": "Dados inválidos.",
    "detalhes": [
      {
        "campo": "url",
        "mensagem": "URL inválida. Use o formato completo, como https://exemplo.com"
      }
    ]
  }
}
```

### Erro: JSON malformado (400)

**Requisição**

```bash
curl -i -X POST http://localhost:3000/analises -H "Content-Type: application/json" -d '{url:'
```

**Resposta**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{
  "erro": {
    "status": 400,
    "codigo": "JSON_INVALIDO",
    "mensagem": "O corpo da requisição não é um JSON válido."
  }
}
```

### Erro: id inválido (400)

**Requisição**

```bash
curl -i -X GET http://localhost:3000/analises/abc
```

**Resposta**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{
  "erro": {
    "status": 400,
    "codigo": "ID_INVALIDO",
    "mensagem": "O id deve ser um número inteiro positivo."
  }
}
```

### Erro: PATCH sem campos (400)

**Requisição**

```bash
curl -i -X PATCH http://localhost:3000/analises/1 -H "Content-Type: application/json" -d '{}'
```

**Resposta**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{
  "erro": {
    "status": 400,
    "codigo": "VALIDACAO",
    "mensagem": "Dados inválidos.",
    "detalhes": [
      {
        "campo": "url, observacao",
        "mensagem": "Informe ao menos um campo para alterar: url ou observacao."
      }
    ]
  }
}
```

### Erro: filtro inválido (400)

**Requisição**

```bash
curl -i -X GET 'http://localhost:3000/analises?classificacao=Perigosa'
```

**Resposta**

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{
  "erro": {
    "status": 400,
    "codigo": "VALIDACAO",
    "mensagem": "Parâmetros de consulta inválidos.",
    "detalhes": [
      {
        "campo": "classificacao",
        "mensagem": "Use um destes valores: Baixa atenção, Atenção moderada, Suspeita."
      }
    ]
  }
}
```

### Erro: análise inexistente (404)

**Requisição**

```bash
curl -i -X GET http://localhost:3000/analises/999
```

**Resposta**

```http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{
  "erro": {
    "status": 404,
    "codigo": "NAO_ENCONTRADO",
    "mensagem": "Análise 999 não encontrada."
  }
}
```

### Erro: rota inexistente (404)

**Requisição**

```bash
curl -i -X GET http://localhost:3000/usuarios
```

**Resposta**

```http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{
  "erro": {
    "status": 404,
    "codigo": "ROTA_NAO_ENCONTRADA",
    "mensagem": "A rota GET /usuarios não existe."
  }
}
```

### Erro: método não permitido (405)

**Requisição**

```bash
curl -i -X DELETE http://localhost:3000/analises
```

**Resposta**

```http
HTTP/1.1 405 Method Not Allowed
Allow: GET, POST
Content-Type: application/json; charset=utf-8

{
  "erro": {
    "status": 405,
    "codigo": "METODO_NAO_PERMITIDO",
    "mensagem": "O método DELETE não é permitido em /analises."
  }
}
```

### Erro: Content-Type incorreto (415)

**Requisição**

```bash
curl -i -X POST http://localhost:3000/analises -H "Content-Type: text/plain" -d '{"url":"https://exemplo.com"}'
```

**Resposta**

```http
HTTP/1.1 415 Unsupported Media Type
Content-Type: application/json; charset=utf-8

{
  "erro": {
    "status": 415,
    "codigo": "TIPO_NAO_SUPORTADO",
    "mensagem": "Envie o corpo com o cabeçalho Content-Type: application/json."
  }
}
```

## Coleção Postman / Insomnia

O arquivo `docs/postman/AnalisaLink.postman_collection.json` tem uma requisição para cada endpoint e para os principais erros, com testes automáticos de status (aba *Tests*).

1. No Postman: **Import** e selecione o arquivo (o Insomnia também importa este formato).
2. Com a API ligada (`npm start`), rode a pasta **Operações** na ordem: o POST guarda o `id` criado na variável `id`, usada pelas demais requisições.
3. A variável `baseUrl` (`http://localhost:3000`) pode ser alterada na coleção.

## Requisitos da etapa e onde verificar

| Requisito | Onde está |
|---|---|
| Recurso principal com GET, GET individual, POST, PUT/PATCH e DELETE | `server/routes.js`, `server/controller.js` |
| 1. HTTP adequado | Verbos por operação, `Location` no 201, `Allow` no 405, CORS em `server/server.js` |
| 2. JSON | Entrada e saída em JSON (`lerCorpo`, `enviar`) |
| 3. Códigos HTTP coerentes | Tabela acima; `tests/api.test.js` confere cada um |
| 4. Validação de entradas | `validarCampos`, `lerId` e `listar` em `server/controller.js` |
| 5. Erros consistentes | `ErroHttp` e o `catch` de `server/server.js` |
| 6. Rotas organizadas | `server/routes.js` (tabela) separada do controle e da persistência |
| 7. Testes com Postman, curl ou equivalente | Coleção em `docs/postman/`, exemplos com `curl` acima e `npm test` |
