import { CONFIG } from './config.js'
import { Progress } from './progress.js'
import { Navigation } from './navigation.js'
import { Quiz } from './quiz.js'
import { Exercise } from './exercise.js'
import { UI } from './ui.js'
import { Storage } from './storage.js'
import { Icons } from './icons.js'
import { Router } from './router.js'

export const Init = {
   run() {
      // 1. Carrega progresso
      Progress.init()

      // 2. Injeta header (fixo, não muda entre rotas)
      Navigation.renderHeader()

      // 3. Inicia o roteador — ele resolve a rota atual e chama runPage
      Router.init(Init.runPage)
   },

   runPage(page) {
      // Sidebar só existe em módulos
      Navigation.renderSidebar()

      if (page === 'module') {
         Init._initModulePage()
      } else {
         Init._initHomePage()
      }

      UI.initCodeCopy()
      UI.updateProgressUI()
   },

   _initModulePage() {
      UI.initTopicRead()
      Quiz.initAll()
      Exercise.initAll()
      Navigation.renderModuleNav()
      UI.initSyntaxHighlight()

      const moduleId = Navigation.currentModule()
      if (moduleId) {
         const mod = Progress.state.progress[moduleId]
         if (mod && mod.status === 'unlocked') {
            mod.status = 'in-progress'
            Storage.save(Progress.state)
         }
      }

      // Rola até o primeiro tópico não lido (quando vindo do CTA)
      if (location.hash === '#continuar') {
         history.replaceState(null, '', location.pathname)
         requestAnimationFrame(() => {
            const firstUnread = document.querySelector(
               '.topic-section:not(.is-read)',
            )
            if (firstUnread) {
               const headerHeight = 60 + 16 // header + folga
               const top =
                  firstUnread.getBoundingClientRect().top +
                  window.scrollY -
                  headerHeight
               window.scrollTo({ top, behavior: 'smooth' })
            }
         })
      }
   },

   _initHomePage() {
      Init._renderHomeStats()
      Init._renderModuleCards()
      Init._updateHeroCTA()
   },

   _updateHeroCTA() {
      const ctaLink = document.querySelector('.hero__actions .btn-primary')
      if (!ctaLink) return

      // 1. Sem nenhum progresso real — mantém "Começar agora"
      // Considera que há progresso se qualquer módulo saiu de 'locked'/'unlocked' inicial
      const hasProgress = CONFIG.modules.some(
         m =>
            Progress.state.progress[m.id]?.status === 'in-progress' ||
            Progress.state.progress[m.id]?.status === 'completed',
      )
      if (!hasProgress) return

      const label = slug => slug.replace('/', '').replace(/-/g, ' ')

      // 2. Há módulo em andamento
      const inProgress = CONFIG.modules.find(
         m => Progress.state.progress[m.id]?.status === 'in-progress',
      )
      if (inProgress) {
         const slug = Router.routeForModule(inProgress.num)
         if (slug) {
            ctaLink.href = slug + '#continuar'
            ctaLink.innerHTML = `Continuar em <strong>${label(slug)}</strong> <i class="fa-solid fa-circle-play"></i>`
         }
         return
      }

      // 3. Nenhum in-progress, mas há unlocked intocado
      const unlocked = CONFIG.modules.find(
         m => Progress.state.progress[m.id]?.status === 'unlocked',
      )
      if (unlocked) {
         const slug = Router.routeForModule(unlocked.num)
         if (slug) {
            ctaLink.href = slug
            ctaLink.innerHTML = `Começar <strong>${label(slug)}</strong> <i class="fa-solid fa-circle-play"></i>`
         }
      }
   },

   _renderHomeStats() {
      const overall = Progress.getOverallProgress()
      const stats = Progress.state.stats

      const els = {
         totalModules: document.getElementById('stat-total-modules'),
         completed: document.getElementById('stat-completed'),
         exercises: document.getElementById('stat-exercises'),
         streak: document.getElementById('stat-streak'),
         progressFill: document.getElementById('hero-progress-fill'),
         progressPct: document.getElementById('hero-progress-pct'),
      }

      if (els.totalModules) els.totalModules.textContent = CONFIG.modules.length
      if (els.completed) els.completed.textContent = overall.completed
      if (els.exercises) els.exercises.textContent = stats.exercisesDone
      if (els.streak) els.streak.textContent = stats.currentStreak
      if (els.progressFill) els.progressFill.style.width = `${overall.pct}%`
      if (els.progressPct) els.progressPct.textContent = `${overall.pct}%`
   },

   _renderModuleCards() {
      const grids = document.querySelectorAll('.modules-grid')
      grids.forEach(grid => {
         // Limpa cards anteriores ao re-renderizar
         grid.innerHTML = ''
         const blockName = grid.dataset.block
         const mods = CONFIG.modules.filter(m => m.block === blockName)

         mods.forEach(mod => {
            const modState = Progress.state.progress[mod.id]
            const status = modState?.status || 'locked'
            const pct = Progress.getModuleProgress(mod.id)
            const slug = Router.routeForModule(mod.num)

            let stateClass = ''
            let statusBadge = ''

            if (status === 'completed') {
               stateClass = 'is-completed'
               statusBadge = `<span class="badge badge-success">Concluído</span>`
            } else if (status === 'in-progress') {
               stateClass = ''
               statusBadge = `<span class="badge badge-primary">${pct}%</span>`
            } else if (status === 'unlocked') {
               stateClass = ''
               statusBadge = ''
            } else {
               stateClass = 'is-locked'
               statusBadge = `<span class="module-card__lock">${Icons.lock}</span>`
            }

            const card = document.createElement('a')
            card.href = slug ?? '#'
            card.className = `module-card ${stateClass}`
            card.innerHTML = `
              <span class="module-card__num">${mod.num}</span>
              <span class="module-card__icon"><i class="fa-solid ${mod.icon}" aria-hidden="true"></i></span>
              <span class="module-card__body">
                <span class="module-card__title">${mod.title}</span>
                <span class="module-card__desc">${mod.block} · ${mod.topics} tópicos</span>
              </span>
              <span class="module-card__status">${statusBadge}</span>
            `
            grid.appendChild(card)
         })
      })
   },
}
