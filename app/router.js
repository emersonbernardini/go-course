// Mapa de rotas: slug → arquivo HTML do módulo
// Adiciona uma entrada aqui pra cada novo módulo
const ROUTES = {
   '/': { page: 'home', file: 'index.html' },
   '/home': { page: 'home', file: 'index.html' },

   '/intro': { page: 'module', file: 'modulos/modulo-01.html', module: '01' },
   '/ambiente': {
      page: 'module',
      file: 'modulos/modulo-02.html',
      module: '02',
   },
   '/estrutura': {
      page: 'module',
      file: 'modulos/modulo-03.html',
      module: '03',
   },
   '/variaveis': {
      page: 'module',
      file: 'modulos/modulo-04.html',
      module: '04',
   },
   '/tipos': { page: 'module', file: 'modulos/modulo-05.html', module: '05' },
   '/operadores': {
      page: 'module',
      file: 'modulos/modulo-06.html',
      module: '06',
   },
   '/condicionais': {
      page: 'module',
      file: 'modulos/modulo-07.html',
      module: '07',
   },
   '/lacos': { page: 'module', file: 'modulos/modulo-08.html', module: '08' },
   '/arrays': { page: 'module', file: 'modulos/modulo-09.html', module: '09' },
   '/slices': { page: 'module', file: 'modulos/modulo-10.html', module: '10' },
   '/maps': { page: 'module', file: 'modulos/modulo-11.html', module: '11' },
   '/funcoes': { page: 'module', file: 'modulos/modulo-12.html', module: '12' },
   '/funcoes-avancado': {
      page: 'module',
      file: 'modulos/modulo-13.html',
      module: '13',
   },
   '/structs': { page: 'module', file: 'modulos/modulo-14.html', module: '14' },
   '/ponteiros': {
      page: 'module',
      file: 'modulos/modulo-15.html',
      module: '15',
   },
   '/metodos': { page: 'module', file: 'modulos/modulo-16.html', module: '16' },
   '/interfaces': {
      page: 'module',
      file: 'modulos/modulo-17.html',
      module: '17',
   },
   '/erros': { page: 'module', file: 'modulos/modulo-18.html', module: '18' },
   '/pacotes': { page: 'module', file: 'modulos/modulo-19.html', module: '19' },
   '/modulos-go': {
      page: 'module',
      file: 'modulos/modulo-20.html',
      module: '20',
   },
   '/goroutines': {
      page: 'module',
      file: 'modulos/modulo-21.html',
      module: '21',
   },
   '/channels': {
      page: 'module',
      file: 'modulos/modulo-22.html',
      module: '22',
   },
   '/select': { page: 'module', file: 'modulos/modulo-23.html', module: '23' },
   '/sincronizacao': {
      page: 'module',
      file: 'modulos/modulo-24.html',
      module: '24',
   },
   '/fmt-strings': {
      page: 'module',
      file: 'modulos/modulo-25.html',
      module: '25',
   },
   '/io': { page: 'module', file: 'modulos/modulo-26.html', module: '26' },
   '/time': { page: 'module', file: 'modulos/modulo-27.html', module: '27' },
   '/http': { page: 'module', file: 'modulos/modulo-28.html', module: '28' },
   '/json': { page: 'module', file: 'modulos/modulo-29.html', module: '29' },
   '/testing': { page: 'module', file: 'modulos/modulo-30.html', module: '30' },
   '/generics': {
      page: 'module',
      file: 'modulos/modulo-31.html',
      module: '31',
   },
   '/reflection': {
      page: 'module',
      file: 'modulos/modulo-32.html',
      module: '32',
   },
   '/build-tags': {
      page: 'module',
      file: 'modulos/modulo-33.html',
      module: '33',
   },
   '/profiling': {
      page: 'module',
      file: 'modulos/modulo-34.html',
      module: '34',
   },

   '/reset': { page: 'reset', file: null },
}

export const Router = {
   _onResolve: null, // callback injetado pelo Init

   init(onResolve) {
      Router._onResolve = onResolve

      // Botão voltar/avançar do browser
      window.addEventListener('popstate', () => Router._resolve())

      // Intercepta cliques em <a href> interno
      document.addEventListener('click', e => {
         const a = e.target.closest('a')
         if (!a) return
         const href = a.getAttribute('href')
         if (!href) return
         // Separa path do hash antes de checar as rotas —
         // sem isso, '/ambiente#continuar' não bate em ROUTES e cai no fallback da home
         const [hrefPath, hrefHash] = href.split('#')
         if (ROUTES[hrefPath] !== undefined) {
            e.preventDefault()
            Router.navigate(hrefPath + (hrefHash ? '#' + hrefHash : ''))
         }
      })

      Router._resolve()
   },

   navigate(path) {
      if (path === '/reset') {
         Router._showResetModal()
         return
      }
      const [cleanPath, hash] = path.split('#')
      history.pushState({}, '', cleanPath + (hash ? '#' + hash : ''))
      Router._resolve()
   },

   _showResetModal() {
      let backdrop = document.getElementById('reset-modal')
      if (!backdrop) {
         backdrop = document.createElement('div')
         backdrop.id = 'reset-modal'
         backdrop.className = 'modal-backdrop'
         backdrop.innerHTML = `
            <div class="modal" role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
               <div class="modal__header">
                  <span class="modal__title" id="reset-modal-title">Resetar progresso</span>
               </div>
               <div class="modal__body">
                  <p>Isso vai apagar <strong>todo o seu progresso</strong> permanentemente. Essa ação não pode ser desfeita.</p>
               </div>
               <div class="modal__footer">
                  <button class="btn btn-secondary" id="reset-cancel">Cancelar</button>
                  <button class="btn btn-danger" id="reset-confirm">Sim, resetar tudo</button>
               </div>
            </div>
         `
         document.body.appendChild(backdrop)

         document
            .getElementById('reset-cancel')
            .addEventListener('click', () => {
               backdrop.classList.remove('is-open')
               Router.navigate('/')
            })

         backdrop.addEventListener('click', e => {
            if (e.target === backdrop) {
               backdrop.classList.remove('is-open')
               Router.navigate('/')
            }
         })

         document
            .getElementById('reset-confirm')
            .addEventListener('click', () => {
               localStorage.clear()
               history.replaceState({}, '', '/')
               location.reload()
            })
      }

      backdrop.classList.add('is-open')
   },

   async _resolve() {
      const path = location.pathname

      if (path === '/reset') {
         Router._showResetModal()
         return
      }

      const route = ROUTES[path] ?? ROUTES['/']

      // Todas as rotas com conteúdo são resolvidas via fetch —
      // incluindo a home. Isso elimina o estado frágil do _homeMain,
      // que capturava o <main> errado quando o usuário entrava direto
      // em um módulo e depois navegava para a home.
      let main = null

      if (route.file) {
         try {
            const res = await fetch(route.file)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const html = await res.text()
            const doc = new DOMParser().parseFromString(html, 'text/html')
            main = doc.querySelector('main')
            if (route.module) {
               const inner = main.querySelector('[data-module]')
               if (inner) inner.dataset.module = route.module
            }
         } catch (err) {
            console.error('[Router] Falha ao carregar rota:', route.file, err)
            return
         }
      }

      // Atualiza data-page no <html> e <body> para o CSS e Init saberem o contexto
      document.documentElement.dataset.page = route.page
      document.body.dataset.page = route.page

      // Substitui o <main> existente
      const currentMain = document.querySelector('main')
      if (main && currentMain) {
         currentMain.replaceWith(main)
      } else if (main) {
         document.getElementById('app').appendChild(main)
      }

      // Notifica Init para re-inicializar a página
      Router._onResolve?.(route.page)

      // Scroll pro topo
      window.scrollTo(0, 0)
   },

   // Retorna o slug da rota para um módulo dado seu número (ex: '04')
   routeForModule(moduleNum) {
      return (
         Object.entries(ROUTES).find(([, r]) => r.module === moduleNum)?.[0] ??
         null
      )
   },
}
