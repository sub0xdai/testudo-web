import "./App.css";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Trade } from "./pages/Trade";
import { Toaster } from "sonner";
import { TradesProvider } from "./state/TradesProvider";
import { Analytics } from "@vercel/analytics/react";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <TradesProvider>
        <Analytics />
        <Toaster
          closeButton
          theme="dark"
          className="pointer-events-auto"
          position="top-right"
          richColors
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a1a',
              border: '1px solid #262626',
            },
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/trade/:market" element={<Trade />} />
            <Route path="*" element={<Navigate to="/trade/SOL_USDC" />} />
          </Routes>
        </BrowserRouter>
      </TradesProvider>
    </ErrorBoundary>
  );
}

export default App;
