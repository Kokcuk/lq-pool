import { useRef, useState, useCallback, useEffect } from 'react';
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
  onRangeChange?: (lower: number, upper: number) => void;
}

// Chart layout constants — must match the LineChart props below
const MARGIN = { top: 8, right: 16, bottom: 0, left: 16 };
const Y_AXIS_WIDTH = 80;
const X_AXIS_HEIGHT = 30; // approximate
const CHART_HEIGHT = 300;
const HANDLE_HEIGHT = 12; // px, drag hit area half-height

const TIME_RANGES = [
  { key: '1d', label: '1D', days: 1 },
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '6m', label: '6M', days: 183 },
  { key: '1y', label: '1Y', days: 365 },
] as const;

type TimeRangeKey = (typeof TIME_RANGES)[number]['key'];

export default function PriceChart({ priceHistory, currentPrice, priceWindow, onRangeChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragBound, setDragBound] = useState<'upper' | 'lower' | null>(null);
  const [dragPrices, setDragPrices] = useState<{ lower: number; upper: number } | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('1y');

  // Filter price history by selected time range
  const cutoff = Date.now() / 1000 - TIME_RANGES.find(t => t.key === timeRange)!.days * 86400;
  const filteredHistory = priceHistory.filter(p => p.timestamp >= cutoff);
  const visibleHistory = filteredHistory.length >= 2 ? filteredHistory : priceHistory.slice(-2);

  const data = visibleHistory.map((p) => ({
    date: new Date(p.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: p.price,
  }));

  const prices = visibleHistory.map((p) => p.price);
  const effectiveLower = dragPrices?.lower ?? priceWindow.lowerPrice;
  const effectiveUpper = dragPrices?.upper ?? priceWindow.upperPrice;
  const minY = Math.min(...prices, effectiveLower) * 0.97;
  const maxY = Math.max(...prices, effectiveUpper) * 1.03;

  // Convert between price and pixel Y
  const chartTop = MARGIN.top;
  const chartBottom = CHART_HEIGHT - X_AXIS_HEIGHT - MARGIN.bottom;
  const chartH = chartBottom - chartTop;

  const priceToY = useCallback((price: number) => {
    return chartTop + chartH * (1 - (price - minY) / (maxY - minY));
  }, [minY, maxY, chartTop, chartH]);

  const yToPrice = useCallback((y: number) => {
    return minY + (maxY - minY) * (1 - (y - chartTop) / chartH);
  }, [minY, maxY, chartTop, chartH]);

  // Drag handlers
  const handleMouseDown = useCallback((bound: 'upper' | 'lower') => (e: React.MouseEvent) => {
    e.preventDefault();
    setDragBound(bound);
    setDragPrices({ lower: priceWindow.lowerPrice, upper: priceWindow.upperPrice });
  }, [priceWindow.lowerPrice, priceWindow.upperPrice]);

  useEffect(() => {
    if (!dragBound) return;

    function handleMouseMove(e: MouseEvent) {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const localY = e.clientY - rect.top;
      const price = yToPrice(localY);

      setDragPrices((prev) => {
        if (!prev) return prev;
        if (dragBound === 'lower') {
          const clamped = Math.max(0.0001, Math.min(price, prev.upper * 0.999));
          return { ...prev, lower: clamped };
        } else {
          const clamped = Math.max(prev.lower * 1.001, price);
          return { ...prev, upper: clamped };
        }
      });
    }

    function handleMouseUp() {
      setDragBound(null);
      setDragPrices((prev) => {
        if (prev && onRangeChange) {
          onRangeChange(
            Math.round(prev.lower * 1e6) / 1e6,
            Math.round(prev.upper * 1e6) / 1e6,
          );
        }
        return null;
      });
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragBound, yToPrice, onRangeChange]);

  // Pixel positions for drag handles
  const containerWidth = containerRef.current?.clientWidth ?? 800;
  const handleLeft = MARGIN.left + Y_AXIS_WIDTH;
  const handleWidth = containerWidth - handleLeft - MARGIN.right;

  const upperY = priceToY(effectiveUpper);
  const lowerY = priceToY(effectiveLower);

  const draggable = !!onRangeChange;

  return (
    <div
      ref={containerRef}
      style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 20, marginBottom: 20, position: 'relative' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, display: 'inline' }}>Price History</h3>
          {draggable && (
            <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 12, marginLeft: 8 }}>
              Drag the red lines to adjust range
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {TIME_RANGES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeRange(key)}
              style={{
                padding: '3px 10px',
                fontSize: 12,
                fontWeight: timeRange === key ? 600 : 400,
                border: '1px solid',
                borderColor: timeRange === key ? '#2563eb' : '#d1d5db',
                borderRadius: 4,
                background: timeRange === key ? '#eff6ff' : '#fff',
                color: timeRange === key ? '#2563eb' : '#6b7280',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart data={data} margin={MARGIN}>
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
            width={Y_AXIS_WIDTH}
          />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12 }}
            formatter={(v) => [formatCurrency(Number(v)), 'Price']}
          />
          <ReferenceArea
            y1={effectiveLower}
            y2={effectiveUpper}
            fill="#22c55e"
            fillOpacity={0.08}
          />
          <ReferenceLine
            y={effectiveUpper}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value: `Upper ${formatCurrency(effectiveUpper)}`, fill: '#ef4444', fontSize: 11, position: 'right' }}
          />
          <ReferenceLine
            y={effectiveLower}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{ value: `Lower ${formatCurrency(effectiveLower)}`, fill: '#ef4444', fontSize: 11, position: 'right' }}
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

      {/* Invisible drag handles overlaid on the chart */}
      {draggable && (
        <>
          <DragHandle
            y={upperY}
            left={handleLeft}
            width={handleWidth}
            dragging={dragBound === 'upper'}
            onMouseDown={handleMouseDown('upper')}
          />
          <DragHandle
            y={lowerY}
            left={handleLeft}
            width={handleWidth}
            dragging={dragBound === 'lower'}
            onMouseDown={handleMouseDown('lower')}
          />
        </>
      )}
    </div>
  );
}

function DragHandle({ y, left, width, dragging, onMouseDown }: {
  y: number;
  left: number;
  width: number;
  dragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  // Offset for the h3 title + padding above the chart
  // h3 has margin 0 0 16px, font ~14px line height ~20px, plus container padding 20px
  const titleOffset = 20 + 20 + 16; // padding-top + title height + title margin-bottom

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left,
        top: y + titleOffset - HANDLE_HEIGHT,
        width,
        height: HANDLE_HEIGHT * 2,
        cursor: 'ns-resize',
        background: dragging ? 'rgba(239,68,68,0.08)' : 'transparent',
        zIndex: 10,
      }}
    />
  );
}
