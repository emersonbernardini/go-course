#!/usr/bin/env python3
"""
Servidor de dev para o curso-go.
Faz rewrite de todas as rotas sem extensão para index.html,
permitindo que o roteador JS cuide da navegação.

Uso: python serve.py [porta]
     python serve.py 8000
"""
import sys
import time
from http.server import SimpleHTTPRequestHandler, HTTPServer


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Remove query string pra checar o path limpo
        path = self.path.split('?')[0]
        # Se não tem extensão → é uma rota do SPA → serve index.html
        if '.' not in path.split('/')[-1]:
            self.path = '/index.html'
        super().do_GET()

    def log_message(self, fmt, *args):
        status = args[1]
        # Cor verde pra 2xx, amarelo pra 3xx, vermelho pra 4/5xx
        color = '\033[32m' if status.startswith('2') else \
                '\033[33m' if status.startswith('3') else '\033[31m'
        reset = '\033[0m'
        print(f'  {color}{args[0]}{reset} {status}')


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
print(f'\033[1m  GoCourse dev server\033[0m')
print(f'  http://localhost:{port}\n')
try:
    HTTPServer(('', port), Handler).serve_forever()
except KeyboardInterrupt:
    time.sleep(1.5)
    print('\n  Servidor encerrado.')
