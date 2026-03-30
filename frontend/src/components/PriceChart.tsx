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
import { formatCurrency } from '../utils/format';

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
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 20 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Price History (1 year)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 16 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            interval={Math.floor(data.length / 8)}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            domain={[minY, maxY]}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={(v) => formatCurrency(v)}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12 }}
            formatter={(v) => [formatCurrency(Number(v)), 'Price']}
          />
          <ReferenceArea
            y1={priceWindow.lowerPrice}
            y2={priceWindow.upperPrice}
            fill="#22c55e"
            fillOpacity={0.08}
          />
          <ReferenceLine
            y={priceWindow.upperPrice}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value: 'Upper', fill: '#ef4444', fontSize: 11, position: 'right' }}
          />
          <ReferenceLine
            y={priceWindow.lowerPrice}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value: 'Lower', fill: '#ef4444', fontSize: 11, position: 'right' }}
          />
          <ReferenceLine
            y={currentPrice}
            stroke="#16a34a"
            strokeWidth={1.5}
            label={{ value: 'Current', fill: '#16a34a', fontSize: 11, position: 'right' }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#2563eb"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
