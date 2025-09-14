import createRequiredContext from '@/lib/createRequiredContext'
import { Globals } from '@/types'
import { Metadata, SideEffectInfo } from '@jsconsole/interpreter'

export type ValueContext = {
  globals: Globals
  metadata: Metadata
  sideEffectInfo: SideEffectInfo
}

export const ValueContextContext = createRequiredContext<ValueContext>()
