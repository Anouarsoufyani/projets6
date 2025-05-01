import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router"
// Vérifiez que le GoogleMapLoader est correctement importé
import GoogleMapLoader from "./Hooks/utils/GoogleMapLoader.jsx"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

// Et qu'il est correctement utilisé dans le rendu
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <GoogleMapLoader>
          <App />
        </GoogleMapLoader>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
