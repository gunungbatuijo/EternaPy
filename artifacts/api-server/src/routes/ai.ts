import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { AskEternalAiBody } from "@workspace/api-zod";

const router = Router();

// POST /api/ai/ask
router.post("/ai/ask", requireAuth, async (req, res) => {
  try {
    const parsed = AskEternalAiBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const { question, contextType, context, code, language } = parsed.data;

    // Eternal AI provides hints and guidance, never direct answers
    const hints = generateHints(question, contextType, context, code, language);
    const followUpQuestions = generateFollowUpQuestions(question, contextType);
    const resources = getRelevantResources(contextType, language);

    const message = getGuidanceMessage(question, contextType);

    res.json({
      message,
      hints,
      followUpQuestions,
      resources,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

function getGuidanceMessage(question: string, contextType: string): string {
  const questionLower = question.toLowerCase();

  if (questionLower.includes("answer") || questionLower.includes("solution") || questionLower.includes("solve")) {
    return "I can't give you the direct answer — but that's actually a good thing! Working through the problem yourself is how real understanding forms. Let me guide you with some hints and questions that will help you find the solution on your own.";
  }

  if (questionLower.includes("error") || questionLower.includes("bug") || questionLower.includes("not working")) {
    return "Let's debug this together! I'll help you understand what might be going wrong. Reading error messages carefully and understanding them is one of the most valuable skills you can develop as a programmer.";
  }

  if (contextType === "challenge" || contextType === "assignment") {
    return "Great question! Rather than giving you the solution directly, let me help you think through the problem. Understanding the 'why' behind the solution will serve you much better in the long run.";
  }

  return "I'm here to help guide your thinking! Let me share some hints and concepts that should help you make progress. Remember — the struggle is where the learning happens.";
}

function generateHints(question: string, contextType: string, context?: string, code?: string, language?: string): string[] {
  const questionLower = question.toLowerCase();

  if (questionLower.includes("loop") || questionLower.includes("iterate")) {
    return [
      "Think about what value changes on each iteration and what condition makes the loop stop.",
      "Consider what data structure you're iterating over and which loop type is most appropriate.",
      "Trace through your loop manually with a small example to verify the logic.",
    ];
  }

  if (questionLower.includes("function") || questionLower.includes("def ")) {
    return [
      "Start with the function signature: what inputs does it need, and what should it return?",
      "Break the problem into smaller steps before writing code.",
      "Test your function with simple inputs before handling edge cases.",
    ];
  }

  if (questionLower.includes("error") || questionLower.includes("exception")) {
    return [
      "Read the error message carefully — it usually tells you exactly what went wrong and on which line.",
      "Check the data types of your variables — type mismatches are a common source of errors.",
      "Add print statements to trace the values of variables at key points in your code.",
    ];
  }

  if (questionLower.includes("sql") || contextType === "lesson" && context?.includes("SQL")) {
    return [
      "Think about which tables you need and how they relate to each other.",
      "Break your query into parts: first SELECT what you want, then FROM where, then any conditions.",
      "Use a simple example to test each part of your query before combining them.",
    ];
  }

  if (code && code.length > 0) {
    return [
      "Look at each line of your code and ask yourself: what does this line actually do?",
      "Trace through your code mentally with a simple input to verify the logic.",
      "Consider: are there any edge cases your current solution doesn't handle?",
    ];
  }

  return [
    "Break the problem into smaller, manageable pieces.",
    "Think about what inputs your solution needs and what output it should produce.",
    "Look for patterns in similar problems you've solved before.",
  ];
}

function generateFollowUpQuestions(question: string, contextType: string): string[] {
  return [
    "What do you think the first step toward a solution would be?",
    "Have you tried breaking the problem into smaller parts?",
    "What output do you expect for the simplest possible input?",
  ];
}

function getRelevantResources(contextType: string, language?: string): Array<{ title: string; url: string; type: string }> {
  const resources: Array<{ title: string; url: string; type: string }> = [
    { title: "MDN Web Docs", url: "https://developer.mozilla.org", type: "documentation" },
  ];

  if (language === "python") {
    resources.unshift({ title: "Python Official Docs", url: "https://docs.python.org/3/", type: "documentation" });
  } else if (language === "javascript") {
    resources.unshift({ title: "MDN JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", type: "documentation" });
  } else if (language === "sql") {
    resources.unshift({ title: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/", type: "documentation" });
  } else if (language === "go") {
    resources.unshift({ title: "Go Tour", url: "https://go.dev/tour/", type: "documentation" });
  }

  return resources;
}

export default router;
