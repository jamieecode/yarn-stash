import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import "./lib/i18n";
import App from "./App.tsx";
import { AuthProvider } from "./auth/AuthContext";
import { ApiError } from "./lib/apiClient";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 4xx(권한/없음/요청 한도 초과)는 다시 보내도 결과가 같거나 한도만 더 깎으므로 네트워크/5xx만 한 번 재시도
      retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
