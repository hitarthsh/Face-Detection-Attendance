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
import { attendanceService } from '../services/attendance.service';
import { formatConfidence, getConfidenceColor } from '../utils/faceUtils';
import { MULTIPART_RETRY_AFTER_AUTH } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AttendanceCamera'>;

interface VerifyResult {
  matched: boolean;
  employeeId?: string;
  employeeName?: string;
  department?: string;
  confidence?: number;
}

const AttendanceCameraScreen: React.FC<Props> = ({ route }) => {
  const mode = route.params?.mode ?? 'checkin';
  const {
    cameraRef,
    device,
    hasPermission,
    permissionStatus,
    requestPermission,
    captureImage,
    isCapturing,
    facing,
    toggleFacing,
  } = useCamera();
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<VerifyResult | null>(null);

  const handleCapture = useCallback(async () => {
    if (loading || isCapturing) return;
    setLoading(true);
    setLastResult(null);
    try {
      const imageUri = await captureImage();
      if (!imageUri) throw new Error('Capture failed');

      if (mode === 'checkin') {
        const record = await attendanceService.checkIn(imageUri);
        setLastResult({
          matched: true,
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          department: record.department,
          confidence: record.confidenceScore,
        });
        Alert.alert(
          '✅ Checked In!',
          `${record.employeeName}\n${record.department}\nStatus: ${record.status}\nConfidence: ${formatConfidence(record.confidenceScore)}`,
          [{ text: 'OK' }]
        );
      } else {
        const record = await attendanceService.checkOut(imageUri);
        setLastResult({
          matched: true,
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          department: record.department,
          confidence: record.confidenceScore,
        });
        const hours = Math.floor((record.workDuration || 0) / 60);
        const mins = (record.workDuration || 0) % 60;
        Alert.alert(
          '👋 Checked Out!',
          `${record.employeeName}\nWork duration: ${hours}h ${mins}m\nConfidence: ${formatConfidence(record.confidenceScore)}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      if (error?.message === MULTIPART_RETRY_AFTER_AUTH) {
        Alert.alert(
          'Sign in refreshed',
          'Please tap capture again after the session update.'
        );
        return;
      }
      const fromServer =
        typeof error?.response?.data?.message === 'string' ? error.response.data.message : '';
      const msg = fromServer || error.message || 'Failed to process attendance';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, [loading, isCapturing, captureImage, mode]);

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
        Alert.alert('Permission Required', 'Camera access is necessary for face detection.');
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
            : 'We need camera access to verify your identity.'}
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={handleRequestPermission}>
          <Text style={styles.permBtnText}>{isDenied ? 'Open Settings' : 'Grant Permission'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  const modeColor = mode === 'checkin' ? '#10B981' : '#EF4444';
  const modeLabel = mode === 'checkin' ? 'CHECK IN' : 'CHECK OUT';
  const modeIcon = mode === 'checkin' ? '📷' : '🚪';

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        onError={(e) => {
          console.log('Camera Error:', e);
          Alert.alert('Camera Error', e.message);
          console.log('hasPermission:', hasPermission);
          console.log('device:', device);
        }}
      />


      <View style={styles.overlay}>
        {/* Mode Badge */}
        <View
          style={[
            styles.modeBadge,
            { backgroundColor: `${modeColor}30`, borderColor: modeColor },
          ]}
        >
          <Text style={styles.modeIcon}>{modeIcon}</Text>
          <Text style={[styles.modeLabel, { color: modeColor }]}>{modeLabel}</Text>
        </View>

        {/* Face Box — shows green when matched, purple when searching */}
        <FaceBox
          isDetected={lastResult?.matched ?? false}
          confidence={lastResult?.confidence}
        />

        {/* Result display */}
        {lastResult?.matched && lastResult.confidence != null && (
          <View style={styles.resultCard}>
            <Text style={styles.resultName}>{lastResult.employeeName}</Text>
            <Text style={styles.resultDept}>{lastResult.department}</Text>
            <Text
              style={[
                styles.resultConf,
                { color: getConfidenceColor(lastResult.confidence) },
              ]}
            >
              Confidence: {formatConfidence(lastResult.confidence)}
            </Text>
          </View>
        )}

        {/* Instructions */}
        {!lastResult && (
          <Text style={styles.instructions}>
            Position your face within the frame{'\n'}Ensure good lighting
          </Text>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.flipBtn} onPress={toggleFacing}>
            <Text style={styles.flipIcon}>🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureBtn,
              { borderColor: modeColor },
              (loading || isCapturing) && styles.captureBtnDisabled,
            ]}
            onPress={handleCapture}
            disabled={loading || isCapturing}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={modeColor} />
            ) : (
              <View style={[styles.captureBtnInner, { backgroundColor: modeColor }]} />
            )}
          </TouchableOpacity>

          {/* Spacer to keep capture button centered */}
          <View style={styles.spacer} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1.5,
    gap: 8,
  },
  modeIcon: { fontSize: 20 },
  modeLabel: { fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  resultCard: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '90%',
  },
  resultName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  resultDept: { color: '#9090A0', fontSize: 14, marginTop: 4 },
  resultConf: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  instructions: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  flipBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipIcon: { fontSize: 22 },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureBtnDisabled: { opacity: 0.5 },
  captureBtnInner: { width: 60, height: 60, borderRadius: 30 },
  spacer: { width: 50 },
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
  permBtn: {
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
  permBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

export default AttendanceCameraScreen;
