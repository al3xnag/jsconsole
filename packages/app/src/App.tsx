import { ActionsProvider } from '@/components/ActionsProvider'
import { Playground } from '@/components/Playground'
import { PreviewProvider } from '@/components/PreviewProvider'
import { StoreProvider } from '@/components/StoreProvider'
import { ConsoleProvider } from '@/components/ConsoleProvider'

function App() {
  return (
    <StoreProvider>
      <ConsoleProvider>
        <PreviewProvider>
          <ActionsProvider>
            <Playground />
          </ActionsProvider>
        </PreviewProvider>
      </ConsoleProvider>
    </StoreProvider>
  )
}

export default App
