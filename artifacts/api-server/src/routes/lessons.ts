import { Router } from "express";
import { db } from "@workspace/db";
import {
  lessonsTable,
  coursesTable,
  lessonProgressTable,
  courseProgressTable,
  usersTable,
  testCasesTable,
  achievementsTable,
  userAchievementsTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { CompleteLessonBody } from "@workspace/api-zod";

const router = Router();

async function getUserByClerkId(clerkId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  return user ?? null;
}

function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// GET /api/lessons/:lessonId
router.get("/lessons/:lessonId", requireAuth, async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    if (isNaN(lessonId)) {
      res.status(400).json({ error: "Invalid lesson ID" });
      return;
    }

    const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
    if (!lesson) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }

    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, lesson.courseId));
    const testCases = await db.select().from(testCasesTable).where(eq(testCasesTable.lessonId, lessonId));

    // Find next/prev lesson in same course
    const allLessons = await db.select().from(lessonsTable)
      .where(eq(lessonsTable.courseId, lesson.courseId))
      .orderBy(lessonsTable.order);

    const idx = allLessons.findIndex(l => l.id === lessonId);
    const prevLessonId = idx > 0 ? allLessons[idx - 1].id : null;
    const nextLessonId = idx < allLessons.length - 1 ? allLessons[idx + 1].id : null;

    const clerkId = (req as any).clerkUserId;
    const user = await getUserByClerkId(clerkId);
    let isCompleted = false;
    if (user) {
      const [prog] = await db.select().from(lessonProgressTable)
        .where(and(eq(lessonProgressTable.userId, user.id), eq(lessonProgressTable.lessonId, lessonId)));
      isCompleted = prog?.completed ?? false;
    }

    res.json({
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      content: lesson.content,
      xpReward: lesson.xpReward,
      isCompleted,
      starterCode: lesson.starterCode ?? null,
      language: lesson.language ?? null,
      testCases: testCases.length > 0 ? testCases : null,
      nextLessonId,
      prevLessonId,
      courseId: lesson.courseId,
      courseTitle: course?.title ?? "",
      order: lesson.order,
      durationMinutes: lesson.durationMinutes,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/lessons/:lessonId/complete
router.post("/lessons/:lessonId/complete", requireAuth, async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    if (isNaN(lessonId)) {
      res.status(400).json({ error: "Invalid lesson ID" });
      return;
    }

    const parsed = CompleteLessonBody.safeParse(req.body);
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

    const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
    if (!lesson) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }

    // Check if already completed
    const [existing] = await db.select().from(lessonProgressTable)
      .where(and(eq(lessonProgressTable.userId, user.id), eq(lessonProgressTable.lessonId, lessonId)));

    let xpEarned = 0;
    if (!existing?.completed) {
      xpEarned = lesson.xpReward;

      if (existing) {
        await db.update(lessonProgressTable)
          .set({ completed: true, completedAt: new Date(), timeSpentSeconds: parsed.data.timeSpentSeconds })
          .where(and(eq(lessonProgressTable.userId, user.id), eq(lessonProgressTable.lessonId, lessonId)));
      } else {
        await db.insert(lessonProgressTable).values({
          userId: user.id,
          lessonId,
          courseId: lesson.courseId,
          completed: true,
          timeSpentSeconds: parsed.data.timeSpentSeconds,
          completedAt: new Date(),
        });
      }

      // Update course progress
      const allLessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, lesson.courseId));
      const completedLessons = await db.select().from(lessonProgressTable)
        .where(and(eq(lessonProgressTable.userId, user.id), eq(lessonProgressTable.courseId, lesson.courseId)));
      const completedCount = completedLessons.filter(lp => lp.completed).length;
      const percent = allLessons.length > 0 ? (completedCount / allLessons.length) * 100 : 0;

      const [existingCourseProgress] = await db.select().from(courseProgressTable)
        .where(and(eq(courseProgressTable.userId, user.id), eq(courseProgressTable.courseId, lesson.courseId)));

      if (existingCourseProgress) {
        await db.update(courseProgressTable)
          .set({ completedLessons: completedCount, totalLessons: allLessons.length, percentComplete: percent, lastLessonId: lessonId })
          .where(and(eq(courseProgressTable.userId, user.id), eq(courseProgressTable.courseId, lesson.courseId)));
      } else {
        await db.insert(courseProgressTable).values({
          userId: user.id,
          courseId: lesson.courseId,
          completedLessons: completedCount,
          totalLessons: allLessons.length,
          percentComplete: percent,
          lastLessonId: lessonId,
        });
      }

      // Award XP and update streak
      const today = new Date().toISOString().split("T")[0];
      const isStreakDay = user.lastActiveDate !== today;
      const newXp = user.xp + xpEarned;
      const oldLevel = calculateLevel(user.xp);
      const newLevel = calculateLevel(newXp);
      const newStreak = isStreakDay ? user.streak + 1 : user.streak;

      await db.update(usersTable).set({
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        longestStreak: Math.max(user.longestStreak, newStreak),
        lastActiveDate: today,
      }).where(eq(usersTable.id, user.id));

      const leveledUp = newLevel > oldLevel;

      // Check for new achievements
      const newAchievements: any[] = [];
      if (!existing?.completed) {
        // First lesson achievement
        const [completedCount1] = await db.select({ count: sql<number>`count(*)` })
          .from(lessonProgressTable).where(eq(lessonProgressTable.userId, user.id));
        if (Number(completedCount1?.count) === 1) {
          const [ach] = await db.select().from(achievementsTable).where(eq(achievementsTable.title, "First Lesson"));
          if (ach) {
            const [alreadyEarned] = await db.select().from(userAchievementsTable)
              .where(and(eq(userAchievementsTable.userId, user.id), eq(userAchievementsTable.achievementId, ach.id)));
            if (!alreadyEarned) {
              await db.insert(userAchievementsTable).values({ userId: user.id, achievementId: ach.id });
              newAchievements.push(ach);
            }
          }
        }
      }

      res.json({
        xpEarned,
        totalXp: newXp,
        newLevel: leveledUp ? newLevel : null,
        newAchievements,
        streakUpdated: isStreakDay,
      });
    } else {
      res.json({
        xpEarned: 0,
        totalXp: user.xp,
        newLevel: null,
        newAchievements: [],
        streakUpdated: false,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
