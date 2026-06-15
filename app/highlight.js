export const Highlight = {
   go(code) {
      // Escapa HTML primeiro
      let out = code
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')

      // Números (antes dos saves para não conflitar com placeholders)
      out = out.replace(
         /\b(\d+(?:\.\d+)?)\b/g,
         '<span class="tok-number">$1</span>',
      )

      // Guarda strings e comentários como placeholders para não serem
      // afetados pelas substituições de keywords/types abaixo
      const saved = []
      const save = match => {
         saved.push(match)
         return `\x00${saved.length - 1}\x00`
      }

      // Strings (backtick e aspas duplas)
      out = out.replace(/(`[^`]*`|"(?:[^"\\]|\\.)*")/g, save)
      // Comentários de bloco
      out = out.replace(/(\/\*[\s\S]*?\*\/)/g, save)
      // Comentários de linha
      out = out.replace(/(\/\/[^\n]*)/g, save)

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
      out = out.replace(/\x00(\d+)\x00/g, (_, i) => {
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
