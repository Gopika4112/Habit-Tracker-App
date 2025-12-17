import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StyleSheet,
  StatusBar,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HabitTracker = () => {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Load habits from storage
  useEffect(() => {
    loadHabits();
  }, []);

  // Save habits to storage whenever they change
  useEffect(() => {
    saveHabits();
  }, [habits]);

  const loadHabits = async () => {
    try {
      const stored = await AsyncStorage.getItem('habits');
      if (stored) {
        setHabits(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const saveHabits = async () => {
    try {
      await AsyncStorage.setItem('habits', JSON.stringify(habits));
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  };

  const addHabit = () => {
    if (newHabitName.trim()) {
      const newHabit = {
        id: Date.now().toString(),
        name: newHabitName.trim(),
        completedDates: [],
        createdAt: today
      };
      setHabits([...habits, newHabit]);
      setNewHabitName('');
      setShowAddModal(false);
    }
  };

  const toggleHabit = (habitId, date) => {
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const isCompleted = habit.completedDates.includes(date);
        return {
          ...habit,
          completedDates: isCompleted
            ? habit.completedDates.filter(d => d !== date)
            : [...habit.completedDates, date]
        };
      }
      return habit;
    }));
  };

  const deleteHabit = (habitId) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setHabits(habits.filter(h => h.id !== habitId))
        }
      ]
    );
  };

  const calculateStreak = (completedDates) => {
    if (completedDates.length === 0) return 0;
    
    const sortedDates = [...completedDates].sort().reverse();
    let streak = 0;
    let currentDate = new Date(today);
    
    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = currentDate.toISOString().split('T')[0];
      if (sortedDates[i] === checkDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate()
      });
    }
    return days;
  };

  const last7Days = getLast7Days();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Habit Tracker</Text>
        <Text style={styles.headerDate}>
          {new Date(today).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{habits.length}</Text>
          <Text style={styles.statLabel}>Total Habits</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.greenText]}>
            {habits.filter(h => h.completedDates.includes(today)).length}
          </Text>
          <Text style={styles.statLabel}>Done Today</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.orangeText]}>
            {habits.reduce((max, h) => Math.max(max, calculateStreak(h.completedDates)), 0)}
          </Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>
      </View>

      {/* Habits List */}
      <ScrollView style={styles.habitsList} contentContainerStyle={styles.habitsContent}>
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySubtitle}>Start building good habits today!</Text>
          </View>
        ) : (
          habits.map((habit) => (
            <View key={habit.id} style={styles.habitCard}>
              <View style={styles.habitHeader}>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  <Text style={styles.streakText}>
                    🔥 {calculateStreak(habit.completedDates)} day streak
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => deleteHabit(habit.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.daysContainer}>
                {last7Days.map((day) => {
                  const isCompleted = habit.completedDates.includes(day.date);
                  const isToday = day.date === today;
                  return (
                    <TouchableOpacity
                      key={day.date}
                      onPress={() => toggleHabit(habit.id, day.date)}
                      style={[
                        styles.dayCircle,
                        isCompleted && styles.dayCompleted,
                        isToday && !isCompleted && styles.dayToday
                      ]}
                    >
                      <Text style={[
                        styles.dayLetter,
                        isCompleted && styles.dayLetterCompleted
                      ]}>
                        {day.dayName.charAt(0)}
                      </Text>
                      <Text style={[
                        styles.dayNumber,
                        isCompleted && styles.dayNumberCompleted
                      ]}>
                        {day.dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        style={styles.addButton}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Habit</Text>
            
            <TextInput
              value={newHabitName}
              onChangeText={setNewHabitName}
              placeholder="Enter habit name..."
              style={styles.input}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setNewHabitName('');
                }}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={addHabit}
                style={[styles.modalButton, styles.addModalButton]}
              >
                <Text style={styles.addButtonTextModal}>Add Habit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#4f46e5',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerDate: {
    color: '#c7d2fe',
    fontSize: 14,
  },
  statsCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  greenText: {
    color: '#16a34a',
  },
  orangeText: {
    color: '#ea580c',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  habitsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  habitsContent: {
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  habitCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  streakText: {
    fontSize: 14,
    color: '#ea580c',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 14,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCompleted: {
    backgroundColor: '#22c55e',
  },
  dayToday: {
    backgroundColor: '#e0e7ff',
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  dayLetter: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
  },
  dayLetterCompleted: {
    color: 'white',
  },
  dayNumber: {
    fontSize: 10,
    color: '#9ca3af',
  },
  dayNumberCompleted: {
    color: 'white',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  addModalButton: {
    backgroundColor: '#4f46e5',
  },
  addButtonTextModal: {
    color: 'white',
    fontWeight: '600',
  },
});

export default HabitTracker;