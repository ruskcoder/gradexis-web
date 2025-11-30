import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function pathMerge(...paths: string[]) {
  return paths
    .map((path, index) => {
      if (index === 0) return path.replace(/\/+$/g, "");
      else return path.replace(/^\/+|\/+$/g, "");
    })
    .filter((path) => path.length > 0)
    .join("/");
}