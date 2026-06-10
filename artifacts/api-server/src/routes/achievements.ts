import { Router } from "express";
import { db } from "@workspace/db";
import { achievementsTable, userAchievementsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

async function getUserByClerkId(clerkId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  return user ?? null;
}

// GET /api/achievements
router.get("/achievements", requireAuth, async (req, res) => {
  try {
    const achievements = await db.select().from(achievementsTable);
    res.json(achievements);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/achievements/user
router.get("/achievements/user", requireAuth, async (req, res) => {
  try {
    const clerkId = (req as any).clerkUserId;
    const user = await getUserByClerkId(clerkId);
    if (!user) {
      res.json([]);
      return;
    }

    const userAchievements = await db
      .select({ achievement: achievementsTable, earnedAt: userAchievementsTable.earnedAt })
      .from(userAchievementsTable)
      .innerJoin(achievementsTable, eq(userAchievementsTable.achievementId, achievementsTable.id))
      .where(eq(userAchievementsTable.userId, user.id));

    res.json(userAchievements.map(ua => ({
      achievement: ua.achievement,
      earnedAt: ua.earnedAt?.toISOString() ?? new Date().toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
