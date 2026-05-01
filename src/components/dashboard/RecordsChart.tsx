import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type DidjyahWithRecords = InstaQLEntity<
  AppSchema,
  "didjyahs",
  { records: {} }
>;

interface RecordsChartProps {
  didjyah: DidjyahWithRecords;
}

export default function RecordsChart({ didjyah }: RecordsChartProps) {
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");

  const chartData = useMemo(() => {
    const records = didjyah.records || []

    let startDate: Date
    let days: number;

    if (period === "week") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      days = 7;
    } else if (period === "month") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 29);
      days = 30;
    } else {
      // year - show last 12 months
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 11);
      days = 12;
    }

    startDate.setHours(0, 0, 0, 0);

    // Group records by period
    const dataMap = new Map<string, number>();

    records.forEach((record) => {
      if (!record.createdDate) return;
      const recordDate = new Date(record.createdDate);
      
      let key: string;
      if (period === "week" || period === "month") {
        // Group by day
        key = `${recordDate.getFullYear()}-${recordDate.getMonth()}-${recordDate.getDate()}`;
      } else {
        // Group by month
        key = `${recordDate.getFullYear()}-${recordDate.getMonth()}`;
      }

      dataMap.set(key, (dataMap.get(key) || 0) + 1);
    });

    // Create array of all periods in range
    const result: Array<{ label: string; value: number; date: Date }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      if (period === "week" || period === "month") {
        date.setDate(date.getDate() + i);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const label =
          period === "week"
            ? date.toLocaleDateString("en-US", { weekday: "short" })
            : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        result.push({
          label,
          value: dataMap.get(key) || 0,
          date: new Date(date),
        });
      } else {
        date.setMonth(date.getMonth() + i);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const label = date.toLocaleDateString("en-US", { month: "short" });
        result.push({
          label,
          value: dataMap.get(key) || 0,
          date: new Date(date),
        });
      }
    }

    return result;
  }, [didjyah.records, period]);

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Records Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
          <TabsContent value={period} className="mt-6">
            <div className="flex items-end justify-between gap-2 h-64">
              {chartData.map((data, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div className="relative w-full flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full bg-primary rounded-t transition-all"
                      style={{
                        height: `${(data.value / maxValue) * 100}%`,
                        minHeight: data.value > 0 ? "4px" : "0",
                      }}
                      title={`${data.label}: ${data.value}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground text-center">
                    {data.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Total: {chartData.reduce((sum, d) => sum + d.value, 0)} records
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

