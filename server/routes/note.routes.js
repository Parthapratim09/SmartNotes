import { createNote,getNotes,deleteNote,updateNote,getNoteById,shareNote, removeCollaborator  } from "../controllers/note.controller.js";
import express from "express";
import verifyToken from "../middleware/auth.middleware.js";

const router = express.Router();

router.get('/', verifyToken, getNotes);
router.post('/', verifyToken, createNote);
router.get('/:noteId', verifyToken, getNoteById);
router.put('/:noteId', verifyToken, updateNote);
router.delete('/:noteId', verifyToken, deleteNote);
router.post('/:noteId/share', verifyToken, shareNote);
router.post("/:noteId/remove-collaborator", verifyToken, removeCollaborator);


export default router;
