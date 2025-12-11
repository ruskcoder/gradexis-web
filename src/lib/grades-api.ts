import { LOGIN_TYPES, API_URL, API_PLATFORM_ENDPOINTS, LOGIN_ENDPOINT, PLATFORMS, CLASSES_ENDPOINT, ATTENDANCE_ENDPOINT, SCHEDULE_ENDPOINT, TRANSCRIPT_ENDPOINT, REPORT_CARD_ENDPOINT, PROGRESS_REPORT_ENDPOINT, TEACHERS_ENDPOINT } from "@/lib/constants";
import { pathMerge } from "@/lib/utils";
import { setSession, currentUser, User, getSession, useStore } from "@/lib/store"; 

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

export async function login(
  platform: Platform,
  loginType: LoginType,
  loginDetails: Record<string, string>,
  referralCode: string = ''
) {
  const session = getSession();
  let body = {
    loginType: loginType,
    loginData: loginDetails,
    options: {
      referralCode: referralCode
    },
    session: session
  }

  let endpoint = pathMerge(API_URL, API_PLATFORM_ENDPOINTS[platform], LOGIN_ENDPOINT);

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

export async function getAttendance(date?: string) {
  const user = currentUser();
  const session = getSession();
  if (!user) {
    throw new Error('No user logged in');
  }
  
  const options = { date: date || '' };
  const cacheKey = generateCacheKey(ATTENDANCE_ENDPOINT, options);
  const cachedData = getCachedValue(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  let body = {
    loginType: user.loginType,
    loginData: {
      username: user.username,
      password: user.password,
      link: user.link,
      clsession: user.clsession
    },
    options: options,
    session: session
  }

  let endpoint = pathMerge(API_URL, API_PLATFORM_ENDPOINTS[user.platform], ATTENDANCE_ENDPOINT);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok || data.success == false) {
    throw new Error(data.message || 'Failed to fetch attendance with status code ' + response.status);
  }
  if (data.session) setSession(data.session);
  
  setCachedValue(cacheKey, data);
  
  return data;
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
  
  let body = {
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

  let endpoint = pathMerge(API_URL, API_PLATFORM_ENDPOINTS[user.platform], CLASSES_ENDPOINT);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
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
        yield data;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function getSchedule() {
  const user = currentUser();
  const session = getSession();
  if (!user) {
    throw new Error('No user logged in');
  }
  
  const cacheKey = generateCacheKey(SCHEDULE_ENDPOINT, {});
  const cachedData = getCachedValue(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  let body = {
    loginType: user.loginType,
    loginData: {
      username: user.username,
      password: user.password,
      link: user.link,
      clsession: user.clsession
    },
    options: {},
    session: session
  }

  let endpoint = pathMerge(API_URL, API_PLATFORM_ENDPOINTS[user.platform], SCHEDULE_ENDPOINT);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok || data.success == false) {
    throw new Error(data.message || 'Failed to fetch schedule with status code ' + response.status);
  }
  if (data.session) setSession(data.session);
  
  setCachedValue(cacheKey, data);
  
  return data;
}

export async function getTranscript() {
  const user = currentUser();
  const session = getSession();
  if (!user) {
    throw new Error('No user logged in');
  }
  
  const cacheKey = generateCacheKey(TRANSCRIPT_ENDPOINT, {});
  const cachedData = getCachedValue(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  let body = {
    loginType: user.loginType,
    loginData: {
      username: user.username,
      password: user.password,
      link: user.link,
      clsession: user.clsession
    },
    options: {},
    session: session
  }

  let endpoint = pathMerge(API_URL, API_PLATFORM_ENDPOINTS[user.platform], TRANSCRIPT_ENDPOINT);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok || data.success == false) {
    throw new Error(data.message || 'Failed to fetch transcript with status code ' + response.status);
  }
  if (data.session) setSession(data.session);
  
  setCachedValue(cacheKey, data);
  
  return data;
}

export async function getReportCard() {
  const user = currentUser();
  const session = getSession();
  if (!user) {
    throw new Error('No user logged in');
  }
  
  const cacheKey = generateCacheKey(REPORT_CARD_ENDPOINT, {});
  const cachedData = getCachedValue(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  let body = {
    loginType: user.loginType,
    loginData: {
      username: user.username,
      password: user.password,
      link: user.link,
      clsession: user.clsession
    },
    options: {},
    session: session
  }

  let endpoint = pathMerge(API_URL, API_PLATFORM_ENDPOINTS[user.platform], REPORT_CARD_ENDPOINT);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok || data.success == false) {
    throw new Error(data.message || 'Failed to fetch report card with status code ' + response.status);
  }
  if (data.session) setSession(data.session);
  
  setCachedValue(cacheKey, data);
  
  return data;
}

export async function getProgressReport() {
  const user = currentUser();
  const session = getSession();
  if (!user) {
    throw new Error('No user logged in');
  }
  
  const cacheKey = generateCacheKey(PROGRESS_REPORT_ENDPOINT, {});
  const cachedData = getCachedValue(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  let body = {
    loginType: user.loginType,
    loginData: {
      username: user.username,
      password: user.password,
      link: user.link,
      clsession: user.clsession
    },
    options: {},
    session: session
  }

  let endpoint = pathMerge(API_URL, API_PLATFORM_ENDPOINTS[user.platform], PROGRESS_REPORT_ENDPOINT);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok || data.success == false) {
    throw new Error(data.message || 'Failed to fetch progress report with status code ' + response.status);
  }
  if (data.session) setSession(data.session);
  
  setCachedValue(cacheKey, data);
  
  return data;
}

export async function getTeachers() {
  const user = currentUser();
  const session = getSession();
  if (!user) {
    throw new Error('No user logged in');
  }
  
  const cacheKey = generateCacheKey(TEACHERS_ENDPOINT, {});
  const cachedData = getCachedValue(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  let body = {
    loginType: user.loginType,
    loginData: {
      username: user.username,
      password: user.password,
      link: user.link,
      clsession: user.clsession
    },
    options: {},
    session: session
  }

  let endpoint = pathMerge(API_URL, API_PLATFORM_ENDPOINTS[user.platform], TEACHERS_ENDPOINT);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok || data.success == false) {
    throw new Error(data.message || 'Failed to fetch teachers with status code ' + response.status);
  }
  if (data.session) setSession(data.session);
  
  setCachedValue(cacheKey, data);
  
  return data;
}