import { Router } from "express";
import {
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory
} from "../controllers/categoryController.js";

const router = Router();

router.post("/", createCategory);
router.get("/", getCategories);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
