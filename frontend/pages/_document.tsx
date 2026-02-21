import { Html, Head, Main, NextScript } from "next/document";
import type { DocumentProps } from "next/document";

const rtlLocales = ["ar"];

export default function Document(props: DocumentProps) {
  const locale = props.__NEXT_DATA__?.locale || "en";
  const dir = rtlLocales.includes(locale) ? "rtl" : "ltr";

  return (
    <Html lang={locale} dir={dir}>
      <Head />
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
