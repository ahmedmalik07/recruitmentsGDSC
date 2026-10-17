import Image from "next/image";
import { hosts, type HostId } from "@/content";
import { cn } from "@/lib/cn";

/** Team photo. SVG placeholders skip the optimizer; real photos get resized by next/image. */
export function HostPhoto({
  id,
  size = 40,
  className,
  priority,
}: {
  id: HostId;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const host = hosts[id];
  return (
    <Image
      src={host.photo}
      alt=""
      width={size}
      height={size}
      sizes={`${size}px`}
      unoptimized={host.photo.endsWith(".svg")}
      priority={priority}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size, boxShadow: `0 0 0 2px ${host.accent}` }}
    />
  );
}
