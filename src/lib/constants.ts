export const APP_NAME = 'Gradexis';
export const PLATFORMS = ['hac', 'skyward-legacy', 'powerschool'] as const;
export const PLATFORM_MAPPING: Record<string, string> = {
    hac: 'HAC',
    'skyward-legacy': 'Skyward Legacy',
    powerschool: 'PowerSchool'
};
export const DISTRICTS_URL = '/districts.json';
// Microsoft SSO is mobile-only (it needs a WebView cookie handoff a browser SPA
// can't do), so the web app offers credentials + ClassLink only.
export const LOGIN_TYPES = ['credentials', 'classlink', 'classlinkCredentials'] as const;

// The ClassLink launchpad prefix shown before the editable part of the link
// field. Users only type their district code (e.g. `katyisd`); the full link is
// `CLASSLINK_LAUNCHPAD_BASE + code`.
export const CLASSLINK_LAUNCHPAD_BASE = 'launchpad.classlink.com/';

/** Pull the district `code` out of a ClassLink launchpad link. */
export function classlinkCodeFromLink(link: string): string {
  if (!link) return '';
  const cleaned = link
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^launchpad\.classlink\.com\//i, '')
    .replace(/^\/+/, '');
  return cleaned.split(/[/?#]/)[0]!.trim();
}
export const API_URL = import.meta.env.VITE_API_URL;
export const API_PLATFORM_ENDPOINTS: Record<typeof PLATFORMS[number], string> = {
    hac: '/hac/',
    'skyward-legacy': '/skyward-legacy/',
    powerschool: '/powerschool/'
};
export const LOGIN_ENDPOINT = '/info';
export const DISTRICTS_ENDPOINT = '/districts';
export const CLASSES_ENDPOINT = '/classes';
export const SINGLE_CLASS_ENDPOINT = '/single-class';
export const ATTENDANCE_ENDPOINT = '/attendance';
export const SCHEDULE_ENDPOINT = '/schedule';
export const BELL_SCHEDULE_ENDPOINT = '/bellSchedule';
export const TRANSCRIPT_ENDPOINT = '/transcript';
export const REPORT_CARD_ENDPOINT = '/reportCard';
export const PROGRESS_REPORT_ENDPOINT = '/ipr';
export const TEACHERS_ENDPOINT = '/teachers';
