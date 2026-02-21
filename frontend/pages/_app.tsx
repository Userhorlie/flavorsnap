import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { appWithTranslation } from "next-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default appWithTranslation(App);
