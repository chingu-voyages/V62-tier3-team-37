/**
 * Fallback for the implicit `children` slot. Without it, a hard navigation
 * where the active children state cannot be recovered renders a 404.
 */
export default function ProfileDefault() {
  return null;
}
