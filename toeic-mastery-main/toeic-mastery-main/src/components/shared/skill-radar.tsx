"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { PART_META } from "@/lib/constants/toeic";
import type { PartAccuracy } from "@/lib/services/recommendation";

export function SkillRadar({ data }: { data: PartAccuracy[] }) {
  const chartData = data.map((d) => ({
    part: PART_META[d.part].shortLabel,
    accuracy: Math.round(d.accuracy * 100),
    attempted: d.attempted,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={chartData} outerRadius="75%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="part" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickCount={5} />
        <Radar name="Độ chính xác" dataKey="accuracy" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.28} />
        <Tooltip
          formatter={(value) => [`${value}%`, "Độ chính xác"]}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
            color: "var(--popover-foreground)",
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
