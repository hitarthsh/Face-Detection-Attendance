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
import api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

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
      await api.get('/health');
      setServerStatus('online');
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>👁</Text>
          </View>
          <Text style={styles.appName}>FaceAttend By IT</Text>
          <Text style={styles.tagline}>Secure Face Recognition Attendance</Text>

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
            placeholder="email id"
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
              placeholder="password"
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2626dd' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#70ff63',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#09cc23',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  logoIcon: { fontSize: 40 },
  appName: { fontSize: 32, fontWeight: '800', color: '#f78215', letterSpacing: 1 },
  tagline: { fontSize: 14, color: '#0be90b', marginTop: 6 },
  form: { gap: 8 },
  label: { color: '#9090A0', fontSize: 13, fontWeight: '600', marginBottom: 4, marginTop: 12 },
  input: {
    backgroundColor: '#1C1C2E',
    borderWidth: 1,
    borderColor: '#2D2D3F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#deec16',
    fontSize: 15,
  },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeBtn: { position: 'absolute', right: 16, top: 14 },
  eyeIcon: { fontSize: 18 },
  loginBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  footer: { textAlign: 'center', color: '#444', fontSize: 12, marginTop: 40 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C2E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2D2D3F',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#9090A0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default LoginScreen;
