import { useRef, useState, useCallback } from 'react';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

export type CameraMode = 'checkin' | 'checkout' | 'register' | 'verify';

export interface UseCameraReturn {
  cameraRef: React.RefObject<Camera>;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  device: ReturnType<typeof useCameraDevice>;
  isCapturing: boolean;
  captureImage: () => Promise<string | null>;
  facing: 'front' | 'back';
  toggleFacing: () => void;
}

export const useCamera = (): UseCameraReturn => {
  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const device = useCameraDevice(facing);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === 'front' ? 'back' : 'front'));
  }, []);

  const captureImage = useCallback(async (): Promise<string | null> => {
    if (!cameraRef.current || isCapturing) return null;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'balanced',
        flash: 'off',
        enableAutoDistortionCorrection: true,
      });
      return `file://${photo.path}`;
    } catch (error) {
      console.error('Camera capture error:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  return {
    cameraRef,
    hasPermission,
    requestPermission,
    device,
    isCapturing,
    captureImage,
    facing,
    toggleFacing,
  };
};
