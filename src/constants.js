export const DEBT_COLORS = {
  'Mercado Pago': '#f0c040',
  Coppel: '#4a8cf7',
  'Muebles América': '#a78bfa',
  Nu: '#e05a6b',
  Banamex: '#4fd1a5',
};

export const TIMELINE = [
  {
    month: 'Abril 2026',
    date: 'Abr 2026',
    goal: 'Activar el plan · Liquidar Mercado Pago',
    badge: '✅ Mercado Pago → $0',
  },
  {
    month: 'Mayo 2026',
    date: 'May 2026',
    goal: 'Liquidar Coppel · Atacar Muebles América',
    badge: '✅ Coppel → $0',
  },
  {
    month: 'Junio 2026',
    date: 'Jun 2026',
    goal: 'Liquidar Muebles América · Atacar Nu',
    badge: '✅ Muebles América → $0',
  },
  {
    month: 'Julio 2026',
    date: 'Jul 2026',
    goal: 'Moto terminada · Máxima potencia sobre Nu',
    badge: '💥 Ataque masivo a Nu',
  },
  {
    month: 'Agosto 2026',
    date: 'Ago 2026',
    goal: 'Liquidar Nu · Golpe masivo a Banamex',
    badge: '✅ Nu → $0',
  },
  {
    month: 'Septiembre 2026',
    date: 'Sep 2026',
    goal: '🏆 TODAS LAS DEUDAS LIQUIDADAS',
    badge: '🎉 LIBRE',
  },
];

export const DEFAULT_DEBTS = [
  {
    id: 1,
    name: 'Mercado Pago',
    emoji: '🛒',
    initialBalance: 2500,
    currentBalance: 2500,
    minPayment: 340,
    color: DEBT_COLORS['Mercado Pago'],
    paid: false,
  },
  {
    id: 2,
    name: 'Coppel',
    emoji: '🏬',
    initialBalance: 5200,
    currentBalance: 5200,
    minPayment: 1300,
    color: DEBT_COLORS.Coppel,
    paid: false,
  },
  {
    id: 3,
    name: 'Muebles América',
    emoji: '🛋️',
    initialBalance: 4800,
    currentBalance: 4800,
    minPayment: 1000,
    color: DEBT_COLORS['Muebles América'],
    paid: false,
  },
  {
    id: 4,
    name: 'Nu',
    emoji: '💜',
    initialBalance: 18000,
    currentBalance: 18000,
    minPayment: 1200,
    color: DEBT_COLORS.Nu,
    paid: false,
  },
  {
    id: 5,
    name: 'Banamex',
    emoji: '🏦',
    initialBalance: 13500,
    currentBalance: 13500,
    minPayment: 1300,
    color: DEBT_COLORS.Banamex,
    paid: false,
  },
];

/** Colores para deudas agregadas manualmente (se ciclan por id). */
export const EXTRA_DEBT_COLORS = [
  '#f472b6',
  '#22d3ee',
  '#fb923c',
  '#c084fc',
  '#2dd4bf',
  '#facc15',
  '#60a5fa',
  '#f87171',
];

export const DEFAULT_INCOME = 27000;
export const DEFAULT_EXPENSES = 15470;

export const GOLDEN_RULES = [
  'El día 15, lo primero es transferir a BBVA — antes de gastar un peso.',
  'Nu débito es para el día a día — si algo no cabe en Nu, no es urgente.',
  'Las tarjetas de ciclo (Plata, Stori, Didi) se pagan en su totalidad cada mes.',
  'Si hay un gasto imprevisto, ajusta en otro lado antes de cargarlo a tarjeta.',
  'Una negociación exitosa con Nu puede cambiar el plan. Insiste.',
  'La despensa es temporal — se retoma en cuanto Banamex caiga.',
];

export const TABS = [
  ['dashboard', '📊 Dashboard'],
  ['debts', '💳 Deudas'],
  ['charts', '📈 Gráficas'],
  ['timeline', '🗺️ Ruta'],
  ['settings', '⚙️ Config'],
];
