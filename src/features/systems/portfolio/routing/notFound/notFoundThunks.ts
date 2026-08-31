import { useCallback } from 'react'
import { useRouter } from 'expo-router'
import type { NotFoundViewProps } from './notFoundSelectors'

export const useNotFoundRoute = (): NotFoundViewProps => {
  const router = useRouter()
  const onReturn = useCallback(() => router.replace('/'), [router])

  return { onReturn }
}
