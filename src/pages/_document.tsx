import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="cs">
        <Head>
          {/* Google Search Console verification */}
          <meta
            name="google-site-verification"
            content="RgLW13GtoNfsDQadebwkaN6g1GLccMHYOnnjR_6F9jA"
          />

          {/* Google Fonts – Poppins + Orbitron */}
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Poppins:wght@300;400;600;700&display=swap"
            rel="stylesheet"
          />

          <meta name="theme-color" content="#7B4DFF" />
          <meta
            name="description"
            content="Tvořím moderní webové aplikace. Od nápadu po hotový produkt."
          />

          <link rel="icon" href="/favicon.ico?v=7" sizes="any" />
          <link rel="shortcut icon" href="/favicon.ico?v=7" type="image/x-icon" />
        </Head>
        <body className="bg-bg text-gray-100">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
