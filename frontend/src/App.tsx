import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './adapters/router/AppRouter'
import { InstallCTA } from './adapters/ui/components/InstallCTA'

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <InstallCTA />
    </BrowserRouter>
  )
}

export default App
