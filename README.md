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
- Salvar as análises realizadas em uma API simulada (`json-server` / `db.json`) por meio de requisições assíncronas (`fetch` com `async/await`);
- Exibir o histórico de análises com filtro dinâmico por URL ou classificação;
- Visualizar os detalhes de uma análise, excluir um registro específico ou limpar todo o histórico com confirmação.

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

## Tecnologias utilizadas

### Cliente (Front-end)

- HTML5 semântico;
- CSS3 responsivo (Flexbox, CSS Grid e Media Queries);
- JavaScript modularizado com ES Modules (`analyzer.js`, `api.js` e `main.js`) e `fetch` (`async/await`).

### Servidor simulado e persistência (estado atual)

- Node.js com `json-server` (`v0.17.4`) e arquivo `db.json` servindo os dados em `http://localhost:3000/analises` (substituindo o `localStorage` utilizado na Etapa 04).

*(Nota: Na especificação inicial da Etapa 01, foi planejada uma arquitetura de servidor definitivo com Python, Flask, SQLAlchemy e SQLite.)*

## Estrutura atual do repositório

```text
AnalisaLink/
├── docs/
│   ├── evidencias/
│   │   ├── etapa-03/
│   │   └── etapa-04/
│   ├── etapa-02.md
│   ├── etapa-03.md
│   ├── etapa-04.md
│   ├── etapa-05.md
│   └── proposta.md
├── src/
│   ├── js/
│   │   ├── analyzer.js
│   │   ├── api.js
│   │   └── main.js
│   ├── historico.html
│   ├── resultado.html
│   ├── style.css
│   └── tela-inicial.html
├── .gitignore
├── db.json
├── package.json
├── package-lock.json
└── README.md
