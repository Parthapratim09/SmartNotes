import React, { useState } from "react";
import { Paper, Typography,CircularProgress } from "@mui/material";
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import { IconButton } from "@mui/material";
import ShareModal from "./shareModel.jsx";

const NoteEditor = ({ note }) => {
  const [showModal, setShowModal] = useState(false);

  if (!note) {
    return (
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography>Loading note...</Typography>
        <CircularProgress size={24} />
      </Paper>
    );
  }

  return (
    <>
      <IconButton aria-label="share" onClick={() => setShowModal(true)}>
        <ShareOutlinedIcon />
    </IconButton>

      {showModal && (
        <ShareModal noteId={note._id} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default NoteEditor;