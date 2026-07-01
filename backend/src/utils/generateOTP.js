/**
 * Generate a random numeric OTP of specified length.
 *
 * Uses Math.random internally. For forgot-password / email-verification
 * flows this is sufficient because the OTP is short-lived (5 min) and
 * single-use. The 6-digit space (1 000 000 combinations) combined with
 * rate-limiting on the send-otp endpoint provides adequate protection.
 *
 * @param {number} [length=6] - Number of digits (default 6, range 1-10).
 * @returns {string} OTP string with exactly `length` digits.
 * @throws {Error} If length is not an integer between 1 and 10.
 *
 * @example
 *   generateOTP()       // → "483921"
 *   generateOTP(4)      // → "7305"
 *   generateOTP(8)      // → "61927403"
 */
export const generateOTP = (length = 6) => {
  if (typeof length !== 'number' || !Number.isInteger(length)) {
    throw new Error('OTP length must be an integer');
  }
  if (length < 1 || length > 10) {
    throw new Error('OTP length must be between 1 and 10');
  }

  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;

  return otp.toString();
};
