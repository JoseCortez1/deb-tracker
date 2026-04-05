import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { fmt } from '../utils/format.js';

export function BarChart({ debts }) {
  const ref = useRef(null);
  const instance = useRef(null);

  useEffect(() => {
    if (instance.current) instance.current.destroy();
    instance.current = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels: debts.map((d) => d.name),
        datasets: [
          {
            label: 'Saldo inicial',
            data: debts.map((d) => d.initialBalance),
            backgroundColor: debts.map((d) => d.color + '33'),
            borderColor: debts.map((d) => d.color + '55'),
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Saldo actual',
            data: debts.map((d) => d.currentBalance),
            backgroundColor: debts.map((d) => d.color),
            borderColor: debts.map((d) => d.color),
            borderWidth: 0,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: '#6b7a9e',
              font: { family: "'JetBrains Mono', monospace", size: 11 },
              boxWidth: 12,
              padding: 16,
            },
          },
          tooltip: {
            backgroundColor: '#1f2a45',
            titleColor: '#e8edf7',
            bodyColor: '#6b7a9e',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: '#6b7a9e',
              font: { family: "'JetBrains Mono', monospace", size: 10 },
            },
            grid: { color: '#1f2a45' },
          },
          y: {
            ticks: {
              color: '#6b7a9e',
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              callback: (v) => '$' + (v / 1000).toFixed(0) + 'k',
            },
            grid: { color: '#1f2a45' },
          },
        },
      },
    });
    return () => instance.current?.destroy();
  }, [debts]);

  return <canvas ref={ref} />;
}
