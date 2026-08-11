import { waitUntil as vercelWaitUntil } from "@vercel/functions";

/**
 * Run work after the response has been sent, without the caller waiting on it.
 *
 * Payment providers abort and flag the integration as broken if we do not
 * respond quickly (Paymob's limit is 5 seconds), but the work still has to
 * finish — on Vercel a bare floating promise is killed the moment the lambda is
 * frozen after responding.
 *
 * `waitUntil` is a Vercel runtime primitive. Outside that runtime (local `next
 * dev`, tests) it is unavailable, so fall back to letting the promise run
 * normally; there is no freeze to race against there.
 */
export function runAfterResponse(promise: Promise<unknown>): void {
  const safe = Promise.resolve(promise).catch((err) => {
    console.error(
      "[background] task failed:",
      err instanceof Error ? err.message : err,
    );
  });

  try {
    vercelWaitUntil(safe);
  } catch {
    void safe;
  }
}
