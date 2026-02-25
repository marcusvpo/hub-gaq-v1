-- ================================================
-- TABELA: avaliacao_percepcao
-- Armazena o feedback de percepção de valor dos clientes
-- Baseado no CSV: Avaliação de Percepção de Valor do Serviço - Ariel Quadros Engenharia e Consultoria
-- ================================================

CREATE TABLE avaliacao_percepcao (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id              UUID REFERENCES clientes(id) ON DELETE SET NULL,
  nome_respondente        TEXT NOT NULL,
  cargo_respondente       TEXT,
  empresa_nome            TEXT,
  cidade                  TEXT,
  nps                     INTEGER CHECK (nps BETWEEN 0 AND 10),
  resumo_3_palavras       TEXT,
  area_atuacao_percebida  TEXT,
  representacao_servico   TEXT,
  relacao_custo_beneficio TEXT,
  qualidades              TEXT[], -- Armazena até 3 qualidades selecionadas
  expectativas            TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários para ajudar na interpretação dos dados
COMMENT ON COLUMN avaliacao_percepcao.nps IS 'Net Promoter Score: de 0 a 10';
COMMENT ON COLUMN avaliacao_percepcao.resumo_3_palavras IS 'Resumo do serviço em até 3 palavras';
COMMENT ON COLUMN avaliacao_percepcao.area_atuacao_percebida IS 'Onde o serviço mais atuou no negócio';
COMMENT ON COLUMN avaliacao_percepcao.representacao_servico IS 'O que o serviço representa (parceria, suporte, etc)';
COMMENT ON COLUMN avaliacao_percepcao.relacao_custo_beneficio IS 'Percepção da relação custo-benefício';
COMMENT ON COLUMN avaliacao_percepcao.qualidades IS 'As 3 principais qualidades percebidas';
COMMENT ON COLUMN avaliacao_percepcao.expectativas IS 'Se o serviço foi acima, dentro ou abaixo do esperado';
