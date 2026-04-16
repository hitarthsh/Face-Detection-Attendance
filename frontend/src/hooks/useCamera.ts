import { useRef, useState, useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  CameraPermissionStatus,
} from 'react-native-vision-camera';

export type CameraMode = 'checkin' | 'checkout' | 'register' | 'verify';

export interface UseCameraReturn {
  cameraRef: React.RefObject<Camera | null>;
  hasPermission: boolean;
  permissionStatus: CameraPermissionStatus;
  requestPermission: () => Promise<boolean>;
  device: ReturnType<typeof useCameraDevice>;
  isCapturing: boolean;
  captureImage: () => Promise<string | null>;
  facing: 'front' | 'back';
  toggleFacing: () => void;
  refreshPermission: () => void;
}

export const useCamera = (): UseCameraReturn => {
  const cameraRef = useRef<Camera>(null);
  const { hasPermission: visionHasPermission, requestPermission: visionRequestPermission } =
    useCameraPermission();
  const [permissionStatus, setPermissionStatus] = useState<CameraPermissionStatus>(
    Camera.getCameraPermissionStatus()
  );
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const device = useCameraDevice(facing);

  const refreshPermission = useCallback(() => {
    const status = Camera.getCameraPermissionStatus();
    setPermissionStatus(status);
  }, []);

  // Sync state when vision camera's internal state changes
  useEffect(() => {
    refreshPermission();
  }, [visionHasPermission, refreshPermission]);

  // Sync state when app comes back to foreground (user might have changed settings)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refreshPermission();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshPermission]);

  const requestPermission = useCallback(async () => {
    // 1. Get current status before asking
    const before = Camera.getCameraPermissionStatus();
    
    // 2. Try asking using current tool
    await visionRequestPermission();
    
    // 3. Get status after asking
    const after = Camera.getCameraPermissionStatus();
    
    // 4. Update local state
    setPermissionStatus(after);
    
    // Keep internal vision state in sync too
    refreshPermission();
    
    return after === 'granted';
  }, [visionRequestPermission, refreshPermission]);

  const toggleFacing = useCallback(() => {
    setFacing(prev => (prev === 'front' ? 'back' : 'front'));
  }, []);

  const captureImage = useCallback(async (): Promise<string | null> => {
    if (!cameraRef.current || isCapturing) return null;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });
      const path = String(photo.path || '').trim();
      if (!path) return null;
      if (path.startsWith('file://') || path.startsWith('content://')) return path;
      return `file://${path}`;
    } catch (error) {
      console.error('Camera capture error:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  return {
    cameraRef,
    hasPermission: permissionStatus === 'granted',
    permissionStatus,
    requestPermission,
    device,
    isCapturing,
    captureImage,
    facing,
    toggleFacing,
    refreshPermission,
  };
};
