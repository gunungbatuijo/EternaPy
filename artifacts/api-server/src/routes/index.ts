import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import coursesRouter from "./courses";
import lessonsRouter from "./lessons";
import challengesRouter from "./challenges";
import assignmentsRouter from "./assignments";
import leaderboardRouter from "./leaderboard";
import achievementsRouter from "./achievements";
import aiRouter from "./ai";
import codeRouter from "./code";
import subscriptionsRouter from "./subscriptions";
import progressRouter from "./progress";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(coursesRouter);
router.use(lessonsRouter);
router.use(challengesRouter);
router.use(assignmentsRouter);
router.use(leaderboardRouter);
router.use(achievementsRouter);
router.use(aiRouter);
router.use(codeRouter);
router.use(subscriptionsRouter);
router.use(progressRouter);

export default router;
