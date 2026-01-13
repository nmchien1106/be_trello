import commentController from "./comment.controller";
import express from "express";
import { verifyAccessToken } from "@/utils/jwt";
import { validateHandle } from "@/middleware/validate-handle";
import { CommentSchema } from "./comment.schema";

const router = express.Router();

// Create a new comment
router.post("/", verifyAccessToken, validateHandle(CommentSchema), commentController.createComment);

// Get comments on a specific card
router.get("/card/:cardId", verifyAccessToken, commentController.getCommentsOnCard);

// Delete a comment
router.delete("/:commentId", verifyAccessToken, commentController.deleteComment);

// Update a comment
router.put("/:commentId", verifyAccessToken, validateHandle(CommentSchema), commentController.updateComment);

// Get a comment by ID
router.get("/:commentId", verifyAccessToken, commentController.getCommentById);


export default router;