#!/usr/bin/env python3
"""
Substitui emojis nos .callout__icon pelos ícones Font Awesome correspondentes,
usando o modifier da classe do .callout pai como fonte de verdade.

Uso: python fix_callout_icons.py
Executa a partir da raiz do projeto (onde está a pasta modulos/).
"""

import re
from pathlib import Path

# Mapeamento: modifier do callout → classe FA
ICON_MAP = {
    "callout--info":    '<i class="fa-solid fa-circle-info" aria-hidden="true"></i>',
    "callout--warning": '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>',
    "callout--success": '<i class="fa-solid fa-circle-check" aria-hidden="true"></i>',
    "callout--error":   '<i class="fa-solid fa-circle-xmark" aria-hidden="true"></i>',
}

# Captura o bloco completo: div.callout com seu modifier + div.callout__icon com o emoji
PATTERN = re.compile(
    r'(<div class="callout (callout--\w+)">\s*<div class="callout__icon">)'
    r'[^<]+'           # emoji (qualquer conteúdo que não seja tag)
    r'(</div>)',
    re.MULTILINE,
)

def substituir(match: re.Match) -> str:
    prefixo   = match.group(1)   # <div class="callout callout--info"><div class="callout__icon">
    modifier  = match.group(2)   # callout--info
    sufixo    = match.group(3)   # </div>

    icone = ICON_MAP.get(modifier)
    if not icone:
        return match.group(0)    # modifier desconhecido — mantém original

    return f"{prefixo}{icone}{sufixo}"

def processar_arquivo(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    novo, n = PATTERN.subn(substituir, original)

    if n == 0:
        return False

    path.write_text(novo, encoding="utf-8")
    print(f"  {path.name}: {n} substituição(ões)")
    return True

def main():
    modulos = sorted(Path("modulos").glob("modulo-*.html"))
    if not modulos:
        print("Nenhum arquivo encontrado. Execute a partir da raiz do projeto.")
        return

    print(f"Processando {len(modulos)} arquivos...\n")
    alterados = sum(processar_arquivo(p) for p in modulos)
    print(f"\nConcluído. {alterados}/{len(modulos)} arquivo(s) alterado(s).")

if __name__ == "__main__":
    main()
