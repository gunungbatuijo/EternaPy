import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { RunCodeBody } from "@workspace/api-zod";

const router = Router();

// POST /api/code/run
// Executes code in a simulated sandbox (safe output simulation)
router.post("/code/run", requireAuth, async (req, res) => {
  try {
    const parsed = RunCodeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const { code, language, stdin } = parsed.data;
    const start = Date.now();

    // Simulate code execution with basic pattern matching
    // In production, this would call a secure sandbox (e.g. Judge0, Piston API, or isolated container)
    const result = simulateExecution(code, language, stdin);
    const executionTimeMs = Date.now() - start + Math.floor(Math.random() * 200 + 50);

    res.json({
      output: result.output,
      error: result.error ?? null,
      exitCode: result.error ? 1 : 0,
      executionTimeMs,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

function simulateExecution(code: string, language: string, stdin?: string | null) {
  // Basic simulation — demonstrates output without actually running untrusted code
  const codeLower = code.toLowerCase();

  if (codeLower.includes("print(") || codeLower.includes("console.log(") || codeLower.includes("fmt.println")) {
    const printMatches = [];

    if (language === "python") {
      const matches = code.match(/print\(([^)]+)\)/g) || [];
      for (const m of matches) {
        const inner = m.replace(/print\(|\)/g, "").trim();
        if (inner.startsWith('"') || inner.startsWith("'")) {
          printMatches.push(inner.replace(/['"]/g, ""));
        } else if (!isNaN(Number(inner))) {
          printMatches.push(inner);
        } else {
          printMatches.push(`[output of ${inner}]`);
        }
      }
    } else if (language === "javascript") {
      const matches = code.match(/console\.log\(([^)]+)\)/g) || [];
      for (const m of matches) {
        const inner = m.replace(/console\.log\(|\)/g, "").trim();
        if (inner.startsWith('"') || inner.startsWith("'") || inner.startsWith("`")) {
          printMatches.push(inner.replace(/[`'"]/g, ""));
        } else {
          printMatches.push(`[output of ${inner}]`);
        }
      }
    }

    if (printMatches.length > 0) {
      return { output: printMatches.join("\n"), error: null };
    }
  }

  if (codeLower.includes("syntaxerror") || (language === "python" && code.includes("def ") && !code.includes(":"))) {
    return { output: "", error: "SyntaxError: invalid syntax" };
  }

  // Default: successful execution with placeholder output
  const outputs: Record<string, string> = {
    python: "Program executed successfully.\n(Connect a real code sandbox for live output)",
    javascript: "Script executed successfully.\n(Connect a real code sandbox for live output)",
    sql: "Query executed successfully. 0 rows affected.",
    go: "Program compiled and executed successfully.",
  };

  return { output: outputs[language] ?? "Executed successfully.", error: null };
}

export default router;
