import { Platform } from 'react-native';
import { postMultipartWithUrlFallback } from '../services/api';

export function normalizeFileUri(uri: string): string {
  let u = String(uri || '').trim();
  if (u.startsWith('file://file://')) {
    u = `file://${u.slice('file://file://'.length)}`;
  }
  if (Platform.OS === 'android' && u.startsWith('/') && !u.startsWith('file:')) {
    u = `file://${u}`;
  }
  return u;
}

export function mimeForPath(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

/**
 * Upload a face image to generate registration embedding
 */
export const registerFaceEmbedding = async (
  employeeId: string,
  imageUri: string
): Promise<{ captureCount: number }> => {
  const normalizedEmployeeId = String(employeeId || '').trim().toUpperCase();
  const fileUri = normalizeFileUri(imageUri);
  const mime = mimeForPath(fileUri);

  const buildFormData = () => {
    const formData = new FormData();
    formData.append('employeeId', normalizedEmployeeId);
    formData.append('image', {
      uri: fileUri,
      type: mime,
      name: mime === 'image/png' ? 'face_register.png' : 'face_register.jpg',
    } as any);
    return formData;
  };

  const { data } = await postMultipartWithUrlFallback<{ data: { captureCount: number } }>(
    '/face/register',
    buildFormData,
    {
      timeout: 120000,
      headers: {
        'x-employee-id': normalizedEmployeeId,
      },
    }
  );

  return data.data;
};

/**
 * Verify a face image against all registered employees
 */
export const verifyFaceEmbedding = async (
  imageUri: string
): Promise<{
  matched: boolean;
  employeeId?: string;
  employeeName?: string;
  department?: string;
  confidence?: number;
  confidencePercent?: string;
}> => {
  const fileUri = normalizeFileUri(imageUri);
  const mime = mimeForPath(fileUri);

  const buildFormData = () => {
    const formData = new FormData();
    formData.append('image', {
      uri: fileUri,
      type: mime,
      name: mime === 'image/png' ? 'face_verify.png' : 'face_verify.jpg',
    } as any);
    return formData;
  };

  const { data } = await postMultipartWithUrlFallback<{
    data: {
      matched: boolean;
      employeeId?: string;
      employeeName?: string;
      department?: string;
      confidence?: number;
      confidencePercent?: string;
    };
  }>('/face/verify', buildFormData, {
    timeout: 120000,
  });

  return data.data;
};

/**
 * Format confidence score to display string
 */
export const formatConfidence = (score: number): string => {
  return `${(score * 100).toFixed(1)}%`;
};

/**
 * Get status color based on confidence
 */
export const getConfidenceColor = (score: number): string => {
  if (score >= 0.9) return '#10B981'; // green
  if (score >= 0.75) return '#F59E0B'; // yellow
  return '#EF4444'; // red
};
