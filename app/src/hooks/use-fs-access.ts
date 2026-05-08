import { useEffect, useState } from 'react'

export function useFsAccessSupport() {
  const [supported, setSupported] = useState(false)
  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'showDirectoryPicker' in window)
  }, [])
  return supported
}
