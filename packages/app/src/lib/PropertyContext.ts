import { Property } from '@/types'
import { createContext } from 'react'

export const PropertyContext = createContext<Property | undefined>(undefined)
