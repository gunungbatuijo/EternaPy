import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    billingPeriod: "forever",
    features: [
      "Access to 20+ free courses",
      "Basic coding challenges",
      "Community forum access",
      "5 Eternal AI questions per day",
      "Progress tracking",
    ],
    isPopular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 24,
    billingPeriod: "month",
    features: [
      "All 100+ courses unlocked",
      "Unlimited coding challenges",
      "Premium projects & assignments",
      "Unlimited Eternal AI",
      "Completion certificates",
      "Advanced learning paths",
      "Priority support",
      "Offline access",
    ],
    isPopular: true,
  },
  {
    id: "team",
    name: "Team",
    price: 49,
    billingPeriod: "month",
    features: [
      "Everything in Pro",
      "Team dashboard & analytics",
      "Up to 10 team members",
      "Organization-wide progress tracking",
      "Classroom management features",
      "Dedicated account manager",
      "Custom learning paths",
      "API access",
    ],
    isPopular: false,
  },
];

// GET /api/subscriptions/plans
router.get("/subscriptions/plans", requireAuth, async (req, res) => {
  res.json(PLANS);
});

export default router;
