import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useGetLeaderboard, GetLeaderboardPeriod } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Flame, Medal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<GetLeaderboardPeriod>(GetLeaderboardPeriod.all_time);
  
  const { data: leaderboard, isLoading } = useGetLeaderboard({
    period,
    limit: 50
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="text-center space-y-4 mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Global Leaderboard</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">See how you stack up against the EternaPy community. Keep your streak alive and complete challenges to climb the ranks.</p>
        </div>

        <Tabs defaultValue={GetLeaderboardPeriod.all_time} onValueChange={(v) => setPeriod(v as GetLeaderboardPeriod)} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value={GetLeaderboardPeriod.weekly}>Weekly</TabsTrigger>
              <TabsTrigger value={GetLeaderboardPeriod.monthly}>Monthly</TabsTrigger>
              <TabsTrigger value={GetLeaderboardPeriod.all_time}>All Time</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={period} className="mt-0">
            <Card className="border-border shadow-sm overflow-hidden bg-card">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : leaderboard && leaderboard.entries.length > 0 ? (
                <div className="divide-y divide-border">
                  {leaderboard.entries.map((entry) => (
                    <div key={entry.userId} className={`flex items-center p-4 sm:px-6 hover:bg-muted/30 transition-colors ${entry.rank <= 3 ? 'bg-primary/5' : ''}`}>
                      <div className="w-8 sm:w-12 text-center font-bold text-lg text-muted-foreground mr-4 shrink-0">
                        {entry.rank === 1 ? <span className="text-amber-500 text-2xl">🥇</span> :
                         entry.rank === 2 ? <span className="text-slate-400 text-2xl">🥈</span> :
                         entry.rank === 3 ? <span className="text-amber-700 text-2xl">🥉</span> :
                         entry.rank}
                      </div>
                      
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border border-border shrink-0 mr-4">
                        <AvatarImage src={entry.avatarUrl || undefined} alt={entry.displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {entry.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold truncate text-foreground">{entry.displayName}</p>
                          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">Lvl {entry.level}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">@{entry.username}</p>
                      </div>
                      
                      <div className="flex items-center gap-6 shrink-0 ml-4">
                        <div className="hidden sm:flex flex-col items-end">
                          <div className="flex items-center gap-1.5 text-orange-500 font-medium">
                            <Flame className="w-4 h-4" /> {entry.streak}
                          </div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5 text-primary font-bold">
                            <Trophy className="w-4 h-4" /> {entry.xp.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">XP</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  No data available for this period.
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
