import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { appWithTranslation } from "next-i18next";

function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}

export default appWithTranslation(App);
