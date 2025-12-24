import hacDistricts from '@/lib/hac-districts.json';
export const APP_NAME = 'Gradexis';
export const PLATFORMS = ['hac'] as const;
export const PLATFORM_MAPPING: Record<string, string> = {
    hac: 'HAC'
};
export const districts = [...hacDistricts];
export const LOGIN_TYPES = ['credentials', 'classlink'] as const;
export const API_URL = 'https://api.gradexis.app/';
export const API_PLATFORM_ENDPOINTS: Record<typeof PLATFORMS[number], string> = {hac: '/v2/hac/'};
export const LOGIN_ENDPOINT = '/info';
export const CLASSES_ENDPOINT = '/classes';
export const ATTENDANCE_ENDPOINT = '/attendance';
export const SCHEDULE_ENDPOINT = '/schedule';
export const TRANSCRIPT_ENDPOINT = '/transcript';
export const REPORT_CARD_ENDPOINT = '/reportCard';
export const PROGRESS_REPORT_ENDPOINT = '/ipr';
export const TEACHERS_ENDPOINT = '/teachers';
