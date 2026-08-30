# AnalisaLink

O **AnalisaLink** é uma aplicação Web educativa criada para ajudar usuários a identificar características comuns de links suspeitos antes de acessá-los.

O projeto analisará somente a estrutura da URL informada. Nenhum endereço será aberto ou acessado durante a análise.

## Problema

Muitas pessoas recebem links por e-mail, redes sociais e aplicativos de mensagens, mas não sabem reconhecer elementos que podem indicar uma tentativa de fraude ou phishing.

Algumas características, como o uso de um endereço IP no lugar do domínio, a presença do caractere `@` ou uma extensão de arquivo executável, podem passar despercebidas.

## Objetivo

O objetivo do AnalisaLink é apresentar os sinais de atenção encontrados em uma URL e explicar, de maneira simples, por que cada característica pode representar um risco.

A aplicação não determinará se um endereço é realmente seguro ou malicioso. O resultado será apenas educativo e baseado em regras definidas no projeto.

## Funcionalidades planejadas

- Receber uma URL informada pelo usuário;
- Mostrar o protocolo, o domínio e o caminho da URL;
- Verificar características suspeitas;
- Calcular uma pontuação de atenção;
- Explicar os sinais encontrados;
- Salvar as análises realizadas;
- Exibir o histórico de análises;
- Permitir a exclusão de uma análise do histórico.

## Regras iniciais de análise

Inicialmente, a aplicação deverá verificar:

- Uso de HTTP em vez de HTTPS;
- Presença do caractere `@`;
- Uso de endereço IP no lugar de um domínio;
- URL muito longa;
- Quantidade excessiva de subdomínios;
- Palavras como `login`, `senha`, `conta`, `verify` e `urgente`;
- Extensões como `.exe`, `.bat`, `.scr` e `.apk`.

## Tecnologias planejadas

### Cliente

- HTML;
- CSS;
- JavaScript;
- Bootstrap.

### Servidor

- Python;
- Flask;
- SQLAlchemy.

### Banco de dados

- SQLite.

## Estrutura inicial do repositório

```text
AnalisaLink/
├── docs/
│   └── proposta.md
└── README.md
```

## Documentação

A proposta e a especificação inicial do projeto estão disponíveis em [`docs/proposta.md`](docs/proposta.md).

## Situação do projeto

O projeto está em fase de planejamento e será desenvolvido de forma incremental ao longo do semestre.

## Limitações

- A aplicação não acessará o endereço analisado;
- A análise não garantirá que uma URL seja segura ou maliciosa;
- A pontuação será baseada somente nas regras definidas no projeto;
- Poderão ocorrer falsos positivos e falsos negativos.
