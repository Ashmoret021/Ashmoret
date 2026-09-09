import { Box, Typography } from '@mui/material';
import axios from 'axios';

void axios;

export default function App() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: '#111827',
        color: 'white',
        textAlign: 'center',
      }}
    >
      <Box>
        <Box
          component="img"
          src="/react.svg"
          alt="React"
          sx={{ width: 96, height: 96, mb: 2 }}
        />
        <Typography variant="h5" component="h1" fontWeight={700}>
          React + Vite + TypeScript + MUI + Axios
        </Typography>
      </Box>
    </Box>
  );
}
