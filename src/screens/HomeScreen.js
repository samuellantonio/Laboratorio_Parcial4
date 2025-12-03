import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@expenses_data';

export default function HomeScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Comida');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setExpenses(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'No se pudieron cargar los gastos');
    }
  };

  const saveExpenses = async (newExpenses) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newExpenses));
      setExpenses(newExpenses);
    } catch (error) {
      console.error('Error saving expenses:', error);
      Alert.alert('Error', 'No se pudo guardar el gasto');
    }
  };

  const handleAddExpense = async () => {
    if (!name.trim() || !amount.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'El monto debe ser un número válido mayor a 0');
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      name: name.trim(),
      amount: amountNum,
      date,
      category,
    };

    const updatedExpenses = [newExpense, ...expenses];
    await saveExpenses(updatedExpenses);

    setName('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Comida');
    setShowForm(false);
  };

  const handleDeleteExpense = async (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de eliminar este gasto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const updatedExpenses = expenses.filter((exp) => exp.id !== id);
            await saveExpenses(updatedExpenses);
          },
        },
      ]
    );
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Deseas salir de la aplicación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          onPress: () => navigation.replace('Login'),
        },
      ]
    );
  };

  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseName}>{item.name}</Text>
          <Text style={styles.expenseCategory}>{item.category}</Text>
        </View>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
      </View>
      <View style={styles.expenseFooter}>
        <Text style={styles.expenseDate}>📅 {item.date}</Text>
        <TouchableOpacity onPress={() => handleDeleteExpense(item.id)}>
          <Text style={styles.deleteButton}>🗑️ Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mi Billetera 💳</Text>
          <Text style={styles.headerSubtitle}>Gestiona tus gastos</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Gastado</Text>
        <Text style={styles.summaryAmount}>${getTotalExpenses()}</Text>
        <Text style={styles.summaryCount}>{expenses.length} registros</Text>
        <Text style={styles.successText}>✅ Los datos se guardan automáticamente</Text>
      </View>

      {!showForm && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(true)}
        >
          <Text style={styles.addButtonText}>+ Agregar Gasto</Text>
        </TouchableOpacity>
      )}

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Nuevo Gasto</Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre del gasto"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Monto"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Fecha (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
          />

          <View style={styles.categoryContainer}>
            {['Comida', 'Transporte', 'Libros', 'Otros'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.categoryButtonActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    category === cat && styles.categoryButtonTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowForm(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleAddExpense}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          expenses.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No hay gastos registrados</Text>
            <Text style={styles.emptySubtext}>
              Presiona "Agregar Gasto" para comenzar
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { backgroundColor: '#3498db', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#ecf0f1', marginTop: 4 },
  logoutButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: '600' },
  summaryCard: { backgroundColor: '#fff', margin: 20, padding: 24, borderRadius: 16, alignItems: 'center', elevation: 3 },
  summaryLabel: { fontSize: 14, color: '#7f8c8d', marginBottom: 8 },
  summaryAmount: { fontSize: 36, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  summaryCount: { fontSize: 14, color: '#95a5a6', marginBottom: 8 },
  successText: { fontSize: 12, color: '#27ae60', fontStyle: 'italic' },
  addButton: { backgroundColor: '#2ecc71', marginHorizontal: 20, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20, elevation: 3 },
  addButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  formCard: { backgroundColor: '#fff', marginHorizontal: 20, padding: 20, borderRadius: 16, marginBottom: 20, elevation: 3 },
  formTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 16 },
  input: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e9ecef' },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 8 },
  categoryButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6' },
  categoryButtonActive: { backgroundColor: '#3498db', borderColor: '#3498db' },
  categoryButtonText: { color: '#495057', fontSize: 14 },
  categoryButtonTextActive: { color: '#fff', fontWeight: '600' },
  formButtons: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#dee2e6' },
  cancelButtonText: { color: '#495057', fontSize: 16, fontWeight: '600' },
  saveButton: { backgroundColor: '#3498db' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  listContentEmpty: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#2c3e50', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#95a5a6', textAlign: 'center' },
  expenseCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  expenseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  expenseInfo: { flex: 1 },
  expenseName: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 4 },
  expenseCategory: { fontSize: 12, color: '#7f8c8d', backgroundColor: '#ecf0f1', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  expenseAmount: { fontSize: 20, fontWeight: 'bold', color: '#e74c3c' },
  expenseFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expenseDate: { fontSize: 12, color: '#95a5a6' },
  deleteButton: { fontSize: 12, color: '#e74c3c', fontWeight: '600' },
});