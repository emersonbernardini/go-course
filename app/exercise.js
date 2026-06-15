import { Progress } from './progress.js'
import { Navigation } from './navigation.js'
import { Storage } from './storage.js'

// UI injetado para evitar circular dependency
let _UI = null
export function setUI(ui) {
   _UI = ui
}

export const Exercise = {
   initAll() {
      document.querySelectorAll('.exercise-block').forEach(block => {
         Exercise._initBlock(block)
      })
   },

   _initBlock(block) {
      const exerciseId = block.dataset.exerciseId
      const moduleId = Navigation.currentModule()
      const options = block.querySelectorAll('.exercise-option')
      let submitBtn = block.querySelector('.exercise-submit')
      let selected = null
      block.dataset.answered = ''

      const saved = Progress.state.progress[moduleId]?.exercises[exerciseId]
      if (saved && saved.completed) {
         Exercise._lockBlock(block, true)
         return
      }

      if (!submitBtn) {
         const footer = document.createElement('div')
         footer.style.cssText =
            'padding: var(--space-4) var(--space-5); border-top: 1px solid var(--color-border); display:flex; justify-content:flex-end;'
         submitBtn = document.createElement('button')
         submitBtn.className = 'btn btn-primary btn-sm exercise-submit'
         submitBtn.textContent = 'Confirmar resposta'
         submitBtn.disabled = true
         footer.appendChild(submitBtn)
         block.appendChild(footer)
      }

      options.forEach(opt => {
         opt.addEventListener('click', () => {
            if (
               opt.classList.contains('is-disabled') ||
               block.dataset.answered === 'true'
            )
               return
            options.forEach(o => o.classList.remove('is-selected'))
            opt.classList.add('is-selected')
            selected = opt
            submitBtn.disabled = false
         })
      })

      submitBtn.disabled = true
      submitBtn.addEventListener('click', () => {
         if (!selected || block.dataset.answered === 'true') return
         block.dataset.answered = 'true'
         const correct = selected.dataset.correct === 'true'
         Exercise._revealAnswer(block, selected, correct)
         Progress.saveExerciseResult(moduleId, exerciseId, correct)
         _UI?.updateProgressUI()
      })
   },

   _revealAnswer(block, selected, correct) {
      const options = block.querySelectorAll('.exercise-option')
      const feedback = block.querySelector('.exercise-feedback')

      options.forEach(opt => {
         opt.classList.add('is-disabled')
         if (opt.dataset.correct === 'true') opt.classList.add('is-correct')
      })

      selected.classList.remove('is-selected')
      if (!correct) selected.classList.add('is-wrong')

      if (feedback) {
         feedback.classList.add('is-visible')
         feedback.classList.add(
            correct ? 'exercise-feedback--correct' : 'exercise-feedback--wrong',
         )
      }

      const submitBtn = block.querySelector('.exercise-submit')
      if (submitBtn) submitBtn.disabled = true

      if (!correct) {
         Exercise._addRetryButton(block)
      }
   },

   _addRetryButton(block) {
      const existing = block.querySelector('.exercise-retry')
      if (existing) return

      const btn = document.createElement('button')
      btn.className = 'btn btn-secondary btn-sm exercise-retry'
      btn.style.marginTop = 'var(--space-3)'
      btn.textContent = 'Tentar novamente'

      btn.addEventListener('click', () => {
         const options = block.querySelectorAll('.exercise-option')
         const feedback = block.querySelector('.exercise-feedback')
         const submitBtn = block.querySelector('.exercise-submit')

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
               'exercise-feedback--correct',
               'exercise-feedback--wrong',
            )
            feedback.textContent = ''
         }

         if (submitBtn) submitBtn.disabled = true

         btn.remove()

         const moduleId = Navigation.currentModule()
         const exerciseId = block.dataset.exerciseId
         const mod = Progress.state.progress[moduleId]
         if (mod?.exercises[exerciseId]) {
            delete mod.exercises[exerciseId]
            Storage.save(Progress.state)
         }

         block.dataset.answered = ''
      })

      const footer =
         block.querySelector('.exercise-submit')?.parentElement || block
      footer.appendChild(btn)
   },

   _lockBlock(block, passed) {
      block.querySelectorAll('.exercise-option').forEach(o => {
         o.classList.add('is-disabled')
         if (o.dataset.correct === 'true') o.classList.add('is-correct')
      })
      const submitBtn = block.querySelector('.exercise-submit')
      if (submitBtn) submitBtn.disabled = true
      const feedback = block.querySelector('.exercise-feedback')
      if (feedback && !feedback.textContent.trim()) {
         feedback.classList.add('is-visible', 'exercise-feedback--correct')
         feedback.textContent = 'Exercício já concluído.'
      }
   },
}
