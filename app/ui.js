import { Progress } from './progress.js'
import { Navigation } from './navigation.js'
import { Highlight } from './highlight.js'
import { icon } from './icons.js'

export const UI = {
   toast(message, type = 'info', duration = 3000) {
      let container = document.querySelector('.toast-container')
      if (!container) {
         container = document.createElement('div')
         container.className = 'toast-container'
         document.body.appendChild(container)
      }

      const icons = {
         success: icon('success'),
         error: icon('error'),
         warning: icon('warning'),
         info: icon('info'),
      }

      const toast = document.createElement('div')
      toast.className = `toast toast--${type}`
      toast.innerHTML = `${icons[type] || ''} <span>${message}</span>`
      container.appendChild(toast)

      setTimeout(() => {
         toast.classList.add('is-leaving')
         toast.addEventListener('animationend', () => toast.remove(), {
            once: true,
         })
      }, duration)
   },

   initCodeCopy() {
      document.querySelectorAll('.code-block__copy').forEach(btn => {
         btn.addEventListener('click', () => {
            const pre = btn.closest('.code-block')?.querySelector('pre')
            if (!pre) return
            navigator.clipboard.writeText(pre.innerText).then(() => {
               btn.textContent = 'Copiado!'
               btn.classList.add('is-copied')
               setTimeout(() => {
                  btn.textContent = 'Copiar'
                  btn.classList.remove('is-copied')
               }, 2000)
            })
         })
      })
   },

   initTopicRead() {
      const moduleId = Navigation.currentModule()
      if (!moduleId) return

      document.querySelectorAll('.topic-section').forEach(section => {
         const topicId = section.dataset.topicId
         const btn = section.querySelector('.mark-read-btn')

         const saved = Progress.state.progress[moduleId]?.topics[topicId]
         if (saved?.read) {
            section.classList.add('is-read')
            if (btn) btn.textContent = 'Lido'
         }

         if (!btn || !topicId) return

         btn.addEventListener('click', () => {
            Progress.markTopicRead(moduleId, topicId)
            section.classList.add('is-read')
            btn.textContent = 'Lido'
            UI.updateProgressUI()
            UI.toast('Tópico marcado como lido', 'success', 2000)
         })
      })
   },

   updateProgressUI() {
      const overall = Progress.getOverallProgress()
      const moduleId = Navigation.currentModule()

      const headerFill = document.getElementById('header-progress-fill')
      if (headerFill) headerFill.style.width = `${overall.pct}%`

      const headerLabel = document.querySelector('.app-header__progress-label')
      if (headerLabel)
         headerLabel.textContent = `${overall.completed}/${overall.total} módulos`

      if (moduleId) {
         const pct = Progress.getModuleProgress(moduleId)
         const inlineFill = document.querySelector(
            '.module-progress-inline .progress-bar__fill',
         )
         const inlinePct = document.querySelector(
            '.module-progress-inline__pct',
         )
         if (inlineFill) inlineFill.style.width = `${pct}%`
         if (inlinePct) inlinePct.textContent = `${pct}%`
         Navigation.renderModuleNav()
      }
   },

   initSyntaxHighlight() {
      document
         .querySelectorAll('.code-block code[data-lang="go"]')
         .forEach(el => {
            el.innerHTML = Highlight.go(el.textContent)
         })
   },
}
