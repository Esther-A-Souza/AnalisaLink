# Etapa 03 — Interface Responsiva com CSS

## Objetivo

Nesta etapa, as interfaces HTML desenvolvidas anteriormente para o **AnalisaLink** foram estilizadas utilizando CSS, buscando melhorar a organização visual, a legibilidade e a adaptação da aplicação para diferentes tamanhos de tela.

A interface foi desenvolvida de forma responsiva para funcionar adequadamente em dispositivos desktop, tablets e smartphones.

---

## Interfaces apresentadas

Foram mantidas as três interfaces desenvolvidas na Etapa 02:

### 1. Tela Inicial

A tela inicial apresenta o nome do sistema, uma breve descrição sobre o funcionamento do AnalisaLink e o formulário utilizado para inserir uma URL para análise.

**Arquivo:** `src/tela-inicial.html`

---

### 2. Tela de Resultado

A tela de resultado representa a área onde serão apresentadas as informações referentes à análise de uma URL.

Nesta etapa, a lógica completa de análise ainda não está implementada. Caso nenhuma análise seja selecionada, a página informa ao usuário que é necessário inserir uma URL pela página inicial ou acessar uma análise pelo histórico.

**Arquivo:** `src/resultado.html`

---

### 3. Tela de Histórico

A tela de histórico apresenta as URLs analisadas anteriormente.

Cada registro apresenta informações como:

* URL analisada;
* data da análise;
* pontuação;
* classificação;
* opção para visualizar detalhes;
* opção para excluir o registro.

**Arquivo:** `src/historico.html`

---

## CSS

A estilização das três páginas foi centralizada em um único arquivo CSS:

```text
src/style.css
```

O mesmo arquivo é utilizado pelas três interfaces, evitando repetição de código e mantendo uma identidade visual consistente em toda a aplicação.

---

## Organização da interface

Foram utilizados **Flexbox** e **CSS Grid** para organizar os elementos da aplicação.

O **Flexbox** foi utilizado principalmente no cabeçalho, na navegação e na organização de elementos que precisam se adaptar ao espaço disponível.

O **CSS Grid** foi utilizado principalmente na organização do formulário e dos elementos apresentados no histórico.

Essa organização permite que os componentes sejam reorganizados automaticamente de acordo com o tamanho da tela utilizada.

---

## Breakpoints utilizados

Foram utilizados dois breakpoints principais por meio de `media queries`.

### Breakpoint para tablet

```css
@media (max-width: 900px)
```

Neste tamanho de tela:

* o cabeçalho passa a utilizar organização vertical;
* os elementos que utilizam múltiplas colunas passam a utilizar apenas uma coluna;
* o conteúdo recebe ajustes de espaçamento.

---

### Breakpoint para smartphone

```css
@media (max-width: 600px)
```

Neste tamanho de tela:

* a navegação é reorganizada para ocupar melhor a largura disponível;
* o formulário passa a ser apresentado em uma única coluna;
* os botões ocupam toda a largura disponível;
* os cards do histórico são reorganizados;
* os espaçamentos são reduzidos para telas menores;
* as ações disponíveis nos cards passam a ser apresentadas verticalmente.

---

## Principais decisões de responsividade

Para manter a aplicação utilizável em diferentes dispositivos, foram adotadas as seguintes decisões:

* utilização de tamanhos flexíveis para os elementos;
* utilização de `Flexbox` para organização do cabeçalho;
* utilização de `Grid` para organização de formulários e cards;
* reorganização dos elementos em telas menores;
* adaptação do menu de navegação;
* alteração do formulário de duas colunas para uma coluna em smartphones;
* botões ocupando toda a largura disponível em telas pequenas;
* adaptação de URLs longas para evitar que ultrapassem os limites dos cards;
* utilização de espaçamentos adequados para cada tamanho de tela;
* manutenção da legibilidade dos textos em desktop, tablet e smartphone.

---

## Viewports utilizados

As interfaces foram testadas utilizando os três tamanhos de viewport definidos para a etapa.

| Dispositivo | Viewport      |
| ----------- | ------------- |
| Desktop     | 1440 × 900 px |
| Tablet      | 768 × 1024 px |
| Smartphone  | 390 × 844 px  |

Para cada viewport foram registradas as três interfaces principais do sistema.

---

## Evidências

As evidências da aplicação estão localizadas no diretório:

```text
docs/evidencias/etapa-03/
```

### Desktop — 1440 × 900 px

```text
desktop-tela-01.png
desktop-tela-02.png
desktop-tela-03.png
```

* `desktop-tela-01.png` — Tela Inicial
* `desktop-tela-02.png` — Tela de Resultado
* `desktop-tela-03.png` — Tela de Histórico

### Tablet — 768 × 1024 px

```text
tablet-tela-01.png
tablet-tela-02.png
tablet-tela-03.png
```

* `tablet-tela-01.png` — Tela Inicial
* `tablet-tela-02.png` — Tela de Resultado
* `tablet-tela-03.png` — Tela de Histórico

### Smartphone — 390 × 844 px

```text
smartphone-tela-01.png
smartphone-tela-02.png
smartphone-tela-03.png
```

* `smartphone-tela-01.png` — Tela Inicial
* `smartphone-tela-02.png` — Tela de Resultado
* `smartphone-tela-03.png` — Tela de Histórico

---

## Estrutura dos arquivos

A estrutura utilizada nesta etapa é:

```text
AnalisaLink/
│
├── docs/
│   ├── etapa-03.md
│   │
│   └── evidencias/
│       └── etapa-03/
│           ├── desktop-tela-01.png
│           ├── desktop-tela-02.png
│           ├── desktop-tela-03.png
│           ├── tablet-tela-01.png
│           ├── tablet-tela-02.png
│           ├── tablet-tela-03.png
│           ├── smartphone-tela-01.png
│           ├── smartphone-tela-02.png
│           └── smartphone-tela-03.png
│
└── src/
    ├── tela-inicial.html
    ├── resultado.html
    ├── historico.html
    └── style.css
```

---

## Resultado da etapa

Com a implementação do CSS responsivo, as três interfaces do AnalisaLink passaram a possuir uma apresentação visual organizada e adaptável a diferentes tamanhos de tela.

A utilização de Flexbox, CSS Grid e media queries permite que a aplicação mantenha a legibilidade e a usabilidade tanto em computadores quanto em tablets e smartphones.

**Tag da entrega:** `etapa-03`
