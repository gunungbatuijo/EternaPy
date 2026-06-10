import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, courseProgressTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

async function getUserByClerkId(clerkId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  return user ?? null;
}

// GET /api/leaderboard
router.get("/leaderboard", requireAuth, async (req, res) => {
  try {
    const { period = "all_time", limit = "50" } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);

    const users = await db.select().from(usersTable).orderBy(desc(usersTable.xp)).limit(limitNum);

    const clerkId = (req as any).clerkUserId;
    const currentUser = await getUserByClerkId(clerkId);
    let userRank: number | null = null;

    if (currentUser) {
      const better = await db.select({ count: sql<number>`count(*)` })
        .from(usersTable)
        .where(sql`xp > ${currentUser.xp}`);
      userRank = Number(better[0]?.count ?? 0) + 1;
    }

    const entries = await Promise.all(users.map(async (u, idx) => {
      const completedCourses = await db.select().from(courseProgressTable)
        .where(eq(courseProgressTable.userId, u.id));
      return {
        rank: idx + 1,
        userId: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl ?? null,
        xp: u.xp,
        level: u.level,
        streak: u.streak,
        completedCourses: completedCourses.filter(p => p.percentComplete >= 100).length,
        country: u.country ?? null,
      };
    }));

    res.json({
      entries,
      userRank,
      period: period as string,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
