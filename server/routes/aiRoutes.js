import express from "express";
import axios from "axios";
import OpenAI from "openai";
import Note from "../models/Note.js"; 
import { HfInference } from "@huggingface/inference";

import dotenv from 'dotenv';
dotenv.config();

const hf = process.env.HF_API_KEY ? new HfInference(process.env.HF_API_KEY) : null;

const router = express.Router();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;


/* ------------------------- SUMMARIZATION ------------------------- */
router.post("/summarize", async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ msg: "No content provided" });

  try {
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a summarization assistant." },
            {
              role: "user",
              content: `Summarize this text in a concise way:\n\n${content}`,
            },
          ],
        });

        const summary =
          completion.choices[0].message.content || "No summary generated.";
        return res.json({ summary });
      } catch (err) {
        console.error("OpenAI Summarize failed, fallback to Hugging Face:", err.message);
      }
    }

    try {
      const response = await axios.post(
        "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
        { inputs: content },
        {
          headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
        }
      );

      if (response.data && response.data[0]?.summary_text) {
        return res.json({ summary: response.data[0].summary_text });
      } else {
        throw new Error("No summary returned from Hugging Face");
      }
    } catch (hfError) {
      console.error("Hugging Face Summarize failed:", hfError.message);
      return res
        .status(500)
        .json({ msg: "Failed to summarize content", error: hfError.message });
    }
  } catch (error) {
    console.error("Final Error:", error.message);
    return res
      .status(500)
      .json({ msg: "Unexpected error occurred", error: error.message });
  }
});

/* ------------------------- TAGS GENERATION ------------------------- */
router.post("/tags", async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ msg: "No content provided" });

  try {
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a tag generation assistant." },
            {
              role: "user",
              content: `Generate 5 short and relevant tags (comma-separated) for this text:\n\n${content}`,
            },
          ],
        });

        const tags =
          completion.choices[0].message.content
            ?.split(",")
            .map((t) => t.trim()) || [];

        return res.json({ tags });
      } catch (err) {
        console.error("OpenAI Tags failed, fallback to Hugging Face:", err.message);
      }
    }

    try {
      const candidateLabels = ["technology", "education", "health", "sports", "finance", "entertainment", "science", "travel"]; // you can customize
      const response = await axios.post(
        "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
        {
          inputs: content,
          parameters: { candidate_labels: candidateLabels, multi_label: true },
        },
        {
          headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
        }
      );

      if (response.data && response.data.labels) {
        const tags = response.data.labels.slice(0, 5);
        return res.json({ tags });
      } else {
        throw new Error("No tags returned from Hugging Face");
      }
    } catch (hfError) {
      console.error("Hugging Face Tags failed:", hfError.message);
      return res
        .status(500)
        .json({ msg: "Failed to generate tags", error: hfError.message });
    }
  } catch (error) {
    console.error("Final Error:", error.message);
    return res
      .status(500)
      .json({ msg: "Unexpected error occurred", error: error.message });
  }
});

/* ------------------------- SEMANTIC SEARCH ------------------------- */

const cosineSimilarity = (a, b) => {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};


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


router.post("/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    const queryEmbedding = await getEmbedding(query);

    const notes = await Note.find({});
    const results = notes
      .map((note) => ({
        ...note.toObject(),
        similarity: cosineSimilarity(queryEmbedding, note.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity);

    res.json(results);
  } catch (err) {
    console.error("Semantic Search Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});



export default router;
