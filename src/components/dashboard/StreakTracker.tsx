import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type DidjyahWithRecords = InstaQLEntity<
  AppSchema,
  "didjyahs",
  { records: {} }
>;

interface StreakTrackerProps {
  didjyah: DidjyahWithRecords;
}

export default function StreakTracker({ didjyah }: StreakTrackerProps) {
  const streaks = useMemo(() => {
    const records = didjyah.records || []
    if (records.length === 0) {
      return { current: 0, longest: 0, dates: new Set<string>() };
    }

    // Get all unique dates with records
    const datesSet = new Set<string>();
    records.forEach((record) => {
      if (record.createdDate) {
        const date = new Date(record.createdDate);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        datesSet.add(dateKey);
      }
    });

    const dates = Array.from(datesSet).sort();

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Check if today has a record
    const checkDate = new Date(today)
    const hasToday = datesSet.has(todayKey)

    // If today doesn't have a record, start from yesterday
    if (!hasToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (checkDate >= new Date(dates[0] || todayKey)) {
      const checkKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
      
      if (datesSet.has(checkKey)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    dates.forEach((dateStr) => {
      const date = new Date(dateStr + "T00:00:00");
      
      if (prevDate === null) {
        tempStreak = 1;
      } else {
        const diffTime = prevDate.getTime() - date.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          // Consecutive day
          tempStreak++;
        } else {
          // Streak broken
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      
      prevDate = date;
    });

    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak, dates: datesSet }
  }, [didjyah])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5" />
          Streak Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Current Streak</div>
            <div className="text-4xl font-bold">{streaks.current}</div>
            <div className="text-xs text-muted-foreground">
              {streaks.current === 0
                ? "No active streak"
                : streaks.current === 1
                ? "day"
                : "days"}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Longest Streak</div>
            <div className="text-4xl font-bold">{streaks.longest}</div>
            <div className="text-xs text-muted-foreground">
              {streaks.longest === 0
                ? "No records yet"
                : streaks.longest === 1
                ? "day"
                : "days"}
            </div>
          </div>
        </div>
        {streaks.current > 0 && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium">Keep it up! 🔥</div>
            <div className="text-xs text-muted-foreground mt-1">
              You're on a {streaks.current}-day streak. Don't break the chain!
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

