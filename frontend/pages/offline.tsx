import React from 'react';
import Head from 'next/head';

export default function Offline() {
  return (
    <>
      <Head>
        <title>Offline - FlavorSnap</title>
        <meta name="description" content="You are currently offline" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-md rounded-lg bg-white p-6 text-center shadow-lg sm:p-8">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-10 w-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">You're Offline</h1>
            <p className="mb-6 text-gray-600">
              It looks like you've lost your internet connection. Some features may not be available until you're back online.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="mb-2 font-semibold text-amber-800">Available Offline:</h3>
              <ul className="space-y-1 text-sm text-amber-700">
                <li>- Previously viewed food images</li>
                <li>- Cached nutrition data</li>
                <li>- App settings and preferences</li>
              </ul>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="min-h-[44px] w-full rounded-lg bg-amber-600 px-4 py-3 font-medium text-white transition duration-200 hover:bg-amber-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
