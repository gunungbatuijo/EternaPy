import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { lessonsTable, coursesTable } from "./courses";
import { challengesTable, assignmentsTable } from "./challenges";

export const lessonProgressTable = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id),
  courseId: integer("course_id").notNull().references(() => coursesTable.id),
  completed: boolean("completed").notNull().default(false),
  timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courseProgressTable = pgTable("course_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  courseId: integer("course_id").notNull().references(() => coursesTable.id),
  completedLessons: integer("completed_lessons").notNull().default(0),
  totalLessons: integer("total_lessons").notNull().default(0),
  percentComplete: real("percent_complete").notNull().default(0),
  lastLessonId: integer("last_lesson_id"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const challengeProgressTable = pgTable("challenge_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  challengeId: integer("challenge_id").notNull().references(() => challengesTable.id),
  completed: boolean("completed").notNull().default(false),
  lastCode: text("last_code"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const assignmentProgressTable = pgTable("assignment_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  assignmentId: integer("assignment_id").notNull().references(() => assignmentsTable.id),
  completed: boolean("completed").notNull().default(false),
  lastCode: text("last_code"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertLessonProgressSchema = createInsertSchema(lessonProgressTable).omit({ id: true, createdAt: true });
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;
export type LessonProgress = typeof lessonProgressTable.$inferSelect;
