import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useGetChallenge, useSubmitChallenge, useRunCode } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/CodeEditor";
import { EternalAI } from "@/components/EternalAI";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChevronLeft, CheckCircle2, XCircle, Loader2, Trophy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function ChallengeDetailPage() {
  const { challengeId } = useParams();
  const id = parseInt(challengeId || "0");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: challenge, isLoading } = useGetChallenge(id, {
    query: {
      enabled: !!id
    }
  });

  const { mutate: runCode, isPending: isRunning } = useRunCode({
    mutation: {
      onSuccess: (data) => {
        setOutput(data.error || data.output || "Program finished with no output.");
        setTestResults([]); // Clear tests on raw run
      },
      onError: (err: any) => {
        setOutput(`Error: ${err.message}`);
      }
    }
  });

  const { mutate: submitChallenge, isPending: isSubmitting } = useSubmitChallenge(id, {
    mutation: {
      onSuccess: (data) => {
        setOutput(data.output || "");
        setTestResults(data.testResults || []);
        
        if (data.passed) {
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-bold">Challenge Solved!</span>
              <span>You earned {data.xpEarned} XP</span>
            </div>
          );
        } else {
          toast.error("Tests failed. Keep trying!");
        }
      },
      onError: (err: any) => {
        setOutput(`Submission Error: ${err.message}`);
        toast.error("Failed to submit code");
      }
    }
  });

  useEffect(() => {
    if (challenge?.starterCode && !code) {
      setCode(challenge.starterCode);
    }
  }, [challenge, code]);

  if (isLoading || !challenge) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const handleRun = () => runCode({ data: { code, language: challenge.language } });
  const handleSubmit = () => submitChallenge({ data: { code, language: challenge.language } });

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case "easy": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "medium": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "hard": return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "";
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-card z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/challenges"><ChevronLeft className="w-4 h-4 mr-1" /> Challenges</Link>
          </Button>
          <div className="h-4 w-px bg-border"></div>
          <Badge variant="outline" className={`capitalize ${getDifficultyColor(challenge.difficulty)}`}>{challenge.difficulty}</Badge>
          <span className="font-semibold text-sm truncate">{challenge.title}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground mr-4">
            <Trophy className="w-4 h-4 text-primary" /> {challenge.xpReward} XP
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="horizontal">
          
          {/* Description Panel */}
          <ResizablePanel defaultSize={35} minSize={25}>
            <div className="h-full overflow-y-auto p-6 border-r border-border bg-card/50">
              <h1 className="text-2xl font-bold mb-6">{challenge.title}</h1>
              
              <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {challenge.description}
                </ReactMarkdown>
              </div>

              {challenge.testCases && challenge.testCases.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Test Cases</h3>
                  <div className="space-y-3">
                    {challenge.testCases.map((tc: any, i: number) => (
                      <div key={i} className="bg-background rounded-lg border border-border p-3 text-sm font-mono">
                        <div className="text-muted-foreground mb-1">Input:</div>
                        <div className="mb-2">{tc.input}</div>
                        <div className="text-muted-foreground mb-1">Expected Output:</div>
                        <div>{tc.expectedOutput}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />
          
          {/* Editor & Output Panel */}
          <ResizablePanel defaultSize={65}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={65}>
                <CodeEditor 
                  initialCode={code} 
                  language={challenge.language} 
                  onChange={setCode}
                  onRun={handleRun}
                  onSubmit={handleSubmit}
                  isRunning={isRunning}
                  isSubmitting={isSubmitting}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={35} minSize={10}>
                <div className="h-full bg-[#1e1e1e] flex flex-col border-t border-border overflow-hidden">
                  <div className="px-4 py-2 border-b border-[#333] bg-[#252526] text-xs font-medium text-gray-400 flex items-center justify-between">
                    <span className="uppercase tracking-wider">Test Results & Output</span>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    {testResults.length > 0 ? (
                      <div className="space-y-4">
                        {testResults.map((tr, i) => (
                          <div key={i} className={`p-3 rounded border ${tr.passed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100' : 'bg-red-500/10 border-red-500/20 text-red-100'}`}>
                            <div className="flex items-center gap-2 mb-2 font-medium">
                              {tr.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                              Test Case {i + 1}: {tr.description}
                            </div>
                            {!tr.passed && (
                              <div className="text-sm font-mono mt-2 space-y-1 opacity-90 pl-6">
                                <div><span className="opacity-70">Expected:</span> {tr.expectedOutput}</div>
                                <div><span className="opacity-70">Actual:</span> {tr.actualOutput}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                        {output || 'Run or Submit your code to see results here.'}
                      </div>
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
                <EternalAI 
                  contextType="challenge"
                  context={challenge.description}
                  code={code}
                  language={challenge.language}
                />
              </ResizablePanel>
            </>
          )}
          
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
