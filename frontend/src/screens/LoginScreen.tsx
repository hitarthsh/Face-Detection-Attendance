import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { authService } from '../services/auth.service';
import api, { resetApiBaseUrlIndex } from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { colors, radii, shadow, spacing } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  React.useEffect(() => {
    checkServer();
  }, []);

  const checkServer = async () => {
    try {
      setServerStatus('checking');
      resetApiBaseUrlIndex();
      // Backend returns 503 when MongoDB is down but the process is still reachable.
      const res = await api.get('/health', {
        validateStatus: () => true,
        timeout: 12000,
      });
      const ok = res.status === 200 || res.status === 503;
      setServerStatus(ok ? 'online' : 'offline');
    } catch {
      setServerStatus('offline');
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await authService.login({ email: email.trim(), password });
      navigation.replace('Main');
    } catch (error: any) {
      await authService.clearSession();
      const apiMessage = error.response?.data?.message;
      const message =
        typeof apiMessage === 'string' && apiMessage.length > 0
          ? apiMessage
          : 'Invalid credentials';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // <KeyboardAvoidingView
    //   style={{ flex: 1 }}
    //   behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    // >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>👁</Text>
          </View>
          <Text style={styles.appName}>FaceAttend</Text>
          <Text style={styles.tagline}>Secure face recognition attendance</Text>

          <TouchableOpacity style={styles.statusBadge} onPress={checkServer}>
            <View style={[styles.statusDot, { backgroundColor: serverStatus === 'online' ? '#4ADE80' : serverStatus === 'offline' ? '#F87171' : '#9CA3AF' }]} />
            <Text style={styles.statusText}>
              Server: {serverStatus.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="name@company.com"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Enter your password"
              placeholderTextColor="#555"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Face Detection Attendance System v1.0</Text>
      </View>
    // </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: colors.bg },
  logoContainer: { alignItems: 'center', marginBottom: 34 },
  logoCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    ...shadow,
  },
  logoIcon: { fontSize: 34 },
  appName: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
  tagline: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
  form: {
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 4, marginTop: 10 },
  input: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
  },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeBtn: { position: 'absolute', right: 16, top: 14 },
  eyeIcon: { fontSize: 18 },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    ...shadow,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  footer: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: 22 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default LoginScreen;
