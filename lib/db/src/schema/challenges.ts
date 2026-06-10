import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const challengesTable = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull().default("easy"),
  language: text("language").notNull().default("python"),
  xpReward: integer("xp_reward").notNull().default(100),
  starterCode: text("starter_code").notNull().default(""),
  hints: text("hints").array().notNull().default([]),
  tags: text("tags").array().notNull().default([]),
  completionRate: real("completion_rate").notNull().default(0.5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assignmentsTable = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull().default(""),
  difficulty: text("difficulty").notNull().default("easy"),
  xpReward: integer("xp_reward").notNull().default(300),
  isPro: boolean("is_pro").notNull().default(false),
  courseId: integer("course_id"),
  starterCode: text("starter_code").notNull().default(""),
  language: text("language").notNull().default("python"),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const challengeTestCasesTable = pgTable("challenge_test_cases", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challengesTable.id),
  input: text("input").notNull().default(""),
  expectedOutput: text("expected_output").notNull(),
  description: text("description").notNull(),
});

export const assignmentTestCasesTable = pgTable("assignment_test_cases", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => assignmentsTable.id),
  input: text("input").notNull().default(""),
  expectedOutput: text("expected_output").notNull(),
  description: text("description").notNull(),
});

export const insertChallengeSchema = createInsertSchema(challengesTable).omit({ id: true, createdAt: true });
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challengesTable.$inferSelect;

export const insertAssignmentSchema = createInsertSchema(assignmentsTable).omit({ id: true, createdAt: true });
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignmentsTable.$inferSelect;
