import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, Target, BarChart3 } from "lucide-react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type DidjyahWithRecords = InstaQLEntity<
  AppSchema,
  "didjyahs",
  { records: {} }
>;

interface DashboardStatsProps {
  didjyah: DidjyahWithRecords;
}

export default function DashboardStats({ didjyah }: DashboardStatsProps) {
  const records = didjyah.records || [];

  // Calculate today's count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartTimestamp = todayStart.getTime();
  const todayEndTimestamp = todayStartTimestamp + 24 * 60 * 60 * 1000;

  const todayCount = records.filter((record) => {
    const recordDate = record.createdDate;
    if (!recordDate) return false;
    return recordDate >= todayStartTimestamp && recordDate < todayEndTimestamp;
  }).length;

  // Calculate this week's count
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekStartTimestamp = weekStart.getTime();
  const weekCount = records.filter((record) => {
    const recordDate = record.createdDate;
    if (!recordDate) return false;
    return recordDate >= weekStartTimestamp;
  }).length;

  // Calculate this month's count
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartTimestamp = monthStart.getTime();
  const monthCount = records.filter((record) => {
    const recordDate = record.createdDate;
    if (!recordDate) return false;
    return recordDate >= monthStartTimestamp;
  }).length;

  // Calculate average per day (over last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const thirtyDaysAgoTimestamp = thirtyDaysAgo.getTime();
  const last30DaysRecords = records.filter((record) => {
    const recordDate = record.createdDate;
    if (!recordDate) return false;
    return recordDate >= thirtyDaysAgoTimestamp;
  });

  // Group by day
  const recordsByDay = new Map<string, number>();
  last30DaysRecords.forEach((record) => {
    if (record.createdDate) {
      const date = new Date(record.createdDate);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      recordsByDay.set(dayKey, (recordsByDay.get(dayKey) || 0) + 1);
    }
  });

  const daysWithRecords = recordsByDay.size;
  const avgPerDay = daysWithRecords > 0 ? (last30DaysRecords.length / daysWithRecords).toFixed(1) : "0";

  const stats = [
    {
      title: "Today",
      value: todayCount.toString(),
      subtitle: didjyah.quantity
        ? `${(todayCount * didjyah.quantity).toLocaleString()} ${didjyah.unit || ""}`
        : "records",
      icon: Calendar,
    },
    {
      title: "This Week",
      value: weekCount.toString(),
      subtitle: didjyah.quantity
        ? `${(weekCount * didjyah.quantity).toLocaleString()} ${didjyah.unit || ""}`
        : "records",
      icon: BarChart3,
    },
    {
      title: "This Month",
      value: monthCount.toString(),
      subtitle: didjyah.quantity
        ? `${(monthCount * didjyah.quantity).toLocaleString()} ${didjyah.unit || ""}`
        : "records",
      icon: TrendingUp,
    },
    {
      title: "Avg Per Day",
      value: avgPerDay,
      subtitle: `last 30 days`,
      icon: Target,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

