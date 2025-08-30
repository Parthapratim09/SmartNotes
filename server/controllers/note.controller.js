import Note from "../models/Note.js";
import { HfInference } from "@huggingface/inference";
import OpenAI from "openai";
import dotenv from 'dotenv';
import User from "../models/User.js";

dotenv.config();

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const hf = process.env.HF_API_KEY ? new HfInference(process.env.HF_API_KEY) : null;

async function getEmbedding(text) {

  if (!text || text.trim() === "") {
    console.log("Skipping embedding for empty content.");
    return null;
  }
  if (openai) {
    try {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return embedding.data[0].embedding;
    } catch (err) {
      console.error("OpenAI failed, falling back to Hugging Face:", err.message);
    }
  }

  if (hf) {
    try {
      const hfEmbedding = await hf.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: text,
      });
      return Array.from(hfEmbedding);
    } catch (hfErr) {
      console.error("Hugging Face fallback also failed:", hfErr.message);
    }
  }
  
  console.error("Both OpenAI and Hugging Face clients are unconfigured or failed.");
  return null;
}





export const createNote =async(req,res) =>{
    try{
        const { title, content } = req.body;
        const embedding = await getEmbedding(content);

        const userId=req.user.id;
        const newNote = new Note({
            user: userId,
            title,
            content,
            embedding,
        })
        const savedNote = await newNote.save();
        res.status(201).json(savedNote);
    } catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json({ msg: "Server error" });
    }
}

export const getNotes = async (req, res) => {
    try{
        const userId=req.user.id;
        const notes=await Note.find({ $or: [{ user: userId }, { sharedWith: userId }] }).sort({ createdAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ msg: "Server error" });  
    }
}

export const updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;
    const { title, content } = req.body;

    
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const isOwner = note.user.toString() === userId;
    const isCollaborator = note.sharedWith.some(
      (sharedUser) => sharedUser.toString() === userId
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ error: "Not authorized to update this note" });
    }

    if (title) note.title = title;
    if (content) {
      note.content = content;
      try {
        const embedding = await getEmbedding(content);
        note.embedding = embedding;
      } catch (embeddingErr) {
        console.error("Embedding error:", embeddingErr);
      }
    }

    await note.save();
    res.status(200).json(note);
  } catch (err) {
    console.error("Error updating note:", err);
    res.status(500).json({ error: "Server error" });
  }
};


export const deleteNote = async (req, res) => {
    try{
        const {noteId} = req.params;
        const userId = req.user.id;
        const deleteNote= await Note.findOneAndDelete({ _id: noteId, user: userId });
        if (!deleteNote) {
            return res.status(404).json({ msg: "Note not found or you do not have permission to delete it" });
        }
        console.log(deleteNote);
        res.status(200).json({ msg: "Note deleted successfully" });
    } catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).json({ msg: "Server error" });
    }
}

export const getNoteById = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;
    const note = await Note.findById(noteId).populate("sharedWith", "username email");  
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    if (
      note.user.toString() !== userId &&
      !note.sharedWith.some((id) => id.toString() === userId)
    ) {
      return res.status(403).json({ msg: "Not authorized to access this note" });
    }

    res.status(200).json(note);
  } catch (err) {
    console.error("Error fetching single note:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const shareNote = async (req, res) => {
  try {
    const { userId } = req.body;
    const { noteId } = req.params;
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ msg: "Note not found" });
    }
    if (!note.user) {
      return res.status(400).json({ message: "Note owner not set" });
    }

    if (note.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ msg: "Only the owner can share this note" });
    }

    const userToShare = await User.findById(userId);
    if (!userToShare) {
      return res.status(404).json({ msg: "User to share with not found" });
    }

    if (!note.sharedWith.includes(userId)) {
      note.sharedWith.push(userId);
      await note.save();
    }
    
    res.json({ msg: "Note shared successfully", note });
  } catch (error) {
    console.error("Error sharing note:", error);
    res.status(500).json({ msg: "Server error" });
  }
};



export const removeCollaborator = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userId } = req.body;

    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ msg: "Note not found" });

    if (note.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    note.sharedWith = note.sharedWith.filter(
      (id) => id.toString() !== userId
    );
    await note.save();

    res.json({ msg: "Collaborator removed", sharedWith: note.sharedWith });
  } catch (err) {
    console.error("Remove collaborator error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
