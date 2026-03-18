import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import api from '../services/api';
import { authService } from '../services/auth.service';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

interface DashboardData {
  overview: {
    totalEmployees: number;
    activeEmployees: number;
    faceRegistered: number;
    todayPresent: number;
    todayLate: number;
    todayAbsent: number;
    totalUsers: number;
    attendanceRate: string;
  };
  weeklyStats: Array<{ _id: string; present: number; late: number; total: number }>;
}

const StatCard = ({ title, value, color, icon }: any) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setData(response.data.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  const overview = data?.overview;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} tintColor="#6C63FF" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'} 👋</Text>
          <Text style={styles.subtitle}>Here's today's overview</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>↩</Text>
        </TouchableOpacity>
      </View>

      {/* Date */}
      <Text style={styles.dateText}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </Text>

      {/* Attendance Rate Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerRate}>{overview?.attendanceRate || '—'}</Text>
        <Text style={styles.bannerLabel}>Today's Attendance Rate</Text>
        <View style={styles.bannerDot} />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard title="Present" value={overview?.todayPresent ?? '—'} color="#10B981" icon="✅" />
        <StatCard title="Late" value={overview?.todayLate ?? '—'} color="#F59E0B" icon="⏰" />
        <StatCard title="Absent" value={overview?.todayAbsent ?? '—'} color="#EF4444" icon="❌" />
        <StatCard title="Total Staff" value={overview?.activeEmployees ?? '—'} color="#6C63FF" icon="👥" />
        <StatCard title="Face Registered" value={overview?.faceRegistered ?? '—'} color="#06B6D4" icon="📷" />
        <StatCard title="Total Users" value={overview?.totalUsers ?? '—'} color="#8B5CF6" icon="🔐" />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#10B98120', borderColor: '#10B981' }]}
          onPress={() => navigation.navigate('AttendanceCamera', { mode: 'checkin' })}
        >
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={[styles.actionLabel, { color: '#10B981' }]}>Check In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}
          onPress={() => navigation.navigate('AttendanceCamera', { mode: 'checkout' })}
        >
          <Text style={styles.actionIcon}>🚪</Text>
          <Text style={[styles.actionLabel, { color: '#EF4444' }]}>Check Out</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#6C63FF20', borderColor: '#6C63FF' }]}
          onPress={() => navigation.navigate('AddEmployee')}
        >
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={[styles.actionLabel, { color: '#6C63FF' }]}>Add Staff</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D1A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#F0F0F5' },
  subtitle: { fontSize: 13, color: '#9090A0', marginTop: 2 },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C1C2E', justifyContent: 'center', alignItems: 'center' },
  logoutText: { fontSize: 18 },
  dateText: { color: '#9090A0', fontSize: 13, paddingHorizontal: 20, marginBottom: 16 },
  banner: {
    margin: 20,
    backgroundColor: '#6C63FF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  bannerRate: { fontSize: 48, fontWeight: '900', color: '#fff' },
  bannerLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  bannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginTop: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  statCard: {
    width: '30%', marginHorizontal: '1.5%', marginVertical: 6, backgroundColor: '#1C1C2E', borderRadius: 16, padding: 16,
    borderLeftWidth: 3, alignItems: 'center' as const,
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statTitle: { fontSize: 11, color: '#9090A0', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#F0F0F5', paddingHorizontal: 20, marginTop: 8, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 30, gap: 8 },
  actionBtn: {
    flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center',
  },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '700' },
});

export default DashboardScreen;
