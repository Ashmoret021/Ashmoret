import { Fab } from '@mui/material';

interface TemporaryAddButtonProps {
  onClick: () => void;
}

export function TemporaryAddButton({ onClick }: TemporaryAddButtonProps) {
  return (
    <Fab
      aria-label="יצירת התקפה"
      onClick={onClick}
      sx={{
        position: 'fixed',
        top: 22,
        right: 22,
        width: 58,
        height: 58,
        fontSize: '2rem',
        zIndex: 1300,
        color: '#ffffff',
        boxShadow: '0 12px 24px rgba(135, 53, 53, 0.35)',
        background: 'linear-gradient(135deg, #873535 0%, #a74444 100%)',
        '&:hover': {
          background: 'linear-gradient(135deg, #732d2d 0%, #873535 100%)',
        },
      }}
    >
      +
    </Fab>
  );
}