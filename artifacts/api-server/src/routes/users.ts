import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  lessonsTable,
  coursesTable,
  courseProgressTable,
  lessonProgressTable,
  challengeProgressTable,
  assignmentProgressTable,
  achievementsTable,
  userAchievementsTable,
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { UpsertUserProfileBody } from "@workspace/api-zod";

const router = Router();

async function getOrCreateUser(clerkId: string) {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  return existing ?? null;
}

function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function xpToNextLevel(level: number): number {
  return (level * level) * 100;
}

// GET /api/users/profile
router.get("/users/profile", requireAuth, async (req, res) => {
  try {
    const clerkId = (req as any).clerkUserId;
    const user = await getOrCreateUser(clerkId);
    if (!user) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/users/profile
router.post("/users/profile", requireAuth, async (req, res) => {
  try {
    const clerkId = (req as any).clerkUserId;
    const parsed = UpsertUserProfileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const data = parsed.data;
    const existing = await getOrCreateUser(clerkId);

    if (existing) {
      const [updated] = await db
        .update(usersTable)
        .set({ ...data, onboardingComplete: true })
        .where(eq(usersTable.clerkId, clerkId))
        .returning();
      res.json(updated);
    } else {
      const [created] = await db
        .insert(usersTable)
        .values({ clerkId, ...data, onboardingComplete: true })
        .returning();
      res.json(created);
    }
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Username already taken" });
    } else {
      res.status(500).json({ error: "Server error" });
    }
  }
});

// GET /api/users/dashboard
router.get("/users/dashboard", requireAuth, async (req, res) => {
  try {
    const clerkId = (req as any).clerkUserId;
    const user = await getOrCreateUser(clerkId);
    if (!user) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const [completedLessonsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(lessonProgressTable)
      .where(eq(lessonProgressTable.userId, user.id));

    const [completedChallengesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(challengeProgressTable)
      .where(eq(challengeProgressTable.userId, user.id));

    const [completedAssignmentsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(assignmentProgressTable)
      .where(eq(assignmentProgressTable.userId, user.id));

    const completedCourses = await db
      .select()
      .from(courseProgressTable)
      .where(eq(courseProgressTable.userId, user.id));

    const completedCoursesCount = completedCourses.filter(p => p.percentComplete >= 100).length;

    const level = calculateLevel(user.xp);
    const xpNext = xpToNextLevel(level);

    const [totalUsersRow] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const usersBetter = await db
      .select({ count: sql<number>`count(*)` })
      .from(usersTable)
      .where(sql`xp > ${user.xp}`);
    const rank = Number(usersBetter[0]?.count ?? 0) + 1;

    const stats = {
      xp: user.xp,
      level,
      xpToNextLevel: xpNext,
      streak: user.streak,
      completedLessons: Number(completedLessonsCount?.count ?? 0),
      completedCourses: completedCoursesCount,
      completedChallenges: Number(completedChallengesCount?.count ?? 0),
      completedAssignments: Number(completedAssignmentsCount?.count ?? 0),
      rank,
      totalUsers: Number(totalUsersRow?.count ?? 1),
    };

    // Continue learning - find most recent course progress
    let continueLearning = null;
    if (completedCourses.length > 0) {
      const latest = completedCourses.sort((a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      )[0];
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, latest.courseId));
      let lastLesson = null;
      if (latest.lastLessonId) {
        const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, latest.lastLessonId));
        if (lesson) {
          lastLesson = {
            id: lesson.id,
            title: lesson.title,
            type: lesson.type,
            order: lesson.order,
            xpReward: lesson.xpReward,
            isCompleted: false,
            durationMinutes: lesson.durationMinutes,
          };
        }
      }
      if (course) {
        continueLearning = {
          course: {
            ...course,
            language: course.language ?? null,
            tags: course.tags ?? [],
          },
          lastLesson,
          progressPercent: latest.percentComplete,
        };
      }
    }

    // Recommended courses - pick random free ones
    const allCourses = await db.select().from(coursesTable).limit(20);
    const recommended = allCourses.slice(0, 4).map(c => ({
      ...c,
      language: c.language ?? null,
      tags: c.tags ?? [],
    }));

    // Recent achievements
    const recentAchievements = await db
      .select({ achievement: achievementsTable, earnedAt: userAchievementsTable.earnedAt })
      .from(userAchievementsTable)
      .innerJoin(achievementsTable, eq(userAchievementsTable.achievementId, achievementsTable.id))
      .where(eq(userAchievementsTable.userId, user.id))
      .orderBy(desc(userAchievementsTable.earnedAt))
      .limit(5);

    const streakInfo = {
      currentStreak: user.streak,
      longestStreak: user.longestStreak,
      lastActiveDate: user.lastActiveDate ?? null,
      todayComplete: user.lastActiveDate === new Date().toISOString().split("T")[0],
    };

    res.json({
      profile: user,
      stats,
      continueLearning,
      recommendedCourses: recommended,
      recentAchievements: recentAchievements.map(r => ({
        achievement: r.achievement,
        earnedAt: r.earnedAt?.toISOString() ?? new Date().toISOString(),
      })),
      streakInfo,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/users/stats
router.get("/users/stats", requireAuth, async (req, res) => {
  try {
    const clerkId = (req as any).clerkUserId;
    const user = await getOrCreateUser(clerkId);
    if (!user) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const [completedLessonsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(lessonProgressTable)
      .where(eq(lessonProgressTable.userId, user.id));

    const [completedChallengesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(challengeProgressTable)
      .where(eq(challengeProgressTable.userId, user.id));

    const [completedAssignmentsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(assignmentProgressTable)
      .where(eq(assignmentProgressTable.userId, user.id));

    const completedCourses = await db
      .select()
      .from(courseProgressTable)
      .where(eq(courseProgressTable.userId, user.id));

    const completedCoursesCount = completedCourses.filter(p => p.percentComplete >= 100).length;
    const level = calculateLevel(user.xp);
    const xpNext = xpToNextLevel(level);

    const [totalUsersRow] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const usersBetter = await db
      .select({ count: sql<number>`count(*)` })
      .from(usersTable)
      .where(sql`xp > ${user.xp}`);
    const rank = Number(usersBetter[0]?.count ?? 0) + 1;

    res.json({
      xp: user.xp,
      level,
      xpToNextLevel: xpNext,
      streak: user.streak,
      completedLessons: Number(completedLessonsCount?.count ?? 0),
      completedCourses: completedCoursesCount,
      completedChallenges: Number(completedChallengesCount?.count ?? 0),
      completedAssignments: Number(completedAssignmentsCount?.count ?? 0),
      rank,
      totalUsers: Number(totalUsersRow?.count ?? 1),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
