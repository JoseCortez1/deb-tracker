import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { fmt } from '../utils/format.js';

export function DonutChart({ debts }) {
  const ref = useRef(null);
  const instance = useRef(null);

  useEffect(() => {
    const active = debts.filter((d) => !d.paid);
    if (instance.current) instance.current.destroy();
    instance.current = new Chart(ref.current, {
      type: 'doughnut',
      data: {
        labels: active.map((d) => d.name),
        datasets: [
          {
            data: active.map((d) => d.currentBalance),
            backgroundColor: active.map((d) => d.color),
            borderColor: '#161c2d',
            borderWidth: 3,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${fmt(ctx.raw)}`,
            },
            backgroundColor: '#1f2a45',
            titleColor: '#e8edf7',
            bodyColor: '#6b7a9e',
            padding: 12,
            cornerRadius: 8,
          },
        },
        animation: { animateRotate: true, duration: 800 },
      },
    });
    return () => instance.current?.destroy();
  }, [debts]);

  return <canvas ref={ref} />;
}
