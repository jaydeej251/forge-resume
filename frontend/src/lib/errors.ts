/** Turn raw fetch/API errors into short user-facing copy. */
export function humanizeError(err: unknown, fallback = "Something went wrong"): string {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : fallback;

  const text = message.trim() || fallback;

  if (/failed to fetch|networkerror|load failed|network request failed/i.test(text)) {
    return "Can't reach the server. If the API is waking up, wait a few seconds and try again.";
  }
  if (/unauthorized/i.test(text)) {
    return "Your session expired. Sign in again, then retry.";
  }
  if (/forbidden/i.test(text)) {
    return "You don't have access to this resume. Sign in or start a new one.";
  }
  if (/conflict|already processing/i.test(text)) {
    return "Still processing the previous message. Wait a moment, then retry.";
  }
  if (/API 5\d\d/i.test(text) || /internal server error/i.test(text)) {
    return "The server hit an error. Retry in a moment.";
  }

  return text;
}
