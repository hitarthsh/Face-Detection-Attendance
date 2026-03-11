import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import api from '../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddEmployee'>;
};

const AddEmployeeScreen: React.FC<Props> = ({ navigation }) => {
  const [form, setForm] = useState({
    employeeId: '',
    name: '',
    department: '',
    email: '',
    phone: '',
    position: '',
  });
  const [loading, setLoading] = useState(false);

  const setField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.employeeId || !form.name || !form.department || !form.email) {
      Alert.alert('Validation', 'Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/employees', form);
      Alert.alert('Success', `${form.name} added successfully!`, [
        {
          text: 'Register Face',
          onPress: () =>
            navigation.replace('FaceRegister', {
              employeeId: data.data.employeeId,
              employeeName: data.data.name,
            }),
        },
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, field, placeholder, keyboardType, required }: any) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#555"
        value={form[field as keyof typeof form]}
        onChangeText={(val) => setField(field, val)}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Add New Employee</Text>

        <Field label="Employee ID" field="employeeId" placeholder="EMP001" required />
        <Field label="Full Name" field="name" placeholder="John Doe" required />
        <Field label="Department" field="department" placeholder="Engineering" required />
        <Field label="Email" field="email" placeholder="john@company.com" keyboardType="email-address" required />
        <Field label="Phone" field="phone" placeholder="+1 234 567 8900" keyboardType="phone-pad" />
        <Field label="Position" field="position" placeholder="Senior Developer" />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Add Employee</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  scroll: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#F0F0F5', marginBottom: 24 },
  fieldContainer: { marginBottom: 16 },
  label: { color: '#9090A0', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: '#1C1C2E',
    borderWidth: 1,
    borderColor: '#2D2D3F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F0F0F5',
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default AddEmployeeScreen;
