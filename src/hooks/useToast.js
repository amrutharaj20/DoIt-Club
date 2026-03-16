import { useState, useCallback } from 'react'

export function useToast() {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)

  const toast = useCallback((msg) => {
    setMessage(msg)
    setVisible(true)
    setTimeout(() => setVisible(false), 3000)
  }, [])

  return { toast, message, visible }
}
