import { useStore } from './store';

export interface GradesLoad {
  loadedAt: number;
  classes: any[];
}

export interface GradesStore {
  initialTerm: string;
  termList: string[];
  history: Record<string, GradesLoad[]>;
}

export function initializeGradesStore(
  initialTerm: string,
  termList: string[],
  term: string,
  classes: any[]
): void {
  useStore.getState().addGradesStore(initialTerm, termList, term, classes);
}

export function addGradesLoad(term: string, classes: any[]): void {
  const gradesStore = useStore.getState().getGradesStore();
  const termHistory = gradesStore.history[term];

  if (termHistory && termHistory.length > 0) {
    const latestLoad = termHistory[termHistory.length - 1];
    if (classesAreEqual(latestLoad.classes, classes)) {

      useStore.getState().updateLatestGradesLoadTime(term);
      return;
    }
  }

  useStore.getState().addGradesStoreLoad(term, classes);
}

function classesAreEqual(classes1: any[], classes2: any[]): boolean {
  if (classes1.length !== classes2.length) {
    return false;
  }
  return JSON.stringify(classes1) === JSON.stringify(classes2);
}

export function getLatestGradesLoad(term: string): GradesLoad | null {
  const gradesStore = useStore.getState().getGradesStore();
  const termHistory = gradesStore.history[term];

  if (!termHistory || termHistory.length === 0) {
    return null;
  }

  const latestLoad = termHistory[termHistory.length - 1];
  return latestLoad ?? null;
}

export function getGradesLoadHistory(term: string): GradesLoad[] {
  const gradesStore = useStore.getState().getGradesStore();
  return gradesStore.history[term] || [];
}

export function hasStorageData(term: string): boolean {
  const gradesStore = useStore.getState().getGradesStore();
  const termHistory = gradesStore.history[term];
  return !!(termHistory && termHistory.length > 0);
}

export function getInitialTerm(): string {
  const gradesStore = useStore.getState().getGradesStore();
  return gradesStore.initialTerm;
}

export function getTermList(): string[] {
  const gradesStore = useStore.getState().getGradesStore();
  return gradesStore.termList;
}

export function getGradesStore(): GradesStore {
  return useStore.getState().getGradesStore();
}

export function clearGradesStore(): void {
  useStore.getState().clearGradesStore();
}

export function updateLatestGradesLoadTime(term: string): void {
  useStore.getState().updateLatestGradesLoadTime(term);
}

