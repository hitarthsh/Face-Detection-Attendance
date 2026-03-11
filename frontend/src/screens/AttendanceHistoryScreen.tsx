import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { attendanceService, AttendanceRecord } from '../services/attendance.service';

const STATUS_COLORS: Record<string, string> = {
  present: '#10B981',
  late: '#F59E0B',
  absent: '#EF4444',
  half_day: '#06B6D4',
  on_leave: '#8B5CF6',
};

const StatusBadge = ({ status }: { status: string }) => (
  <View style={[styles.badge, { backgroundColor: `${STATUS_COLORS[status] || '#555'}20` }]}>
    <Text style={[styles.badgeText, { color: STATUS_COLORS[status] || '#555' }]}>
      {status.replace('_', ' ').toUpperCase()}
    </Text>
  </View>
);

const AttendanceCard = ({ record }: { record: AttendanceRecord }) => {
  const checkIn = record.checkIn?.time ? new Date(record.checkIn.time) : null;
  const checkOut = record.checkOut?.time ? new Date(record.checkOut.time) : null;
  const formatTime = (d: Date | null) =>
    d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.nameContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{record.employeeName[0]}</Text>
          </View>
          <View>
            <Text style={styles.name}>{record.employeeName}</Text>
            <Text style={styles.dept}>{record.department}</Text>
          </View>
        </View>
        <StatusBadge status={record.status} />
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>IN</Text>
          <Text style={styles.timeValue}>{formatTime(checkIn)}</Text>
        </View>
        <View style={styles.timeDivider} />
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>OUT</Text>
          <Text style={styles.timeValue}>{formatTime(checkOut)}</Text>
        </View>
        <View style={styles.timeDivider} />
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>HOURS</Text>
          <Text style={styles.timeValue}>
            {record.workDuration ? `${Math.floor(record.workDuration / 60)}h ${record.workDuration % 60}m` : '—'}
          </Text>
        </View>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>CONFIDENCE</Text>
          <Text style={[styles.timeValue, { color: '#6C63FF' }]}>
            {(record.confidenceScore * 100).toFixed(0)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const AttendanceHistoryScreen: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'today' | 'history'>('today');

  const fetchRecords = useCallback(async (reset = false) => {
    try {
      if (view === 'today') {
        const data = await attendanceService.getTodayAttendance();
        setRecords(data);
      } else {
        const { records: data } = await attendanceService.getReport({});
        setRecords(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [view]);

  useEffect(() => {
    setLoading(true);
    fetchRecords();
  }, [view]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Attendance</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, view === 'today' && styles.tabActive]}
          onPress={() => setView('today')}
        >
          <Text style={[styles.tabText, view === 'today' && styles.tabTextActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === 'history' && styles.tabActive]}
          onPress={() => setView('history')}
        >
          <Text style={[styles.tabText, view === 'history' && styles.tabTextActive]}>History</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6C63FF" style={styles.loader} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <AttendanceCard record={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchRecords(); }}
              tintColor="#6C63FF"
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No attendance records found</Text>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#F0F0F5' },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#1C1C2E',
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#6C63FF' },
  tabText: { color: '#9090A0', fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: '#fff' },
  loader: { marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#555', marginTop: 60, fontSize: 16 },
  card: {
    backgroundColor: '#1C1C2E',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2D2D3F',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  nameContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  name: { color: '#F0F0F5', fontSize: 15, fontWeight: '700' },
  dept: { color: '#9090A0', fontSize: 12 },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeBox: { flex: 1, alignItems: 'center' },
  timeLabel: { color: '#9090A0', fontSize: 9, fontWeight: '700', marginBottom: 4, letterSpacing: 0.5 },
  timeValue: { color: '#F0F0F5', fontSize: 13, fontWeight: '600' },
  timeDivider: { width: 1, backgroundColor: '#2D2D3F', marginVertical: 4 },
});

export default AttendanceHistoryScreen;
