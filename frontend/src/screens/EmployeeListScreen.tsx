import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../services/api';
import EmployeeCard, { Employee } from '../components/EmployeeCard';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

const EmployeeListScreen: React.FC<Props> = ({ navigation }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchEmployees = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const { data } = await api.get('/employees', {
        params: { search: search || undefined, page: currentPage, limit: 20 },
      });
      const newEmployees = data.employees;
      setEmployees(reset ? newEmployees : (prev) => [...prev, ...newEmployees]);
      setHasMore(data.pagination.page < data.pagination.pages);
      if (reset) setPage(2); else setPage((p) => p + 1);
    } catch (error) {
      Alert.alert('Error', 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchEmployees(true);
  }, [search]);

  const renderEmployee = ({ item }: { item: Employee }) => (
    <EmployeeCard
      employee={item}
      onPress={() => Alert.alert(item.name, `ID: ${item.employeeId}\nDept: ${item.department}\nEmail: ${item.email}`)}
      onFaceRegister={() =>
        navigation.navigate('FaceRegister', {
          employeeId: item.employeeId,
          employeeName: item.name,
        })
      }
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Employees</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddEmployee')}
        >
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or ID..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6b63ffd4" style={styles.loader} />
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item._id}
          renderItem={renderEmployee}
          onEndReached={() => hasMore && fetchEmployees()}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No employees found</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#F0F0F5' },
  addBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C2E',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2D2D3F',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#F0F0F5', fontSize: 15, paddingVertical: 12 },
  loader: { marginTop: 60 },
  emptyText: { textAlign: 'center', color: '#555', marginTop: 60, fontSize: 16 },
});

export default EmployeeListScreen;
