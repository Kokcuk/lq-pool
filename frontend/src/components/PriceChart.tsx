import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import type { PricePoint, PriceWindow } from '../types';
import { formatPrice } from '../utils/format';

interface Props {
  priceHistory: PricePoint[];
  currentPrice: number;
  priceWindow: PriceWindow;
}

export default function PriceChart({ priceHistory, currentPrice, priceWindow }: Props) {
  const data = priceHistory.map((p) => ({
    date: new Date(p.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: p.price,
  }));

  const prices = priceHistory.map((p) => p.price);
  const minY = Math.min(...prices, priceWindow.lowerPrice) * 0.97;
  const maxY = Math.max(...prices, priceWindow.upperPrice) * 1.03;

  return (
    <div style={styles.wrap}>
      <h3 style={styles.title}>Price History (1 year)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 16 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#475569', fontSize: 11 }}
            interval={Math.floor(data.length / 8)}
            tickLine={false}
            axisLine={{ stroke: '#2d2d4e' }}
          />
          <YAxis
            domain={[minY, maxY]}
            tick={{ fill: '#475569', fontSize: 11 }}
            tickFormatter={(v) => `$${formatPrice(v)}`}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip
            contentStyle={{ background: '#1e1e38', border: '1px solid #2d2d4e', borderRadius: 6, fontSize: 12 }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#818cf8' }}
            formatter={(v) => [`$${formatPrice(Number(v))}`, 'Price']}
          />
          {/* Shaded band between lower and upper */}
          <ReferenceArea
            y1={priceWindow.lowerPrice}
            y2={priceWindow.upperPrice}
            fill="#6366f1"
            fillOpacity={0.08}
          />
          {/* Upper bound */}
          <ReferenceLine
            y={priceWindow.upperPrice}
            stroke="#6366f1"
            strokeDasharray="4 4"
            label={{ value: 'upper', fill: '#6366f1', fontSize: 11, position: 'right' }}
          />
          {/* Lower bound */}
          <ReferenceLine
            y={priceWindow.lowerPrice}
            stroke="#6366f1"
            strokeDasharray="4 4"
            label={{ value: 'lower', fill: '#6366f1', fontSize: 11, position: 'right' }}
          />
          {/* Current price */}
          <ReferenceLine
            y={currentPrice}
            stroke="#22c55e"
            strokeWidth={1.5}
            label={{ value: 'current', fill: '#22c55e', fontSize: 11, position: 'right' }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#818cf8"
            dot={false}
            strokeWidth={1.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    background: '#1e1e38',
    border: '1px solid #2d2d4e',
    borderRadius: 8,
    padding: '16px 20px',
    marginBottom: 20,
  },
  title: {
    margin: '0 0 16px',
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: 600,
  },
};
