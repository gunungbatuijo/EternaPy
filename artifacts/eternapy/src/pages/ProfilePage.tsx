import { Layout } from "@/components/Layout";
import { useGetUserProfile, useGetUserStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Flame, BookOpen, Terminal, Edit, CalendarDays, MapPin, Code2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function ProfilePage() {
  const { data: profile, isLoading: isProfileLoading } = useGetUserProfile();
  const { data: stats, isLoading: isStatsLoading } = useGetUserStats();

  const isLoading = isProfileLoading || isStatsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="md:col-span-2 h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile || !stats) {
    return <Layout><div className="text-center py-20">Profile not found.</div></Layout>;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header Profile Card */}
        <Card className="overflow-hidden border-border bg-card">
          <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 w-full"></div>
          <CardContent className="px-6 sm:px-10 pb-10 relative">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end -mt-16 sm:-mt-12 mb-6">
              <Avatar className="w-32 h-32 border-4 border-card bg-muted shadow-lg">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                  {profile.displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left space-y-1">
                <h1 className="text-3xl font-bold text-foreground">{profile.displayName}</h1>
                <p className="text-muted-foreground text-lg">@{profile.username}</p>
              </div>
              <Button variant="outline" className="shrink-0"><Edit className="w-4 h-4 mr-2" /> Edit Profile</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="space-y-4">
                {profile.bio && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h3>
                    <p className="text-foreground leading-relaxed">{profile.bio}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {profile.country && (
                    <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {profile.country}</div>
                  )}
                  <div className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> Joined {format(new Date(profile.createdAt), "MMMM yyyy")}</div>
                  <div className="flex items-center gap-1.5"><Code2 className="w-4 h-4" /> {profile.experienceLevel}</div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                <div className="grid grid-cols-2 gap-y-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5"><Trophy className="w-4 h-4 text-primary" /> Level</div>
                    <div className="text-2xl font-bold">{profile.level}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> Streak</div>
                    <div className="text-2xl font-bold">{profile.streak} <span className="text-base font-normal text-muted-foreground">days</span></div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-blue-500" /> Lessons</div>
                    <div className="text-2xl font-bold">{stats.completedLessons}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5"><Terminal className="w-4 h-4 text-emerald-500" /> Challenges</div>
                    <div className="text-2xl font-bold">{stats.completedChallenges}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
