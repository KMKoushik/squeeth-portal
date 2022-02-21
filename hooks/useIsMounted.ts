import * as React from 'react'

export const useIsMounted = () => {
  const mounted = React.useRef(false)

  React.useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  return React.useCallback(() => mounted.current, [])
}

export default useIsMounted
