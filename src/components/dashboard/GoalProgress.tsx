import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type DidjyahWithRecords = InstaQLEntity<
  AppSchema,
  "didjyahs",
  { records: {} }
>;

interface GoalProgressProps {
  didjyah: DidjyahWithRecords;
}

export default function GoalProgress({ didjyah }: GoalProgressProps) {
  const records = didjyah.records || [];
  const dailyGoal = didjyah.dailyGoal || 0;
  const quantity = didjyah.quantity || 1;

  // Calculate today's progress
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartTimestamp = todayStart.getTime();
  const todayEndTimestamp = todayStartTimestamp + 24 * 60 * 60 * 1000;

  const todayCount = records.filter((record) => {
    const recordDate = record.createdDate;
    if (!recordDate) return false;
    return recordDate >= todayStartTimestamp && recordDate < todayEndTimestamp;
  }).length;

  const current = quantity ? todayCount * quantity : todayCount;
  const total = dailyGoal && quantity ? dailyGoal * quantity : dailyGoal;
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  // Calculate completion rate for last 7 days
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartTimestamp = weekStart.getTime();

  const weekRecords = records.filter((record) => {
    const recordDate = record.createdDate;
    if (!recordDate) return false;
    return recordDate >= weekStartTimestamp;
  });

  // Group by day
  const recordsByDay = new Map<string, number>();
  weekRecords.forEach((record) => {
    if (record.createdDate) {
      const date = new Date(record.createdDate);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      recordsByDay.set(dayKey, (recordsByDay.get(dayKey) || 0) + 1);
    }
  });

  const daysWithRecords = Array.from(recordsByDay.keys()).length;
  const completionRate = dailyGoal > 0
    ? (daysWithRecords / 7) * 100
    : 0;

  if (dailyGoal === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goal Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No daily goal set for this didjyah.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Goal Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today's Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Today</span>
            <span className="text-muted-foreground">
              {current.toLocaleString()} / {total.toLocaleString()}{" "}
              {didjyah.unit || ""}
            </span>
          </div>
          <Progress value={percentage} className="h-3" />
          <div className="text-xs text-muted-foreground text-center">
            {todayCount} {todayCount === 1 ? "record" : "records"} today
          </div>
        </div>

        {/* Weekly Completion Rate */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">7-Day Completion Rate</span>
            <span className="text-muted-foreground">
              {completionRate.toFixed(0)}%
            </span>
          </div>
          <Progress value={completionRate} className="h-3" />
          <div className="text-xs text-muted-foreground text-center">
            {daysWithRecords} out of 7 days completed
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="text-2xl font-bold">{todayCount}</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{daysWithRecords}</div>
            <div className="text-xs text-muted-foreground">Active Days</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

