import { Router } from "express";
import { db } from "@workspace/db";
import {
  coursesTable,
  chaptersTable,
  lessonsTable,
  courseProgressTable,
  lessonProgressTable,
  usersTable,
} from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

async function getUserByClerkId(clerkId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  return user ?? null;
}

function formatCourse(c: typeof coursesTable.$inferSelect) {
  return {
    ...c,
    language: c.language ?? null,
    tags: c.tags ?? [],
  };
}

// GET /api/courses
router.get("/courses", requireAuth, async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = db.select().from(coursesTable);

    const conditions = [];
    if (category && typeof category === "string") {
      conditions.push(eq(coursesTable.category, category));
    }
    if (search && typeof search === "string") {
      conditions.push(ilike(coursesTable.title, `%${search}%`));
    }

    const courses = conditions.length > 0
      ? await db.select().from(coursesTable).where(and(...conditions))
      : await db.select().from(coursesTable);

    res.json(courses.map(formatCourse));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/courses/featured
router.get("/courses/featured", requireAuth, async (req, res) => {
  try {
    const courses = await db.select().from(coursesTable).limit(8);
    res.json(courses.map(formatCourse));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/courses/recommended
router.get("/courses/recommended", requireAuth, async (req, res) => {
  try {
    const clerkId = (req as any).clerkUserId;
    const user = await getUserByClerkId(clerkId);

    // Simple recommendation: courses not yet started, matching experience level
    let courses = await db.select().from(coursesTable).limit(6);
    if (user) {
      const started = await db.select({ courseId: courseProgressTable.courseId })
        .from(courseProgressTable)
        .where(eq(courseProgressTable.userId, user.id));
      const startedIds = new Set(started.map(s => s.courseId));
      const notStarted = courses.filter(c => !startedIds.has(c.id));
      courses = notStarted.length >= 4 ? notStarted.slice(0, 4) : courses.slice(0, 4);
    }

    res.json(courses.map(formatCourse));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/courses/:courseId — must come AFTER /courses/featured and /courses/recommended
router.get("/courses/:courseId", requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    if (isNaN(courseId)) {
      res.status(400).json({ error: "Invalid course ID" });
      return;
    }

    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.courseId, courseId));
    const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, courseId));

    const clerkId = (req as any).clerkUserId;
    const user = await getUserByClerkId(clerkId);
    let userProgress = null;
    let completedLessonIds = new Set<number>();

    if (user) {
      const [prog] = await db.select().from(courseProgressTable)
        .where(and(eq(courseProgressTable.userId, user.id), eq(courseProgressTable.courseId, courseId)));
      if (prog) {
        userProgress = {
          courseId: prog.courseId,
          completedLessons: prog.completedLessons,
          totalLessons: prog.totalLessons,
          percentComplete: prog.percentComplete,
          lastLessonId: prog.lastLessonId ?? null,
          startedAt: prog.startedAt?.toISOString() ?? null,
          completedAt: prog.completedAt?.toISOString() ?? null,
        };
      }
      const lessonProgs = await db.select().from(lessonProgressTable)
        .where(and(eq(lessonProgressTable.userId, user.id), eq(lessonProgressTable.courseId, courseId)));
      completedLessonIds = new Set(lessonProgs.filter(lp => lp.completed).map(lp => lp.lessonId));
    }

    const chaptersWithLessons = chapters
      .sort((a, b) => a.order - b.order)
      .map(ch => ({
        ...ch,
        lessons: lessons
          .filter(l => l.chapterId === ch.id)
          .sort((a, b) => a.order - b.order)
          .map(l => ({
            id: l.id,
            title: l.title,
            type: l.type,
            order: l.order,
            xpReward: l.xpReward,
            isCompleted: completedLessonIds.has(l.id),
            durationMinutes: l.durationMinutes,
          })),
      }));

    res.json({
      ...formatCourse(course),
      longDescription: course.longDescription,
      chapters: chaptersWithLessons,
      userProgress,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
