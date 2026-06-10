import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useListChallenges } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trophy, CheckCircle2, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChallengesPage() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [language, setLanguage] = useState<string>("all");

  const { data: challenges, isLoading } = useListChallenges({
    difficulty: difficulty !== "all" ? difficulty : undefined,
    language: language !== "all" ? language : undefined
  });

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case "easy": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "medium": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "hard": return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "";
    }
  };

  const filteredChallenges = challenges?.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Coding Challenges</h1>
          <p className="text-muted-foreground">Test your skills with isolated, real-world coding problems.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search challenges..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-full sm:w-[150px] bg-background">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Difficulty</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full sm:w-[150px] bg-background">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Language</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="sql">SQL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : filteredChallenges && filteredChallenges.length > 0 ? (
          <div className="grid gap-4">
            {filteredChallenges.map(challenge => (
              <Card key={challenge.id} className={`flex flex-col sm:flex-row items-start sm:items-center p-4 hover:border-primary/50 transition-colors ${challenge.isCompleted ? 'bg-muted/30' : ''}`}>
                <div className="flex-1 space-y-1 w-full">
                  <div className="flex items-center gap-2 mb-1">
                    {challenge.isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    <h3 className={`font-semibold text-lg ${challenge.isCompleted ? 'text-muted-foreground' : ''}`}>{challenge.title}</h3>
                    <Badge variant="outline" className={`ml-2 capitalize ${getDifficultyColor(challenge.difficulty)}`}>{challenge.difficulty}</Badge>
                    <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">{challenge.language}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{challenge.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> {challenge.xpReward} XP</span>
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {Math.round(challenge.completionRate)}% Success Rate</span>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto shrink-0">
                  <Button variant={challenge.isCompleted ? "secondary" : "default"} className="w-full" asChild>
                    <Link href={`/challenges/${challenge.id}`}>
                      {challenge.isCompleted ? "Solve Again" : "Solve Challenge"}
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-border">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No challenges found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
