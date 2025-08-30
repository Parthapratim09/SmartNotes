import dotenv from 'dotenv';
import express from "express";
import mongoose from "mongoose";
import cors from 'cors';
import { createServer } from "http";
import { Server } from "socket.io";
import Note from "./models/Note.js";

import authRoutes from './routes/auth.routes.js';
import noteRoutes from './routes/note.routes.js';
import aiRoutes from "./routes/aiRoutes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();
const app = express();
const server = createServer(app); 

// --- Socket.IO setup ---
const io = new Server(server, {
  cors: {
    origin: process.env.FRONT_END_URL, 
    methods: ["GET", "POST"]
  }
});

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- MongoDB connection ---
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser:true,
    useUnifiedTopology:true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection failed", err));

// --- Routes ---
app.get('/', (req, res) => {
  res.send('Welcome to the SmartNotes API');
});
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use("/api/user", userRoutes);

// --- Socket.IO Collaboration ---
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins a specific note room with authentication
  socket.on("joinNote", async ({ noteId, userId }) => {
    
    if (!noteId || !userId) return; 

    try {
      const note = await Note.findById(noteId);
      if (!note) return;

      // Check if the user is the owner or a collaborator
      if (
        note.User.toString() === userId ||
        note.sharedWith.map(id => id.toString()).includes(userId)
      ) {
        socket.join(noteId);
        console.log(`User ${userId} joined note ${noteId}`);
      } else {
        console.log(`User ${userId} attempted to join note ${noteId} without permission`);
 
        socket.emit("authError", "You don't have permission to join this note.");
      }
    } catch (err) {
      console.error("Error joining note room:", err);
    }
  });

  // User updates note content
  socket.on("updateNote", async ({ noteId, content, userId }) => {
    if (!noteId || !content || !userId) return;

    try {
      const note = await Note.findById(noteId);
      if (!note) return;


      if (
        note.user.toString() === userId ||
        note.sharedWith.map(id => id.toString()).includes(userId)
      ) {
        note.content = content;
        await note.save();

        io.to(noteId).emit("noteUpdated", note);
      } else {
        console.log(`User ${userId} attempted to update note ${noteId} without permission`);
        socket.emit("authError", "You don't have permission to edit this note.");
      }
    } catch (err) {
      console.error("Error updating note:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


// --- Start Server ---
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`); 
});
