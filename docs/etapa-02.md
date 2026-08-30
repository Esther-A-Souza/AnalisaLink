# Etapa 02 

## Funcionalidades implementadas

Nesta etapa foram implementadas as seguintes funcionalidades:

- Navegação entre as páginas;
- Formulário para inserção de uma URL;
- Validação obrigatória do campo de URL pelo HTML;
- Representação da tela de resultado;
- Representação do histórico de análises;
- Link para visualizar os detalhes de uma análise;
- Botão representativo para exclusão de uma análise.

A análise da URL, a pontuação, o histórico e a exclusão ainda utilizam dados fictícios. A lógica será implementada nas próximas etapas.

## Páginas criadas

### Página inicial

Apresenta o objetivo da aplicação, suas limitações e um formulário para o usuário informar uma URL.

Arquivo: `src/tela-inicial.html`.

### Página de resultado

Apresenta um exemplo de resultado contendo a URL, suas partes principais, pontuação, classificação e sinais encontrados.

Arquivo: `src/resultado.html`.

### Página de histórico

Apresenta um exemplo de análise anterior, com data, pontuação, classificação e ações para visualizar ou excluir.

Arquivo: `src/historico.html`.

## Decisões sobre a estrutura HTML

Foram utilizados elementos semânticos como:

- `header` para o cabeçalho;
- `nav` para a navegação;
- `main` para o conteúdo principal;
- `section` para agrupar os conteúdos;
- `article` para representar uma análise;
- `form` para o envio da URL;
- `label` para identificar o campo;
- `button` para representar ações;
- `time` para representar a data e o horário.

As três páginas utilizam a mesma navegação. A página atual é identificada pelo atributo `aria-current="page"`.

Nesta etapa foram priorizadas a estrutura semântica e a representação das interfaces. A estilização e a lógica da aplicação serão desenvolvidas posteriormente.
