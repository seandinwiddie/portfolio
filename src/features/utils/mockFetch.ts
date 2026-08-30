/**
 * fetchBaseQuery calls `response.clone()`, which hand-rolled `{ json, text }`
 * literals do not provide -- mocks shaped that way made every request look like
 * a network failure. Real Response objects behave correctly.
 */
export const mockJsonFetch = (payload: unknown, status = 200) =>
  jest.fn().mockImplementation(async () =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  ) as unknown as typeof fetch;

export const mockFailedFetch = () =>
  jest.fn().mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;
