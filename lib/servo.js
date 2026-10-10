/* Servo pose for the capabilities strip: how far a shape tilts toward the
   pointer, and which way its sensor pupil looks. dx/dy run from the shape's
   centre to the pointer in screen coordinates (y grows down). The tilt mirrors
   instead of swinging round when the pointer is behind the shape, and never
   exceeds maxDeg (the --look-max token). */
export function servoPose(dx, dy, maxDeg) {
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return { tilt: 0, ux: 0, uy: 0 };
  const angle = (Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI;
  const tilt = Math.max(-maxDeg, Math.min(maxDeg, angle));
  return { tilt: tilt === 0 ? 0 : tilt, ux: dx / distance, uy: dy / distance };
}
