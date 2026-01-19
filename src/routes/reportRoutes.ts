import { Router } from "express";
import { getAggregatedReport, getDashboardStats } from "../controllers/reportController.js";

const router = Router();

router.get("/summary", getAggregatedReport); // ?type=daily|weekly|monthly
router.get("/dashboard", getDashboardStats);

export default router;
