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

/**
 * Flatten a multi-group class (e.g. a Skyward semester, where assignments live
 * under `class.groups` keyed by the component terms) into the flat
 * `categories` + `scores` shape the grade views render. Each nested category
 * keeps its real stats; every assignment is placed under its own
 * group-prefixed category ("3RD - Major Grade") instead of one shared bucket.
 * Classes without `groups` (HAC, single-term Skyward) pass through unchanged.
 */
export function transformGroupsToCategories(classData: any) {
  if (!classData || !classData.groups || typeof classData.groups !== "object") {
    return classData;
  }

  const groups = classData.groups;
  const groupNames = Object.keys(groups);
  if (groupNames.length === 0) return classData;

  const multi = groupNames.length > 1;
  const categories: Record<string, any> = {};
  const scores: any[] = [];

  for (const groupName of groupNames) {
    const group = groups[groupName];
    if (!group) continue;
    const catKey = (catName: string) => (multi ? `${groupName} - ${catName}` : catName);

    if (group.categories && typeof group.categories === "object") {
      for (const [catName, catData] of Object.entries(group.categories)) {
        categories[catKey(catName)] = { ...(catData as any) };
      }
    }

    const groupScores = Array.isArray(group.scores) ? group.scores : [];
    for (const sc of groupScores) {
      const cat = catKey(sc.category || "Other");
      if (!categories[cat]) {
        categories[cat] = {
          categoryWeight: (parseFloat(group.weight) || 0).toFixed(2),
          percent: "0.000",
          studentsPoints: "0",
          maximumPoints: "0",
        };
      }
      scores.push({ ...sc, category: cat });
    }
  }

  return {
    ...classData,
    categories,
    scores: scores.length > 0 ? scores : classData.scores || [],
  };
}