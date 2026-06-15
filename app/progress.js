import { CONFIG } from './config.js'
import { Storage } from './storage.js'

// UI é importado dinamicamente para evitar circular dependency
// (Progress._checkModuleCompletion chama UI.toast)
let _UI = null
export function setUI(ui) {
   _UI = ui
}

export const Progress = {
   state: null,

   init() {
      Progress.state = Storage.load()
      Progress._updateStreak()
      Progress._syncUnlocks()
   },

   _syncUnlocks() {
      CONFIG.modules.forEach((mod, idx) => {
         const state = Progress.state.progress[mod.id]
         if (!state) return
         if (state.status === 'completed' && idx + 1 < CONFIG.modules.length) {
            const nextId = CONFIG.modules[idx + 1].id
            const nextState = Progress.state.progress[nextId]
            if (nextState?.status === 'locked') {
               nextState.status = 'unlocked'
            }
         }
      })
      Storage.save(Progress.state)
   },

   markTopicRead(moduleId, topicId) {
      const mod = Progress.state.progress[moduleId]
      if (!mod) return

      if (!mod.topics[topicId]) {
         mod.topics[topicId] = { read: false }
      }

      if (mod.topics[topicId].read) return

      mod.topics[topicId].read = true
      mod.topics[topicId].timestamp = new Date().toISOString()

      if (mod.status === 'locked') mod.status = 'unlocked'
      else if (mod.status === 'unlocked') mod.status = 'in-progress'

      Storage.save(Progress.state)
      Progress._checkModuleCompletion(moduleId)
   },

   saveQuizResult(moduleId, quizId, score, total) {
      const mod = Progress.state.progress[moduleId]
      if (!mod) return

      const passed = score >= Math.ceil(total * 0.7)

      if (!mod.quizzes[quizId]) {
         mod.quizzes[quizId] = { score: 0, total, attempts: 0, passed: false }
      }

      mod.quizzes[quizId].attempts++
      if (score > mod.quizzes[quizId].score) {
         mod.quizzes[quizId].score = score
      }
      if (passed) {
         mod.quizzes[quizId].passed = true
         Progress.state.stats.quizzesPassed++
      }

      Storage.save(Progress.state)
      Progress._checkModuleCompletion(moduleId)
   },

   saveExerciseResult(moduleId, exerciseId, correct) {
      const mod = Progress.state.progress[moduleId]
      if (!mod) return

      if (!mod.exercises[exerciseId]) {
         mod.exercises[exerciseId] = { completed: false, attempts: 0 }
      }

      mod.exercises[exerciseId].attempts++
      if (correct) {
         const wasCompleted = mod.exercises[exerciseId].completed
         mod.exercises[exerciseId].completed = true
         if (!wasCompleted) {
            Progress.state.stats.exercisesDone++
         }
      }

      Storage.save(Progress.state)
      Progress._checkModuleCompletion(moduleId)
   },

   getModuleProgress(moduleId) {
      const mod = Progress.state.progress[moduleId]
      const meta = CONFIG.modules.find(m => m.id === moduleId)
      if (!mod || !meta) return 0

      const totalTopics = meta.topics
      const readTopics = Object.values(mod.topics).filter(t => t.read).length
      const topicPct = totalTopics > 0 ? (readTopics / totalTopics) * 70 : 70

      const totalQuizzes = meta.quizzes || 0
      const passedQuizzes = Object.values(mod.quizzes).filter(
         q => q.passed,
      ).length
      const quizPct =
         totalQuizzes > 0 ? (passedQuizzes / totalQuizzes) * 20 : 20

      const totalExercises = meta.exercises || 0
      const doneExercises = Object.values(mod.exercises).filter(
         e => e.completed,
      ).length
      const exPct =
         totalExercises > 0 ? (doneExercises / totalExercises) * 10 : 10

      return Math.round(topicPct + quizPct + exPct)
   },

   getOverallProgress() {
      const total = CONFIG.modules.length
      const completed = CONFIG.modules.filter(
         m => Progress.state.progress[m.id]?.status === 'completed',
      ).length
      return { completed, total, pct: Math.round((completed / total) * 100) }
   },

   _checkModuleCompletion(moduleId) {
      const pct = Progress.getModuleProgress(moduleId)
      const mod = Progress.state.progress[moduleId]
      if (!mod) return

      if (pct === 100 && mod.status !== 'completed') {
         mod.status = 'completed'
         mod.completedAt = new Date().toISOString()
         Progress.state.stats.modulesCompleted++

         const idx = CONFIG.modules.findIndex(m => m.id === moduleId)
         if (idx >= 0 && idx + 1 < CONFIG.modules.length) {
            const nextId = CONFIG.modules[idx + 1].id
            if (Progress.state.progress[nextId].status === 'locked') {
               Progress.state.progress[nextId].status = 'unlocked'
            }
         }

         Storage.save(Progress.state)
         _UI?.toast('Módulo concluído!', 'success')
      }
   },

   _updateStreak() {
      const today = new Date().toDateString()
      const last = Progress.state.stats.lastStudyDate

      if (last === today) return

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      if (last === yesterday.toDateString()) {
         Progress.state.stats.currentStreak++
      } else if (last !== today) {
         Progress.state.stats.currentStreak = 1
      }

      Progress.state.stats.lastStudyDate = today
      Storage.save(Progress.state)
   },
}
