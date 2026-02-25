---
id: agents-sync
name: Agents Sync
description: Sincroniza agentes entre .codex/agents e .squads/agents
---

# Agents Sync

Esta skill é responsável por manter a paridade estrutural entre os diretórios de agentes do projeto.

## Princípios de Operação

- **Fonte Primária:** `.codex/agents` é considerada a fonte da verdade.
- **Sincronização Determinística:** O processo segue regras rígidas de cópia sem alteração de conteúdo.
- **Segurança:** 
    - Nunca apaga arquivos.
    - Nunca altera o conteúdo interno dos arquivos.
    - Nunca renomeia arquivos.
- **Idempotência:** A execução repetida não gera efeitos colaterais ou alterações desnecessárias.

## Ativação

A skill pode ser ativada manualmente via comando `/agents-sync`.

## Funcionamento

1. Verifica a existência das pastas `.codex/agents` e `.squads/agents`.
2. Para cada arquivo em `.codex/agents`, se não existir em `.squads/agents` ou for diferente, ele é copiado.
3. Para cada arquivo em `.squads/agents`, se não existir em `.codex/agents`, ele é copiado para a fonte primária.
