import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useGetAssignment, useSubmitAssignment, useRunCode } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/CodeEditor";
import { EternalAI } from "@/components/EternalAI";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChevronLeft, CheckCircle2, XCircle, Loader2, Trophy, Briefcase } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AssignmentDetailPage() {
  const { assignmentId } = useParams();
  const id = parseInt(assignmentId || "0");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: assignment, isLoading } = useGetAssignment(id, {
    query: { enabled: !!id }
  });

  const { mutate: runCode, isPending: isRunning } = useRunCode({
    mutation: {
      onSuccess: (data) => {
        setOutput(data.error || data.output || "Program finished with no output.");
        setTestResults([]);
      },
      onError: (err: any) => { setOutput(`Error: ${err.message}`); }
    }
  });

  const { mutate: submitAssignment, isPending: isSubmitting } = useSubmitAssignment(id, {
    mutation: {
      onSuccess: (data) => {
        setOutput(data.output || "");
        setTestResults(data.testResults || []);
        if (data.passed) toast.success(`Project Completed! +${data.xpEarned} XP`);
        else toast.error("Requirements not met yet. Keep building!");
      },
      onError: (err: any) => {
        setOutput(`Submission Error: ${err.message}`);
        toast.error("Failed to submit project");
      }
    }
  });

  useEffect(() => {
    if (assignment?.starterCode && !code) setCode(assignment.starterCode);
  }, [assignment, code]);

  if (isLoading || !assignment) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const handleRun = () => runCode({ data: { code, language: assignment.language } });
  const handleSubmit = () => submitAssignment({ data: { code, language: assignment.language } });

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-card z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/assignments"><ChevronLeft className="w-4 h-4 mr-1" /> Projects</Link>
          </Button>
          <div className="h-4 w-px bg-border"></div>
          <Briefcase className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm truncate">{assignment.title}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground mr-4">
            <Trophy className="w-4 h-4 text-primary" /> {assignment.xpReward} XP
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={isSidebarOpen ? "bg-primary/10 text-primary border-primary/20" : ""}
          >
            Eternal AI
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={35} minSize={25}>
            <div className="h-full overflow-y-auto p-6 border-r border-border bg-card/50">
              <h1 className="text-2xl font-bold mb-6">{assignment.title}</h1>
              
              <Tabs defaultValue="desc">
                <TabsList className="w-full mb-6 bg-muted/50">
                  <TabsTrigger value="desc" className="flex-1">Description</TabsTrigger>
                  <TabsTrigger value="reqs" className="flex-1">Requirements</TabsTrigger>
                </TabsList>
                <TabsContent value="desc" className="mt-0">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{assignment.description}</ReactMarkdown>
                  </div>
                </TabsContent>
                <TabsContent value="reqs" className="mt-0">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{assignment.requirements}</ReactMarkdown>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={65}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70}>
                <CodeEditor 
                  initialCode={code} 
                  language={assignment.language} 
                  onChange={setCode}
                  onRun={handleRun}
                  onSubmit={handleSubmit}
                  isRunning={isRunning}
                  isSubmitting={isSubmitting}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={10}>
                <div className="h-full bg-[#1e1e1e] flex flex-col border-t border-border overflow-hidden">
                  <div className="px-4 py-2 border-b border-[#333] bg-[#252526] text-xs font-medium text-gray-400 flex items-center justify-between">
                    <span className="uppercase tracking-wider">Test Results</span>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    {testResults.length > 0 ? (
                      <div className="space-y-4">
                        {testResults.map((tr, i) => (
                          <div key={i} className={`p-3 rounded border ${tr.passed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100' : 'bg-red-500/10 border-red-500/20 text-red-100'}`}>
                            <div className="flex items-center gap-2 font-medium">
                              {tr.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                              Requirement {i + 1}: {tr.description}
                            </div>
                            {!tr.passed && <div className="text-sm font-mono mt-2 opacity-90 pl-6">{tr.actualOutput}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="font-mono text-sm text-gray-300 whitespace-pre-wrap">{output || 'Submit your project to run tests against the requirements.'}</div>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {isSidebarOpen && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                <EternalAI contextType="assignment" context={assignment.requirements} code={code} language={assignment.language} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
