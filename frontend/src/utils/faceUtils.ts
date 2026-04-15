import api from '../services/api';

/**
 * Upload a face image to generate registration embedding
 */
export const registerFaceEmbedding = async (
  employeeId: string,
  imageUri: string
): Promise<{ captureCount: number }> => {
  const normalizedEmployeeId = String(employeeId || '').trim();
  const formData = new FormData();
  formData.append('employeeId', normalizedEmployeeId);
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'face_register.jpg',
  } as any);

  const { data } = await api.post('/face/register', formData, {
    // Let RN/axios set multipart boundary automatically.
    timeout: 120000,
    headers: {
      // Backend fallback if multipart body fields are dropped by the client stack.
      'x-employee-id': normalizedEmployeeId,
    },
  });

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
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'face_verify.jpg',
  } as any);

  const { data } = await api.post('/face/verify', formData, {
    // Face verification can take longer on cold backend instances.
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
