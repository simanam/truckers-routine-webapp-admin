/**
 * Derives a thumbnail image URL from a Cloudinary video URL.
 *
 * Cloudinary lets you grab a frame from a video by:
 *  1. Injecting transformations (so_0 = first frame, w/h/c for sizing)
 *  2. Changing the file extension to an image format (.jpg)
 *
 * Example:
 *   Input:  https://res.cloudinary.com/xxx/video/upload/v123/folder/file.mp4
 *   Output: https://res.cloudinary.com/xxx/video/upload/so_0,w_400,h_300,c_fill,q_auto,f_auto/v123/folder/file.jpg
 */
export function getCloudinaryThumbnail(
  videoUrl: string | null | undefined,
  options?: { width?: number; height?: number }
): string | null {
  if (!videoUrl) return null;

  // Only process Cloudinary URLs
  if (!videoUrl.includes("res.cloudinary.com")) return null;

  const w = options?.width ?? 400;
  const h = options?.height ?? 300;
  const transformation = `so_0,w_${w},h_${h},c_fill,q_auto,f_auto`;

  // Pattern: .../video/upload/[optional-existing-transforms/]v1234/...
  // We insert our transformation right after "upload/"
  const uploadIndex = videoUrl.indexOf("/upload/");
  if (uploadIndex === -1) return null;

  const before = videoUrl.substring(0, uploadIndex + "/upload/".length);
  const after = videoUrl.substring(uploadIndex + "/upload/".length);

  // Replace video extension with .jpg
  const withJpg = after.replace(/\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i, ".jpg");

  return `${before}${transformation}/${withJpg}`;
}
