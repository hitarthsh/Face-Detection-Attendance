import api from '../services/api';

/**
 * Upload a face image to generate registration embedding
 */
export const registerFaceEmbedding = async (
  employeeId: string,
  imageUri: string
): Promise<{ captureCount: number }> => {
  const formData = new FormData();
  formData.append('employeeId', employeeId);
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'face_register.jpg',
  } as any);

  const { data } = await api.post('/face/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
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
    headers: { 'Content-Type': 'multipart/form-data' },
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
