import { DashboardRevenueBucket } from '@/types';
import { formatPrice } from '@/lib/utils';

interface Props {
  data: DashboardRevenueBucket[];
}

const WIDTH = 720;
const HEIGHT = 220;
const PAD_LEFT = 64;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const BAR_RADIUS = 4;
const ACCENT = '#2563EB';

function niceMax(value: number): number {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Column with rounded top corners only, square at the baseline. */
function roundedTopBarPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(BAR_RADIUS, width / 2, height);
  const bottom = y + height;
  if (height <= 0) return '';
  return `M${x},${bottom} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${bottom} Z`;
}

export default function RevenueChart({ data }: Props) {
  const nonEmptyBuckets = data.filter((d) => d.orders > 0).length;

  if (nonEmptyBuckets < 2) {
    return (
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">Динаміка виручки</h2>
        <div className="flex h-40 items-center justify-center text-sm text-gray-400">
          Замало даних для динаміки
        </div>
      </div>
    );
  }

  const max = niceMax(Math.max(...data.map((d) => d.total)));
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const bandWidth = plotWidth / data.length;
  const barWidth = Math.min(24, bandWidth * 0.6);
  const yTicks = [0, max * 0.5, max];
  const labelStep = Math.max(1, Math.ceil(data.length / 10));

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-500">Динаміка виручки</h2>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Динаміка виручки за обраний період">
        {yTicks.map((tick) => {
          const y = PAD_TOP + plotHeight - (tick / max) * plotHeight;
          return (
            <g key={tick}>
              <line x1={PAD_LEFT} y1={y} x2={WIDTH - PAD_RIGHT} y2={y} stroke="#E5E7EB" strokeWidth={1} />
              <text x={PAD_LEFT - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#9CA3AF">
                {formatPrice(tick)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const barHeight = max > 0 ? (d.total / max) * plotHeight : 0;
          const x = PAD_LEFT + i * bandWidth + (bandWidth - barWidth) / 2;
          const y = PAD_TOP + plotHeight - barHeight;
          return (
            <g key={`${d.bucket}-${i}`}>
              <path d={roundedTopBarPath(x, y, barWidth, barHeight)} fill={ACCENT}>
                <title>{`${d.bucket}: ${formatPrice(d.total)} (${d.orders} замовлень)`}</title>
              </path>
              {i % labelStep === 0 && (
                <text x={x + barWidth / 2} y={HEIGHT - PAD_BOTTOM + 16} textAnchor="middle" fontSize={10} fill="#6B7280">
                  {d.bucket}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
