import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@expenses_data';
const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Comida');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const categories = [
    { name: 'Comida', icon: '🍔', color: '#FF6B6B' },
    { name: 'Transporte', icon: '🚗', color: '#4ECDC4' },
    { name: 'Libros', icon: '📚', color: '#95E1D3' },
    { name: 'Entretenimiento', icon: '🎮', color: '#FFE66D' },
    { name: 'Salud', icon: '💊', color: '#A8E6CF' },
    { name: 'Otros', icon: '📦', color: '#C7CEEA' }
  ];

  function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

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
      month: selectedMonth,
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

  const getFilteredExpenses = () => {
    return expenses.filter(exp => exp.month === selectedMonth);
  };

  const getTotalExpenses = () => {
    return getFilteredExpenses().reduce((sum, exp) => sum + exp.amount, 0).toFixed(2);
  };

  const getCategoryStats = () => {
    const filtered = getFilteredExpenses();
    const stats = {};
    categories.forEach(cat => {
      const total = filtered
        .filter(exp => exp.category === cat.name)
        .reduce((sum, exp) => sum + exp.amount, 0);
      if (total > 0) {
        stats[cat.name] = { total, ...cat };
      }
    });
    return stats;
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Deseas salir de la aplicación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', onPress: () => navigation.replace('Login') },
      ]
    );
  };

  const getMonthName = (monthKey) => {
    const [year, month] = monthKey.split('-');
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const getCategoryIcon = (catName) => {
    const cat = categories.find(c => c.name === catName);
    return cat ? cat.icon : '📦';
  };

  const getCategoryColor = (catName) => {
    const cat = categories.find(c => c.name === catName);
    return cat ? cat.color : '#C7CEEA';
  };

  const renderStats = () => {
    const stats = getCategoryStats();
    const total = parseFloat(getTotalExpenses());
    const filteredExpenses = getFilteredExpenses();

    return (
      <ScrollView style={styles.statsContainer}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>📊 Estadísticas</Text>
          <TouchableOpacity onPress={() => setShowStats(false)}>
            <Text style={styles.closeStats}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total del mes</Text>
          <Text style={styles.statValue}>${total.toFixed(2)}</Text>
          <Text style={styles.statSubtext}>{filteredExpenses.length} gastos registrados</Text>
        </View>

        <Text style={styles.sectionTitle}>Por categoría</Text>
        {Object.keys(stats).length > 0 ? (
          Object.entries(stats).map(([key, data]) => {
            const percentage = ((data.total / total) * 100).toFixed(1);
            return (
              <View key={key} style={styles.categoryStatCard}>
                <View style={styles.categoryStatHeader}>
                  <View style={styles.categoryStatInfo}>
                    <Text style={styles.categoryStatIcon}>{data.icon}</Text>
                    <Text style={styles.categoryStatName}>{key}</Text>
                  </View>
                  <Text style={styles.categoryStatAmount}>${data.total.toFixed(2)}</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: data.color }]} />
                </View>
                <Text style={styles.categoryStatPercent}>{percentage}% del total</Text>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyStats}>
            <Text style={styles.emptyStatsText}>No hay gastos este mes</Text>
          </View>
        )}

        <View style={styles.statsFooter} />
      </ScrollView>
    );
  };

  const renderMonthPicker = () => {
    const availableMonths = [...new Set(expenses.map(exp => exp.month))].sort().reverse();
    const currentMonth = getCurrentMonth();
    
    if (!availableMonths.includes(currentMonth)) {
      availableMonths.unshift(currentMonth);
    }

    return (
      <View style={styles.monthPickerOverlay}>
        <View style={styles.monthPickerContainer}>
          <Text style={styles.monthPickerTitle}>Selecciona un mes</Text>
          <ScrollView style={styles.monthList}>
            {availableMonths.map(month => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthItem,
                  month === selectedMonth && styles.monthItemActive
                ]}
                onPress={() => {
                  setSelectedMonth(month);
                  setShowMonthPicker(false);
                }}
              >
                <Text style={[
                  styles.monthItemText,
                  month === selectedMonth && styles.monthItemTextActive
                ]}>
                  {getMonthName(month)}
                  {month === currentMonth && ' 🟢'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.closePickerButton}
            onPress={() => setShowMonthPicker(false)}
          >
            <Text style={styles.closePickerText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (showStats) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={require('../../assets/Mi_Billetera.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Mi Billetera</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>
        {renderStats()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={require('../../assets/Mi_Billetera.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>Mi Billetera</Text>
            <Text style={styles.headerSubtitle}>Gestiona tus gastos</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.monthSelector}
          onPress={() => setShowMonthPicker(true)}
        >
          <Text style={styles.monthSelectorLabel}>Mes actual</Text>
          <View style={styles.monthSelectorContent}>
            <Text style={styles.monthSelectorText}>{getMonthName(selectedMonth)}</Text>
            <Text style={styles.monthSelectorIcon}>📅</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Gastado</Text>
          <Text style={styles.summaryAmount}>${getTotalExpenses()}</Text>
          <Text style={styles.summaryCount}>{getFilteredExpenses().length} registros</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.addButton]}
            onPress={() => setShowForm(true)}
          >
            <Text style={styles.actionButtonIcon}>➕</Text>
            <Text style={styles.actionButtonText}>Agregar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.statsButton]}
            onPress={() => setShowStats(true)}
          >
            <Text style={styles.actionButtonIcon}>📊</Text>
            <Text style={styles.actionButtonText}>Estadísticas</Text>
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>✨ Nuevo Gasto</Text>

            <TextInput
              style={styles.input}
              placeholder="¿En qué gastaste?"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#95a5a6"
            />

            <TextInput
              style={styles.input}
              placeholder="Monto"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholderTextColor="#95a5a6"
            />

            <TextInput
              style={styles.input}
              placeholder="Fecha (YYYY-MM-DD)"
              value={date}
              onChangeText={setDate}
              placeholderTextColor="#95a5a6"
            />

            <Text style={styles.categoryLabel}>Categoría</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryButton,
                    category === cat.name && { 
                      backgroundColor: cat.color,
                      transform: [{ scale: 1.05 }]
                    },
                  ]}
                  onPress={() => setCategory(cat.name)}
                >
                  <Text style={styles.categoryButtonIcon}>{cat.icon}</Text>
                  <Text style={[
                    styles.categoryButtonText,
                    category === cat.name && styles.categoryButtonTextActive,
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

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
                <Text style={styles.saveButtonText}>💾 Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lista de gastos */}
        {getFilteredExpenses().length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyText}>No hay gastos este mes</Text>
            <Text style={styles.emptySubtext}>
              ¡Comienza a registrar tus gastos!
            </Text>
          </View>
        ) : (
          <View style={styles.expensesList}>
            {getFilteredExpenses().map((item) => (
              <View key={item.id} style={[styles.expenseCard, { borderLeftColor: getCategoryColor(item.category) }]}>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseInfo}>
                    <View style={styles.expenseNameRow}>
                      <Text style={styles.categoryIcon}>{getCategoryIcon(item.category)}</Text>
                      <Text style={styles.expenseName}>{item.name}</Text>
                    </View>
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
            ))}
          </View>
        )}
      </ScrollView>

      {showMonthPicker && renderMonthPicker()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { 
    backgroundColor: '#667eea', 
    padding: 20, 
    paddingTop: 50, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#e0e7ff', marginTop: 4 },
  logoutButton: { 
    backgroundColor: 'rgba(255,255,255,0.25)', 
    paddingVertical: 10, 
    paddingHorizontal: 18, 
    borderRadius: 12 
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  
  monthSelector: { 
    backgroundColor: '#fff', 
    marginHorizontal: 20, 
    marginTop: -20,
    padding: 16, 
    borderRadius: 16, 
    elevation: 4,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  monthSelectorLabel: { fontSize: 12, color: '#667eea', fontWeight: '600', marginBottom: 4 },
  monthSelectorContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthSelectorText: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
  monthSelectorIcon: { fontSize: 22 },

  summaryCard: { 
    backgroundColor: '#fff', 
    margin: 20, 
    marginTop: 16,
    padding: 24, 
    borderRadius: 20, 
    alignItems: 'center', 
    elevation: 3,
  },
  summaryLabel: { fontSize: 14, color: '#718096', marginBottom: 8, fontWeight: '600' },
  summaryAmount: { 
    fontSize: 42, 
    fontWeight: 'bold', 
    color: '#667eea', 
    marginBottom: 4,
  },
  summaryCount: { fontSize: 14, color: '#a0aec0', fontWeight: '500' },

  actionButtons: { 
    flexDirection: 'row', 
    marginHorizontal: 20, 
    gap: 12, 
    marginBottom: 20 
  },
  actionButton: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 16, 
    borderRadius: 16, 
    elevation: 3,
  },
  addButton: { backgroundColor: '#48bb78' },
  statsButton: { backgroundColor: '#ed8936' },
  actionButtonIcon: { fontSize: 20, marginRight: 8 },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  formCard: { 
    backgroundColor: '#fff', 
    marginHorizontal: 20, 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 20, 
    elevation: 4,
    borderTopWidth: 4,
    borderTopColor: '#667eea',
  },
  formTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#2d3748', 
    marginBottom: 16,
    textAlign: 'center',
  },
  input: { 
    backgroundColor: '#f7fafc', 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16, 
    marginBottom: 12, 
    borderWidth: 2, 
    borderColor: '#e2e8f0',
    color: '#2d3748',
  },
  categoryLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#4a5568', 
    marginBottom: 12,
    marginTop: 4,
  },
  categoryScroll: { marginBottom: 16 },
  categoryButton: { 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 16, 
    backgroundColor: '#f7fafc', 
    borderWidth: 2, 
    borderColor: '#e2e8f0',
    marginRight: 8,
    alignItems: 'center',
    minWidth: 90,
  },
  categoryButtonIcon: { fontSize: 24, marginBottom: 4 },
  categoryButtonText: { color: '#4a5568', fontSize: 12, fontWeight: '600' },
  categoryButtonTextActive: { color: '#fff', fontWeight: '700' },
  
  formButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#f7fafc', borderWidth: 2, borderColor: '#e2e8f0' },
  cancelButtonText: { color: '#4a5568', fontSize: 16, fontWeight: '700' },
  saveButton: { backgroundColor: '#667eea' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  expensesList: {
    paddingHorizontal: 20,
  },
  
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyIcon: { fontSize: 80, marginBottom: 16, opacity: 0.5 },
  emptyText: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#2d3748', 
    marginBottom: 8 
  },
  emptySubtext: { 
    fontSize: 14, 
    color: '#a0aec0', 
    textAlign: 'center',
    fontWeight: '500',
  },

  expenseCard: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    elevation: 2,
    borderLeftWidth: 4,
  },
  expenseHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  expenseInfo: { flex: 1 },
  expenseNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  categoryIcon: { fontSize: 20, marginRight: 8 },
  expenseName: { 
    fontSize: 16, 
    fontWeight: '700',
    color: '#2d3748',
    flex: 1,
    },
expenseCategory: {
fontSize: 11,
color: '#718096',
backgroundColor: '#edf2f7',
paddingHorizontal: 10,
paddingVertical: 4,
borderRadius: 8,
alignSelf: 'flex-start',
fontWeight: '600',
},
expenseAmount: { fontSize: 22, fontWeight: 'bold', color: '#e53e3e' },
expenseFooter: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
borderTopWidth: 1,
borderTopColor: '#f7fafc',
paddingTop: 12,
},
expenseDate: { fontSize: 12, color: '#a0aec0', fontWeight: '500' },
deleteButton: { fontSize: 12, color: '#e53e3e', fontWeight: '700' },
monthPickerOverlay: {
position: 'absolute',
top: 0,
left: 0,
right: 0,
bottom: 0,
backgroundColor: 'rgba(0,0,0,0.5)',
justifyContent: 'center',
alignItems: 'center',
zIndex: 1000,
},
monthPickerContainer: {
backgroundColor: '#fff',
borderRadius: 20,
padding: 24,
width: width * 0.85,
maxHeight: '70%',
elevation: 8,
},
monthPickerTitle: {
fontSize: 20,
fontWeight: 'bold',
color: '#2d3748',
marginBottom: 16,
textAlign: 'center',
},
monthList: { maxHeight: 300 },
monthItem: {
padding: 16,
borderRadius: 12,
marginBottom: 8,
backgroundColor: '#f7fafc',
},
monthItemActive: {
backgroundColor: '#667eea',
},
monthItemText: {
fontSize: 16,
color: '#4a5568',
fontWeight: '600',
textAlign: 'center',
},
monthItemTextActive: {
color: '#fff',
fontWeight: '700',
},
closePickerButton: {
backgroundColor: '#e2e8f0',
padding: 14,
borderRadius: 12,
marginTop: 16,
},
closePickerText: {
textAlign: 'center',
color: '#4a5568',
fontWeight: '700',
fontSize: 16,
},
statsContainer: { flex: 1, backgroundColor: '#f8f9fa' },
statsHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
padding: 20,
paddingTop: 10,
},
statsTitle: { fontSize: 24, fontWeight: 'bold', color: '#2d3748' },
closeStats: { fontSize: 28, color: '#a0aec0', fontWeight: 'bold' },
statCard: {
backgroundColor: '#fff',
marginHorizontal: 20,
padding: 24,
borderRadius: 20,
alignItems: 'center',
elevation: 3,
marginBottom: 24,
},
statLabel: { fontSize: 14, color: '#718096', marginBottom: 8, fontWeight: '600' },
statValue: { fontSize: 42, fontWeight: 'bold', color: '#667eea', marginBottom: 4 },
statSubtext: { fontSize: 14, color: '#a0aec0', fontWeight: '500' },
sectionTitle: {
fontSize: 18,
fontWeight: 'bold',
color: '#2d3748',
marginLeft: 20,
marginBottom: 12,
},
categoryStatCard: {
backgroundColor: '#fff',
marginHorizontal: 20,
padding: 16,
borderRadius: 16,
marginBottom: 12,
elevation: 2,
},
categoryStatHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 12,
},
categoryStatInfo: { flexDirection: 'row', alignItems: 'center' },
categoryStatIcon: { fontSize: 24, marginRight: 12 },
categoryStatName: { fontSize: 16, fontWeight: '700', color: '#2d3748' },
categoryStatAmount: { fontSize: 18, fontWeight: 'bold', color: '#e53e3e' },
progressBarContainer: {
height: 8,
backgroundColor: '#edf2f7',
borderRadius: 4,
marginBottom: 8,
overflow: 'hidden',
},
progressBar: { height: '100%', borderRadius: 4 },
categoryStatPercent: { fontSize: 12, color: '#718096', fontWeight: '600' },
emptyStats: {
padding: 40,
alignItems: 'center',
},
emptyStatsText: {
fontSize: 16,
color: '#a0aec0',
fontWeight: '600',
},
statsFooter: { height: 40 },
});