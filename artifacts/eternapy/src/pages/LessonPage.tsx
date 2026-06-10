import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useGetLesson, useCompleteLesson, useRunCode } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/CodeEditor";
import { EternalAI } from "@/components/EternalAI";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChevronLeft, ChevronRight, CheckCircle2, PlayCircle, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

export default function LessonPage() {
  const { lessonId } = useParams();
  const id = parseInt(lessonId || "0");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  const { data: lesson, isLoading } = useGetLesson(id, {
    query: {
      enabled: !!id
    }
  });

  const { mutate: completeLesson, isPending: isCompleting } = useCompleteLesson({
    mutation: {
      onSuccess: () => {
        toast.success("Lesson completed!");
        queryClient.invalidateQueries({ queryKey: ["/api/lessons", id] });
        queryClient.invalidateQueries({ queryKey: ["/api/courses", lesson?.courseId] });
      }
    }
  });

  const { mutate: runCode, isPending: isRunning } = useRunCode({
    mutation: {
      onSuccess: (data) => {
        setOutput(data.error || data.output || "Program finished with no output.");
        if (data.exitCode === 0) {
          toast.success("Code ran successfully");
        } else {
          toast.error("Execution error");
        }
      },
      onError: (err: any) => {
        setOutput(`Error: ${err.message}`);
        toast.error("Failed to run code");
      }
    }
  });

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setTimeSpent(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [id]);

  useEffect(() => {
    if (lesson?.starterCode && !code) {
      setCode(lesson.starterCode);
    }
  }, [lesson, code]);

  if (isLoading || !lesson) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const handleRun = () => {
    runCode({ data: { code, language: lesson.language || "python" } });
  };

  const handleComplete = () => {
    if (!lesson.isCompleted) {
      completeLesson({ data: { timeSpentSeconds: timeSpent } });
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-card z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link href={`/courses/${lesson.courseId}`}><ChevronLeft className="w-4 h-4 mr-1" /> Course</Link>
          </Button>
          <div className="h-4 w-px bg-border"></div>
          <span className="font-semibold text-sm truncate max-w-[200px] md:max-w-md">{lesson.title}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={isSidebarOpen ? "bg-primary/10 text-primary border-primary/20" : ""}
          >
            Eternal AI
          </Button>
          
          {lesson.isCompleted ? (
            <div className="flex items-center text-emerald-500 font-medium text-sm mr-2">
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Completed
            </div>
          ) : (
            <Button size="sm" onClick={handleComplete} disabled={isCompleting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isCompleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Complete Lesson
            </Button>
          )}

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" disabled={!lesson.prevLessonId} asChild={!!lesson.prevLessonId}>
              {lesson.prevLessonId ? <Link href={`/lessons/${lesson.prevLessonId}`}><ChevronLeft className="w-4 h-4" /></Link> : <ChevronLeft className="w-4 h-4 opacity-50" />}
            </Button>
            <Button variant="ghost" size="icon" disabled={!lesson.nextLessonId} asChild={!!lesson.nextLessonId}>
              {lesson.nextLessonId ? <Link href={`/lessons/${lesson.nextLessonId}`}><ChevronRight className="w-4 h-4" /></Link> : <ChevronRight className="w-4 h-4 opacity-50" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="horizontal">
          
          {/* Content Panel */}
          <ResizablePanel defaultSize={lesson.type === 'coding' ? 40 : 100} minSize={30}>
            <div className="h-full overflow-y-auto p-6 md:p-8">
              <div className="max-w-3xl mx-auto">
                <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className="bg-muted px-2 py-1 rounded">{lesson.type}</span>
                  <span>{lesson.xpReward} XP</span>
                </div>
                
                <h1 className="text-3xl font-bold mb-8">{lesson.title}</h1>
                
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {lesson.content}
                  </ReactMarkdown>
                </div>
                
                {lesson.type !== 'coding' && !lesson.isCompleted && (
                  <div className="mt-12 pt-8 border-t border-border flex justify-center">
                    <Button size="lg" onClick={handleComplete} disabled={isCompleting}>
                      Mark as Completed <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          {lesson.type === 'coding' && (
            <>
              <ResizableHandle withHandle />
              {/* Editor Panel */}
              <ResizablePanel defaultSize={60}>
                <ResizablePanelGroup direction="vertical">
                  <ResizablePanel defaultSize={70}>
                    <CodeEditor 
                      initialCode={code} 
                      language={lesson.language || "python"} 
                      onChange={setCode}
                      onRun={handleRun}
                      isRunning={isRunning}
                    />
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={30} minSize={10}>
                    <div className="h-full bg-[#1e1e1e] flex flex-col border-t border-border">
                      <div className="px-4 py-2 border-b border-[#333] bg-[#252526] text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Output
                      </div>
                      <div className="flex-1 p-4 font-mono text-sm overflow-auto text-gray-300 whitespace-pre-wrap">
                        {output || 'Click "Run Code" to see output here.'}
                      </div>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </>
          )}

          {isSidebarOpen && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                <EternalAI 
                  contextType="lesson"
                  context={lesson.content}
                  code={code}
                  language={lesson.language || undefined}
                />
              </ResizablePanel>
            </>
          )}
          
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
