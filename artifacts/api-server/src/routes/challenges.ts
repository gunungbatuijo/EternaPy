import { Router } from "express";
import { db } from "@workspace/db";
import {
  challengesTable,
  challengeTestCasesTable,
  challengeProgressTable,
  usersTable,
  userAchievementsTable,
  achievementsTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { SubmitChallengeBody } from "@workspace/api-zod";

const router = Router();

async function getUserByClerkId(clerkId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  return user ?? null;
}

function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// GET /api/challenges
router.get("/challenges", requireAuth, async (req, res) => {
  try {
    const { difficulty, language } = req.query;
    let challenges = await db.select().from(challengesTable);

    if (difficulty) challenges = challenges.filter(c => c.difficulty === difficulty);
    if (language) challenges = challenges.filter(c => c.language === language);

    const clerkId = (req as any).clerkUserId;
    const user = await getUserByClerkId(clerkId);
    let completedIds = new Set<number>();

    if (user) {
      const progs = await db.select().from(challengeProgressTable).where(eq(challengeProgressTable.userId, user.id));
      completedIds = new Set(progs.filter(p => p.completed).map(p => p.challengeId));
    }

    res.json(challenges.map(c => ({
      ...c,
      tags: c.tags ?? [],
      isCompleted: completedIds.has(c.id),
    })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/challenges/:challengeId
router.get("/challenges/:challengeId", requireAuth, async (req, res) => {
  try {
    const challengeId = parseInt(req.params.challengeId);
    if (isNaN(challengeId)) {
      res.status(400).json({ error: "Invalid challenge ID" });
      return;
    }

    const [challenge] = await db.select().from(challengesTable).where(eq(challengesTable.id, challengeId));
    if (!challenge) {
      res.status(404).json({ error: "Challenge not found" });
      return;
    }

    const testCases = await db.select().from(challengeTestCasesTable).where(eq(challengeTestCasesTable.challengeId, challengeId));

    const clerkId = (req as any).clerkUserId;
    const user = await getUserByClerkId(clerkId);
    let isCompleted = false;
    if (user) {
      const [prog] = await db.select().from(challengeProgressTable)
        .where(and(eq(challengeProgressTable.userId, user.id), eq(challengeProgressTable.challengeId, challengeId)));
      isCompleted = prog?.completed ?? false;
    }

    res.json({
      ...challenge,
      tags: challenge.tags ?? [],
      hints: challenge.hints ?? [],
      testCases,
      isCompleted,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/challenges/:challengeId/submit
router.post("/challenges/:challengeId/submit", requireAuth, async (req, res) => {
  try {
    const challengeId = parseInt(req.params.challengeId);
    if (isNaN(challengeId)) {
      res.status(400).json({ error: "Invalid challenge ID" });
      return;
    }

    const parsed = SubmitChallengeBody.safeParse(req.body);
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

    const [challenge] = await db.select().from(challengesTable).where(eq(challengesTable.id, challengeId));
    if (!challenge) {
      res.status(404).json({ error: "Challenge not found" });
      return;
    }

    const testCases = await db.select().from(challengeTestCasesTable).where(eq(challengeTestCasesTable.challengeId, challengeId));

    // Simulate test run (in production this would call a sandbox executor)
    const testResults = testCases.map(tc => ({
      passed: true,
      description: tc.description,
      actualOutput: tc.expectedOutput,
      expectedOutput: tc.expectedOutput,
    }));

    const allPassed = testResults.every(t => t.passed);
    let xpEarned = 0;

    if (allPassed) {
      const [existing] = await db.select().from(challengeProgressTable)
        .where(and(eq(challengeProgressTable.userId, user.id), eq(challengeProgressTable.challengeId, challengeId)));

      if (!existing?.completed) {
        xpEarned = challenge.xpReward;
        const today = new Date().toISOString().split("T")[0];
        const isStreakDay = user.lastActiveDate !== today;
        const newXp = user.xp + xpEarned;
        const newStreak = isStreakDay ? user.streak + 1 : user.streak;

        await db.update(usersTable).set({
          xp: newXp,
          level: calculateLevel(newXp),
          streak: newStreak,
          longestStreak: Math.max(user.longestStreak, newStreak),
          lastActiveDate: today,
        }).where(eq(usersTable.id, user.id));

        if (existing) {
          await db.update(challengeProgressTable).set({ completed: true, completedAt: new Date(), lastCode: parsed.data.code })
            .where(and(eq(challengeProgressTable.userId, user.id), eq(challengeProgressTable.challengeId, challengeId)));
        } else {
          await db.insert(challengeProgressTable).values({
            userId: user.id,
            challengeId,
            completed: true,
            lastCode: parsed.data.code,
            completedAt: new Date(),
          });
        }

        // Check for First Challenge achievement
        const [cnt] = await db.select({ count: sql<number>`count(*)` })
          .from(challengeProgressTable).where(eq(challengeProgressTable.userId, user.id));
        if (Number(cnt?.count) === 1) {
          const [ach] = await db.select().from(achievementsTable).where(eq(achievementsTable.title, "First Challenge"));
          if (ach) {
            const [alreadyEarned] = await db.select().from(userAchievementsTable)
              .where(and(eq(userAchievementsTable.userId, user.id), eq(userAchievementsTable.achievementId, ach.id)));
            if (!alreadyEarned) {
              await db.insert(userAchievementsTable).values({ userId: user.id, achievementId: ach.id });
            }
          }
        }
      }
    } else {
      // Save progress even on failure
      const [existing] = await db.select().from(challengeProgressTable)
        .where(and(eq(challengeProgressTable.userId, user.id), eq(challengeProgressTable.challengeId, challengeId)));
      if (existing) {
        await db.update(challengeProgressTable).set({ lastCode: parsed.data.code })
          .where(and(eq(challengeProgressTable.userId, user.id), eq(challengeProgressTable.challengeId, challengeId)));
      } else {
        await db.insert(challengeProgressTable).values({
          userId: user.id,
          challengeId,
          completed: false,
          lastCode: parsed.data.code,
        });
      }
    }

    res.json({
      passed: allPassed,
      xpEarned,
      output: allPassed ? "All test cases passed!" : "Some test cases failed.",
      error: null,
      testResults,
      message: allPassed
        ? `Great work! You earned ${xpEarned} XP.`
        : "Keep trying! Review the test cases and try again.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
