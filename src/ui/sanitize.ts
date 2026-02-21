/**
 * Sanitize untrusted text for terminal rendering.
 * Removes ANSI escapes and control characters that can alter terminal state.
 */
export function sanitizeTerminalText(text: string): string {
  let stripped = "";

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code !== 27) {
      stripped += text[i] ?? "";
      continue;
    }

    const next = text[i + 1] ?? "";

    // ANSI CSI: ESC [ ... final-byte
    if (next === "[") {
      i += 2;
      while (i < text.length) {
        const byte = text.charCodeAt(i);
        if (byte >= 64 && byte <= 126) {
          break;
        }
        i++;
      }
      continue;
    }

    // ANSI OSC: ESC ] ... BEL or ESC \
    if (next === "]") {
      i += 2;
      while (i < text.length) {
        const byte = text.charCodeAt(i);
        if (byte === 7) {
          break;
        }
        if (byte === 27 && text[i + 1] === "\\") {
          i++;
          break;
        }
        i++;
      }
    }
  }

  let sanitized = "";
  for (let i = 0; i < stripped.length; i++) {
    const code = stripped.charCodeAt(i);
    // Keep tab/newline/carriage return, strip other ASCII control chars.
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      continue;
    }
    if (code === 127) {
      continue;
    }
    sanitized += stripped[i] ?? "";
  }

  return sanitized;
}
