import express from "express";
import * as knowledgeBlocksController from "../controllers/knowledgeBlocksController.js";

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.get("/", asyncHandler(knowledgeBlocksController.getAllKnowledgeBlocks));
router.post("/", asyncHandler(knowledgeBlocksController.createKnowledgeBlock));
router.put("/:id", asyncHandler(knowledgeBlocksController.updateKnowledgeBlock));
router.delete("/:id", asyncHandler(knowledgeBlocksController.deleteKnowledgeBlock));

export default router;

