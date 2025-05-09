import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router"
import GoogleMapLoader from "./Hooks/utils/GoogleMapLoader.jsx"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
})

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
