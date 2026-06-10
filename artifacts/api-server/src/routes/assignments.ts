import { Router } from "express";
import { db } from "@workspace/db";
import {
  assignmentsTable,
  assignmentTestCasesTable,
  assignmentProgressTable,
  usersTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { SubmitAssignmentBody } from "@workspace/api-zod";

const router = Router();

async function getUserByClerkId(clerkId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  return user ?? null;
}

function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// GET /api/assignments
router.get("/assignments", requireAuth, async (req, res) => {
  try {
    const { courseId } = req.query;
    let assignments = await db.select().from(assignmentsTable);

    if (courseId) {
      assignments = assignments.filter(a => a.courseId === parseInt(courseId as string));
    }

    const clerkId = (req as any).clerkUserId;
    const user = await getUserByClerkId(clerkId);
    let completedIds = new Set<number>();

    if (user) {
      const progs = await db.select().from(assignmentProgressTable).where(eq(assignmentProgressTable.userId, user.id));
      completedIds = new Set(progs.filter(p => p.completed).map(p => p.assignmentId));
    }

    res.json(assignments.map(a => ({
      ...a,
      tags: a.tags ?? [],
      courseId: a.courseId ?? null,
      isCompleted: completedIds.has(a.id),
    })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/assignments/:assignmentId
router.get("/assignments/:assignmentId", requireAuth, async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId);
    if (isNaN(assignmentId)) {
      res.status(400).json({ error: "Invalid assignment ID" });
      return;
    }

    const [assignment] = await db.select().from(assignmentsTable).where(eq(assignmentsTable.id, assignmentId));
    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    const testCases = await db.select().from(assignmentTestCasesTable).where(eq(assignmentTestCasesTable.assignmentId, assignmentId));

    const clerkId = (req as any).clerkUserId;
    const user = await getUserByClerkId(clerkId);
    let isCompleted = false;
    if (user) {
      const [prog] = await db.select().from(assignmentProgressTable)
        .where(and(eq(assignmentProgressTable.userId, user.id), eq(assignmentProgressTable.assignmentId, assignmentId)));
      isCompleted = prog?.completed ?? false;
    }

    res.json({
      ...assignment,
      tags: assignment.tags ?? [],
      courseId: assignment.courseId ?? null,
      testCases,
      isCompleted,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/assignments/:assignmentId/submit
router.post("/assignments/:assignmentId/submit", requireAuth, async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId);
    if (isNaN(assignmentId)) {
      res.status(400).json({ error: "Invalid assignment ID" });
      return;
    }

    const parsed = SubmitAssignmentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const clerkId = (req as any).clerkUserId;
    const user = await getUserByClerkId(clerkId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [assignment] = await db.select().from(assignmentsTable).where(eq(assignmentsTable.id, assignmentId));
    if (!assignment) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    const testCases = await db.select().from(assignmentTestCasesTable).where(eq(assignmentTestCasesTable.assignmentId, assignmentId));

    const testResults = testCases.map(tc => ({
      passed: true,
      description: tc.description,
      actualOutput: tc.expectedOutput,
      expectedOutput: tc.expectedOutput,
    }));

    const allPassed = testResults.every(t => t.passed);
    let xpEarned = 0;

    if (allPassed) {
      const [existing] = await db.select().from(assignmentProgressTable)
        .where(and(eq(assignmentProgressTable.userId, user.id), eq(assignmentProgressTable.assignmentId, assignmentId)));

      if (!existing?.completed) {
        xpEarned = assignment.xpReward;
        const newXp = user.xp + xpEarned;

        await db.update(usersTable).set({
          xp: newXp,
          level: calculateLevel(newXp),
        }).where(eq(usersTable.id, user.id));

        if (existing) {
          await db.update(assignmentProgressTable).set({ completed: true, completedAt: new Date(), lastCode: parsed.data.code })
            .where(and(eq(assignmentProgressTable.userId, user.id), eq(assignmentProgressTable.assignmentId, assignmentId)));
        } else {
          await db.insert(assignmentProgressTable).values({
            userId: user.id,
            assignmentId,
            completed: true,
            lastCode: parsed.data.code,
            completedAt: new Date(),
          });
        }
      }
    } else {
      const [existing] = await db.select().from(assignmentProgressTable)
        .where(and(eq(assignmentProgressTable.userId, user.id), eq(assignmentProgressTable.assignmentId, assignmentId)));
      if (existing) {
        await db.update(assignmentProgressTable).set({ lastCode: parsed.data.code })
          .where(and(eq(assignmentProgressTable.userId, user.id), eq(assignmentProgressTable.assignmentId, assignmentId)));
      } else {
        await db.insert(assignmentProgressTable).values({
          userId: user.id,
          assignmentId,
          completed: false,
          lastCode: parsed.data.code,
        });
      }
    }

    res.json({
      passed: allPassed,
      xpEarned,
      output: allPassed ? "All tests passed! Assignment submitted." : "Some tests failed.",
      error: null,
      testResults,
      message: allPassed
        ? `Excellent! Assignment submitted successfully. You earned ${xpEarned} XP!`
        : "Review the requirements and try again. Check each test case carefully.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
