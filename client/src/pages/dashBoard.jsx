import React, { useState, useEffect, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import DarkModeToggle from "./darkmode.jsx";
import { useTheme } from "@mui/material/styles";   
import { useRef } from 'react'
import { useNavigate } from "react-router-dom";

import {
  AppBar, Toolbar, Typography, Button, Container, Grid, TextField,
  Paper, Card, CardContent, CardActions, IconButton, Box, Chip, CircularProgress,Snackbar,Alert
} from "@mui/material";
import NoteEditor from "./noteEditor.jsx";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import BookIcon from '@mui/icons-material/Book';
import SummarizeIcon from '@mui/icons-material/Summarize';
import LabelIcon from '@mui/icons-material/Label';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MicIcon from '@mui/icons-material/Mic';
import HearingIcon from '@mui/icons-material/Hearing';
import AddTaskIcon from '@mui/icons-material/AddTask';

const Dashboard = () => {
  const { token, logout } = useContext(AuthContext);
  const theme = useTheme();
  
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [aiLoading, setAiLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [speakingNoteId, setSpeakingNoteId] = useState(null);
  const [snackbar, setSnackbar] = useState({
      open: false,
      message: "",
      severity: "success",
    });

  useEffect(() => {
    if (token) fetchNotes();
  }, [token]);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleApiError = (err) => {
    if (err.response?.status === 401) {
      console.error(" Unauthorized or session expired. Logging out.");
      showSnackbar("Unauthorized or session expired. Logging out.", "error");
      logout();   
    } else {
      console.error(" API Error:", err.response?.data || err.message);
      showSnackbar("API Error: " + (err.response?.data?.msg || err.message), "error");
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await api.get("/notes");
      setNotes(res.data);
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) return;
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/notes/${editingId}`, { title, content });
      } else {
        await api.post("/notes", { title, content });
      }
      await fetchNotes();
      resetForm();
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateNoteInState = (id, data) => {
    setNotes(notes.map(n => n._id === id ? { ...n, ...data } : n));
  };

  const handleSummarize = async (id) => {
    setAiLoading(id);
    try {
      const note = notes.find(n => n._id === id);
      const { data } = await api.post("/ai/summarize", { content: note.content });
      updateNoteInState(id, { summary: data.summary });
    } catch (err) {
      handleApiError(err);
    } finally {
      setAiLoading(null);
    }
  };

  const handleTags = async (id) => {
    setAiLoading(id);
    try {
      const note = notes.find(n => n._id === id);
      const { data } = await api.post("/ai/tags", { content: note.content });
      updateNoteInState(id, { tags: data.tags });
    } catch (err) {
      handleApiError(err);
    } finally {
      setAiLoading(null);
    }
  };

  const deleteNote = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter((note) => note._id !== id));
    } catch (err) {
      handleApiError(err);
    }
  };

  const startEdit = (note) => {
    setEditingId(note._id);
    setTitle(note.title);
    setContent(note.content);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchNotes();
      return;
    }
    try {
      const { data } = await api.post("/ai/search", { query: searchQuery });
      setNotes(data);
    } catch (err) {
      handleApiError(err);
    }
  };

const speakNote = (noteId, text) => {
  if (!window.speechSynthesis) {
    showSnackbar("Speech Synthesis not supported in this browser.", "info");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;

  utterance.onend = () => {
    setSpeakingNoteId(null); 
  };

  window.speechSynthesis.speak(utterance);
  setSpeakingNoteId(noteId);
};

const stopSpeaking = () => {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  setSpeakingNoteId(null);
};



const [listeningField, setListeningField] = useState(null);
const recognitionRef = useRef(null);

const toggleListening = (field) => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    showSnackbar("Speech Recognition not supported in this browser.", "info");
    return;
  }

  if (listeningField === field && recognitionRef.current) {
    recognitionRef.current.stop();
    recognitionRef.current = null;
    setListeningField(null);
    return;
  }

  if (listeningField && recognitionRef.current) {
    recognitionRef.current.stop();
    recognitionRef.current = null;
    setListeningField(null);
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    setListeningField(field);
    recognitionRef.current = recognition;
  };

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    if (field === "title") {
      setTitle(transcript);
    } else if (field === "content") {
      setContent(transcript);
    }
  };

  recognition.onend = () => {
    recognitionRef.current = null;
    setListeningField(null);
  };

  recognition.start();
};



  return (
    <Box sx={{ flexGrow: 1, backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <BookIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            SmartNotes Dashboard
          </Typography>
          <DarkModeToggle/>
          <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 4, backgroundColor: theme.palette.background.paper }}>
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            {editingId ? <EditIcon /> : <AddTaskIcon />} {editingId ? "Edit Note" : "Add a New Note"}  
          </Typography>
          <TextField
            fullWidth label="Title" variant="outlined" margin="normal"
            value={title} onChange={(e) => setTitle(e.target.value)}
             InputProps={{
    endAdornment: (
      <IconButton onClick={() => toggleListening("title")}>
        {listeningField === "title" ? <HearingIcon/> : <MicIcon />}
      </IconButton>
    ),
  }}
          />
          <TextField
            fullWidth label="Content" variant="outlined" margin="normal" multiline rows={4}
            value={content} onChange={(e) => setContent(e.target.value)}
            InputProps={{
    endAdornment: (
      <IconButton onClick={() => toggleListening("content")}>
        {listeningField === "content" ? <HearingIcon/> : <MicIcon />}
      </IconButton>
    ),
  }}
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              type="submit" variant="contained" loading={loading}
              startIcon={editingId ? <EditIcon /> : <AddIcon />}
            >
              {editingId ? "Update Note" : "Add Note"}
            </Button>
            {editingId && (
              <Button variant="outlined" color="secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </Box>
        </Paper>

        <Grid container spacing={3}>
          <Box sx={{ mb: 3, display: "flex", gap: 2, width: "100%" }}>
            <TextField
              fullWidth
              placeholder="Search notes semantically..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="contained" onClick={handleSearch}>Search</Button>
          </Box>

          {notes.map((note) => (
            <Grid key={note._id} xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: theme.palette.background.paper }} >

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {note.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {note.content}
                  </Typography>

                  {note.summary && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" component="p" fontWeight="bold">Summary:</Typography>
                      <Typography variant="body2" color="text.secondary">{note.summary}</Typography>
                    </Box>
                  )}

                  {note.tags && note.tags.length > 0 && (
                    <Box mt={1}>
                      <Typography variant="subtitle2" component="p" fontWeight="bold" sx={{ mb: 0.5 }}>Tags:</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {note.tags.map(tag => <Chip key={tag} label={tag} size="small" />)}
                      </Box>
                    </Box>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  <Box>
                    {aiLoading === note._id ? <CircularProgress size={24} /> : (
                      <>
                        <Button size="small" startIcon={<SummarizeIcon />} onClick={() => handleSummarize(note._id)}>
                          Summarize
                        </Button>
                        <Button size="small" startIcon={<LabelIcon />} onClick={() => handleTags(note._id)}>
                          Generate Tags
                        </Button>
                        {speakingNoteId === note._id ? (
          <Button size="small" onClick={stopSpeaking}><StopIcon /> Stop</Button>
        ) : (
          <Button size="small" onClick={() => speakNote(note._id,"Title: "+ note.title + "\n" +"Note: " + note.content)}><VolumeUpIcon /> Speak</Button>
        )}
                      </>
                    )}
                  </Box>
                  
                  <Box>

                    <IconButton aria-label="edit" onClick={() => startEdit(note)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton aria-label="delete" onClick={() => deleteNote(note._id)}>
                      <DeleteIcon />
                    </IconButton>
                    <NoteEditor note={note} />  
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
      <Snackbar
              open={snackbar.open}
              autoHideDuration={3000}
              onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
              anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
              <Alert
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                severity={snackbar.severity}
                sx={{ width: "100%" }}
              >
                {snackbar.message}
              </Alert>
            </Snackbar>
    </Box>
  );
};

export default Dashboard;
