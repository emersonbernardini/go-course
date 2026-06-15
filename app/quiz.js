import { Progress } from './progress.js'
import { Navigation } from './navigation.js'
import { Storage } from './storage.js'

// UI injetado para evitar circular dependency
let _UI = null
export function setUI(ui) {
   _UI = ui
}

export const Quiz = {
   initAll() {
      document.querySelectorAll('.quiz-block').forEach(block => {
         Quiz._initBlock(block)
      })
   },

   _initBlock(block) {
      const quizId = block.dataset.quizId
      const moduleId = Navigation.currentModule()
      const options = block.querySelectorAll('.quiz-option')
      const submitBtn = block.querySelector('.quiz-submit')
      let selected = null

      const saved = Progress.state.progress[moduleId]?.quizzes[quizId]
      if (saved && saved.attempts > 0) {
         Quiz._lockBlock(block, saved.passed)
         return
      }

      options.forEach(opt => {
         opt.addEventListener('click', () => {
            if (opt.classList.contains('is-disabled')) return
            options.forEach(o => o.classList.remove('is-selected'))
            opt.classList.add('is-selected')
            selected = opt
            if (submitBtn) submitBtn.disabled = false
         })
      })

      if (submitBtn) {
         submitBtn.disabled = true
         submitBtn.addEventListener('click', () => {
            if (!selected) return
            const correct = selected.dataset.correct === 'true'
            Quiz._revealAnswer(block, selected, correct)
            Progress.saveQuizResult(moduleId, quizId, correct ? 1 : 0, 1)
            _UI?.updateProgressUI()
         })
      }
   },

   _revealAnswer(block, selected, correct) {
      const options = block.querySelectorAll('.quiz-option')
      const feedback = block.querySelector('.quiz-feedback')
      const submitBtn = block.querySelector('.quiz-submit')

      options.forEach(opt => {
         opt.classList.add('is-disabled')
         if (opt.dataset.correct === 'true') {
            opt.classList.add('is-correct')
         }
      })

      selected.classList.remove('is-selected')
      if (!correct) selected.classList.add('is-wrong')

      if (feedback) {
         feedback.classList.add('is-visible')
         feedback.classList.add(
            correct ? 'quiz-feedback--correct' : 'quiz-feedback--wrong',
         )

         if (!feedback.textContent.trim()) {
            const customText = correct
               ? block.dataset.feedbackCorrect
               : block.dataset.feedbackWrong
            if (customText) {
               feedback.textContent = customText
            } else {
               feedback.textContent = correct
                  ? '✓ Resposta correta!'
                  : '✗ Resposta incorreta. Revise o conteúdo e tente novamente.'
            }
         }
      }

      if (submitBtn) submitBtn.disabled = true

      if (!correct) {
         Quiz._addRetryButton(block)
      }
   },

   _addRetryButton(block) {
      const existing = block.querySelector('.quiz-retry')
      if (existing) return

      const btn = document.createElement('button')
      btn.className = 'btn btn-secondary btn-sm quiz-retry'
      btn.style.marginTop = 'var(--space-3)'
      btn.textContent = 'Tentar novamente'

      btn.addEventListener('click', () => {
         const options = block.querySelectorAll('.quiz-option')
         const feedback = block.querySelector('.quiz-feedback')
         const submitBtn = block.querySelector('.quiz-submit')

         options.forEach(opt => {
            opt.classList.remove(
               'is-disabled',
               'is-selected',
               'is-correct',
               'is-wrong',
            )
         })

         if (feedback) {
            feedback.classList.remove(
               'is-visible',
               'quiz-feedback--correct',
               'quiz-feedback--wrong',
            )
            feedback.textContent = ''
         }

         if (submitBtn) submitBtn.disabled = true

         btn.remove()

         const moduleId = Navigation.currentModule()
         const quizId = block.dataset.quizId
         const mod = Progress.state.progress[moduleId]
         if (mod?.quizzes[quizId]) {
            if (mod.quizzes[quizId].passed) {
               Progress.state.stats.quizzesPassed--
            }
            delete mod.quizzes[quizId]
            Storage.save(Progress.state)
         }
      })

      const footer = block.querySelector('.quiz-submit')?.parentElement || block
      footer.appendChild(btn)
   },

   _lockBlock(block, passed) {
      const options = block.querySelectorAll('.quiz-option')
      options.forEach(opt => opt.classList.add('is-disabled'))
      const submitBtn = block.querySelector('.quiz-submit')
      if (submitBtn) submitBtn.disabled = true

      const feedback = block.querySelector('.quiz-feedback')
      if (feedback) {
         feedback.classList.add('is-visible')
         feedback.classList.add(
            passed ? 'quiz-feedback--correct' : 'quiz-feedback--wrong',
         )
         if (!feedback.textContent.trim()) {
            feedback.textContent = passed
               ? 'Você já respondeu corretamente.'
               : 'Você respondeu incorretamente. Revise o conteúdo.'
         }
      }

      if (!passed) {
         Quiz._addRetryButton(block)
      }
   },
}
