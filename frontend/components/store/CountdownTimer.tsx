'use client';

import { useState, useEffect } from 'react';

interface Props {
  endDate: string;
}

export default function CountdownTimer({ endDate }: Props) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) return setTimeLeft({ h: 0, m: 0, s: 0 });
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft({ h, m, s });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1 text-sm" style={{ fontFamily: 'var(--sl-font-mono)' }}>
      <span
        className="rounded px-1.5 py-0.5 font-semibold"
        style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)', border: '1px solid var(--sl-accent)' }}
      >
        {pad(timeLeft.h)}
      </span>
      <span style={{ color: 'var(--sl-accent)' }}>:</span>
      <span
        className="rounded px-1.5 py-0.5 font-semibold"
        style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)', border: '1px solid var(--sl-accent)' }}
      >
        {pad(timeLeft.m)}
      </span>
      <span style={{ color: 'var(--sl-accent)' }}>:</span>
      <span
        className="rounded px-1.5 py-0.5 font-semibold"
        style={{ background: 'var(--sl-accent-muted)', color: 'var(--sl-accent)', border: '1px solid var(--sl-accent)' }}
      >
        {pad(timeLeft.s)}
      </span>
    </div>
  );
}
