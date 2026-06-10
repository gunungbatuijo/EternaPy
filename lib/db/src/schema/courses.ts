import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description").notNull().default(""),
  category: text("category").notNull(),
  language: text("language"),
  difficulty: text("difficulty").notNull().default("beginner"),
  estimatedHours: integer("estimated_hours").notNull().default(5),
  xpReward: integer("xp_reward").notNull().default(500),
  isPro: boolean("is_pro").notNull().default(false),
  iconEmoji: text("icon_emoji").notNull().default("📚"),
  color: text("color").notNull().default("#6366f1"),
  tags: text("tags").array().notNull().default([]),
  enrolledCount: integer("enrolled_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chaptersTable = pgTable("chapters", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
});

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").notNull().references(() => chaptersTable.id),
  courseId: integer("course_id").notNull().references(() => coursesTable.id),
  title: text("title").notNull(),
  type: text("type").notNull().default("reading"),
  content: text("content").notNull().default(""),
  order: integer("order").notNull().default(0),
  xpReward: integer("xp_reward").notNull().default(50),
  durationMinutes: integer("duration_minutes").notNull().default(10),
  starterCode: text("starter_code"),
  language: text("language"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const testCasesTable = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessonsTable.id),
  challengeId: integer("challenge_id"),
  assignmentId: integer("assignment_id"),
  input: text("input").notNull().default(""),
  expectedOutput: text("expected_output").notNull(),
  description: text("description").notNull(),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true, createdAt: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;

export const insertLessonSchema = createInsertSchema(lessonsTable).omit({ id: true, createdAt: true });
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessonsTable.$inferSelect;

export const insertChapterSchema = createInsertSchema(chaptersTable).omit({ id: true });
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type Chapter = typeof chaptersTable.$inferSelect;
