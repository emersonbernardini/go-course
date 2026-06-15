import { UI } from './ui.js'
import { Init } from './init.js'
import { setUI as progressSetUI } from './progress.js'
import { setUI as quizSetUI } from './quiz.js'
import { setUI as exerciseSetUI } from './exercise.js'

// Resolve circular dependencies injetando UI nos módulos que precisam dela
progressSetUI(UI)
quizSetUI(UI)
exerciseSetUI(UI)

if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', Init.run)
} else {
   Init.run()
}
