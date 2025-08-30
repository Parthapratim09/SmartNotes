import React, { useState, useEffect } from "react";
import axios from "axios";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import ShareIcon from "@mui/icons-material/Share";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const ShareModal = ({ noteId, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collaborators, setCollaborators] = useState([]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACK_END_URL}/api/notes/${noteId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCollaborators(data.sharedWith || []);
      } catch (err) {
        console.error("Failed to load collaborators", err);
        showSnackbar("Failed to load collaborators", "error");
      }
    };
    fetchCollaborators();
  }, [noteId]);


  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACK_END_URL}/api/user/search?q=${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(data);
    } catch (err) {
      console.error("Search failed:", err);
      showSnackbar("Search failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (userId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACK_END_URL}/api/notes/${noteId}/share`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sharedUser = results.find((u) => u._id === userId);
      setCollaborators((prev) => [...prev, sharedUser]);

      showSnackbar("Note shared successfully!", "success");
    } catch (err) {
      console.error("Failed to share note:", err);
      showSnackbar("Failed to share note. User may already have access.", "error");
    }
  };


  const handleRemove = async (userId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACK_END_URL}/api/notes/${noteId}/remove-collaborator`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCollaborators((prev) => prev.filter((u) => u._id !== userId));
      showSnackbar("Collaborator removed", "info");
    } catch (err) {
      console.error("Failed to remove collaborator", err);
      showSnackbar("Failed to remove collaborator", "error");
    }
  };

  return (
    <>
      <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          Share Note
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* Search Input */}
          <div style={{ display: "flex", gap: "8px" }}>
            <TextField
              label="Search by email or username"
              fullWidth
              variant="outlined"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              sx={{ whiteSpace: "nowrap" }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Search"}
            </Button>
          </div>

          <List sx={{ mt: 2 }}>
            {results.map((user) => (
              <ListItem
                key={user._id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="share"
                    onClick={() => handleShare(user._id)}
                  >
                    <ShareIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={user.username} secondary={user.email} />
              </ListItem>
            ))}
          </List>

          {/* Current Collaborators */}
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
            Current Collaborators
          </Typography>
          <List>
            {collaborators.length === 0 && (
              <ListItem key="no-collaborators">
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary">
                      No collaborators yet
                    </Typography>
                  }
                />
              </ListItem>
            )}
            {collaborators.map((user) => (
              <ListItem
                key={user._id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="remove"
                    onClick={() => handleRemove(user._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={user.username} secondary={user.email} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
    </>
  );
};

export default ShareModal;
