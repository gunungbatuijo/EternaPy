import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAskEternalAi, AiQuestionContextType } from "@workspace/api-client-react";
import { Send, Bot, Loader2, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface EternalAIProps {
  contextType: AiQuestionContextType;
  context?: string;
  code?: string;
  language?: string;
}

interface Message {
  role: "user" | "ai";
  content: string;
}

export function EternalAI({ contextType, context, code, language }: EternalAIProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "Hello! I'm Eternal AI. I can guide you through this problem. What do you need help with?"
    }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { mutate: askAi, isPending } = useAskEternalAi({
    mutation: {
      onSuccess: (data) => {
        let fullMessage = data.message;
        if (data.hints && data.hints.length > 0) {
          fullMessage += "\n\n**Hints:**\n" + data.hints.map(h => `- ${h}`).join("\n");
        }
        setMessages(prev => [...prev, { role: "ai", content: fullMessage }]);
      },
      onError: () => {
        setMessages(prev => [...prev, { role: "ai", content: "I encountered an error trying to process your request. Please try again." }]);
      }
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);

    askAi({
      data: {
        question: userMsg,
        contextType,
        context,
        code,
        language
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      <div className="p-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <Bot className="w-5 h-5" />
          Eternal AI
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Guides you toward the answer without giving it away.
        </p>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary/20 text-primary" : "bg-blue-500/20 text-blue-500"}`}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`rounded-xl px-4 py-2 max-w-[85%] text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-muted rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-muted/20">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for a hint..."
            className="flex-1 bg-background"
            disabled={isPending}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isPending}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
