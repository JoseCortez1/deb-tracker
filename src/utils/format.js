export const fmt = (v) =>
  '$' +
  Number(v || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export const pct = (a, b) =>
  b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0;
