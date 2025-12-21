import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PLATFORMS, CLASSES_ENDPOINT } from './constants';

type Platform = typeof PLATFORMS[number];

export interface BellSchedule {
  name: string;
  periods: Array<{
    period: number | string;
    startTime: string;
    endTime: string;
    name?: string;
  }>;
}

export interface TodoItem {
  id: string;
  title: string;
  dueDate: Date | null;
  completed: boolean;
}

export interface Shortcut {
  id: string;
  title: string;
  url: string;
  image: string;
}

export interface User {
  loginType: '' | 'credentials' | 'classlink';
  username: string;
  password: string;
  platform: Platform;
  link: string;
  clsession: string;
  name: string;
  avatar: string;
  district: string;
  school: string;
  colorTheme: string;
  theme: 'light' | 'dark';
  color: string;
  gradesView: 'card' | 'list';
  showPageTitles?: boolean;
  matchThemeWithLogo?: boolean;
  bellSchedules: BellSchedule[];
  premium: boolean;
  lastLogin: Date | null;
  courseTypesByCourseName: Record<string, string>;
  deletedTranscriptCourses: string[];
  customCourses: Array<{ courseName: string; grade: string; type: string }>;
  rankDataPoints: Array<{ gpa: number | null; rank: number | null }>;
  todos: TodoItem[];
  shortcuts: Shortcut[];
  gradesStore: {
    initialTerm: string;
    termList: string[];
    history: Record<string, Record<string, Array<{ loadedAt: number; average: any; categories: any; scores: any[] }>>>;
  };
}

const DEFAULT_USER: User = {
  loginType: '',
  username: '',
  password: '',
  platform: 'hac',
  link: '',
  clsession: '',
  name: '',
  avatar: '',
  district: '',
  school: '',
  colorTheme: 'default',
  theme: 'light',
  color: 'blue',
  gradesView: 'list',
  showPageTitles: true,
  matchThemeWithLogo: false,
  bellSchedules: [],
  premium: false,
  lastLogin: null,
  courseTypesByCourseName: {},
  deletedTranscriptCourses: [],
  customCourses: [],
  rankDataPoints: [
    { gpa: null, rank: null },
    { gpa: null, rank: null }
  ],
  todos: [],
  shortcuts: [],
  gradesStore: {
    initialTerm: '',
    termList: [],
    history: {},
  },
};

interface Session {
  loginTime?: number;
  lastActivity?: number;
  [key: string]: any;
}

interface UserStore {
  users: User[];
  currentUserIndex: number;
  session: Session;
  cache: Record<string, any>;
  cacheTimestamp?: number | null;

  currentUser: () => User | null;

  setUsers: (users: User[]) => void;
  setCurrentUserIndex: (index: number) => void;
  addUser: (user?: Partial<User>) => void;
  removeUser: (index: number) => void;
  changeUserData: (key: keyof User, value: any) => void;
  setSession: (session: Partial<Session>) => void;
  getCacheValue: (key: string) => any;
  setCacheValue: (key: string, value: any) => void;
  clearCache: () => void;
  addTodo: (todo: Omit<TodoItem, 'id'>) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  removeTodo: (id: string) => void;
  toggleTodoComplete: (id: string) => void;
  addShortcut: (shortcut: Omit<Shortcut, 'id'>) => void;
  updateShortcut: (id: string, updates: Partial<Shortcut>) => void;
  removeShortcut: (id: string) => void;
  addGradesStore: (initialTerm: string, termList: string[], term: string, classes: any[]) => void;
  addGradesStoreLoad: (term: string, classes: any[]) => void;
  updateLatestGradesLoadTime: (term: string) => void;
  getGradesStore: () => {
    initialTerm: string;
    termList: string[];
    history: Record<string, Array<{ loadedAt: number; classes: any[] }>>;
  };
  clearGradesStore: () => void;
}

export const useStore = create<UserStore>()(
  persist(
    (set, get) => ({
      users: [],
      currentUserIndex: -1,
      session: {},
      cache: {},
      cacheTimestamp: null,

      currentUser: (): User | null => {
        const { users, currentUserIndex } = get();
        if (users.length === 0 || currentUserIndex < 0 || currentUserIndex >= users.length) {
          return null;
        }
        return users[currentUserIndex]!;
      },

      setUsers: (users: User[]) => {
        set({ users });
      },

      setCurrentUserIndex: (index: number) => {
        set({ currentUserIndex: index });
      },

      addUser: (user?: Partial<User>) => {
        set((state) => ({
          users: [...state.users, { ...DEFAULT_USER, ...user }],
        }));
      },

      removeUser: (index: number) => {
        set((state) => {
          const newUsers = state.users.filter((_, i) => i !== index);
          let newIndex = state.currentUserIndex;

          if (newIndex >= newUsers.length) {
            newIndex = newUsers.length - 1;
          }

          return {
            users: newUsers,
            currentUserIndex: newIndex,
          };
        });
      },

      changeUserData: (key: keyof User, value: any) => {
        set((state) => {
          const newUsers = [...state.users];
          if (newUsers[state.currentUserIndex]) {
            newUsers[state.currentUserIndex] = {
              ...newUsers[state.currentUserIndex],
              [key]: value,
            } as User;
          }
          return { users: newUsers };
        });
      },

      setSession: (session: Partial<Session>) => {
        set((state) => ({
          session: { ...state.session, ...session },
        }));
      },

      getCacheValue: (key: string) => {
        return get().cache[key];
      },

      setCacheValue: (key: string, value: any) => {
        set((state) => ({
          cache: { ...state.cache, [key]: value },
          cacheTimestamp: Date.now(),
        }));
      },

      clearCache: () => {
        set({ cache: {}, cacheTimestamp: null });
      },

      addTodo: (todo: Omit<TodoItem, 'id'>) => {
        set((state) => {
          const newUsers = [...state.users];
          if (newUsers[state.currentUserIndex]) {
            const id = Math.random().toString(36).substr(2, 9);
            const currentUser = newUsers[state.currentUserIndex]!;
            newUsers[state.currentUserIndex] = {
              ...currentUser,
              todos: [...(currentUser.todos || []), { ...todo, id }],
            } as User;
          }
          return { users: newUsers };
        });
      },

      updateTodo: (id: string, updates: Partial<TodoItem>) => {
        set((state) => {
          const newUsers = [...state.users];
          if (newUsers[state.currentUserIndex]) {
            const currentUser = newUsers[state.currentUserIndex]!;
            newUsers[state.currentUserIndex] = {
              ...currentUser,
              todos: (currentUser.todos || []).map((todo) =>
                todo.id === id ? { ...todo, ...updates } : todo
              ),
            } as User;
          }
          return { users: newUsers };
        });
      },

      removeTodo: (id: string) => {
        set((state) => {
          const newUsers = [...state.users];
          if (newUsers[state.currentUserIndex]) {
            const currentUser = newUsers[state.currentUserIndex]!;
            newUsers[state.currentUserIndex] = {
              ...currentUser,
              todos: (currentUser.todos || []).filter((todo) => todo.id !== id),
            } as User;
          }
          return { users: newUsers };
        });
      },

      toggleTodoComplete: (id: string) => {
        set((state) => {
          const newUsers = [...state.users];
          if (newUsers[state.currentUserIndex]) {
            const currentUser = newUsers[state.currentUserIndex]!;
            newUsers[state.currentUserIndex] = {
              ...currentUser,
              todos: (currentUser.todos || []).map((todo) =>
                todo.id === id ? { ...todo, completed: !todo.completed } : todo
              ),
            } as User;
          }
          return { users: newUsers };
        });
      },

      addShortcut: (shortcut: Omit<Shortcut, 'id'>) => {
        set((state) => {
          const newUsers = [...state.users];
          if (newUsers[state.currentUserIndex]) {
            const id = Math.random().toString(36).substr(2, 9);
            const currentUser = newUsers[state.currentUserIndex]!;
            newUsers[state.currentUserIndex] = {
              ...currentUser,
              shortcuts: [...(currentUser.shortcuts || []), { ...shortcut, id }],
            } as User;
          }
          return { users: newUsers };
        });
      },

      updateShortcut: (id: string, updates: Partial<Shortcut>) => {
        set((state) => {
          const newUsers = [...state.users];
          if (newUsers[state.currentUserIndex]) {
            const currentUser = newUsers[state.currentUserIndex]!;
            newUsers[state.currentUserIndex] = {
              ...currentUser,
              shortcuts: (currentUser.shortcuts || []).map((shortcut) =>
                shortcut.id === id ? { ...shortcut, ...updates } : shortcut
              ),
            } as User;
          }
          return { users: newUsers };
        });
      },

      removeShortcut: (id: string) => {
        set((state) => {
          const newUsers = [...state.users];
          if (newUsers[state.currentUserIndex]) {
            const currentUser = newUsers[state.currentUserIndex]!;
            newUsers[state.currentUserIndex] = {
              ...currentUser,
              shortcuts: (currentUser.shortcuts || []).filter((shortcut) => shortcut.id !== id),
            } as User;
          }
          return { users: newUsers };
        });
      },

      addGradesStore: (initialTerm: string, termList: string[], term: string, classes: any[]) => {
        set((state) => {
          const newUsers = [...state.users];
          if (newUsers[state.currentUserIndex]) {
            const currentUser = newUsers[state.currentUserIndex]!;
            const newHistory = { ...currentUser.gradesStore.history };
            if (!newHistory[term]) {
              newHistory[term] = {};
            } else {
              newHistory[term] = { ...newHistory[term] };
            }

            for (const classData of classes) {
              const courseKey = `${classData.course}|${classData.name}`;
              if (!newHistory[term][courseKey]) {
                newHistory[term][courseKey] = [];
              } else {
                newHistory[term][courseKey] = [...newHistory[term][courseKey]];
              }

              const courseHistory = newHistory[term][courseKey];
              if (courseHistory && courseHistory.length > 0) {
                const latestEntry = courseHistory[courseHistory.length - 1];
                if (
                  latestEntry &&
                  JSON.stringify(latestEntry.average) === JSON.stringify(classData.average) &&
                  JSON.stringify(latestEntry.categories) === JSON.stringify(classData.categories) &&
                  JSON.stringify(latestEntry.scores) === JSON.stringify(classData.scores)
                ) {

                  courseHistory[courseHistory.length - 1] = {
                    loadedAt: Date.now(),
                    average: classData.average,
                    categories: classData.categories,
                    scores: classData.scores,
                  };
                  continue;
                }
              }

              if (courseHistory) {
                courseHistory.push({
                  loadedAt: Date.now(),
                  average: classData.average,
                  categories: classData.categories,
                  scores: classData.scores,
                });
              }
            }

            newUsers[state.currentUserIndex] = {
              ...currentUser,
              gradesStore: {
                initialTerm,
                termList,
                history: newHistory,
              },
            } as User;
          }
          return { users: newUsers };
        });
      },

      addGradesStoreLoad: (term: string, classes: any[]) => {
        set((state) => {
          const newUsers = [...state.users];
          if (newUsers[state.currentUserIndex]) {
            const currentUser = newUsers[state.currentUserIndex]!;
            const newHistory = { ...currentUser.gradesStore.history };
            if (!newHistory[term]) {
              newHistory[term] = {};
            } else {
              newHistory[term] = { ...newHistory[term] };
            }

            for (const classData of classes) {
              const courseKey = `${classData.course}|${classData.name}`;
              if (!newHistory[term][courseKey]) {
                newHistory[term][courseKey] = [];
              } else {
                newHistory[term][courseKey] = [...newHistory[term][courseKey]];
              }

              const courseHistory = newHistory[term][courseKey];
              if (courseHistory && courseHistory.length > 0) {
                const latestEntry = courseHistory[courseHistory.length - 1];

                if (
                  latestEntry &&
                  JSON.stringify(latestEntry.average) === JSON.stringify(classData.average) &&
                  JSON.stringify(latestEntry.categories) === JSON.stringify(classData.categories) &&
                  JSON.stringify(latestEntry.scores) === JSON.stringify(classData.scores)
                ) {

                  courseHistory[courseHistory.length - 1] = {
                    loadedAt: Date.now(),
                    average: classData.average,
                    categories: classData.categories,
                    scores: classData.scores,
                  };
                  continue;
                }
              }

              if (courseHistory) {
                courseHistory.push({
                  loadedAt: Date.now(),
                  average: classData.average,
                  categories: classData.categories,
                  scores: classData.scores,
                });
              }
            }

            newUsers[state.currentUserIndex] = {
              ...currentUser,
              gradesStore: {
                ...currentUser.gradesStore,
                history: newHistory,
              },
            } as User;
          }
          return { users: newUsers };
        });
      },

      updateLatestGradesLoadTime: (term: string) => {
        set((state) => {
          const newUsers = [...state.users];
          if (newUsers[state.currentUserIndex]) {
            const currentUser = newUsers[state.currentUserIndex]!;
            const newHistory = { ...currentUser.gradesStore.history };
            if (newHistory[term]) {
              newHistory[term] = { ...newHistory[term] };

              for (const courseKey in newHistory[term]) {
                const courseHistory = newHistory[term][courseKey];
                if (courseHistory && courseHistory.length > 0) {
                  const latestEntry = courseHistory[courseHistory.length - 1];
                  if (latestEntry) {
                    courseHistory[courseHistory.length - 1] = {
                      loadedAt: Date.now(),
                      average: latestEntry.average,
                      categories: latestEntry.categories,
                      scores: latestEntry.scores,
                    };
                  }
                }
              }
              newUsers[state.currentUserIndex] = {
                ...currentUser,
                gradesStore: {
                  ...currentUser.gradesStore,
                  history: newHistory,
                },
              } as User;
            }
          }
          return { users: newUsers };
        });
      },

      getGradesStore: () => {
        const { users, currentUserIndex } = get();
        if (users.length === 0 || currentUserIndex < 0 || currentUserIndex >= users.length) {
          return {
            initialTerm: '',
            termList: [],
            history: {} as Record<string, Array<{ loadedAt: number; classes: any[] }>>,
          };
        }
        const store = users[currentUserIndex]?.gradesStore;
        if (!store) {
          return {
            initialTerm: '',
            termList: [],
            history: {} as Record<string, Array<{ loadedAt: number; classes: any[] }>>,
          };
        }
        return {
          initialTerm: store.initialTerm,
          termList: store.termList,
          history: store.history as unknown as Record<string, Array<{ loadedAt: number; classes: any[] }>>,
        };
      },

      clearGradesStore: () => {
        set((state) => {
          const newUsers = [...state.users];
          if (newUsers[state.currentUserIndex]) {
            const currentUser = newUsers[state.currentUserIndex]!;
            newUsers[state.currentUserIndex] = {
              ...currentUser,
              gradesStore: {
                initialTerm: '',
                termList: [],
                history: {},
              },
            } as User;
          }
          return { users: newUsers };
        });
      },
    }),
    {
      name: 'user-store', 
      partialize: (state) => ({
        users: state.users,
        currentUserIndex: state.currentUserIndex,
      }),
      onRehydrateStorage: () => (persistedState) => {
        try {
          if (!persistedState || !Array.isArray(persistedState.users)) return

          const mergedUsers = persistedState.users.map((u: Partial<User>) => {
            return {
              ...DEFAULT_USER,
              ...u,
            } as User
          })

          let idx = -1
          const rawIdx: any = (persistedState as any).currentUserIndex
          if (typeof rawIdx === 'number') {
            idx = rawIdx
          } else if (typeof rawIdx === 'string' && rawIdx.trim() !== '') {
            const parsed = parseInt(rawIdx, 10)
            if (!isNaN(parsed)) idx = parsed
          }

          if (idx >= mergedUsers.length) {
            idx = mergedUsers.length - 1
          }
          if (idx < -1) {
            idx = -1
          }

          ;(persistedState as any).users = mergedUsers
          ;(persistedState as any).currentUserIndex = idx
        } catch (e) {
          console.error(e)
        }
      },
    }
  )
);

export const useCurrentUser = () => {
  return useStore((state) => {
    const { users, currentUserIndex } = state;
    if (users.length === 0 || currentUserIndex < 0 || currentUserIndex >= users.length) return null;
    return users[currentUserIndex];
  });
};

export const currentUser = () => {
  return useStore.getState().currentUser();
};

export const getSession = () => {
  return useStore.getState().session;
};

export const setSession = (session: Partial<Session>) => {
  useStore.getState().setSession(session);
};

