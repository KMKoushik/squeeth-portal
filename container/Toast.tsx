import { Alert, Snackbar } from '@mui/material'
import useAppStore from '../store/appStore'

const ToastMessage: React.FC = () => {
  const toastMsg = useAppStore(s => s.toast)
  const setToast = useAppStore(s => s.setToast)

  const handleClose = () => {
    setToast(null)
  }

  const color = toastMsg?.severity === 'error' ? 'error.main' : 'success.main'
  const lightColor = toastMsg?.severity === 'error' ? 'error.light' : 'success.light'

  return (
    <Snackbar
      open={!!toastMsg}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bgcolor: 'background.surface' }}
    >
      <Alert
        variant="outlined"
        onClose={handleClose}
        severity={toastMsg?.severity}
        sx={{
          width: '100%',
          bgcolor: lightColor,
          color,
          border: `1px solid ${color}`,
        }}
      >
        {toastMsg?.message}
      </Alert>
    </Snackbar>
  )
}

export default ToastMessage
