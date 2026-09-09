import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
} from "@mui/material";

const pages = [
  {
    title: "Welcome",
    content: "Welcome to the setup wizard. Let's get you started.",
  },
  {
    title: "Configure",
    content: "Configure your preferences before continuing.",
  },
  {
    title: "Complete",
    content: "Everything is ready. Click Finish to complete the setup.",
  },
];

export const AddScenerioModal =() => {
    const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);

  const handleNext = () => {
    if (page < pages.length - 1) {
      setPage((current) => current + 1);
    } else {
      setOpen(false);
      setPage(0);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPage(0);
  };

  const progress = ((page + 1) / pages.length) * 100;

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)} sx={{zIndex: 10000, bgcolor: "black"}}>
        יצירת תרחיש
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {pages[page].title}
        </DialogTitle>

        <LinearProgress
          variant="determinate"
          value={progress}
        />

        <DialogContent sx={{ py: 5 }}>
          <Box
            sx={{
              minHeight: 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <Box>
              <Typography variant="h5" gutterBottom>
                {pages[page].title}
              </Typography>

              <Typography color="text.secondary">
                {pages[page].content}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleNext}
          >
            {page === pages.length - 1 ? "Finish" : "Next"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}