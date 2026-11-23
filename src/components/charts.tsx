"use client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { money } from "@/lib/money";
export function SalesChart({
  data,
  currency,
}: {
  data: { date: string; revenue: number; cost: number }[];
  currency: string;
}) {
  if (!data.length)
    return (
      <div className="chart-empty">
        Las ventas confirmadas del período aparecerán acá.
      </div>
    );
  return (
    <div
      className="chart"
      role="img"
      aria-label="Gráfico de ingresos y costos de ventas. Los valores exactos se muestran en la tabla de ventas."
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ left: 0, top: 15, right: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c45135" stopOpacity={0.22} />
              <stop offset="1" stopColor="#c45135" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#ecebe7" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            width={55}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) =>
              Number(v) >= 1000 ? `${Number(v) / 1000}k` : String(v)
            }
            tickLine={false}
            axisLine={false}
          />
          <Tooltip formatter={(v) => money(Number(v), currency)} />
          <Legend />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="revenue"
            name="Ingresos por ventas"
            stroke="#c45135"
            strokeWidth={2}
            fill="url(#revenue)"
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="cost"
            name="Costo de mercadería"
            stroke="#667d6b"
            fill="transparent"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
