export const OTP_LENGTH = 6;

/** Strip everything that is not a digit and clamp to `OTP_LENGTH`. */
export function sanitizeOtpDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export type OtpGridUpdate = {
  digits: string[];
  /** Box to move focus to after the update. */
  focusIndex: number;
};

/**
 * Apply whatever landed in box `index` to the whole grid.
 *
 * One `<input>` holds several of the six boxes' worth of characters whenever the
 * code arrives in a single event - a paste, or iOS/Android SMS autofill - so the
 * value cannot be treated as one digit. The distinction that matters:
 *
 * - **More than one character** is a bulk arrival. Spread it across the grid from
 *   `index`.
 * - **Exactly one character into a box that already holds one** is the user
 *   retyping that position. Replace it in place. Distributing here would leave the
 *   old digit in place and spill the new one into the *next* box, so a correction
 *   silently shifted the rest of the code right.
 *
 * Pure, so the paste/typing/autofill rules are testable without a DOM.
 */
export function applyOtpInput(
  digits: readonly string[],
  index: number,
  incoming: string,
): OtpGridUpdate {
  const sanitized = sanitizeOtpDigits(incoming);
  const next = [...digits];

  if (sanitized.length === 0) {
    next[index] = "";
    return { digits: next, focusIndex: index };
  }

  if (sanitized.length === 1 && digits[index]) {
    next[index] = sanitized;
    // Stay put and select, so the next keystroke corrects this box again instead of
    // appending to it and re-triggering the distribution path.
    return { digits: next, focusIndex: index };
  }

  let cursor = index;
  for (const character of sanitized) {
    if (cursor >= OTP_LENGTH) break;
    next[cursor] = character;
    cursor += 1;
  }

  // Land on the first box still empty, so typing continues where the code ended.
  const firstEmpty = next.indexOf("");
  return { digits: next, focusIndex: firstEmpty === -1 ? OTP_LENGTH - 1 : firstEmpty };
}
