-- Modelo do banco do AnalisaLink (SQLite)
-- Relacionamento: uma ANALISE possui vários SINAIS (1:N).
-- O script é idempotente: pode ser executado várias vezes sem apagar dados.

CREATE TABLE IF NOT EXISTS analises (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  url            TEXT    NOT NULL,
  protocolo      TEXT    NOT NULL,
  dominio        TEXT    NOT NULL,
  caminho        TEXT    NOT NULL,
  pontuacao      INTEGER NOT NULL CHECK (pontuacao BETWEEN 0 AND 100),
  classificacao  TEXT    NOT NULL CHECK (classificacao IN ('Baixa atenção', 'Atenção moderada', 'Suspeita')),
  observacao     TEXT    NOT NULL DEFAULT '',
  criada_em      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  atualizada_em  TEXT
);

CREATE TABLE IF NOT EXISTS sinais (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  analise_id  INTEGER NOT NULL REFERENCES analises (id) ON DELETE CASCADE,
  texto       TEXT    NOT NULL,
  pontos      INTEGER NOT NULL CHECK (pontos > 0)
);

CREATE INDEX IF NOT EXISTS idx_sinais_analise ON sinais (analise_id);
CREATE INDEX IF NOT EXISTS idx_analises_classificacao ON analises (classificacao);
