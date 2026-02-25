#!/bin/bash
set -e

# Garantir existência das pastas
mkdir -p .codex/agents
mkdir -p .squads/agents

echo "Iniciando sincronização de agentes..."

# 1. De .codex/agents para .squads/agents (Fonte Primária)
for file in .codex/agents/*.md; do
    [ -e "$file" ] || continue
    filename=$(basename "$file")
    dest=".squads/agents/$filename"
    
    if [ ! -f "$dest" ]; then
        cp "$file" "$dest"
        echo "✓ $filename criado em .squads/agents"
    elif ! cmp -s "$file" "$dest"; then
        cp "$file" "$dest"
        echo "✓ $filename atualizado em .squads/agents"
    else
        echo "- $filename já sincronizado"
    fi
done

# 2. De .squads/agents para .codex/agents (Novos agentes)
for file in .squads/agents/*.md; do
    [ -e "$file" ] || continue
    filename=$(basename "$file")
    dest=".codex/agents/$filename"
    
    if [ ! -f "$dest" ]; then
        cp "$file" "$dest"
        echo "✓ $filename copiado para .codex/agents (fonte primária)"
    fi
done

echo "Sincronização concluída."
