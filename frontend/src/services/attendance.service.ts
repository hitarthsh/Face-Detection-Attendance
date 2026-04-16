import api, { postMultipartWithUrlFallback } from './api';
import { mimeForPath, normalizeFileUri } from '../utils/faceUtils';

export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  checkIn: { time: string; location?: { latitude: number; longitude: number } };
  checkOut?: { time: string; location?: { latitude: number; longitude: number } };
  status: 'present' | 'late' | 'absent' | 'half_day' | 'on_leave';
  confidenceScore: number;
  workDuration: number;
}

export interface CheckInResult {
  data: AttendanceRecord;
  success: boolean;
}

const buildFormData = (imageUri: string, fileName: string, extras?: Record<string, string>) => {
  const fileUri = normalizeFileUri(imageUri);
  const mime = mimeForPath(fileUri);
  const name = mime === 'image/png' ? fileName.replace(/\.jpe?g$/i, '.png') : fileName;
  const formData = new FormData();
  formData.append('image', {
    uri: fileUri,
    type: mime,
    name,
  } as any);

  if (extras) {
    Object.entries(extras).forEach(([key, val]) => formData.append(key, val));
  }
  return formData;
};

export const attendanceService = {
  async checkIn(
    imageUri: string,
    location?: { latitude: number; longitude: number }
  ): Promise<AttendanceRecord> {
    const extras = {
      ...(location && {
        latitude: String(location.latitude),
        longitude: String(location.longitude),
      }),
    };
    const { data } = await postMultipartWithUrlFallback<{ data: AttendanceRecord }>(
      '/attendance/checkin',
      () => buildFormData(imageUri, 'checkin.jpg', extras),
      { timeout: 120000 }
    );
    return data.data;
  },

  async checkOut(
    imageUri: string,
    location?: { latitude: number; longitude: number }
  ): Promise<AttendanceRecord> {
    const extras = {
      ...(location && {
        latitude: String(location.latitude),
        longitude: String(location.longitude),
      }),
    };
    const { data } = await postMultipartWithUrlFallback<{ data: AttendanceRecord }>(
      '/attendance/checkout',
      () => buildFormData(imageUri, 'checkout.jpg', extras),
      { timeout: 120000 }
    );
    return data.data;
  },

  async getTodayAttendance(): Promise<AttendanceRecord[]> {
    const { data } = await api.get('/attendance/today');
    return data.records;
  },

  async getReport(params?: {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    department?: string;
    page?: number;
    limit?: number;
  }): Promise<{ records: AttendanceRecord[]; pagination: any; stats: any }> {
    const { data } = await api.get('/attendance/report', { params });
    return { records: data.records, pagination: data.pagination, stats: data.stats };
  },
};
