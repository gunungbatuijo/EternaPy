import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { sql } from "@codemirror/lang-sql";
import { Button } from "@/components/ui/button";
import { Play, Send } from "lucide-react";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CodeEditorProps {
  initialCode: string;
  language: string;
  onChange: (code: string) => void;
  onRun?: () => void;
  onSubmit?: () => void;
  isRunning?: boolean;
  isSubmitting?: boolean;
}

export function CodeEditor({ 
  initialCode, 
  language, 
  onChange, 
  onRun, 
  onSubmit, 
  isRunning = false, 
  isSubmitting = false 
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const { theme } = useTheme();
  
  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleChange = (value: string) => {
    setCode(value);
    onChange(value);
  };

  const getLanguageExtension = () => {
    switch (language.toLowerCase()) {
      case "python": return [python()];
      case "javascript": 
      case "js": return [javascript()];
      case "sql": return [sql()];
      default: return [];
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden border-border bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{language}</span>
        <div className="flex gap-2">
          {onRun && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRun} 
              disabled={isRunning || isSubmitting}
            >
              {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Run Code
            </Button>
          )}
          {onSubmit && (
            <Button 
              size="sm" 
              onClick={onSubmit}
              disabled={isRunning || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Submit
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-[#1e1e1e]">
        <CodeMirror
          value={code}
          height="100%"
          extensions={getLanguageExtension()}
          onChange={handleChange}
          theme="dark" // We'll keep the editor dark for that "IDE feel"
          className="text-sm font-mono h-full"
        />
      </div>
    </Card>
  );
}
