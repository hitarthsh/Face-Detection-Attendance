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
import { colors, radii, shadow } from '../theme';

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
  type FormField = keyof typeof form;

  const setField = (field: FormField, value: string) =>
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
      const rawMessage = String(error?.response?.data?.message || error?.message || '');
      const message = rawMessage.includes("Unexpected token 'n'")
        ? 'Server returned an invalid response. Please try again.'
        : rawMessage || 'Failed to add employee';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (
    label: string,
    field: FormField,
    placeholder: string,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default',
    required = false
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#555"
        value={form[field]}
        onChangeText={(val) => setField(field, val)}
        keyboardType={keyboardType}
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

        {renderField('Employee ID', 'employeeId', 'EMP001', 'default', true)}
        {renderField('Full Name', 'name', 'John Doe', 'default', true)}
        {renderField('Department', 'department', 'Engineering', 'default', true)}
        {renderField('Email', 'email', 'john@company.com', 'email-address', true)}
        {renderField('Phone', 'phone', '+1 234 567 8900', 'phone-pad')}
        {renderField('Position', 'position', 'Senior Developer')}

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
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 24 },
  fieldContainer: { marginBottom: 16 },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  required: { color: colors.danger },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    ...shadow,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default AddEmployeeScreen;
