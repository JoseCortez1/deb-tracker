/**
 * Calcula la ruta de pago de deudas (metodo avalancha).
 */
export function calculatePayoffTimeline(debts, income, livingExpenses, startMonth) {
  const active = debts.filter(d => !d.paid && d.currentBalance > 0)
    .map(d => ({ ...d, balance: Number(d.currentBalance) }));
  if (!active.length || !income || !startMonth) return [];

  const minPaymentsTotal = active.reduce((s, d) => s + Number(d.minPayment || 0), 0);
  let available = income - livingExpenses - minPaymentsTotal;
  if (available < 0) available = 0;

  active.sort((a, b) => b.balance - a.balance);

  const [sy, sm] = startMonth.split('-').map(Number);
  const timeline = [];
  let month = sy * 12 + sm - 1;
  const maxMonths = 24;

  for (let iter = 0; iter < maxMonths; iter++) {
    if (!active.some(d => d.balance > 0)) break;
    const currYear = Math.floor(month / 12);
    const currM = (month % 12) + 1;
    const dateStr = currYear + '-' + String(currM).padStart(2, '0');
    const monthLabel = new Date(currYear, currM - 1, 1)
      .toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

    for (const d of active) {
      if (d.balance > 0) {
        d.balance -= Number(d.minPayment || 0);
        if (d.balance < 0) d.balance = 0;
      }
    }

    let attacked = null;
    let attackDebtName = '';
    if (available > 0) {
      const target = active.find(d => d.balance > 0);
      if (target) {
        const payment = Math.min(available, target.balance);
        target.balance -= payment;
        attacked = payment;
        attackDebtName = target.name;
      }
    }

    const monthDebts = active.map(d => ({
      id: d.id, name: d.name, balance: Math.max(0, d.balance),
      color: d.color, emoji: d.emoji,
    }));

    const justPaid = active.filter(d => d.balance <= 0);

    timeline.push({
      month: monthLabel, date: dateStr, debts: monthDebts,
      available: Math.max(0, available),
      attack: attacked ? { amount: attacked, name: attackDebtName } : null,
      justPaid: justPaid.length > 0 ? justPaid.map(d => d.name) : null,
      goal: justPaid.length > 0
        ? justPaid.map(d => d.emoji).join('') + ' ' + justPaid.map(d => d.name).join(', ') + ' liquidada(s)'
        : attacked ? attackDebtName + ': -' + fmtShort(attacked) : 'Pagando minimos',
      badge: justPaid.length > 0
        ? '✅ ' + justPaid.map(d => d.name).join(', ') + ' -> /usr/bin/bash'
        : null,
    });
    month++;
  }
  return timeline;
}

function fmtShort(amount) {
  if (amount >= 1000) return '$' + (amount / 1000).toFixed(1) + 'k';
  return '$' + Math.round(amount);
}
