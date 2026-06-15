import { CONFIG } from './config.js'
import { Progress } from './progress.js'
import { Icons, icon } from './icons.js'
import { Router } from './router.js'

export const Navigation = {
   currentModule() {
      const el = document.querySelector('[data-module]')
      if (!el) return null
      const num = el.dataset.module
      return 'modulo-' + num
   },

   currentPage() {
      return (
         document.body.dataset.page ??
         document.documentElement.dataset.page ??
         'home'
      )
   },

   // Retorna o slug da rota para um módulo dado seu id (ex: 'modulo-04')
   _slugForId(moduleId) {
      const num = moduleId.replace('modulo-', '')
      return (
         Router.routeForModule(num.replace(/^0+/, '').padStart(2, '0')) ??
         Router.routeForModule(num) ??
         `modulos/${moduleId}.html`
      )
   },

   renderHeader() {
      // Header é fixo — só renderiza uma vez
      if (document.querySelector('.app-header')) return

      const overall = Progress.getOverallProgress()

      const header = document.createElement('header')
      header.className = 'app-header'
      header.innerHTML = `
        <button class="btn btn-ghost btn-icon" id="sidebar-toggle" aria-label="Abrir menu" style="visibility:hidden">
          ${Icons.menu}
        </button>
        <a href="/" class="app-header__logo">
          <span>Go</span>Course
        </a>
        <div class="app-header__progress-wrap" id="header-progress">
          <span class="app-header__progress-label" id="header-progress-label">${overall.completed}/${overall.total} módulos</span>
          <div class="progress-bar" style="width:120px">
            <div class="progress-bar__fill" id="header-progress-fill" style="width:${overall.pct}%"></div>
          </div>
          <span class="text-sm font-semibold text-primary font-mono" id="header-progress-pct">${overall.pct}%</span>
        </div>
      `

      const app = document.getElementById('app')
      app.insertBefore(header, app.firstChild)

      document
         .getElementById('sidebar-toggle')
         ?.addEventListener('click', Navigation.toggleSidebar)
   },

   renderSidebar() {
      // Sidebar só existe em páginas de módulo
      const page = Navigation.currentPage()

      // Remove sidebar anterior (pode ter mudado de módulo)
      document.querySelector('.app-sidebar')?.remove()
      document.querySelector('.sidebar-overlay')?.remove()

      const toggleBtn = document.getElementById('sidebar-toggle')

      if (page !== 'module') {
         if (toggleBtn) toggleBtn.style.visibility = 'hidden'
         return
      }

      if (toggleBtn) toggleBtn.style.visibility = 'visible'

      const currentId = Navigation.currentModule()
      const overall = Progress.getOverallProgress()

      const blocks = {}
      CONFIG.modules.forEach(mod => {
         if (!blocks[mod.block]) blocks[mod.block] = []
         blocks[mod.block].push(mod)
      })

      let navHtml = ''
      Object.entries(blocks).forEach(([blockName, mods]) => {
         navHtml += `<div class="sidebar-nav__block">
          <div class="sidebar-nav__block-label">${blockName}</div>`

         mods.forEach(mod => {
            const modProgress = Progress.state.progress[mod.id]
            const status = modProgress?.status || 'locked'
            const isActive = mod.id === currentId
            const slug = Navigation._slugForId(mod.id)

            let stateClass = ''
            let iconHtml = Icons.lock

            if (status === 'completed') {
               stateClass = 'is-completed'
               iconHtml = Icons.check
            } else if (status === 'in-progress' || status === 'unlocked') {
               iconHtml = Icons.circle
            } else {
               stateClass = 'is-locked'
            }

            if (isActive) stateClass += ' is-active'

            navHtml += `
            <a href="${slug}" class="sidebar-nav__item ${stateClass}" data-module-link="${mod.id}">
              <span class="sidebar-nav__item-icon">${iconHtml}</span>
              <span>${mod.title}</span>
              <span class="sidebar-nav__item-num">${mod.num}</span>
            </a>`
         })

         navHtml += `</div>`
      })

      const sidebar = document.createElement('aside')
      sidebar.className = 'app-sidebar'
      sidebar.id = 'app-sidebar'
      sidebar.setAttribute('aria-label', 'Navegação do curso')
      sidebar.innerHTML = `
        <div class="app-sidebar__header">
          <div class="app-sidebar__title">Navegação</div>
          <div class="app-sidebar__progress">
            <div class="app-sidebar__progress-text">
              <span>Progresso geral</span>
              <span>${overall.pct}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar__fill" style="width:${overall.pct}%"></div>
            </div>
          </div>
        </div>
        <nav class="sidebar-nav" aria-label="Módulos do curso">
          ${navHtml}
        </nav>
      `

      const overlay = document.createElement('div')
      overlay.className = 'sidebar-overlay'
      overlay.id = 'sidebar-overlay'
      overlay.addEventListener('click', Navigation.closeSidebar)

      const app = document.getElementById('app')
      app.appendChild(sidebar)
      app.appendChild(overlay)
   },

   renderModuleNav() {
      const currentId = Navigation.currentModule()
      if (!currentId) return

      const idx = CONFIG.modules.findIndex(m => m.id === currentId)
      const prev = idx > 0 ? CONFIG.modules[idx - 1] : null
      const next =
         idx < CONFIG.modules.length - 1 ? CONFIG.modules[idx + 1] : null
      const currentPct = Progress.getModuleProgress(currentId)

      const container = document.querySelector('.module-nav')
      if (!container) return
      container.innerHTML = ''

      if (prev) {
         const prevBtn = document.createElement('a')
         prevBtn.href = Navigation._slugForId(prev.id)
         prevBtn.className = 'module-nav__btn'
         prevBtn.innerHTML = `
          <span class="module-nav__label">${icon('arrowLeft')} Anterior</span>
          <span class="module-nav__title">${prev.title}</span>
        `
         container.appendChild(prevBtn)
      }

      if (next) {
         const nextMod = Progress.state.progress[next.id]
         const blocked = nextMod?.status === 'locked' || currentPct < 100

         const nextBtn = document.createElement(blocked ? 'span' : 'a')
         if (!blocked) nextBtn.href = Navigation._slugForId(next.id)
         nextBtn.className = 'module-nav__btn module-nav__btn--next'
         if (blocked) {
            nextBtn.style.opacity = '0.4'
            nextBtn.style.cursor = 'not-allowed'
         }
         nextBtn.innerHTML = `
          <span class="module-nav__label">Próximo ${icon('arrow')}</span>
          <span class="module-nav__title">${next.title}</span>
        `
         container.appendChild(nextBtn)
      }
   },

   toggleSidebar() {
      const sidebar = document.getElementById('app-sidebar')
      sidebar?.classList.contains('is-open')
         ? Navigation.closeSidebar()
         : Navigation.openSidebar()
   },

   openSidebar() {
      document.getElementById('app-sidebar')?.classList.add('is-open')
      document.getElementById('sidebar-overlay')?.classList.add('is-visible')
      document.body.style.overflow = 'hidden'
   },

   closeSidebar() {
      document.getElementById('app-sidebar')?.classList.remove('is-open')
      document.getElementById('sidebar-overlay')?.classList.remove('is-visible')
      document.body.style.overflow = ''
   },
}
