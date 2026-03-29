import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar
} from 'react-native';
import { CheckCircle2, Circle, Plus, Trash2, LayoutGrid, Sun, Moon } from 'lucide-react-native';
import { Colors } from '../theme';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

const TaskScreen = ({ isDarkMode, toggleDarkMode }: any) => {
  const [task, setTask] = useState('');
  const [taskList, setTaskList] = useState<Task[]>([
    { id: '1', text: 'Nauczyć się React Native', completed: true },
    { id: '2', text: 'Zintegrować Firebase', completed: false },
  ]);

  // ZMIANA: bgColor na transparent, aby widzieć gradient z App.tsx
  const bgColor = 'transparent';
  const textColor = isDarkMode ? Colors.darkText : '#1E293B';
  // ZMIANA: Karty i input z lekką przezroczystością
  const cardColor = isDarkMode ? Colors.darkCard : 'rgba(255, 255, 255, 0.8)';
  const borderColor = isDarkMode ? Colors.darkBorder : 'rgba(255, 255, 255, 0.5)';
  const subTextColor = isDarkMode ? '#94A3B8' : '#64748B';

  const handleAddTask = () => {
    if (task.trim().length === 0) return;
    const newTask = {
      id: Date.now().toString(),
      text: task,
      completed: false,
    };
    setTaskList([newTask, ...taskList]);
    setTask('');
    Keyboard.dismiss();
  };

  const toggleTask = (id: string) => {
    setTaskList(taskList.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteTask = (id: string) => {
    setTaskList(taskList.filter(item => item.id !== id));
  };

  const renderItem = ({ item }: { item: Task }) => (
    <View style={[styles.taskCard, { backgroundColor: cardColor, borderColor: borderColor }]}>
      <TouchableOpacity
        style={styles.taskTextContainer}
        onPress={() => toggleTask(item.id)}
      >
        {item.completed ? (
          <CheckCircle2 size={24} color={Colors.primary} />
        ) : (
          <Circle size={24} color={isDarkMode ? '#475569' : '#CBD5E1'} />
        )}
        <Text style={[
          styles.taskText,
          { color: textColor },
          item.completed && styles.completedText
        ]}>
          {item.text}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => deleteTask(item.id)}>
        <Trash2 size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={[styles.title, { color: textColor }]}>Moje Zadania 📝</Text>
            <TouchableOpacity onPress={toggleDarkMode} style={styles.themeToggle}>
              {isDarkMode ? (
                <Sun size={24} color="#FFD700" />
              ) : (
                <Moon size={24} color="#64748B" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            {taskList.filter(t => !t.completed).length} pozostało do zrobienia
          </Text>
        </View>

        <FlatList
          data={taskList}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          style={{ backgroundColor: 'transparent' }} // Wymuszenie przezroczystości listy
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <LayoutGrid size={48} color={subTextColor} />
              <Text style={[styles.emptyText, { color: subTextColor }]}>Brak zadań. Dodaj coś!</Text>
            </View>
          }
        />

        <View style={[styles.inputContainer, { backgroundColor: cardColor, borderTopColor: borderColor }]}>
          <TextInput
            style={[styles.input, { color: textColor, backgroundColor: isDarkMode ? '#2A2A3C' : 'rgba(148, 163, 184, 0.1)' }]}
            placeholder="Co masz do zrobienia?"
            placeholderTextColor="#94A3B8"
            value={task}
            onChangeText={setTask}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
            <Plus color="white" size={24} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 25, paddingTop: Platform.OS === 'android' ? 50 : 70, marginBottom: 10 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeToggle: { padding: 8, borderRadius: 12 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 15, marginTop: 5 },
  listContent: { padding: 20, paddingBottom: 140 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  taskTextContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  taskText: { fontSize: 16, fontWeight: '600', marginLeft: 12 },
  completedText: { textDecorationLine: 'line-through', color: '#94A3B8' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, fontSize: 16 },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 55,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    marginRight: 12,
  },
  addButton: {
    width: 55,
    height: 55,
    backgroundColor: '#7B61FF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});

export default TaskScreen;