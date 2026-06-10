import { Router } from "express";
import { db } from "@workspace/db";
import { courseProgressTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

async function getUserByClerkId(clerkId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  return user ?? null;
}

// GET /api/progress/course/:courseId
router.get("/progress/course/:courseId", requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    if (isNaN(courseId)) {
      res.status(400).json({ error: "Invalid course ID" });
      return;
    }

    const clerkId = (req as any).clerkUserId;
    const user = await getUserByClerkId(clerkId);
    if (!user) {
      res.json({
        courseId,
        completedLessons: 0,
        totalLessons: 0,
        percentComplete: 0,
        lastLessonId: null,
        startedAt: null,
        completedAt: null,
      });
      return;
    }

    const [prog] = await db.select().from(courseProgressTable)
      .where(and(eq(courseProgressTable.userId, user.id), eq(courseProgressTable.courseId, courseId)));

    if (!prog) {
      res.json({
        courseId,
        completedLessons: 0,
        totalLessons: 0,
        percentComplete: 0,
        lastLessonId: null,
        startedAt: null,
        completedAt: null,
      });
      return;
    }

    res.json({
      courseId: prog.courseId,
      completedLessons: prog.completedLessons,
      totalLessons: prog.totalLessons,
      percentComplete: prog.percentComplete,
      lastLessonId: prog.lastLessonId ?? null,
      startedAt: prog.startedAt?.toISOString() ?? null,
      completedAt: prog.completedAt?.toISOString() ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
