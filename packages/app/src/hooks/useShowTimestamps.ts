import { useLocalStorage } from '@uidotdev/usehooks'

export function useShowTimestamps() {
  return useLocalStorage('showTimestamps', true)
}
