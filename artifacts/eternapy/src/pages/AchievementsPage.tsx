import { Layout } from "@/components/Layout";
import { useListAchievements, useGetUserAchievements } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Lock } from "lucide-react";

export default function AchievementsPage() {
  const { data: allAchievements, isLoading: isAllLoading } = useListAchievements();
  const { data: userAchievements, isLoading: isUserLoading } = useGetUserAchievements();

  const isLoading = isAllLoading || isUserLoading;

  // Map to easily check if user has achievement
  const earnedSet = new Set(userAchievements?.map(ua => ua.achievement.id));
  const earnedCount = userAchievements?.length || 0;
  const totalCount = allAchievements?.length || 0;
  const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
            <Trophy className="w-12 h-12" />
          </div>
          <div className="flex-1 w-full text-center md:text-left space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Your Achievements</h1>
              <p className="text-muted-foreground mt-1">Complete courses, maintain streaks, and solve challenges to unlock badges.</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>{earnedCount} of {totalCount} Unlocked</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : allAchievements && allAchievements.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allAchievements.map(achievement => {
              const isEarned = earnedSet.has(achievement.id);
              return (
                <Card key={achievement.id} className={`overflow-hidden transition-all duration-300 ${isEarned ? 'border-primary/30 bg-primary/5 hover:border-primary/60 hover:-translate-y-1' : 'border-border bg-muted/30 opacity-70 grayscale'}`}>
                  <CardContent className="p-6 flex flex-col items-center text-center relative h-full">
                    {!isEarned && (
                      <div className="absolute top-3 right-3 text-muted-foreground">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`text-5xl mb-4 ${!isEarned ? 'opacity-50' : ''}`} role="img" aria-hidden="true">
                      {achievement.iconEmoji}
                    </div>
                    <h3 className="font-bold text-foreground mb-2 leading-tight">{achievement.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-auto">
                      {achievement.description}
                    </p>
                    {isEarned && (
                      <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                        Unlocked
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No achievements configured in the system.
          </div>
        )}
      </div>
    </Layout>
  );
}
