import { ActionsProvider } from '@/components/ActionsProvider'
import { ConsoleProvider } from '@/components/ConsoleProvider'
import { Playground } from '@/components/Playground'
import { PreviewProvider } from '@/components/PreviewProvider'
import { StoreProvider } from '@/components/StoreProvider'
import { ThemeProvider } from '@/components/ThemeProvider'

function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <ConsoleProvider>
          <PreviewProvider>
            <ActionsProvider>
              <Playground />
            </ActionsProvider>
          </PreviewProvider>
        </ConsoleProvider>
      </StoreProvider>
    </ThemeProvider>
  )
}

export default App
