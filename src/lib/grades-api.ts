import { LOGIN_TYPES, API_URL, API_PLATFORM_ENDPOINTS, LOGIN_ENDPOINT, PLATFORMS, CLASSES_ENDPOINT, ATTENDANCE_ENDPOINT, SCHEDULE_ENDPOINT, TRANSCRIPT_ENDPOINT, REPORT_CARD_ENDPOINT, PROGRESS_REPORT_ENDPOINT, TEACHERS_ENDPOINT } from "@/lib/constants";
import { pathMerge } from "@/lib/utils";
import { setSession, currentUser, getSession, useStore } from "@/lib/store";
import { initializeGradesStore, addGradesLoad } from "@/lib/grades-store";

type Platform = typeof PLATFORMS[number];
type LoginType = typeof LOGIN_TYPES[number];

function generateCacheKey(endpoint: string, options: Record<string, any> = {}): string {
  const optionsStr = Object.keys(options).length > 0 ? JSON.stringify(options) : 'no-options';
  return `${endpoint}:${optionsStr}`;
}

function getCachedValue(key: string): any {
  return useStore.getState().getCacheValue(key);
}

function setCachedValue(key: string, value: any): void {
  useStore.getState().setCacheValue(key, value);
}

/**
 * Handles authentication errors by redirecting to login with username prefilled
 * Keeps user data intact, only requires password update
 */
function handleAuthError(response: Response, data: any, user: any): void {
  const isAuthError = response.status === 401 || 
    data?.message?.includes('Invalid') ||
    data?.message?.includes('password') ||
    data?.message?.includes('Session');

  if (isAuthError && user?.username) {
    // Keep user in store, just redirect to login to update password
    const params = new URLSearchParams();
    params.set('username', user.username);
    params.set('reason', 'password_expired');
    if (user.district) params.set('district', user.district);
    if (user.link) params.set('link', user.link);
    if (user.platform) params.set('platform', user.platform);
    if (user.loginType) params.set('loginType', user.loginType);
    
    const loginUrl = `/login?${params.toString()}`;
    window.location.href = loginUrl;
    
    throw new Error('Password expired - redirecting to login');
  }
}

export async function login(
  platform: Platform,
  loginType: LoginType,
  loginDetails: Record<string, string>,
  referralCode: string = ''
) {
  const session = getSession();
  const body = {
    loginType: loginType,
    loginData: loginDetails,
    options: {
      referralCode: referralCode
    },
    session: session
  }

  const endpoint = pathMerge(API_URL, API_PLATFORM_ENDPOINTS[platform], LOGIN_ENDPOINT);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok || data.success == false) {
    throw new Error(data.message || 'Login failed with status code ' + response.status);
  }
  if (data.session) setSession(data.session);
  return data;
}

/**
 * The shared body of every non-streaming, authenticated data fetch: check the
 * cache, POST `{ loginType, loginData, options, session }`, run the auth-error
 * handler (redirect to /login) on failure, persist the refreshed session,
 * cache, and return. The endpoints differ only in their path and `options`.
 */
async function fetchEndpoint(
  endpoint: string,
  label: string,
  options: Record<string, any> = {}
) {
  const user = currentUser();
  if (!user) {
    throw new Error('No user logged in');
  }

  const cacheKey = generateCacheKey(endpoint, options);
  const cachedData = getCachedValue(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const body = {
    loginType: user.loginType,
    loginData: {
      username: user.username,
      password: user.password,
      link: user.link,
      clsession: user.clsession
    },
    options,
    session: getSession()
  };

  const url = pathMerge(API_URL, API_PLATFORM_ENDPOINTS[user.platform], endpoint);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok || data.success == false) {
    handleAuthError(response, data, user);
    throw new Error(data.message || `Failed to fetch ${label} with status code ${response.status}`);
  }
  if (data.session) setSession(data.session);

  setCachedValue(cacheKey, data);

  return data;
}

export function getAttendance(date?: string) {
  return fetchEndpoint(ATTENDANCE_ENDPOINT, 'attendance', { date: date || '' });
}

export async function* getClasses(term?: string) {
  const user = currentUser();
  const session = getSession();
  if (!user) {
    throw new Error('No user logged in');
  }

  const options = { term: term || '' };
  const cacheKey = generateCacheKey(CLASSES_ENDPOINT, options);

  const cachedData = getCachedValue(cacheKey);
  if (cachedData) {
    yield cachedData;
    return;
  }

  const body = {
    loginType: user.loginType,
    loginData: {
      username: user.username,
      password: user.password,
      link: user.link,
      clsession: user.clsession
    },
    options: options,
    session: session,
    stream: true
  }

  const endpoint = pathMerge(API_URL, API_PLATFORM_ENDPOINTS[user.platform], CLASSES_ENDPOINT);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    handleAuthError(response, { message: 'Failed to fetch classes' }, user);
    throw new Error('Failed to fetch classes with status code ' + response.status);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (value) {
        buffer += decoder.decode(value, { stream: true });
      }
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';
      for (const chunk of chunks) {
        if (chunk.trim()) {
          const data = JSON.parse(chunk);

          if (data.percent !== undefined && data.message !== undefined) {
            yield {
              percent: data.percent,
              message: data.message
            };
          }

          if (data.success === true) {
            if (data.session) setSession(data.session);
            setCachedValue(cacheKey, data);

            if (term) {
              addGradesLoad(term, data.classes);
            } else {
              initializeGradesStore(data.term, data.termList, data.term, data.classes);
            }

            yield data;
            return;
          }
        }
      }
      if (done) break;
    }

    if (buffer.trim()) {
      const data = JSON.parse(buffer);
      if (data.success === true) {
        if (data.session) setSession(data.session);
        setCachedValue(cacheKey, data);

        if (term) {

          addGradesLoad(term, data.classes);
        } else {

          initializeGradesStore(data.term, data.termList, data.term, data.classes);
        }

        yield data;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function getSchedule() {
  return fetchEndpoint(SCHEDULE_ENDPOINT, 'schedule');
}

export function getTranscript() {
  return fetchEndpoint(TRANSCRIPT_ENDPOINT, 'transcript');
}

export function getReportCard() {
  return fetchEndpoint(REPORT_CARD_ENDPOINT, 'report card');
}

export function getProgressReport() {
  return fetchEndpoint(PROGRESS_REPORT_ENDPOINT, 'progress report');
}

export function getTeachers() {
  return fetchEndpoint(TEACHERS_ENDPOINT, 'teachers');
}