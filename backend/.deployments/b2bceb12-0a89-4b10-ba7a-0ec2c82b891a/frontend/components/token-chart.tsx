"use client"

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { priceHistory } from "@/lib/mock-data"

interface TokenChartProps {
  tokenId: string
  height?: number
}

export function TokenChart({ tokenId, height = 300 }: TokenChartProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={priceHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9CFFBB" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#9CFFBB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#666", fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#666", fontSize: 12 }}
            tickFormatter={(value) => value.toFixed(4)}
            domain={["dataMin - 0.001", "dataMax + 0.001"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111111",
              border: "1px solid rgba(156, 255, 187, 0.2)",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}
            labelStyle={{ color: "#888" }}
            itemStyle={{ color: "#9CFFBB" }}
            formatter={(value: number) => [`${value.toFixed(6)} ADA`, "Price"]}
          />
          <Area type="monotone" dataKey="price" stroke="#9CFFBB" strokeWidth={2} fill="url(#priceGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
