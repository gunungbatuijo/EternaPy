import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useListCourses } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, BookOpen, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const { data: courses, isLoading } = useListCourses({
    search: search || undefined,
    category: category !== "all" ? category : undefined
  });

  const categories = ["Programming Languages", "Backend Development", "Databases", "DevOps", "Web Development", "Computer Science"];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Explore Courses</h1>
          <p className="text-muted-foreground">Master programming through hands-on practice and guided paths.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search courses..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <Card key={course.id} className="flex flex-col h-full hover:border-primary/50 transition-colors group">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${course.color}20`, color: course.color }}>
                      <span role="img" aria-hidden="true">{course.iconEmoji}</span>
                    </div>
                    {course.isPro && (
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">PRO</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2 h-10 mt-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pb-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="font-normal text-xs">{course.difficulty}</Badge>
                    <Badge variant="outline" className="font-normal text-xs">{course.category}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {course.estimatedHours}h</div>
                    <div className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {course.lessonCount} lessons</div>
                    <div className="flex items-center gap-1.5 col-span-2"><Users className="w-4 h-4" /> {course.enrolledCount.toLocaleString()} enrolled</div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full" asChild>
                    <Link href={`/courses/${course.id}`}>View Course</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-border">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No courses found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            <Button variant="link" onClick={() => { setSearch(""); setCategory("all"); }}>Clear filters</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
