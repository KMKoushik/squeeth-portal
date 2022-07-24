// Lol. Used to show toast message

import { useCallback } from 'react'
import useAppStore from '../store/appStore'

const useToaster = () => {
  const setToast = useAppStore(s => s.setToast)

  const showMessageFromServer = useCallback(
    async (res: Response) => {
      const { message } = await res.json()
      setToast({
        message,
        severity: res.status === 200 ? 'success' : 'error',
      })
    },
    [setToast],
  )

  return showMessageFromServer
}

export default useToaster
