const ICONS = {
   // Navegação / UI
   menu: 'fa-bars',
   close: 'fa-xmark',
   arrow: 'fa-arrow-right',
   arrowLeft: 'fa-arrow-left',
   info: 'fa-circle-info',
   gear: 'fa-gear',

   // Estado de módulos
   lock: 'fa-lock',
   check: 'fa-circle-check',
   circle: 'fa-circle',
   inProgress: 'fa-circle-half-stroke',

   // Conteúdo
   module: 'fa-book',
   exercise: 'fa-code',
   quiz: 'fa-list-check',
   progress: 'fa-chart-line',
   start: 'fa-circle-play',

   // Feedback
   success: 'fa-circle-check',
   error: 'fa-circle-xmark',
   warning: 'fa-triangle-exclamation',
   celebrate: 'fa-trophy',
}

export function icon(key, extraClass = '') {
   const fa = ICONS[key] || 'fa-circle'
   const extra = extraClass ? ` ${extraClass}` : ''
   return `<i class="fa-solid ${fa}${extra}" aria-hidden="true"></i>`
}

// Alias de compatibilidade para código legado que usava Icons.*
export const Icons = {
   menu: icon('menu'),
   check: icon('check'),
   lock: icon('lock'),
   circle: icon('circle'),
   info: icon('info'),
   arrow: icon('arrow'),
}
