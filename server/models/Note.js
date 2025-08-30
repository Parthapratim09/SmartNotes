import mongoose from "mongoose";
import User from "./User.js";



const noteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  title: { type: String },
  content: { type: String },
  createdAt: { type: Date, default: Date.now },
  summary: String,
  tags: [String],
  embedding: [Number],
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

export default mongoose.model("Note",noteSchema);