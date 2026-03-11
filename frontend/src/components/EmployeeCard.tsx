import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  department: string;
  email: string;
  phone?: string;
  faceRegistered: boolean;
  isActive: boolean;
  position?: string;
}

interface EmployeeCardProps {
  employee: Employee;
  onPress?: () => void;
  onFaceRegister?: () => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onPress, onFaceRegister }) => {
  const initials = employee.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{employee.name}</Text>
        <Text style={styles.dept}>{employee.department}</Text>
        <Text style={styles.id}>ID: {employee.employeeId}</Text>
      </View>
      <View style={styles.actions}>
        <View style={[styles.badge, { backgroundColor: employee.faceRegistered ? '#10B98120' : '#F59E0B20' }]}>
          <Text style={[styles.badgeText, { color: employee.faceRegistered ? '#10B981' : '#F59E0B' }]}>
            {employee.faceRegistered ? '✓ Face' : '⚠ No Face'}
          </Text>
        </View>
        {!employee.faceRegistered && onFaceRegister && (
          <TouchableOpacity style={styles.registerBtn} onPress={onFaceRegister}>
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C2E',
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2D2D3F',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: '#F0F0F5',
    fontSize: 16,
    fontWeight: '700',
  },
  dept: {
    color: '#9090A0',
    fontSize: 13,
    marginTop: 2,
  },
  id: {
    color: '#6C63FF',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  actions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    rowGap: 8,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  registerBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  registerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default EmployeeCard;
