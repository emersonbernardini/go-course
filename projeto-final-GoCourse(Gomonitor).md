# GoMonitor — Mapa de Implementação do Projeto Final

> Documento de referência para implementação do projeto prático do curso GoCourse.
> Deve ser lido após a conclusão dos 34 módulos de conteúdo teórico.

---

## Visão Geral

**Nome do projeto:** GoMonitor  
**Descrição:** Ferramenta CLI que monitora a disponibilidade de URLs em background, serve uma API JSON de status e gera relatórios de uptime.  
**Repositório:** `github.com/<usuario>/gomonitor`  
**Público:** Qualquer desenvolvedor que concluiu os 34 módulos do GoCourse.

### O que o usuário entrega ao final

- Binário compilado e funcional (`gomonitor`)
- API REST em `localhost:8080/status`
- Relatório exportável em JSON
- `go test ./...` passando
- README documentado e profissional
- Commits que contam a história da construção

---

## Arquitetura Final do Sistema

```
gomonitor/
│
├── main.go                  # Entry point — CLI parsing, bootstrap
│
├── config/
│   └── config.go            # Configuração: targets, intervalo, porta
│
├── checker/
│   ├── checker.go           # Interface Checker + implementação HTTP
│   └── checker_test.go      # Testes com mock de HTTP client
│
├── monitor/
│   ├── monitor.go           # Engine principal: goroutines, channels, loop
│   └── monitor_test.go      # Testes do pipeline de monitoramento
│
├── storage/
│   ├── storage.go           # Interface Storage + implementação in-memory
│   ├── file.go              # Implementação com persistência em arquivo JSON
│   └── storage_test.go      # Testes de leitura/escrita
│
├── reporter/
│   ├── reporter.go          # Geração de relatório (uptime %, histórico)
│   └── reporter_test.go
│
├── api/
│   ├── server.go            # Servidor HTTP net/http — endpoints REST
│   └── server_test.go       # Testes dos handlers
│
├── go.mod
├── go.sum
└── README.md
```

---

## Fluxo de dados do sistema

```
[Config] → URLs a monitorar
    ↓
[Monitor] cria uma goroutine por URL
    ↓
cada goroutine chama [Checker].Check(url) em intervalo fixo
    ↓
resultado (status, latência, timestamp) → channel de resultados
    ↓
[Monitor] lê o channel e chama [Storage].Save(result)
    ↓
[API Server] lê [Storage].GetAll() e serve /status
[Reporter]   lê [Storage].GetAll() e gera relatório
```

---

## Mapeamento Módulo → Implementação

Cada módulo do curso entrega um pedaço concreto do projeto.
O exercício prático do módulo implementa exatamente o que está descrito aqui.

---

### Módulo 03 — Estrutura de um programa Go
**Entrega:** Esqueleto do projeto

```go
// main.go
package main

import "fmt"

func main() {
    fmt.Println("GoMonitor v0.1")
}
```

**O que o usuário faz:**
- Criar o diretório `gomonitor/`
- Rodar `go mod init github.com/<usuario>/gomonitor`
- Criar `main.go` com o esqueleto acima
- Rodar `go run main.go` e ver o output

**Conceitos exercitados:** `package main`, `import`, `func main()`, `go mod init`

---

### Módulo 04 — Variáveis e constantes
**Entrega:** Constantes de configuração e variáveis de estado

```go
// config/config.go
package config

const (
    DefaultInterval = 30  // segundos entre cada verificação
    DefaultPort     = 8080
    DefaultTimeout  = 10  // timeout de cada requisição HTTP
    Version         = "0.1.0"
)

var DefaultTargets = []string{
    "https://go.dev",
    "https://pkg.go.dev",
}
```

**O que o usuário faz:**
- Criar o package `config`
- Declarar constantes com `iota` para status (Up, Down, Unknown)
- Importar e usar em `main.go`

**Conceitos exercitados:** `const`, `iota`, `var`, zero values, escopo de pacote

---

### Módulo 05 — Tipos básicos
**Entrega:** Tipos primitivos usados no domínio

```go
// dentro de checker/checker.go (introdução dos tipos)

// StatusCode representa o resultado de uma verificação
// 0 = desconhecido, 1 = online, 2 = offline
type StatusCode int

const (
    StatusUnknown StatusCode = iota
    StatusUp
    StatusDown
)

// latência em milissegundos (int64), URL como string,
// HTTP status code como int, mensagem de erro como string
```

**O que o usuário faz:**
- Definir os tipos primitivos que representam o domínio
- Entender por que `int64` para latência (não `int`)
- Entender por que `string` para URL (não `[]byte`)

**Conceitos exercitados:** `int`, `int64`, `string`, `bool`, conversão de tipos

---

### Módulo 06 — Operadores
**Entrega:** Lógica de cálculo de uptime

```go
// dentro de reporter/reporter.go

func calcularUptime(total, online int) float64 {
    if total == 0 {
        return 0
    }
    return float64(online) / float64(total) * 100
}

func estaOnline(statusCode int) bool {
    return statusCode >= 200 && statusCode < 300
}
```

**O que o usuário faz:**
- Implementar `calcularUptime` e `estaOnline`
- Usar operadores aritméticos, relacionais e lógicos no contexto real

**Conceitos exercitados:** operadores aritméticos, relacionais (`>=`, `<`), lógicos (`&&`), conversão de tipo (`float64`)

---

### Módulo 07 — Condicionais
**Entrega:** Classificação de resultado HTTP

```go
// dentro de checker/checker.go

func classificarResposta(statusCode int, err error) StatusCode {
    if err != nil {
        return StatusDown
    }

    switch {
    case statusCode >= 200 && statusCode < 300:
        return StatusUp
    case statusCode >= 500:
        return StatusDown
    default:
        return StatusUnknown
    }
}
```

**O que o usuário faz:**
- Implementar a função de classificação completa
- Usar `if` com inicialização para o erro
- Usar `switch` sem expressão (expression-less switch)

**Conceitos exercitados:** `if/else`, `if` com init, `switch` expression e type

---

### Módulo 08 — Laços
**Entrega:** Loop de monitoramento contínuo

```go
// dentro de monitor/monitor.go (versão sem goroutine ainda)

func loopSimples(urls []string, intervalo int) {
    for {
        for _, url := range urls {
            resultado := checar(url)
            fmt.Printf("[%s] %s — %dms\n",
                resultado.Timestamp.Format("15:04:05"),
                url,
                resultado.Latencia,
            )
        }
        // aguarda próximo ciclo
        time.Sleep(time.Duration(intervalo) * time.Second)
    }
}
```

**O que o usuário faz:**
- Implementar o loop de monitoramento sequencial (sem concorrência ainda)
- Usar `for` infinito, `range`, `break` com label para parada controlada

**Conceitos exercitados:** `for` clássico, `for` infinito, `range`, `break`, `continue`, labels

---

### Módulo 09 — Arrays
**Entrega:** Buffer fixo de histórico recente

```go
// dentro de storage/storage.go

// HistoricoRecente mantém os últimos N resultados de uma URL
// usando array de tamanho fixo como buffer circular
type HistoricoRecente struct {
    resultados [10]Resultado  // array fixo — os últimos 10
    proximo    int
    total      int
}

func (h *HistoricoRecente) adicionar(r Resultado) {
    h.resultados[h.proximo%10] = r
    h.proximo++
    if h.total < 10 {
        h.total++
    }
}
```

**O que o usuário faz:**
- Implementar o buffer circular com array de tamanho fixo
- Entender na prática por que o tamanho é parte do tipo

**Conceitos exercitados:** declaração de array, tamanho fixo como parte do tipo, iteração, limitações

---

### Módulo 10 — Slices
**Entrega:** Histórico completo ilimitado e lista de targets

```go
// dentro de storage/storage.go

type Storage struct {
    resultados map[string][]Resultado  // url → slice de resultados
}

func (s *Storage) Salvar(r Resultado) {
    s.resultados[r.URL] = append(s.resultados[r.URL], r)
}

func (s *Storage) UltimosN(url string, n int) []Resultado {
    todos := s.resultados[url]
    if len(todos) <= n {
        return todos
    }
    return todos[len(todos)-n:]  // slicing para pegar os últimos N
}
```

**O que o usuário faz:**
- Migrar de array fixo para slice dinâmico
- Implementar `UltimosN` com slicing de três índices
- Entender o gotcha de memória compartilhada ao retornar subslices

**Conceitos exercitados:** `make`, `append`, `copy`, slicing, backing array, gotchas de memória

---

### Módulo 11 — Maps
**Entrega:** Índice de estado atual por URL

```go
// dentro de storage/storage.go

type EstadoAtual struct {
    URL        string
    Status     StatusCode
    UltimaVez  time.Time
    Latencia   int64
    HTTPStatus int
}

type Storage struct {
    estado     map[string]EstadoAtual  // estado atual de cada URL
    historico  map[string][]Resultado  // histórico completo
}

func (s *Storage) AtualizarEstado(r Resultado) {
    s.estado[r.URL] = EstadoAtual{
        URL:        r.URL,
        Status:     r.Status,
        UltimaVez:  r.Timestamp,
        Latencia:   r.Latencia,
        HTTPStatus: r.HTTPStatus,
    }
}

func (s *Storage) BuscarEstado(url string) (EstadoAtual, bool) {
    estado, ok := s.estado[url]  // comma ok pattern
    return estado, ok
}
```

**O que o usuário faz:**
- Implementar o índice de estado com map
- Usar comma ok para verificar existência
- Entender por que maps não são thread-safe (spoiler para o módulo de sync)

**Conceitos exercitados:** declaração, `make`, leitura/escrita/deleção, comma ok, iteração

---

### Módulo 12 — Funções: fundamentos
**Entrega:** Funções do domínio com múltiplos retornos

```go
// dentro de checker/checker.go

// checarURL faz a requisição e retorna resultado + erro
func checarURL(url string, timeoutSeg int) (Resultado, error) {
    inicio := time.Now()

    client := &http.Client{
        Timeout: time.Duration(timeoutSeg) * time.Second,
    }

    resp, err := client.Get(url)
    latencia := time.Since(inicio).Milliseconds()

    if err != nil {
        return Resultado{
            URL:      url,
            Status:   StatusDown,
            Latencia: latencia,
            Erro:     err.Error(),
        }, err
    }
    defer resp.Body.Close()

    return Resultado{
        URL:        url,
        Status:     classificarResposta(resp.StatusCode, nil),
        HTTPStatus: resp.StatusCode,
        Latencia:   latencia,
        Timestamp:  time.Now(),
    }, nil
}
```

**O que o usuário faz:**
- Implementar `checarURL` com múltiplos retornos
- Usar `defer` para fechar o body
- Passar funções como argumento (factory de checker)

**Conceitos exercitados:** declaração, parâmetros, múltiplos retornos, retornos nomeados, first-class functions

---

### Módulo 13 — Funções: avançado
**Entrega:** Middleware de retry com backoff e closure de configuração

```go
// dentro de checker/checker.go

// comRetry retorna uma função que tenta até maxTentativas vezes
// com backoff exponencial — closure captura a configuração
func comRetry(fn func(string) (Resultado, error), maxTentativas int) func(string) (Resultado, error) {
    return func(url string) (Resultado, error) {
        var ultimo error
        for i := range maxTentativas {
            resultado, err := fn(url)
            if err == nil {
                return resultado, nil
            }
            ultimo = err
            espera := time.Duration(1<<uint(i)) * time.Second  // 1s, 2s, 4s...
            time.Sleep(espera)
        }
        return Resultado{URL: url, Status: StatusDown}, ultimo
    }
}

// init registra métricas iniciais
func init() {
    log.SetPrefix("[gomonitor] ")
    log.SetFlags(log.Ltime | log.Lshortfile)
}
```

**O que o usuário faz:**
- Implementar `comRetry` como higher-order function com closure
- Implementar função variádica `checarTodas(urls ...string)`
- Usar `defer` para logging de tempo de execução
- Usar `panic/recover` no servidor HTTP para não derrubar o processo

**Conceitos exercitados:** closures, variádicas, `defer`, `panic/recover`, `init()`

---

### Módulo 14 — Structs
**Entrega:** Modelo de domínio completo

```go
// dentro de checker/checker.go

type Resultado struct {
    URL        string     `json:"url"`
    Status     StatusCode `json:"status"`
    HTTPStatus int        `json:"http_status,omitempty"`
    Latencia   int64      `json:"latency_ms"`
    Timestamp  time.Time  `json:"timestamp"`
    Erro       string     `json:"error,omitempty"`
}

// Config embeds as configurações de timeout/retry
type CheckerConfig struct {
    TimeoutSeg    int
    MaxTentativas int
    UserAgent     string
}

// HTTPChecker embeds CheckerConfig para herdar configurações
type HTTPChecker struct {
    CheckerConfig                    // embedding
    client        *http.Client
}

func NovoHTTPChecker(cfg CheckerConfig) *HTTPChecker {
    return &HTTPChecker{
        CheckerConfig: cfg,
        client: &http.Client{
            Timeout: time.Duration(cfg.TimeoutSeg) * time.Second,
        },
    }
}
```

**O que o usuário faz:**
- Definir todas as structs do domínio com tags JSON
- Usar embedding para composição de configuração
- Usar struct anônima para configuração inline em testes

**Conceitos exercitados:** declaração, campos, literal, structs anônimas, embedding, tags

---

### Módulo 15 — Ponteiros
**Entrega:** Receivers de ponteiro no Storage e passagem eficiente

```go
// dentro de storage/storage.go

type MemoryStorage struct {
    estado    map[string]EstadoAtual
    historico map[string][]Resultado
}

// Receiver de ponteiro — modifica o estado interno
func (s *MemoryStorage) Salvar(r Resultado) {
    s.historico[r.URL] = append(s.historico[r.URL], r)
    s.estado[r.URL] = EstadoAtual{
        URL:      r.URL,
        Status:   r.Status,
        Latencia: r.Latencia,
    }
}

// Resultado é passado por valor — é pequeno, sem necessidade de ponteiro
// Config é passada por ponteiro — pode ser grande e é compartilhada
func NovoMonitor(cfg *config.Config, storage *MemoryStorage) *Monitor {
    return &Monitor{cfg: cfg, storage: storage}
}
```

**O que o usuário faz:**
- Converter receivers de valor para ponteiro onde necessário
- Documentar por que cada decisão foi tomada nos comentários
- Identificar nil pointer panic e adicionar guarda

**Conceitos exercitados:** `&` e `*`, nil pointer, valor vs referência, quando usar ponteiro

---

### Módulo 16 — Métodos
**Entrega:** Métodos do Monitor e do Checker

```go
// dentro de monitor/monitor.go

type Monitor struct {
    cfg     *config.Config
    storage Storage
    checker checker.Checker
}

func (m *Monitor) Iniciar() {
    // implementado no módulo de goroutines
}

func (m *Monitor) Parar() {
    // implementado no módulo de channels
}

func (m *Monitor) StatusGeral() RelatorioGeral {
    return m.storage.RelatorioGeral()
}

// Método em tipo não-struct: StatusCode tem método String()
func (s StatusCode) String() string {
    switch s {
    case StatusUp:
        return "UP"
    case StatusDown:
        return "DOWN"
    default:
        return "UNKNOWN"
    }
}
```

**O que o usuário faz:**
- Adicionar métodos a todas as structs do domínio
- Implementar `String()` em `StatusCode` (satisfaz `fmt.Stringer`)
- Entender receiver por valor vs ponteiro na prática

**Conceitos exercitados:** receivers por valor e ponteiro, métodos em tipos não-struct

---

### Módulo 17 — Interfaces
**Entrega:** Interfaces `Checker` e `Storage` — coração da arquitetura

```go
// dentro de checker/checker.go
type Checker interface {
    Check(url string) (Resultado, error)
}

// dentro de storage/storage.go
type Storage interface {
    Salvar(resultado Resultado)
    BuscarEstado(url string) (EstadoAtual, bool)
    UltimosN(url string, n int) []Resultado
    RelatorioGeral() []EstadoAtual
}

// MockChecker para testes — implementa Checker sem HTTP real
type MockChecker struct {
    Resposta Resultado
    Erro     error
}

func (m *MockChecker) Check(url string) (Resultado, error) {
    return m.Resposta, m.Erro
}
```

**O que o usuário faz:**
- Definir as duas interfaces centrais
- Refatorar `Monitor` para depender das interfaces, não das implementações
- Implementar `MockChecker` para uso nos testes
- Usar `interface{}` / `any` para campo de metadados genérico

**Conceitos exercitados:** implementação implícita, `any`, type assertion, type switch, interfaces pequenas

---

### Módulo 18 — Erros
**Entrega:** Hierarquia de erros tipados do GoMonitor

```go
// dentro de checker/errors.go

// ErrTimeout indica que a URL não respondeu no tempo limite
type ErrTimeout struct {
    URL     string
    Timeout time.Duration
}

func (e *ErrTimeout) Error() string {
    return fmt.Sprintf("timeout após %v verificando %s", e.Timeout, e.URL)
}

// ErrDNS indica falha de resolução de nome
type ErrDNS struct {
    URL  string
    Causa string
}

func (e *ErrDNS) Error() string {
    return fmt.Sprintf("falha de DNS para %s: %s", e.URL, e.Causa)
}

// ErrHTTP indica resposta com status de erro
type ErrHTTP struct {
    URL    string
    Status int
}

func (e *ErrHTTP) Error() string {
    return fmt.Sprintf("%s respondeu com HTTP %d", e.URL, e.Status)
}

// classificarErro converte error genérico em erro tipado do domínio
func classificarErro(url string, err error) error {
    if err == nil {
        return nil
    }

    var netErr net.Error
    if errors.As(err, &netErr) && netErr.Timeout() {
        return &ErrTimeout{URL: url}
    }

    // wrapping para preservar contexto
    return fmt.Errorf("verificando %s: %w", url, err)
}
```

**O que o usuário faz:**
- Criar os três tipos de erro do domínio
- Implementar `classificarErro` com `errors.As`
- Usar `%w` para wrapping em todos os pontos de retorno de erro
- Usar `errors.Is` nos testes para verificar tipo de erro

**Conceitos exercitados:** `error` como tipo, `errors.New`, `fmt.Errorf`, erros customizados, `errors.Is/As`, wrapping com `%w`

---

### Módulo 19 — Pacotes
**Entrega:** Organização final em packages com responsabilidades claras

```
checker/   → sabe como verificar URLs (domínio de verificação)
storage/   → sabe como armazenar resultados (domínio de persistência)
monitor/   → orquestra checker + storage (domínio de controle)
reporter/  → sabe como gerar relatórios (domínio de apresentação)
api/       → sabe como servir HTTP (domínio de interface)
config/    → configuração global (sem dependências internas)
```

**O que o usuário faz:**
- Reorganizar o código nos packages corretos
- Garantir que não há importação circular
- Exportar apenas o que outros packages precisam
- Criar `internal/` para utilitários privados do projeto

**Conceitos exercitados:** criando packages, exportação por maiúscula, packages internos, organização

---

### Módulo 20 — Go Modules
**Entrega:** `go.mod` limpo e dependências documentadas

```
// go.mod final — zero dependências externas (stdlib only)
module github.com/<usuario>/gomonitor

go 1.22
```

**O que o usuário faz:**
- Verificar que o projeto usa apenas stdlib
- Rodar `go mod tidy` e entender o output
- Entender por que zero dependências externas é um diferencial

**Conceitos exercitados:** `go mod init`, `go.mod`, `go.sum`, `go get`, `go tidy`, versionamento semântico

---

### Módulo 21 — Goroutines
**Entrega:** Monitoramento paralelo de todas as URLs

```go
// dentro de monitor/monitor.go

func (m *Monitor) Iniciar(ctx context.Context) {
    var wg sync.WaitGroup

    for _, url := range m.cfg.URLs {
        wg.Add(1)
        go func(u string) {
            defer wg.Done()
            m.loopURL(ctx, u)
        }(url)  // captura correta da variável de loop
    }

    wg.Wait()
}

func (m *Monitor) loopURL(ctx context.Context, url string) {
    ticker := time.NewTicker(time.Duration(m.cfg.Intervalo) * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            resultado, err := m.checker.Check(url)
            if err != nil {
                resultado.Erro = err.Error()
            }
            m.resultados <- resultado
        }
    }
}
```

**O que o usuário faz:**
- Refatorar o loop sequencial para goroutines paralelas
- Usar `WaitGroup` para aguardar todas as goroutines
- Entender e corrigir o gotcha de captura de variável de loop
- Rodar o race detector: `go run -race main.go`

**Conceitos exercitados:** `go` keyword, scheduler M:N, race conditions, `WaitGroup`

---

### Módulo 22 — Channels
**Entrega:** Pipeline de resultados via channel

```go
// dentro de monitor/monitor.go

type Monitor struct {
    cfg        *config.Config
    storage    Storage
    checker    checker.Checker
    resultados chan checker.Resultado  // channel de resultados
    parar      chan struct{}           // sinal de parada
}

func NovoMonitor(cfg *config.Config, s Storage, c checker.Checker) *Monitor {
    return &Monitor{
        cfg:        cfg,
        storage:    s,
        checker:    c,
        resultados: make(chan checker.Resultado, len(cfg.URLs)*2),  // buffered
        parar:      make(chan struct{}),
    }
}

// coletarResultados lê do channel e persiste — roda em goroutine separada
func (m *Monitor) coletarResultados() {
    for resultado := range m.resultados {
        m.storage.Salvar(resultado)
    }
}
```

**O que o usuário faz:**
- Adicionar o channel de resultados ao Monitor
- Implementar o coletor que lê do channel em loop com `range`
- Entender buffered vs unbuffered na prática (e o que acontece se o buffer encher)
- Fechar o channel corretamente no shutdown

**Conceitos exercitados:** channels buffered/unbuffered, direção, `range` em channel, `close`, deadlocks

---

### Módulo 23 — Select e padrões de concorrência
**Entrega:** Shutdown gracioso e timeout por URL

```go
// dentro de monitor/monitor.go

func (m *Monitor) Iniciar() {
    ctx, cancel := context.WithCancel(context.Background())
    m.cancelar = cancel

    // goroutine coletora
    go m.coletarResultados()

    // goroutine por URL
    for _, url := range m.cfg.URLs {
        go m.loopURL(ctx, url)
    }
}

func (m *Monitor) Parar() {
    m.cancelar()          // cancela o context — todas as goroutines param
    close(m.resultados)   // fecha o channel — coletora termina o range
}

// loopURL usa select para multiplexar ticker e cancelamento
func (m *Monitor) loopURL(ctx context.Context, url string) {
    ticker := time.NewTicker(m.cfg.IntervaloD())
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():  // cancelamento
            return
        case <-ticker.C:    // próxima verificação
            resultado, _ := m.checker.Check(url)
            m.resultados <- resultado
        }
    }
}
```

**O que o usuário faz:**
- Implementar shutdown gracioso com `context.WithCancel`
- Usar `select` para multiplexar ticker e cancelamento
- Implementar timeout por URL com `context.WithTimeout`
- Implementar padrão done channel

**Conceitos exercitados:** `select`, timeout pattern, done channel/cancellation, fan-in, pipeline

---

### Módulo 24 — Sincronização
**Entrega:** Storage thread-safe

```go
// dentro de storage/storage.go

type MemoryStorage struct {
    mu        sync.RWMutex                  // protege leitura e escrita
    estado    map[string]EstadoAtual
    historico map[string][]Resultado
}

// Salvar — escrita exclusiva
func (s *MemoryStorage) Salvar(r checker.Resultado) {
    s.mu.Lock()
    defer s.mu.Unlock()

    s.historico[r.URL] = append(s.historico[r.URL], r)
    s.estado[r.URL] = EstadoAtual{/* ... */}
}

// BuscarEstado — leitura concorrente permitida
func (s *MemoryStorage) BuscarEstado(url string) (EstadoAtual, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()

    estado, ok := s.estado[url]
    return estado, ok
}

// contadorRequisicoesTotal usa atomic para evitar mutex em contador simples
var totalRequisicoes atomic.Int64

func incrementarTotal() {
    totalRequisicoes.Add(1)
}
```

**O que o usuário faz:**
- Adicionar `sync.RWMutex` ao MemoryStorage
- Usar `RLock/RUnlock` para leituras e `Lock/Unlock` para escritas
- Usar `sync.Once` para inicialização do storage
- Usar `atomic` para contadores de métricas simples
- Rodar `go test -race ./...` e verificar que não há race conditions

**Conceitos exercitados:** `sync.Mutex`, `sync.RWMutex`, `sync.Once`, `sync.Map`, `atomic`

---

### Módulo 25 — fmt, strings, strconv
**Entrega:** Formatação de output e parsing de configuração

```go
// dentro de reporter/reporter.go

func (r *Reporter) FormatarLinha(estado EstadoAtual) string {
    status := strings.ToUpper(estado.Status.String())
    latencia := strconv.FormatInt(estado.Latencia, 10) + "ms"

    // alinhamento com fmt.Sprintf e padding
    return fmt.Sprintf("%-50s %-8s %8s  %s",
        estado.URL,
        status,
        latencia,
        estado.UltimaVez.Format("15:04:05"),
    )
}

// ParsearURLs converte string separada por vírgula em slice
func ParsearURLs(raw string) []string {
    partes := strings.Split(raw, ",")
    urls := make([]string, 0, len(partes))
    for _, p := range partes {
        url := strings.TrimSpace(p)
        if url != "" {
            urls = append(urls, url)
        }
    }
    return urls
}
```

**O que o usuário faz:**
- Implementar formatação de tabela alinhada com `fmt.Sprintf`
- Implementar parsing de flags de linha de comando com `strconv`
- Usar `strings.Builder` para construção eficiente de strings longas

**Conceitos exercitados:** `fmt`, `strings`, `strconv` — as funções mais usadas de cada

---

### Módulo 26 — io, bufio, os
**Entrega:** Persistência de histórico em arquivo

```go
// dentro de storage/file.go

type FileStorage struct {
    MemoryStorage              // embedding — herda todos os métodos
    caminho   string
    mu        sync.Mutex
}

func (f *FileStorage) Salvar(r checker.Resultado) {
    f.MemoryStorage.Salvar(r)  // salva em memória

    // persiste no arquivo de forma assíncrona
    go f.persistir()
}

func (f *FileStorage) persistir() {
    f.mu.Lock()
    defer f.mu.Unlock()

    arquivo, err := os.OpenFile(f.caminho, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
    if err != nil {
        log.Printf("erro ao abrir arquivo de storage: %v", err)
        return
    }
    defer arquivo.Close()

    writer := bufio.NewWriter(arquivo)
    encoder := json.NewEncoder(writer)

    todos := f.MemoryStorage.RelatorioGeral()
    if err := encoder.Encode(todos); err != nil {
        log.Printf("erro ao serializar storage: %v", err)
        return
    }

    writer.Flush()
}

func CarregarFileStorage(caminho string) (*FileStorage, error) {
    arquivo, err := os.Open(caminho)
    if err != nil {
        if os.IsNotExist(err) {
            return &FileStorage{caminho: caminho}, nil
        }
        return nil, fmt.Errorf("abrindo storage: %w", err)
    }
    defer arquivo.Close()

    // lê com bufio para eficiência
    reader := bufio.NewReader(arquivo)
    // ... deserializa
}
```

**O que o usuário faz:**
- Implementar `FileStorage` que persiste o estado entre execuções
- Usar `bufio.Writer` para escrita eficiente
- Usar flags de `os.OpenFile` corretamente
- Ler o arquivo na inicialização para restaurar estado

**Conceitos exercitados:** `io`, `bufio`, `os` — leitura, escrita, flags de arquivo

---

### Módulo 27 — time
**Entrega:** Intervalos configuráveis e timestamps precisos

```go
// dentro de config/config.go

type Config struct {
    URLs          []string
    Intervalo     time.Duration  // ex: 30s, 1m, 5m
    Timeout       time.Duration
    RetencaoMax   time.Duration  // apagar histórico mais antigo que X
}

// dentro de storage/storage.go — limpeza de histórico antigo

func (s *MemoryStorage) LimparAntigos(retencao time.Duration) {
    s.mu.Lock()
    defer s.mu.Unlock()

    limite := time.Now().Add(-retencao)

    for url, resultados := range s.historico {
        filtrado := resultados[:0]
        for _, r := range resultados {
            if r.Timestamp.After(limite) {
                filtrado = append(filtrado, r)
            }
        }
        s.historico[url] = filtrado
    }
}
```

**O que o usuário faz:**
- Migrar `int` de intervalos para `time.Duration`
- Implementar limpeza de histórico antigo
- Formatar timestamps no output e nos relatórios
- Usar `time.Since` e `time.Until` nos cálculos de uptime

**Conceitos exercitados:** `time.Duration`, `time.Time`, `time.Since`, `time.Ticker`, formatação

---

### Módulo 28 — net/http
**Entrega:** API REST completa

```go
// dentro de api/server.go

type Server struct {
    storage monitor.Storage
    porta   int
    srv     *http.Server
}

func NovoServer(storage monitor.Storage, porta int) *Server {
    s := &Server{storage: storage, porta: porta}

    mux := http.NewServeMux()
    mux.HandleFunc("GET /status", s.handleStatus)
    mux.HandleFunc("GET /status/{url}", s.handleStatusURL)
    mux.HandleFunc("GET /historico/{url}", s.handleHistorico)
    mux.HandleFunc("GET /relatorio", s.handleRelatorio)

    s.srv = &http.Server{
        Addr:         fmt.Sprintf(":%d", porta),
        Handler:      mux,
        ReadTimeout:  5 * time.Second,
        WriteTimeout: 10 * time.Second,
    }

    return s
}

func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
    estados := s.storage.RelatorioGeral()
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(estados)
}

func (s *Server) Iniciar() error {
    log.Printf("API disponível em http://localhost:%d", s.porta)
    return s.srv.ListenAndServe()
}

func (s *Server) Parar(ctx context.Context) error {
    return s.srv.Shutdown(ctx)
}
```

**Endpoints entregues:**

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/status` | Estado atual de todas as URLs |
| GET | `/status/{url}` | Estado de uma URL específica |
| GET | `/historico/{url}` | Histórico completo de uma URL |
| GET | `/relatorio` | Relatório com uptime % de todas as URLs |

**O que o usuário faz:**
- Implementar o servidor HTTP com `http.NewServeMux()`
- Implementar os 4 handlers
- Configurar timeouts de leitura e escrita
- Implementar shutdown gracioso do servidor

**Conceitos exercitados:** servidor HTTP, handlers, `ServeMux`, rotas com parâmetro, cliente HTTP

---

### Módulo 29 — encoding/json
**Entrega:** Serialização completa com tags e validação

```go
// Todas as structs já têm tags JSON desde o módulo 14
// Aqui o usuário implementa o endpoint de relatório exportável

type Relatorio struct {
    GeradoEm  time.Time         `json:"gerado_em"`
    Versao    string            `json:"versao"`
    Total     int               `json:"total_urls"`
    Online    int               `json:"online"`
    Offline   int               `json:"offline"`
    UptimePct float64           `json:"uptime_geral_pct"`
    URLs      []RelatorioURL    `json:"urls"`
}

type RelatorioURL struct {
    URL        string    `json:"url"`
    Status     string    `json:"status"`
    UptimePct  float64   `json:"uptime_pct"`
    Latencia   int64     `json:"latency_ms_avg"`
    Verificacoes int     `json:"total_checks"`
    UltimaVez  time.Time `json:"last_check"`
}

// handler de export — gera JSON para download
func (s *Server) handleExport(w http.ResponseWriter, r *http.Request) {
    relatorio := s.reporter.Gerar()
    w.Header().Set("Content-Type", "application/json")
    w.Header().Set("Content-Disposition", "attachment; filename=gomonitor-report.json")

    encoder := json.NewEncoder(w)
    encoder.SetIndent("", "  ")  // pretty-print para o arquivo
    encoder.Encode(relatorio)
}
```

**O que o usuário faz:**
- Implementar o `Reporter` com geração de `Relatorio`
- Adicionar endpoint `/export` que gera JSON para download
- Implementar loading de configuração de arquivo JSON
- Tratar o caso de campo desconhecido no JSON de configuração

**Conceitos exercitados:** tags de struct, `json.Marshal/Unmarshal`, `json.Encoder/Decoder`, campos omitempty

---

### Módulo 30 — testing
**Entrega:** Suite de testes completa com cobertura real

```go
// checker/checker_test.go

func TestHTTPChecker_Check_Sucesso(t *testing.T) {
    // servidor HTTP fake para testes
    srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
    }))
    defer srv.Close()

    checker := NovoHTTPChecker(CheckerConfig{TimeoutSeg: 5})
    resultado, err := checker.Check(srv.URL)

    if err != nil {
        t.Fatalf("esperava nil, got %v", err)
    }
    if resultado.Status != StatusUp {
        t.Errorf("esperava StatusUp, got %v", resultado.Status)
    }
}

func TestHTTPChecker_Check_Timeout(t *testing.T) {
    srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        time.Sleep(2 * time.Second)  // simula lentidão
    }))
    defer srv.Close()

    checker := NovoHTTPChecker(CheckerConfig{TimeoutSeg: 1})  // timeout de 1s
    resultado, err := checker.Check(srv.URL)

    if resultado.Status != StatusDown {
        t.Errorf("esperava StatusDown após timeout, got %v", resultado.Status)
    }

    var errTimeout *ErrTimeout
    if !errors.As(err, &errTimeout) {
        t.Errorf("esperava ErrTimeout, got %T", err)
    }
}

// storage/storage_test.go — teste de concorrência

func TestMemoryStorage_Concorrencia(t *testing.T) {
    s := NovoMemoryStorage()
    var wg sync.WaitGroup
    const goroutines = 100

    for range goroutines {
        wg.Add(1)
        go func() {
            defer wg.Done()
            s.Salvar(checker.Resultado{URL: "https://go.dev", Status: checker.StatusUp})
        }()
    }
    wg.Wait()
    // se race detector não reclamar, o mutex está funcionando
}
```

**O que o usuário faz:**
- Escrever testes para `checker`, `storage`, `reporter` e `api`
- Usar `httptest.NewServer` para testes do checker e dos handlers
- Usar `MockChecker` (implementado no módulo 17) nos testes do monitor
- Rodar `go test -race -cover ./...` e atingir >80% de cobertura

**Conceitos exercitados:** `testing.T`, `httptest`, table-driven tests, benchmarks, `go test -race -cover`

---

### Módulo 31 — Generics
**Entrega:** Histórico e agregadores genéricos

```go
// dentro de storage/generic.go

// Historico é um buffer genérico de tamanho limitado
type Historico[T any] struct {
    mu     sync.RWMutex
    itens  []T
    limite int
}

func NovoHistorico[T any](limite int) *Historico[T] {
    return &Historico[T]{
        itens:  make([]T, 0, limite),
        limite: limite,
    }
}

func (h *Historico[T]) Adicionar(item T) {
    h.mu.Lock()
    defer h.mu.Unlock()

    h.itens = append(h.itens, item)
    if len(h.itens) > h.limite {
        h.itens = h.itens[len(h.itens)-h.limite:]
    }
}

func (h *Historico[T]) Todos() []T {
    h.mu.RLock()
    defer h.mu.RUnlock()
    copia := make([]T, len(h.itens))
    copy(copia, h.itens)
    return copia
}

// Media calcula a média de qualquer tipo numérico
func Media[N int | int64 | float64](valores []N) float64 {
    if len(valores) == 0 {
        return 0
    }
    var soma N
    for _, v := range valores {
        soma += v
    }
    return float64(soma) / float64(len(valores))
}
```

**O que o usuário faz:**
- Refatorar `HistoricoRecente` para usar `Historico[T]`
- Implementar `Media[N]` e usar no cálculo de latência média
- Entender quando generics ajudam e quando complicam

**Conceitos exercitados:** type parameters, constraints, instanciação, quando usar generics

---

### Módulo 32 — Reflection
**Entrega:** Validador de configuração e pretty-printer de structs

```go
// dentro de config/validator.go

// ValidarConfig usa reflection para checar campos obrigatórios
// sem precisar listar cada campo manualmente
func ValidarConfig(cfg interface{}) []string {
    var erros []string
    v := reflect.ValueOf(cfg)

    if v.Kind() == reflect.Ptr {
        v = v.Elem()
    }

    t := v.Type()
    for i := range t.NumField() {
        field := t.Field(i)
        value := v.Field(i)

        tag := field.Tag.Get("validate")
        if tag == "required" && value.IsZero() {
            erros = append(erros, fmt.Sprintf("campo obrigatório ausente: %s", field.Name))
        }
    }
    return erros
}

// PrintStruct imprime qualquer struct de forma legível — útil para debug
func PrintStruct(v interface{}) string {
    // implementação com reflect.TypeOf / reflect.ValueOf
}
```

**O que o usuário faz:**
- Implementar validador de config usando reflection
- Implementar um pretty-printer de structs para debug
- Entender os custos de performance e quando evitar reflection

**Conceitos exercitados:** `reflect.Value`, `reflect.Type`, tags customizadas, quando evitar reflection

---

### Módulo 33 — Build tags e compilação condicional
**Entrega:** Builds para diferentes ambientes

```go
// storage/storage_prod.go
//go:build !test

package storage

// Em produção, usa FileStorage com persistência
func NovoStorage(cfg *config.Config) Storage {
    return NovoFileStorage(cfg.CaminhoStorage)
}

// storage/storage_test_build.go
//go:build test

package storage

// Em testes, usa MemoryStorage sem I/O
func NovoStorage(cfg *config.Config) Storage {
    return NovoMemoryStorage()
}
```

**Makefile:**
```makefile
build:
    go build -o gomonitor ./...

build-debug:
    go build -tags debug -o gomonitor-debug ./...

test:
    go test -tags test -race -cover ./...

release:
    GOOS=linux GOARCH=amd64 go build -o dist/gomonitor-linux ./...
    GOOS=darwin GOARCH=arm64 go build -o dist/gomonitor-mac ./...
    GOOS=windows GOARCH=amd64 go build -o dist/gomonitor.exe ./...
```

**O que o usuário faz:**
- Criar build tags para storage de produção vs teste
- Criar Makefile com targets para build, teste e release
- Fazer cross-compilation para Linux, macOS e Windows
- Entender `GOOS` e `GOARCH`

**Conceitos exercitados:** `//go:build`, compilação condicional, cross-compilation, Makefile

---

### Módulo 34 — Profiling e otimização
**Entrega:** Análise de performance real do GoMonitor

```go
// dentro de main.go — flag de profiling

import _ "net/http/pprof"  // registra endpoints de profiling automaticamente

func main() {
    // ...
    if cfg.Profiling {
        go func() {
            log.Println("pprof disponível em http://localhost:6060/debug/pprof")
            log.Fatal(http.ListenAndServe(":6060", nil))
        }()
    }
}
```

**Benchmarks a implementar:**

```go
// storage/storage_bench_test.go

func BenchmarkMemoryStorage_Salvar(b *testing.B) {
    s := NovoMemoryStorage()
    r := checker.Resultado{URL: "https://go.dev", Status: checker.StatusUp, Latencia: 42}

    b.ResetTimer()
    for range b.N {
        s.Salvar(r)
    }
}

func BenchmarkMemoryStorage_Salvar_Paralelo(b *testing.B) {
    s := NovoMemoryStorage()
    r := checker.Resultado{URL: "https://go.dev", Status: checker.StatusUp}

    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() {
            s.Salvar(r)
        }
    })
}
```

**O que o usuário faz:**
- Ativar pprof e fazer profiling com 100 URLs simultâneas
- Analisar CPU profile com `go tool pprof`
- Identificar e corrigir pelo menos um gargalo real
- Rodar benchmarks e comparar antes/depois da otimização
- Documentar os achados no README

**Conceitos exercitados:** `net/http/pprof`, `go tool pprof`, benchmarks, otimização baseada em dados

---

## README final — estrutura obrigatória

```markdown
# GoMonitor

Ferramenta de monitoramento de URLs construída em Go puro (zero dependências externas).
Desenvolvida como projeto final do curso GoCourse.

## Funcionalidades

- Monitoramento paralelo de N URLs com intervalo configurável
- Detecção de timeout, erro de DNS e status HTTP >= 400
- API REST em `/status`, `/historico` e `/relatorio`
- Persistência de histórico em arquivo JSON
- Exportação de relatório com uptime %
- Zero dependências externas — apenas stdlib Go

## Instalação

\`\`\`bash
go install github.com/<usuario>/gomonitor@latest
\`\`\`

## Uso

\`\`\`bash
# Monitorar URLs com intervalo de 30s
gomonitor -urls https://go.dev,https://pkg.go.dev -intervalo 30s

# Com API habilitada na porta 8080
gomonitor -urls https://go.dev -api -porta 8080

# Consultar status via API
curl http://localhost:8080/status | jq .

# Exportar relatório
curl http://localhost:8080/relatorio > relatorio.json
\`\`\`

## Arquitetura

[diagrama e explicação das decisões técnicas]

## Performance

[resultados dos benchmarks do módulo 34]

## O que aprendi construindo isso

[seção opcional — conta a história do projeto]
```

---

## Checklist final antes de publicar

- [ ] `go build ./...` sem erros
- [ ] `go test -race -cover ./...` — cobertura > 80%, zero race conditions
- [ ] `go vet ./...` sem warnings
- [ ] `golint ./...` (ou `staticcheck`) sem issues
- [ ] README completo com instalação, uso e exemplos reais
- [ ] Commits organizados (um por módulo ou por feature)
- [ ] Tag `v1.0.0` no repositório
- [ ] Publicado em `pkg.go.dev` (automático ao publicar no GitHub com `go.mod`)

---

## Dependências externas: zero

O projeto usa apenas a stdlib Go. Isso é intencional e é um diferencial.
Qualquer recrutador que clonar o repositório roda `go build` e funciona.
Sem `npm install`, sem `pip install`, sem Docker obrigatório.

---

*Documento gerado em junho de 2026 — GoCourse v1.0*
