import * as React from 'react'
import Box from '@mui/material/Box'
import MaterialModal from '@mui/material/Modal'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

export interface ModalProps {
  title: string
  open: boolean
  handleClose?: () => void
}

export const Modal: React.FC<ModalProps> = ({ open, handleClose, title, children }) => {
  return (
    <MaterialModal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          px: 3,
          py: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 0.5,
            marginY: 0,
            mb: 2,
          }}
        >
          <Typography variant="h4" sx={{ fontSize: '20px', fontWeight: 600 }}>
            {title}
          </Typography>
          {handleClose && (
            <IconButton edge="end" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Typography sx={{ fontSize: '15px' }}>{children}</Typography>
        </Box>
      </Box>
    </MaterialModal>
  )
}
