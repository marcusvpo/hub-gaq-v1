# 📋 Scorecard Grupo Ariel Quadros — Documentação Técnica Completa

## Visão Geral

Este documento descreve o **Scorecard de Diagnóstico Operacional** desenvolvido pelo **Grupo Ariel Quadros**, consultoria especializada em engenharia de processos para o ramo alimentício. O scorecard é a principal ferramenta diagnóstica utilizada pelo consultor Ariel Quadros para avaliar a saúde operacional, financeira e estratégica de negócios do setor de food service, como restaurantes, lanchonetes, food trucks, padarias e similares.

O objetivo deste arquivo é servir como **contexto base para a IA da plataforma**, orientando como estruturar, interpretar e gerar scorecards automaticamente para cada cliente avaliado pelo consultor.

***

## Sobre o Grupo Ariel Quadros

| Campo | Detalhe |
|-------|---------|
| **Nome** | Grupo Ariel Quadros |
| **Fundador** | Ariel Quadros (Engenheiro de Produção — FACAMP, Campinas, SP) |
| **Segmento** | Consultoria de engenharia para o ramo alimentício |
| **Público-alvo** | Micro, pequenos e médios empreendedores do food service |
| **Proposta de valor** | CMV + Processos + Preço Certo = Lucro |
| **Modalidade** | Consultoria presencial — vai até a operação do cliente |
| **CNPJ** | 48.964.111/0001-44 |
| **Localização** | Campinas, São Paulo, Brasil |
| **Instagram** | @grupoarielquadros |

O Grupo Ariel Quadros atua diretamente nas operações dos clientes, diagnosticando gargalos em gestão financeira, controle de CMV (Custo de Mercadoria Vendida), precificação, padronização de processos, gestão de pessoas, vendas e marketing, com a missão de transformar operações desorganizadas em negócios lucrativos e escaláveis.

***

## Propósito e Caso de Uso do Scorecard

O scorecard é aplicado **no início de cada processo consultivo**, geralmente durante uma reunião presencial ou visita à operação do cliente. Seu objetivo é:

1. **Diagnosticar** a situação atual do negócio de forma estruturada e padronizada.
2. **Quantificar** o nível de maturidade operacional em 8 dimensões críticas.
3. **Identificar** pontos críticos negativos e práticas positivas já existentes.
4. **Gerar um plano de prioridades** baseado nas áreas com menor pontuação.
5. **Criar baseline** para acompanhamento da evolução ao longo do processo consultivo.

### Fluxo de Uso

```
Prospecção do cliente
       ↓
Reunião/Visita de diagnóstico
       ↓
Ariel preenche o scorecard (indicadores + notas)
       ↓
Geração do score total (0–1000)
       ↓
Classificação do negócio (faixa de maturidade)
       ↓
Apresentação ao cliente + Plano de Ação
       ↓
Início do processo consultivo com foco nas áreas críticas
```

Durante a avaliação, o consultor observa a operação e conversa diretamente com o dono do negócio. Para cada indicador relevante encontrado, ele:
- Seleciona o **código do indicador** correspondente
- Registra uma **observação textual** (o que foi efetivamente encontrado)
- Marca como **positivo** (`#`) ou **negativo** (`*`)
- Atribui uma **nota** (0, 12 ou 25) para cada critério da área

***

## Sistema de Pontuação

### Escala de Notas por Critério

Cada critério de cada área recebe uma das três notas abaixo, baseada no nível de implementação observado:

| Nota | Significado | Exemplo de Situação |
|------|-------------|---------------------|
| **0** | Ausente / Crítico — o critério não existe no negócio | Sem nenhum controle de caixa |
| **12** | Parcial / Incompleto — existe algo, mas de forma precária ou inconsistente | Tem planilha mas não usa regularmente |
| **25** | Completo / Excelente — critério totalmente implementado e funcional | Separa 100% CPF e CNPJ, usa sistema de gestão corretamente |

> **Importante para a IA:** Ao sugerir notas, considere o princípio "tudo ou nada" como extremos e a situação de "mais ou menos" como o ponto intermediário. A nota 12 representa consciência ou tentativa sem consistência. A nota 25 representa maturidade e consistência comprovada.

### Score Total e Faixas de Classificação

O score total varia de **0 a 1000 pontos**, com **8 áreas** de avaliação, cada uma valendo **até 125 pontos** (5 critérios × 25 pontos).

| Faixa de Score | Classificação | Significado |
|---------------|---------------|-------------|
| **0 – 350** | 🔴 Risco Estrutural Alto | Negócio com falhas graves em múltiplas áreas; risco imediato de colapso operacional ou financeiro |
| **351 – 500** | 🟠 Operação Instável | Existem alguns controles, mas a operação é imprevisível e dependente do dono |
| **501 – 650** | 🟡 Estrutura Funcional | O negócio funciona, mas com perdas significativas por falta de padronização |
| **651 – 800** | 🟢 Estrutura Organizada | Operação com processos básicos implementados; potencial de escala visível |
| **801 – 900** | 🔵 Gestão Profissional | Gestão estruturada com indicadores e processos consolidados |
| **901 – 1000** | ⭐ Operação Escalável | Negócio maduro, com gestão profissional e capacidade real de expansão |

***

## Simbologia e Convenção de Indicadores

Cada indicador do scorecard é identificado por um **código único** com prefixo de área. Durante a avaliação, o consultor marca cada indicador como:

| Símbolo | Tipo | Descrição |
|---------|------|-----------|
| `*` | **Indicador Negativo** | Situação problemática, ausente ou precária encontrada no negócio |
| `#` | **Indicador Positivo** | Boa prática identificada, ponto forte da operação |

> **Nota para a plataforma:** Ao cadastrar um indicador, o consultor deve: (1) selecionar ou criar o código do indicador; (2) escrever no campo de texto o que foi especificamente encontrado naquele cliente; (3) marcar como positivo ou negativo; (4) salvar. Os campos de texto são livres para capturar a realidade específica de cada negócio.

***

## Áreas de Avaliação

O scorecard está dividido em **8 áreas temáticas**. Cada área contém critérios de pontuação (formais) e indicadores de observação (descritivos).

***

### Área 1 — Financeiro (`FIN`)

**Objetivo:** Avaliar o nível de organização financeira do negócio, desde a separação entre finanças pessoais e empresariais até a estrutura de precificação e planejamento.

**Por que é crítico:** A maioria dos negócios do ramo alimentício fecha por falta de controle financeiro. O dono frequentemente confunde faturamento com lucro, mistura contas pessoais e empresariais, e precifica sem base em custos reais.

#### Critérios de Pontuação (max. 125 pts)

| Código | Critério | O que avalia |
|--------|----------|-------------|
| **F1** | Separação Financeira | Se o empreendedor separa 100% as contas PF (CPF) das contas PJ (CNPJ), usando contas bancárias distintas para cada |
| **F2** | Controle de Caixa | Se existe registro formal das entradas e saídas diárias, com saldo de caixa conhecido em tempo real |
| **F3** | Conhecimento do Resultado | Se o dono sabe com precisão qual é o lucro líquido mensal do negócio (não apenas o faturamento) |
| **F4** | Estrutura de Precificação | Se os preços são definidos com base em custos reais + margem desejada, e não empiricamente ou copiando concorrentes |
| **F5** | Planejamento Financeiro | Se existe algum sistema, planilha ou ferramenta utilizada de forma consistente para planejamento e controle financeiro |

#### Indicadores de Observação

| Código | Sinal | Descrição | Interpretação na Avaliação |
|--------|-------|-----------|----------------------------|
| `FIN-SEP` | `*` | Mistura CPF e CNPJ | O empreendedor usa a mesma conta bancária ou cartão para gastos pessoais e do negócio — impede qualquer análise financeira real |
| `FIN-HEAD` | `*` | Controla com a cabeça | Nenhum registro; o controle financeiro existe apenas na memória do dono, sem respaldo documental |
| `FIN-CAIXA` | `*` | Não sabe o caixa | Quando questionado sobre o saldo atual do caixa, o dono não sabe responder com precisão |
| `FIN-NL?` | `*` | Não sabe o lucro do negócio | Incapaz de informar o lucro líquido do último mês — confunde receita com resultado |
| `FIN-TK` | `*` | Acha que sobra | Crença subjetiva de que o negócio está lucrando, sem nenhuma comprovação numérica |
| `FIN-FATOK` | `*` | Sabe o faturamento | Conhece a receita bruta, mas sem saber custos e lucro; indicador de consciência parcial |
| `FIN-PLN` | `*` | Tem planilha | Possui alguma planilha de controle criada, mas uso inconsistente — nota parcial (12 pts) |
| `FIN-DESORG` | `*` | Tem planilha mas não usa | Criou uma planilha em algum momento, mas abandonou ou não atualiza — pior que não ter |
| `FIN-APPSYS` | `*` | Usa direitinho o sistema | Utiliza um app ou sistema de gestão de forma minimamente correta — pode indicar nota parcial ou positiva dependendo do nível |
| `FIN-PRECEMP` | `*` | Preço empírico | Preços definidos "no feeling", sem cálculo de custo ou margem |
| `FIN-PRECCONC` | `*` | Preço com base no concorrente | Precifica apenas copiando o mercado, sem analisar se o preço cobre seus próprios custos |
| `FIN-PRECMARG` | `*` | Preço com margem | Aplica alguma margem sobre o custo — prática parcialmente positiva, mas pode estar incompleta |

***

### Área 2 — CMV & Markup (`CMV`)

**Objetivo:** Avaliar o controle sobre o Custo de Mercadoria Vendida (CMV), a existência de fichas técnicas, a precisão na apuração de custos e a inteligência sobre margens por produto.

**Por que é crítico:** O CMV ideal para food service gira entre 28% e 35% do faturamento. Sem ficha técnica, o negócio não sabe quanto custa produzir cada prato e consequentemente não consegue precificar corretamente, gerando vendas no prejuízo sem perceber.

#### Critérios de Pontuação (max. 125 pts)

| Código | Critério | O que avalia |
|--------|----------|-------------|
| **C1** | Ficha Técnica | Se todos os produtos têm ficha técnica formal com ingredientes, gramagens, modo de preparo e custo calculado |
| **C2** | CMV Real Calculado | Se o negócio apura o CMV real periodicamente (não apenas estima) com base em estoque e compras |
| **C3** | Inclusão Total de Custos | Se todos os custos variáveis são incluídos no cálculo (embalagens, descartáveis, insumos secundários, etc.) |
| **C4** | Análise de Mix por Margem | Se o dono sabe quais produtos têm maior e menor margem, e usa isso estrategicamente no cardápio |
| **C5** | Atualização de Custos | Se os custos dos insumos são revisados e atualizados regularmente, especialmente após reajustes de fornecedores |

#### Indicadores de Observação

| Código | Sinal | Descrição | Interpretação na Avaliação |
|--------|-------|-----------|----------------------------|
| `CMV-FT?` | `*` | Sem ficha técnica formal | Nenhum produto tem ficha técnica estruturada; receitas estão na cabeça dos cozinheiros |
| `CMV-REAL?` | `*` | Não sabe CMV real | O dono não consegue informar o % de CMV do negócio no último período |
| `CMV-EMB?` | `*` | Embalagem fora da conta | Custos com embalagens, sacolas e descartáveis não são incluídos no cálculo do CMV — distorce completamente a margem real |
| `CMV-PRECEMP` | `*` | Preço empírico | Precificação sem base em ficha técnica ou CMV calculado |
| `CMV-MIX?` | `*` | Não sabe o preço por produto | Não tem clareza sobre qual é a margem de lucro de cada item do cardápio individualmente |
| `CMV-UPDREG` | `#` | Atualiza preço regularmente | Boa prática: revisa e atualiza os custos e preços de forma periódica e sistemática |
| `CMV-MARCAT` | `#` | Margem definida por categoria | Boa prática: define margens diferentes por categoria de produto (ex: bebidas vs pratos principais) |
| `CMV-ANALMEN` | `#` | Análise mensal de CMV | Boa prática: realiza análise mensal formal do CMV, comparando com metas estabelecidas |

***

### Área 3 — Operação (`OPR`)

**Objetivo:** Avaliar o grau de padronização dos processos operacionais, a capacidade de produção no pico de demanda, o controle de desperdícios e a funcionalidade do layout físico.

**Por que é crítico:** No food service, a operação é o coração do negócio. Sem padrão operacional, o tempo de preparo é imprevisível, a qualidade varia por funcionário, o desperdício é invisível e o layout pode criar gargalos que comprometem a capacidade de atendimento.

#### Critérios de Pontuação (max. 125 pts)

| Código | Critério | O que avalia |
|--------|----------|-------------|
| **O1** | Padronização de Processos | Se existem POPs (Procedimentos Operacionais Padrão) documentados para as principais etapas de produção e atendimento |
| **O2** | Tempo Médio Monitorado | Se o negócio acompanha o tempo médio de preparo dos pratos e o tempo de espera do cliente (tempo até a mesa) |
| **O3** | Controle de Desperdício | Se existem práticas formais para medir e reduzir desperdícios de insumos na produção |
| **O4** | Layout Funcional | Se o layout da cozinha e do salão favorece o fluxo de trabalho sem criar cruzamentos, gargalos ou perdas de tempo desnecessárias |
| **O5** | Indicadores Operacionais | Se o negócio acompanha métricas operacionais como produtividade por turno, taxa de ocupação e capacidade de atendimento |

#### Indicadores de Observação

| Código | Sinal | Descrição | Interpretação na Avaliação |
|--------|-------|-----------|----------------------------|
| `OPR-GAR` | `*` | Gargalo no pico | No horário de maior movimento, a operação trava — mesas esperando muito, fila de pedidos acumulando |
| `OPR-POP` | `*` | Sem padrão operacional | Cada funcionário faz o prato do seu jeito; não há procedimento escrito ou treinamento padronizado |
| `OPR-DES` | `*` | Desperdício visível | É possível observar insumos sendo desperdiçados na produção — excesso de ingredientes, erros frequentes, produtos vencendo |
| `OPR-TMP?` | `*` | Sem tempo médio de preparo | O negócio não monitora quanto tempo leva para preparar cada prato ou entregar ao cliente |
| `OPR-POPDOC` | `#` | Processo documentado | Boa prática: procedimentos de produção e atendimento estão escritos, com passo a passo acessível aos funcionários |
| `OPR-PROD` | `#` | Produtividade alta | Boa prática: a equipe consegue atender o volume esperado sem sobrecarga, com ritmo adequado mesmo nos picos |
| `OPR-LAYF` | `*` | Layout trava o fluxo | O arranjo físico da cozinha ou salão cria ineficiências — caminhos longos, cruzamentos desnecessários, áreas mal posicionadas |

***

### Área 4 — Estoque (`EST`)

**Objetivo:** Avaliar a gestão do estoque de insumos — desde a realização de inventários periódicos até o controle de validade, planejamento de compras e alinhamento entre sistema e realidade física.

**Por que é crítico:** Estoque descontrolado gera dois problemas simultâneos: perdas por vencimento de produtos e rupturas por falta de insumos. Ambos impactam diretamente o CMV e a experiência do cliente. Além disso, compras impulsivas sem planejamento consomem capital de giro desnecessariamente.

#### Critérios de Pontuação (max. 125 pts)

| Código | Critério | O que avalia |
|--------|----------|-------------|
| **E1** | Inventário Periódico | Se o negócio realiza contagem física do estoque com periodicidade definida (semanal, quinzenal ou mensal) |
| **E2** | Conferência Física vs Sistema | Se o sistema de gestão/ERP é conferido contra o estoque físico regularmente, com divergências sendo investigadas |
| **E4** | Plano de Compras | Se as compras são planejadas com base no histórico de consumo e não feitas por impulso ou quando falta produto |
| **E5** | Controle de Validade | Se existe processo formal para controlar as datas de validade dos insumos, evitando perdas por vencimento |
| **E6** | Análise de Insumos | Se o negócio analisa o consumo médio por insumo para identificar oportunidades de redução de custo e renegociação com fornecedores |

#### Indicadores de Observação

| Código | Sinal | Descrição | Interpretação na Avaliação |
|--------|-------|-----------|----------------------------|
| `EST-SEMI` | `*` | Não faz inventário periódico | Nunca realiza contagem física formal do estoque — tudo é controlado visualmente ou "no olho" |
| `EST-DIFSYS` | `*` | Sistema diverge do físico | O sistema de gestão mostra um saldo, mas o estoque físico é diferente — sintoma de lançamentos incorretos e possíveis desvios |
| `EST-COMPIMP` | `*` | Compras impulsivas | As compras são feitas quando o produto acaba ou por oportunismo, sem critério de planejamento |
| `EST-VALRIS` | `*` | Risco de validade | Existem produtos no estoque próximos ao vencimento ou com vencimento já expirado — perda de dinheiro direta |
| `EST-INVREG` | `#` | Inventário bem estruturado | Boa prática: contagem física realizada com regularidade e método, com resultados registrados |
| `EST-COMPM` | `#` | Consumo médio calculado | Boa prática: o negócio sabe o consumo médio por insumo por período, tornando o planejamento de compras previsível |
| `EST-FEFO` | `#` | FEFO implementado | Boa prática: aplica o método "First Expire, First Out" — o produto com vencimento mais próximo é sempre o primeiro a ser utilizado |

***

### Área 5 — Pessoas (`PES`)

**Objetivo:** Avaliar a estrutura de gestão de pessoas do negócio — clareza de funções, existência de treinamento, grau de dependência do dono e liderança da equipe.

**Por que é crítico:** No food service, a rotatividade de funcionários é um dos maiores custos ocultos. Um negócio que depende 100% do dono para funcionar nunca consegue escalar. Sem funções claras e treinamento estruturado, cada funcionário novo começa do zero, comprometendo a qualidade e aumentando o CMV por desperdícios.

#### Critérios de Pontuação (max. 125 pts)

| Código | Critério | O que avalia |
|--------|----------|-------------|
| **P1** | Definição de Funções | Se cada colaborador tem um cargo com responsabilidades claras, evitando sobreposições e lacunas operacionais |
| **P2** | Treinamento Estruturado | Se existe processo formal de integração e treinamento para novos colaboradores, incluindo POPs e padrões de qualidade |
| **P3** | Dependência do Dono | Se o negócio consegue operar normalmente na ausência do dono — quanto mais alto, melhor |
| **P4** | Indicadores de Desempenho | Se existem métricas para avaliar o desempenho individual dos colaboradores e da equipe |
| **P5** | Liderança | Se existe uma liderança intermediária (gerente, chefe de cozinha, líder de turno) que supervisiona a operação sem precisar do dono |

#### Indicadores de Observação

| Código | Sinal | Descrição | Interpretação na Avaliação |
|--------|-------|-----------|----------------------------|
| `PES-FUNCONF` | `*` | Funções confusas | Os colaboradores não sabem exatamente o que é responsabilidade deles — "todo mundo faz tudo" sem critério |
| `PES-SEMTR` | `*` | Sem treinamento claro | Novos funcionários aprendem observando outros, sem processo formal — qualidade inconsistente garantida |
| `PES-ROTAL` | `*` | Rotatividade alta | Alto turnover de equipe, gerando custo constante de recrutamento, treinamento e queda de produtividade |
| `PES-SOBREC` | `*` | Dono sobrecarregado | O dono está operacionalmente dentro do negócio em funções que deveriam ser delegadas — não consegue trabalhar "no" negócio para trabalhar "pelo" negócio |
| `PES-SEMLID` | `*` | Sem liderança clara | Não existe figura de liderança intermediária — qualquer problema sobe direto para o dono |
| `PES-FUNCLAR` | `#` | Funções bem definidas | Boa prática: cada cargo tem descrição clara de responsabilidades, horários e KPIs |
| `PES-TREEST` | `#` | Treinamento estruturado | Boa prática: existe processo documentado de onboarding e treinamento contínuo para a equipe |

***

### Área 6 — Vendas (`VEN`)

**Objetivo:** Avaliar o controle sobre métricas de vendas — ticket médio, metas de faturamento, estratégias de upsell e conhecimento sobre os produtos mais rentáveis do mix.

**Por que é crítico:** Muitos donos de food service não sabem qual é o ticket médio dos seus clientes, não têm meta de faturamento definida e não trabalham estrategicamente o cardápio para empurrar os produtos de maior margem. Sem essas informações, é impossível crescer com inteligência.

#### Critérios de Pontuação (max. 125 pts)

| Código | Critério                     | O que avalia                                                                                                                      |
| ------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| V1     | Conhecimento do Ticket Médio | Se o dono sabe o valor médio gasto por cliente por visita e acompanha sua evolução ao longo do tempo                              |
| V2     | Meta de Faturamento          | Se existe uma meta mensal de receita definida, documentada e comunicada — com acompanhamento semanal ou quinzenal                 |
| V3     | Inteligência de Mix          | Se o dono conhece os produtos estrela (mais vendidos e mais rentáveis) e usa essa informação para decisões de cardápio e promoção |
| V4     | Estratégia de Upsell         | Se a equipe foi treinada e tem script para ofertar adicionais, combos e upgrades de forma natural durante o atendimento           |
| V5     | Análise Mensal de Vendas     | Se realiza análise periódica dos dados de vendas (ticket médio, mix vendido, performance vs meta) com frequência mínima mensal    |

#### Indicadores de Observação

| Código | Sinal | Descrição | Interpretação na Avaliação |
|--------|-------|-----------|----------------------------|
| `VEN-TKM?` | `*` | Não sabe o ticket médio | O dono não consegue informar o valor médio gasto por cliente por visita |
| `VEN-SEMMETA` | `*` | Sem meta de faturamento | Não existe uma meta mensal de receita definida — operação sem direção comercial |
| `VEN-SEMUP` | `*` | Sem upsell | A equipe não pratica nem recebeu treinamento para oferecer itens adicionais ou sugestões que aumentem o ticket |
| `VEN-MIXCEGO` | `*` | Não sabe produto estrela | Desconhece quais produtos vendem mais e quais têm maior margem — toma decisões de cardápio no escuro |
| `VEN-METADEF` | `#` | Meta clara | Boa prática: existe meta de faturamento mensal definida, comunicada e acompanhada |
| `VEN-UPSTR` | `#` | Upsell estruturado | Boa prática: a equipe tem treinamento e script para ofertar adicionais, combos e sugestões de forma natural |
| `VEN-ANALMEN` | `#` | Análise mensal de vendas | Boa prática: realiza análise mensal dos dados de vendas com foco em ticket médio, produtos mais vendidos e margem por mix |

***

### Área 7 — Marketing (`MKT`)

**Objetivo:** Avaliar a presença e estratégia de marketing do negócio — consistência nas redes sociais, definição de público-alvo, existência de campanhas e estratégias de retenção de clientes.

**Por que é crítico:** No food service atual, marketing digital é uma alavanca direta de crescimento. Negócios com presença irregular nas redes sociais perdem visibilidade para concorrentes. Sem estratégia de retenção, o custo de aquisição de novos clientes é alto e o faturamento fica instável.

#### Critérios de Pontuação (max. 125 pts)

| Código | Critério                     | O que avalia                                                                                                                            |
| ------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| M1     | Presença Digital Consistente | Se o negócio mantém presença regular e padronizada nas redes sociais — frequência mínima, identidade visual coesa e engajamento ativo   |
| M2     | Público-Alvo Definido        | Se o dono consegue descrever claramente quem é seu cliente ideal (ICP) e se a comunicação é direcionada para esse perfil                |
| M3     | Planejamento de Campanhas    | Se existem campanhas e promoções planejadas com antecedência — com objetivo claro, período definido e divulgação estruturada            |
| M4     | Estratégia de Retenção       | Se existem ações sistemáticas para fazer o cliente retornar (programa de fidelidade, comunicação pós-visita, datas especiais, etc.)     |
| M5     | Mensuração de Resultados     | Se consegue medir o retorno das ações de marketing — novos clientes por canal, ROI de campanhas, crescimento de seguidores qualificados |

#### Indicadores de Observação

| Código | Sinal | Descrição | Interpretação na Avaliação |
|--------|-------|-----------|----------------------------|
| `MKT-IRREG` | `*` | Postagens irregulares | Presença nas redes sociais inconsistente — dias sem postar, sem padrão visual ou frequência |
| `MKT-SEMSEQ` | `*` | Sem público definido | O negócio não sabe quem é seu cliente ideal (ICP) — comunica para "todo mundo", que é o mesmo que não comunicar para ninguém |
| `MKT-SEMMET` | `*` | Sem campanha definida | Sem ações de marketing planejadas — promoções são feitas por impulso, sem objetivo claro |
| `MKT-SEMRET` | `*` | Sem estratégia de retenção | Não existe nenhuma ação para fazer o cliente voltar (fidelidade, cashback, aniversário, etc.) |
| `MKT-CAL` | `#` | Calendário bem estruturado | Boa prática: existe calendário de conteúdo mensal, com datas comemorativas e promoções planejadas |
| `MKT-FUNIL` | `#` | Funil de aquisição definido | Boa prática: existe clareza sobre como novos clientes chegam ao negócio e há ações para cada etapa do funil |
| `MKT-ROI` | `#` | Mede retorno financeiro | Boa prática: consegue mensurar o retorno financeiro das ações de marketing — quantos clientes vieram de uma campanha específica |

***

### Área 8 — Gestão & Estratégia (`GES`)

**Objetivo:** Avaliar o nível de gestão estratégica do negócio — se existe planejamento, reuniões periódicas, indicadores de performance e visão de crescimento de médio/longo prazo.

**Por que é crítico:** A diferença entre um negócio que sobrevive e um que cresce está na gestão estratégica. Um dono que só "apaga incêndios" (gestão reativa) nunca consegue construir sistemas de crescimento. Sem plano trimestral, sem reuniões de análise e sem visão de futuro, o negócio permanece pequeno e dependente.

#### Critérios de Pontuação (max. 125 pts)

| Código | Critério                | O que avalia                                                                                                                      |
| ------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| G1     | Gestão por Indicadores  | Se o negócio acompanha KPIs formais (faturamento, CMV, ticket médio, ocupação, etc.) de forma regular e usa dados para decisões   |
| G2     | Planejamento Mensal     | Se existe um plano de ações mensal documentado — com prioridades definidas, responsáveis e prazo, não apenas a rotina operacional |
| G3     | Reuniões de Análise     | Se realiza reuniões periódicas (mensais ou quinzenais) com pauta estruturada para revisar resultados e ajustar o plano            |
| G4     | Planejamento Trimestral | Se existe um plano de médio prazo (90 dias) com metas específicas, iniciativas estratégicas e marcos de acompanhamento            |
| G5     | Visão de Crescimento    | Se o dono consegue articular claramente onde quer estar em 12 a 24 meses — com metas concretas de expansão, equipe ou faturamento |

#### Indicadores de Observação

| Código | Sinal | Descrição | Interpretação na Avaliação |
|--------|-------|-----------|----------------------------|
| `GES-APAG` | `*` | Gestão reativa | O dono só age quando o problema aparece — sem processos preventivos ou planejamento antecipado |
| `GES-SEMM` | `*` | Sem plano mensal | Não existe um plano de ações para o mês — cada dia é uma surpresa |
| `GES-SEMIN` | `*` | Sem indicadores | Nenhum KPI acompanhado formalmente — decisões tomadas por percepção e não por dados |
| `GES-SEMR` | `*` | Sem reunião mensal | Não realiza reuniões periódicas para análise de resultados com sua equipe ou consigo mesmo |
| `GES-SEMV` | `*` | Sem visão de crescimento | O dono não consegue articular onde quer chegar em 12 ou 24 meses — foco 100% no operacional imediato |
| `GES-PLTRI` | `#` | Plano trimestral estruturado | Boa prática: existe um plano de metas e ações para os próximos 3 meses, por escrito e acompanhado |
| `GES-REUSTR` | `#` | Reuniões trimestrais com pauta | Boa prática: realiza reuniões periódicas com pauta definida para revisão de resultados e planejamento |

***

## Resumo das Áreas e Indicadores

| Área | Código | Critérios | Indicadores `*` | Indicadores `#` | Status Critérios |
|------|--------|-----------|-----------------|-----------------|-----------------|
| Financeiro | FIN | F1–F5 | 12 | 0 | ✅ Tabulado |
| CMV & Markup | CMV | C1–C5 | 5 | 3 | ✅ Tabulado |
| Operação | OPR | O1–O5 | 5 | 2 | ✅ Tabulado |
| Estoque | EST | E1,E2,E4,E5,E6 | 4 | 3 | ✅ Tabulado |
| Pessoas | PES | P1–P5 | 5 | 2 | ✅ Tabulado |
| Vendas | VEN | V1-V5 | 4 | 3 | ✅ Tabulado |
| Marketing | MKT | M1-M5 | 4 | 3 | ✅ Tabulado |
| Gestão & Estratégia | GES | G1-G5 | 5 | 2 | ✅ Tabulado |

***

## Estrutura do Banco de Dados

A seguir está o modelo de banco de dados recomendado para **Supabase (PostgreSQL)**, considerando que cada cliente terá seu scorecard montado individualmente pelo consultor dentro da plataforma.

### Diagrama Conceitual

```
clientes
   └── avaliacoes (1 por sessão de diagnóstico)
           ├── avaliacao_criterios (nota 0/12/25 por critério)
           └── avaliacao_indicadores (observações por indicador)

areas ─────────────── criterios (seeded)
  └──── indicadores_padrao (seeded/library)
```

### DDL Completo (PostgreSQL / Supabase)

```sql
-- ================================================
-- TABELA: clientes
-- Armazena os dados dos negócios avaliados
-- ================================================
CREATE TABLE clientes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_fantasia   TEXT NOT NULL,
  razao_social    TEXT,
  cnpj            TEXT,
  segmento        TEXT, -- ex: restaurante, lanchonete, food truck, padaria
  contato_nome    TEXT,
  contato_telefone TEXT,
  contato_email   TEXT,
  cidade          TEXT,
  estado          TEXT DEFAULT 'SP',
  ativo           BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- TABELA: areas
-- As 8 áreas fixas do scorecard (dados seedados)
-- ================================================
CREATE TABLE areas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          TEXT NOT NULL UNIQUE, -- 'FIN', 'CMV', 'OPR', 'EST', 'PES', 'VEN', 'MKT', 'GES'
  nome            TEXT NOT NULL,        -- 'Financeiro', 'CMV & Markup', etc.
  descricao       TEXT,
  pontos_maximos  INTEGER DEFAULT 125,
  ordem           INTEGER NOT NULL,     -- Ordem de exibição (1 a 8)
  criterios_tabulados BOOLEAN DEFAULT TRUE -- FALSE para VEN, MKT, GES
);

-- ================================================
-- TABELA: criterios
-- Critérios de pontuação por área (dados seedados)
-- ================================================
CREATE TABLE criterios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id         UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  codigo          TEXT NOT NULL UNIQUE, -- 'F1', 'F2', 'C1', 'O1', 'E1', 'P1'...
  nome            TEXT NOT NULL,        -- 'Separação Financeira', 'Ficha Técnica'...
  descricao       TEXT,                 -- Descrição detalhada do que está sendo avaliado
  pontos_maximos  INTEGER DEFAULT 25,
  ordem           INTEGER NOT NULL
);

-- ================================================
-- TABELA: indicadores_padrao
-- Biblioteca de indicadores predefinidos (dados seedados)
-- ================================================
CREATE TABLE indicadores_padrao (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id         UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  codigo          TEXT NOT NULL UNIQUE, -- 'FIN-SEP', 'CMV-FT?', 'OPR-GAR'...
  descricao       TEXT NOT NULL,        -- Descrição padrão do indicador
  tipo            TEXT NOT NULL CHECK (tipo IN ('positivo', 'negativo')),
  ativo           BOOLEAN DEFAULT TRUE
);

-- ================================================
-- TABELA: avaliacoes
-- Sessão de diagnóstico por cliente
-- ================================================
CREATE TABLE avaliacoes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id          UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  consultor_id        UUID REFERENCES auth.users(id), -- Usuário da plataforma (Ariel)
  data_avaliacao      DATE NOT NULL DEFAULT CURRENT_DATE,
  status              TEXT DEFAULT 'rascunho'
                        CHECK (status IN ('rascunho', 'em_andamento', 'concluido')),
  score_total         INTEGER, -- Calculado: soma de todos os avaliacao_criterios.nota
  classificacao       TEXT,    -- Calculado: faixa de maturidade baseada no score_total
  observacoes_gerais  TEXT,    -- Campo livre para observações gerais da avaliação
  versao              INTEGER DEFAULT 1, -- Para futuras reavaliações do mesmo cliente
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- TABELA: avaliacao_criterios
-- Pontuação por critério por avaliação (0 / 12 / 25)
-- ================================================
CREATE TABLE avaliacao_criterios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id    UUID NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
  criterio_id     UUID NOT NULL REFERENCES criterios(id),
  nota            INTEGER NOT NULL CHECK (nota IN (0, 12, 25)),
  justificativa   TEXT, -- Observação do consultor para fundamentar a nota
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(avaliacao_id, criterio_id)
);

-- ================================================
-- TABELA: avaliacao_indicadores
-- Indicadores observados durante a avaliação, com nota textual
-- ================================================
CREATE TABLE avaliacao_indicadores (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id            UUID NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
  indicador_padrao_id     UUID REFERENCES indicadores_padrao(id), -- NULL se for indicador customizado
  area_id                 UUID NOT NULL REFERENCES areas(id),
  codigo_custom           TEXT,    -- Usado apenas se indicador_padrao_id for NULL
  descricao_personalizada TEXT NOT NULL, -- O que Ariel escreveu após "=" para esse cliente
  tipo                    TEXT NOT NULL CHECK (tipo IN ('positivo', 'negativo')),
  created_at              TIMESTAMPTZ DEFAULT NOW()
);
-- Garante unicidade: mesma avaliação não pode ter o mesmo indicador padrão duas vezes
CREATE UNIQUE INDEX idx_avaliacao_indicador_unico
  ON avaliacao_indicadores(avaliacao_id, indicador_padrao_id)
  WHERE indicador_padrao_id IS NOT NULL;
```

### View Auxiliar: Score por Área

```sql
-- View para calcular score por área em cada avaliação
CREATE OR REPLACE VIEW vw_score_por_area AS
SELECT
  ac.avaliacao_id,
  a.id AS area_id,
  a.codigo AS area_codigo,
  a.nome AS area_nome,
  SUM(ac.nota) AS score_area,
  a.pontos_maximos,
  ROUND((SUM(ac.nota)::DECIMAL / a.pontos_maximos) * 100, 1) AS percentual
FROM avaliacao_criterios ac
JOIN criterios c ON ac.criterio_id = c.id
JOIN areas a ON c.area_id = a.id
GROUP BY ac.avaliacao_id, a.id, a.codigo, a.nome, a.pontos_maximos;
```

### Função: Calcular e Atualizar Score Total

```sql
-- Função para calcular score total e classificação automaticamente
CREATE OR REPLACE FUNCTION calcular_score_avaliacao(p_avaliacao_id UUID)
RETURNS VOID AS $$
DECLARE
  v_score INTEGER;
  v_classificacao TEXT;
BEGIN
  SELECT COALESCE(SUM(nota), 0)
  INTO v_score
  FROM avaliacao_criterios
  WHERE avaliacao_id = p_avaliacao_id;

  v_classificacao := CASE
    WHEN v_score BETWEEN 0   AND 350  THEN 'Risco Estrutural Alto'
    WHEN v_score BETWEEN 351 AND 500  THEN 'Operação Instável'
    WHEN v_score BETWEEN 501 AND 650  THEN 'Estrutura Funcional'
    WHEN v_score BETWEEN 651 AND 800  THEN 'Estrutura Organizada'
    WHEN v_score BETWEEN 801 AND 900  THEN 'Gestão Profissional'
    WHEN v_score BETWEEN 901 AND 1000 THEN 'Operação Escalável'
    ELSE 'Não Calculado'
  END;

  UPDATE avaliacoes
  SET score_total = v_score,
      classificacao = v_classificacao,
      updated_at = NOW()
  WHERE id = p_avaliacao_id;
END;
$$ LANGUAGE plpgsql;
```

### Resumo das Tabelas

| Tabela | Tipo | Descrição |
|--------|------|-----------|
| `clientes` | Transacional | Dados dos negócios avaliados |
| `areas` | Seedada | As 8 áreas fixas do scorecard |
| `criterios` | Seedada | Critérios de pontuação por área |
| `indicadores_padrao` | Seedada | Biblioteca de indicadores predefinidos |
| `avaliacoes` | Transacional | Cada sessão de diagnóstico por cliente |
| `avaliacao_criterios` | Transacional | Notas (0/12/25) por critério por avaliação |
| `avaliacao_indicadores` | Transacional | Indicadores observados com notas textuais |

***

## Instruções para a IA da Plataforma

Ao processar ou gerar um scorecard, a IA deve seguir estas diretrizes:

1. **Escala de notas:** Sempre usar apenas os valores `0`, `12` ou `25`. Nunca interpolação.
2. **Indicadores negativos (`*`):** Representam ausência, desorganização ou prática inadequada. Contribuem para notas 0 ou 12.
3. **Indicadores positivos (`#`):** Representam boas práticas implementadas. Contribuem para nota 25.
4. **Campo de observação:** O texto após `=` nos indicadores é sempre específico do cliente. Deve ser tratado como campo livre e único por avaliação.
5. **Áreas pendentes:** VENDAS, MARKETING e GESTÃO & ESTRATÉGIA ainda não possuem critérios formalizados. A IA deve tratar essas áreas com cautela e aguardar a tabulação completa.
6. **Score máximo:** 1000 pontos (8 áreas × 5 critérios × 25 pts). Qualquer score acima de 1000 indica erro de cálculo.
7. **Classificação automática:** Sempre calcular a faixa de maturidade com base no score total conforme a tabela de bandas definida.
8. **Evolução histórica:** Cada cliente pode ter múltiplas avaliações ao longo do tempo. Preservar o histórico para medir evolução.