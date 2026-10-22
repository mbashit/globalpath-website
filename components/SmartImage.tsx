import Image, { type ImageProps } from "next/image";

/**
 * next/image wrapper. SVG placeholders are served unoptimised; once you
 * swap them for JPG/WebP photos, Next.js optimises them automatically.
 */
export function SmartImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  return <Image {...props} unoptimized={src.endsWith(".svg") || props.unoptimized} />;
}
