import { AppRouter } from './app/router'
import { Toaster } from './components/ui/toast'

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  )
}
