import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { useCamera } from '../hooks/useCamera';
import FaceBox from '../components/FaceBox';
import { registerFaceEmbedding } from '../utils/faceUtils';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'FaceRegister'>;

const FaceRegisterScreen: React.FC<Props> = ({ navigation, route }) => {
  const { employeeId, employeeName } = route.params;
  const {
    cameraRef,
    device,
    hasPermission,
    permissionStatus,
    requestPermission,
    captureImage,
    isCapturing,
  } = useCamera();
  const [captureCount, setCaptureCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const REQUIRED_CAPTURES = 3;

  const handleCapture = useCallback(async () => {
    if (loading || isCapturing) return;
    setLoading(true);
    try {
      const imageUri = await captureImage();
      if (!imageUri) {
        Alert.alert('Error', 'Failed to capture image. Please try again.');
        return;
      }
      const result = await registerFaceEmbedding(employeeId, imageUri);
      const newCount = result.captureCount;
      setCaptureCount(newCount);

      if (newCount >= REQUIRED_CAPTURES) {
        Alert.alert(
          'Success! 🎉',
          `Face registered for ${employeeName}. ${newCount} captures recorded.`,
          [{ text: 'Done', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'Captured!',
          `${newCount}/${REQUIRED_CAPTURES} captures done. Please capture from a slightly different angle.`
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Face registration failed');
    } finally {
      setLoading(false);
    }
  }, [loading, isCapturing, captureImage, employeeId, employeeName, navigation]);

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) {
      const status = Camera.getCameraPermissionStatus();
      if (status === 'denied') {
        Alert.alert(
          'Permission Denied',
          'Camera access is blocked. Please enable it in your system settings to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        Alert.alert('Permission Required', 'Camera access is necessary to register faces.');
      }
    }
  }, [requestPermission]);

  if (!hasPermission) {
    const isDenied = permissionStatus === 'denied';
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          {isDenied
            ? 'Access was previously denied. Please enable it in Settings.'
            : 'We need camera access to register your face.'}
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={handleRequestPermission}>
          <Text style={styles.permissionBtnText}>
            {isDenied ? 'Open Settings' : 'Grant Permission'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  const isComplete = captureCount >= REQUIRED_CAPTURES;

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top Info */}
        <View style={styles.topBar}>
          <Text style={styles.employeeName}>{employeeName}</Text>
          <Text style={styles.employeeId}>ID: {employeeId}</Text>
        </View>

        {/* Face Box — show as "detected/complete" once at least 1 capture done */}
        <FaceBox isDetected={captureCount > 0} confidence={captureCount > 0 ? 0.95 : undefined} />

        {/* Instructions */}
        <Text style={styles.instructions}>
          {isComplete
            ? '✅ Registration complete!'
            : `Look straight at the camera\nCapture ${captureCount + 1} of ${REQUIRED_CAPTURES}`}
        </Text>

        {/* Progress */}
        <View style={styles.progressRow}>
          {Array.from({ length: REQUIRED_CAPTURES }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressDot, i < captureCount && styles.progressDotFilled]}
            />
          ))}
        </View>

        {/* Capture Button */}
        <TouchableOpacity
          style={[styles.captureBtn, (loading || isCapturing || isComplete) && styles.captureBtnDisabled]}
          onPress={handleCapture}
          disabled={loading || isCapturing || isComplete}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.captureBtnInner} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 16,
  },
  employeeName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  employeeId: { color: '#6C63FF', fontSize: 14, marginTop: 4 },
  instructions: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 16,
  },
  progressRow: { flexDirection: 'row', gap: 12 },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotFilled: { backgroundColor: '#6C63FF' },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  captureBtnDisabled: { opacity: 0.5 },
  captureBtnInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D1A',
    padding: 40,
    gap: 16,
  },
  permissionIcon: { fontSize: 64, marginBottom: 10 },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  permissionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  permissionBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  permissionBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default FaceRegisterScreen;
