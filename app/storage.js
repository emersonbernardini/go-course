import { CONFIG } from './config.js'

export const Storage = {
   load() {
      try {
         const raw = localStorage.getItem(CONFIG.storageKey)
         if (!raw) return Storage._defaultState()
         const parsed = JSON.parse(raw)
         return parsed
      } catch (e) {
         console.warn('[Storage] Erro ao carregar dados:', e)
         return Storage._defaultState()
      }
   },

   save(state) {
      try {
         state.lastAccess = new Date().toISOString()
         localStorage.setItem(CONFIG.storageKey, JSON.stringify(state))
      } catch (e) {
         console.warn('[Storage] Erro ao salvar dados:', e)
      }
   },

   _defaultState() {
      const state = {
         version: CONFIG.version,
         lastAccess: new Date().toISOString(),
         progress: {},
         stats: {
            totalTimeSpent: 0,
            modulesCompleted: 0,
            quizzesPassed: 0,
            exercisesDone: 0,
            currentStreak: 0,
            lastStudyDate: null,
         },
      }

      CONFIG.modules.forEach((mod, idx) => {
         state.progress[mod.id] = {
            status: idx === 0 ? 'unlocked' : 'locked',
            topics: {},
            quizzes: {},
            exercises: {},
            completedAt: null,
         }
      })

      return state
   },

   reset() {
      localStorage.removeItem(CONFIG.storageKey)
      return Storage._defaultState()
   },
}
