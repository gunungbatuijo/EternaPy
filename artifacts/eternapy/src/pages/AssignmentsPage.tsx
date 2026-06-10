import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useListAssignments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Trophy, Briefcase, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

export default function AssignmentsPage() {
  const [search, setSearch] = useState("");
  
  const { data: assignments, isLoading } = useListAssignments();

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case "easy": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "medium": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "hard": return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "";
    }
  };

  const filtered = assignments?.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Projects & Assignments</h1>
          <p className="text-muted-foreground">Larger, real-world applications to build for your portfolio.</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search assignments..." 
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-6">
            {filtered.map(assignment => (
              <Card key={assignment.id} className={`flex flex-col h-full hover:border-primary/50 transition-colors ${assignment.isCompleted ? 'bg-muted/20' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={`capitalize ${getDifficultyColor(assignment.difficulty)}`}>{assignment.difficulty}</Badge>
                    {assignment.isPro && <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Lock className="w-3 h-3 mr-1" /> PRO</Badge>}
                  </div>
                  <CardTitle className="text-xl">{assignment.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{assignment.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium text-sm text-primary">
                    <Trophy className="w-4 h-4" /> {assignment.xpReward} XP
                  </div>
                  <Button variant={assignment.isCompleted ? "outline" : "default"} asChild>
                    <Link href={`/assignments/${assignment.id}`}>
                      {assignment.isCompleted ? "Review Project" : "Start Project"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-border">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No assignments found</h3>
          </div>
        )}
      </div>
    </Layout>
  );
}
