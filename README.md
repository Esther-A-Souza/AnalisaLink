# AnalisaLink

O **AnalisaLink** é uma aplicação Web educativa criada para ajudar usuários a identificar características comuns de links suspeitos antes de acessá-los.

O projeto analisa somente a estrutura da URL informada, sem abrir ou acessar o endereço durante a verificação.

## Problema

Muitas pessoas recebem links por e-mail, redes sociais e aplicativos de mensagens, mas não sabem reconhecer elementos que podem indicar uma tentativa de fraude ou phishing.

Características como o uso de um endereço IP no lugar do domínio, a presença do caractere `@` ou uma extensão de arquivo executável podem passar despercebidas.

## Objetivo

O objetivo do AnalisaLink é apresentar os sinais de atenção encontrados em uma URL e explicar, de maneira simples, por que cada característica pode representar um risco.

A aplicação não determina se um endereço é realmente seguro ou malicioso; o resultado é educativo e baseado apenas nas regras definidas no projeto.

## Funcionalidades implementadas

- Receber e validar a URL informada pelo usuário (verificando campo vazio, formato válido e protocolo HTTP ou HTTPS);
- Separar e mostrar o protocolo, o domínio e o caminho da URL;
- Verificar características suspeitas e calcular uma pontuação de atenção (0 a 100);
- Classificar o resultado e explicar os sinais encontrados na análise;
- Salvar as análises em um **banco de dados SQLite** por meio de uma API REST própria (Node.js), com requisições assíncronas (`fetch` com `async/await`);
- Exibir o histórico de análises com filtro dinâmico por URL ou classificação;
- Visualizar os detalhes de uma análise, excluir um registro específico ou limpar todo o histórico com confirmação;
- Alterar uma análise (URL e observação) por meio dos métodos `PUT` e `PATCH` da API;
- Manter os dados salvos mesmo depois de reiniciar a aplicação.

## Regras de análise e pontuação

A análise soma os pontos de cada sinal encontrado até o limite de 100 pontos:

| Sinal identificado | Pontuação |
| --- | --- |
| Uso de HTTP em vez de HTTPS | +15 |
| Presença do caractere `@` | +25 |
| Uso de endereço IP no lugar do domínio | +30 |
| URL com mais de 75 caracteres | +10 |
| Mais de 3 subdomínios | +15 |
| Cada palavra suspeita (`login`, `senha`, `conta`, `verify`, `urgente`) | +10 |
| Extensão `.exe`, `.bat`, `.scr` ou `.apk` no caminho | +30 |

**Classificação do resultado:**
- **0 a 24 pontos:** Baixa atenção
- **25 a 49 pontos:** Atenção moderada
- **50 a 100 pontos:** Suspeita

## API REST

A API disponibiliza o recurso `analises` em JSON, na porta `3000`. O servidor calcula a pontuação, a classificação e os sinais; o cliente envia apenas a `url` (e, opcionalmente, uma `observacao`).

| Método | Rota | Operação | Resposta de sucesso |
| --- | --- | --- | --- |
| GET | `/analises` | Listar (filtros opcionais: `busca`, `classificacao`, `ordem`) | `200 OK` |
| GET | `/analises/:id` | Consultar uma análise | `200 OK` |
| POST | `/analises` | Criar uma análise | `201 Created` |
| PUT | `/analises/:id` | Substituir URL e observação | `200 OK` |
| PATCH | `/analises/:id` | Alterar parcialmente | `200 OK` |
| DELETE | `/analises/:id` | Excluir uma análise | `204 No Content` |

As entradas são validadas e os erros seguem sempre o mesmo formato (`{ "erro": { "status", "codigo", "mensagem" } }`), com os códigos `400`, `404`, `405`, `413`, `415` e `500`. Detalhes e exemplos em [`docs/etapa-06.md`](docs/etapa-06.md).

## Banco de dados

O projeto usa **SQLite** (relacional) com duas tabelas relacionadas: `analises` e `sinais` (uma análise possui vários sinais, relação 1:N, com exclusão em cascata). Só o arquivo `server/repository.js` contém SQL, o que mantém a API independente do banco. O modelo, a descrição das entidades, a justificativa da escolha e exemplos de CRUD estão em [`docs/etapa-07.md`](docs/etapa-07.md).

## Como executar

Requisito: Node.js **22.13 ou superior** (`node -v`). Não há dependências para instalar.

1. Na pasta do projeto, crie o banco (opcional, a API também o cria ao iniciar) e ligue a API:
   ```bash
   npm run db:criar
   npm run db:exemplo   # opcional: insere 3 análises de exemplo
   npm start
   ```
   Para demonstrar os estados de carregamento do front-end, use `npm run api`, que adiciona 800 ms de atraso a cada resposta.
2. Abra `src/tela-inicial.html` com a extensão **Live Server** do VS Code (módulos JavaScript não funcionam abrindo o arquivo diretamente).

O banco fica em `data/analisalink.db` (gerado automaticamente e ignorado pelo Git). O terminal mostra um aviso `ExperimentalWarning` do módulo `node:sqlite`; é esperado.

## Testes

- **Automáticos:** `npm test` executa 25 testes da API e do banco (usam outra porta e um banco temporário, sem alterar `data/`).
- **Manuais:** a coleção `docs/postman/AnalisaLink.postman_collection.json` pode ser importada no Postman ou no Insomnia; os exemplos com `curl` estão em `docs/etapa-06.md` e `docs/etapa-07.md`.

## Tecnologias utilizadas

### Cliente (Front-end)

- HTML5 semântico;
- CSS3 responsivo (Flexbox, CSS Grid e Media Queries);
- JavaScript modularizado com ES Modules (`analyzer.js`, `api.js` e `main.js`) e `fetch` (`async/await`).

### Servidor e persistência (estado atual)

- Node.js com o módulo `http` nativo (sem frameworks nem dependências externas), organizado em rotas, controle, repositório e tratamento de erros;
- banco de dados **SQLite** acessado pelo módulo nativo `node:sqlite`, com esquema em `server/db/schema.sql` (substituindo o `localStorage` da Etapa 04, o `json-server` da Etapa 05 e o arquivo `db.json` da Etapa 06);
- testes automáticos com o `node:test` e coleção do Postman.

*(Nota: Na especificação inicial da Etapa 01, foi planejada uma arquitetura de servidor com Python, Flask, SQLAlchemy e SQLite. O banco SQLite foi mantido; o servidor foi implementado em Node.js.)*

## Estrutura atual do repositório

```text
AnalisaLink/
├── docs/
│   ├── evidencias/
│   │   ├── etapa-03/
│   │   └── etapa-04/
│   ├── postman/
│   │   └── AnalisaLink.postman_collection.json
│   ├── etapa-02.md
│   ├── etapa-03.md
│   ├── etapa-04.md
│   ├── etapa-05.md
│   ├── etapa-06.md
│   ├── etapa-07.md
│   └── proposta.md
├── server/
│   ├── db/
│   │   ├── conexao.js
│   │   ├── criar.js
│   │   ├── exemplo.js
│   │   └── schema.sql
│   ├── controller.js
│   ├── erros.js
│   ├── repository.js
│   ├── routes.js
│   └── server.js
├── src/
│   ├── js/
│   │   ├── analyzer.js
│   │   ├── api.js
│   │   └── main.js
│   ├── historico.html
│   ├── resultado.html
│   ├── style.css
│   └── tela-inicial.html
├── tests/
│   └── api.test.js
├── .gitignore
├── package.json
└── README.md
```
