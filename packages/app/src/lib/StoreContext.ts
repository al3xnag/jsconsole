import type { Dispatch } from 'react'
import createRequiredContext from '@/lib/createRequiredContext'
import { Store, StoreReducerAction } from '@/types'

export const StoreContext = createRequiredContext<Store>()
export const StoreDispatchContext = createRequiredContext<Dispatch<StoreReducerAction>>()
