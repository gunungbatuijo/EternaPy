import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, Star, BookOpen, ChevronRight, Medal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { data: dashboard, isLoading, error } = useGetDashboard({
    query: {
      retry: false
    }
  });

  useEffect(() => {
    // Check if onboarding is complete
    if (error && (error as any).status === 404) {
      setLocation("/onboarding");
    } else if (dashboard && !dashboard.profile.onboardingComplete) {
      setLocation("/onboarding");
    }
  }, [dashboard, error, setLocation]);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="col-span-2 h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!dashboard || !dashboard.profile.onboardingComplete) {
    return null; // Will redirect in useEffect
  }

  const { stats, continueLearning, recommendedCourses, recentAchievements, streakInfo } = dashboard;
  
  // Calculate level progress
  const nextLevelXp = stats.xp + stats.xpToNextLevel;
  const levelProgress = nextLevelXp > 0 ? (stats.xp / nextLevelXp) * 100 : 0;

  return (
    <Layout>
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {dashboard.profile.displayName}</h1>
            <p className="text-muted-foreground mt-1">Ready to write some code today?</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold">{stats.xp}</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total XP</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold">{streakInfo?.currentStreak || 0}</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Day Streak</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold">{stats.completedLessons}</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Lessons Done</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center">
                <Medal className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold">#{stats.rank}</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Global Rank</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Continue Learning */}
            {continueLearning?.course && (
              <Card className="border-primary/20 shadow-md overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-xl" role="img" aria-hidden="true">{continueLearning.course.iconEmoji}</span>
                    Continue Learning
                  </CardTitle>
                  <CardDescription>{continueLearning.course.title}</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-4">
                    {continueLearning.lastLesson && (
                      <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Up Next</p>
                          <p className="font-medium">{continueLearning.lastLesson.title}</p>
                        </div>
                        <Button asChild size="sm">
                          <Link href={`/lessons/${continueLearning.lastLesson.id}`}>
                            Continue <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Course Progress</span>
                        <span className="font-medium">{Math.round(continueLearning.progressPercent || 0)}%</span>
                      </div>
                      <Progress value={continueLearning.progressPercent} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Level Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Level {stats.level}</span>
                  <span className="text-sm font-normal text-muted-foreground">{stats.xpToNextLevel} XP to Level {stats.level + 1}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={levelProgress} className="h-3 mb-2 bg-muted" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{stats.xp} XP</span>
                  <span>{nextLevelXp} XP</span>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Courses */}
            {recommendedCourses.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Recommended for you</h2>
                  <Button variant="link" asChild className="h-auto p-0 text-muted-foreground hover:text-primary">
                    <Link href="/courses">View all</Link>
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {recommendedCourses.slice(0, 2).map((course) => (
                    <Card key={course.id} className="flex flex-col h-full hover:border-primary/50 transition-colors">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-2xl" role="img" aria-hidden="true">{course.iconEmoji}</span>
                          <span className="text-xs font-semibold px-2 py-1 bg-muted rounded-full uppercase tracking-wider">{course.difficulty}</span>
                        </div>
                        <CardTitle className="text-base line-clamp-1">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-2 text-xs h-8">{course.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="p-4 pt-0 mt-auto">
                        <Button variant="secondary" className="w-full text-xs h-8" asChild>
                          <Link href={`/courses/${course.id}`}>View Course</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            {/* Streak Widget */}
            <Card className="bg-gradient-to-br from-card to-card border-border relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className={`w-5 h-5 ${streakInfo?.todayComplete ? 'text-orange-500' : 'text-muted-foreground'}`} />
                  Daily Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                  <span className="text-5xl font-black text-foreground mb-2">{streakInfo?.currentStreak || 0}</span>
                  <p className="text-sm font-medium text-muted-foreground mb-6">Days in a row</p>
                  
                  {streakInfo?.todayComplete ? (
                    <div className="bg-green-500/10 text-green-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center w-full justify-center">
                      <CheckCircle className="w-4 h-4 mr-2" /> Streak secured today!
                    </div>
                  ) : (
                    <div className="bg-muted px-4 py-2 rounded-lg text-sm font-medium flex items-center w-full justify-center text-muted-foreground">
                      Complete a lesson to extend your streak
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Recent Badges
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground" asChild>
                    <Link href="/achievements">All</Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentAchievements && recentAchievements.length > 0 ? (
                  recentAchievements.map((ua) => (
                    <div key={ua.achievement.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-lg flex-shrink-0">
                        {ua.achievement.iconEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{ua.achievement.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{ua.achievement.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No achievements yet. Keep learning to earn badges!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Simple icon for the streak status
function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
