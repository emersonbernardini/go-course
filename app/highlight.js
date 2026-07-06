export const Highlight = {
   go(code) {
      // Escapa HTML primeiro
      let out = code
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')

      // Guarda strings e comentários como placeholders ANTES de qualquer
      // outra substituição (números, keywords, types), para que o conteúdo
      // interno deles nunca seja tocado.
      // Marcador não pode ser puramente numérico: \b\d+\b casaria os
      // dígitos do índice do placeholder e corromperia o restore.
      const saved = []
      const save = match => {
         saved.push(match)
         return `\x00P${saved.length - 1}Q\x00`
      }

      // Strings (backtick e aspas duplas) — precisa vir antes dos
      // comentários: uma string pode conter "//" ou "/*" (ex: URLs).
      out = out.replace(/(`[^`]*`|"(?:[^"\\]|\\.)*")/g, save)
      // Comentários de bloco
      out = out.replace(/(\/\*[\s\S]*?\*\/)/g, save)
      // Comentários de linha
      out = out.replace(/(\/\/[^\n]*)/g, save)

      // Números (agora seguro: strings/comentários já viraram placeholders)
      out = out.replace(
         /\b(\d+(?:\.\d+)?)\b/g,
         '<span class="tok-number">$1</span>',
      )

      // Keywords Go
      const keywords = [
         'package',
         'import',
         'func',
         'return',
         'var',
         'const',
         'type',
         'struct',
         'interface',
         'map',
         'chan',
         'go',
         'select',
         'case',
         'default',
         'break',
         'continue',
         'for',
         'range',
         'if',
         'else',
         'switch',
         'defer',
         'make',
         'new',
         'append',
         'len',
         'cap',
         'close',
         'delete',
         'copy',
         'panic',
         'recover',
         'print',
         'println',
         'true',
         'false',
         'nil',
         'iota',
      ]
      out = out.replace(
         new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'),
         '<span class="tok-keyword">$1</span>',
      )

      // Tipos built-in
      const types = [
         'int',
         'int8',
         'int16',
         'int32',
         'int64',
         'uint',
         'uint8',
         'uint16',
         'uint32',
         'uint64',
         'float32',
         'float64',
         'complex64',
         'complex128',
         'bool',
         'string',
         'byte',
         'rune',
         'error',
         'any',
      ]
      out = out.replace(
         new RegExp(`\\b(${types.join('|')})\\b`, 'g'),
         '<span class="tok-type">$1</span>',
      )

      // Funções — identificador seguido de (
      out = out.replace(
         /\b([a-zA-Z_][a-zA-Z0-9_]*)(\s*\()/g,
         '<span class="tok-func">$1</span>$2',
      )

      // Restaura strings e comentários com suas classes
      out = out.replace(/\x00P(\d+)Q\x00/g, (_, i) => {
         const val = saved[+i]
         const cls =
            val.startsWith('//') || val.startsWith('/*')
               ? 'tok-comment'
               : 'tok-string'
         return `<span class="${cls}">${val}</span>`
      })

      return out
   },
}
