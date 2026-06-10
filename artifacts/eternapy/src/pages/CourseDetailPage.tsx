import { Link, useParams } from "wouter";
import { Layout } from "@/components/Layout";
import { useGetCourse } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Clock, BookOpen, Users, Trophy, PlayCircle, CheckCircle2, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const id = parseInt(courseId || "0");

  const { data: course, isLoading } = useGetCourse(id, {
    query: {
      enabled: !!id
    }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32 mb-8" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-20">
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <Button asChild><Link href="/courses">Back to courses</Link></Button>
        </div>
      </Layout>
    );
  }

  const { chapters, userProgress } = course;
  
  // Determine next lesson to take
  let nextLessonUrl = `/lessons/${chapters?.[0]?.lessons?.[0]?.id || 0}`;
  if (userProgress && userProgress.lastLessonId) {
    // Basic logic, real app would find the lesson after lastLessonId
    nextLessonUrl = `/lessons/${userProgress.lastLessonId}`;
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        <Button variant="ghost" className="mb-2 -ml-4" asChild>
          <Link href="/courses"><ChevronLeft className="w-4 h-4 mr-2" /> Back to courses</Link>
        </Button>

        {/* Hero Section */}
        <div className="bg-card rounded-2xl border border-border p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10 rounded-bl-full pointer-events-none" style={{ backgroundColor: course.color }}></div>
          
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0 z-10" style={{ backgroundColor: `${course.color}20`, color: course.color }}>
            <span role="img" aria-hidden="true">{course.iconEmoji}</span>
          </div>
          
          <div className="flex-1 z-10">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="bg-background">{course.category}</Badge>
              <Badge variant="outline" className="bg-background">{course.difficulty}</Badge>
              {course.isPro && <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">PRO</Badge>}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{course.title}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">{course.description}</p>
            
            <div className="flex flex-wrap gap-6 mt-6 text-sm font-medium text-foreground">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /> {course.estimatedHours} hours</div>
              <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-muted-foreground" /> {course.lessonCount} lessons</div>
              <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-muted-foreground" /> {course.xpReward} XP</div>
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /> {course.enrolledCount.toLocaleString()} enrolled</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">About this course</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                {course.longDescription.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Course Syllabus</h2>
              {chapters.length > 0 ? (
                <Accordion type="multiple" defaultValue={[chapters[0].id.toString()]} className="w-full">
                  {chapters.map((chapter) => (
                    <AccordionItem key={chapter.id} value={chapter.id.toString()} className="border-border">
                      <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-4 rounded-lg">
                        <div className="flex flex-col items-start text-left">
                          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Chapter {chapter.order}</span>
                          <span className="font-bold text-lg">{chapter.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        <div className="space-y-2 mt-4">
                          {chapter.lessons.map((lesson) => (
                            <Link key={lesson.id} href={`/lessons/${lesson.id}`} className="block">
                              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background hover:border-primary/50 transition-colors group">
                                <div className="flex items-center gap-3">
                                  {lesson.isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  ) : (
                                    <PlayCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  )}
                                  <span className={`font-medium ${lesson.isCompleted ? 'text-muted-foreground line-through' : ''}`}>
                                    {lesson.order}. {lesson.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="uppercase tracking-wider">{lesson.type}</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-muted-foreground">No chapters available yet.</p>
              )}
            </section>
          </div>

          <div>
            <Card className="sticky top-20 border-primary/20 shadow-md">
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
                {userProgress ? (
                  <CardDescription>{userProgress.percentComplete}% Complete</CardDescription>
                ) : (
                  <CardDescription>Not started yet</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {userProgress ? (
                  <div className="space-y-2">
                    <Progress value={userProgress.percentComplete} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">{userProgress.completedLessons} of {userProgress.totalLessons} lessons</p>
                  </div>
                ) : (
                  <Progress value={0} className="h-2" />
                )}
                
                <Button size="lg" className="w-full text-base h-12" asChild>
                  <Link href={nextLessonUrl}>
                    {userProgress && userProgress.percentComplete > 0 ? "Continue Learning" : "Start Course"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
