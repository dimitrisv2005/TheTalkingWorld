import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAllTests } from '../../services/database';

type TestRow = {
  id: number;
  testLanguage: string;
  testScore: number;
  testTotal: number;
  timestamp: string;
};

const languages = [
  { id: 'English', flag: '🇬🇧', name: 'English' },
  { id: 'German',  flag: '🇩🇪', name: 'Deutsch' },
  { id: 'French',  flag: '🇫🇷', name: 'Français' },
  { id: 'Spanish', flag: '🇪🇸', name: 'Español' },
];

export default function TestHistoryScreen() {
  const [tests, setTests] = useState<TestRow[]>([]);
  const [activeLang, setActiveLang] = useState('English');

  useFocusEffect(
    useCallback(() => {
      const data = getAllTests();
      setTests(data);

      // ← Φόρτωσε την τελευταία γλώσσα
      AsyncStorage.getItem('lastLanguage').then((lang) => {
        if (lang) setActiveLang(lang);
      });
    }, [])
  );

  const filtered = tests.filter((t) => t.testLanguage === activeLang);

  const getEmoji = (score: number, total: number) => {
    const percent = (score / total) * 100;
    if (percent >= 80) return '🎉';
    if (percent >= 50) return '😊';
    return '💪';
  };

  const formatDate = (timestamp: string) => {
  
    const isoString = timestamp.replace(' ', 'T') + 'Z';
    const date = new Date(isoString);
    return date.toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: TestRow }) => {
    const percent = Math.round((item.testScore / item.testTotal) * 100);
    const emoji = getEmoji(item.testScore, item.testTotal);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.date}>{formatDate(item.timestamp)}</Text>
          </View>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>
            {item.testScore} / {item.testTotal} σωστά
          </Text>
          <View style={[styles.percentBadge, { backgroundColor: percent >= 80 ? '#1a3a2a' : percent >= 50 ? '#3a3a1a' : '#3a1a1a' }]}>
            <Text style={[styles.percentText, { color: percent >= 80 ? '#28a745' : percent >= 50 ? '#ffc107' : '#dc3545' }]}>
              {percent}%
            </Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: `${percent}%` as any,
            backgroundColor: percent >= 80 ? '#28a745' : percent >= 50 ? '#ffc107' : '#dc3545'
          }]} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ιστορικό Τεστ</Text>

      {/* Tabs γλωσσών */}
      <View style={styles.tabs}>
        {languages.map((lang) => {
          const count = tests.filter((t) => t.testLanguage === lang.id).length;
          return (
            <TouchableOpacity
              key={lang.id}
              style={[styles.tab, activeLang === lang.id && styles.activeTab]}
              onPress={() => setActiveLang(lang.id)}
            >
              <Text style={styles.tabFlag}>{lang.flag}</Text>
              {count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.empty}>
            Δεν έχεις κάνει τεστ στα {languages.find((l) => l.id === activeLang)?.name}!
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D1D21', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 15, textAlign: 'center', color: '#fff' },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, backgroundColor: '#2e2e33', borderRadius: 15, padding: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, position: 'relative' },
  activeTab: { backgroundColor: '#3e3e44', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  tabFlag: { fontSize: 26 },
  badge: { position: 'absolute', top: 0, right: 8, backgroundColor: '#007AFF', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  empty: { textAlign: 'center', color: '#ccc', fontSize: 16 },
  list: { flex: 1, backgroundColor: '#1D1D21' },
  card: { backgroundColor: '#2e2e33', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardInfo: { flex: 1 },
  date: { fontSize: 12, color: '#aaa' },
  emoji: { fontSize: 28 },
  divider: { height: 1, backgroundColor: '#3e3e44', marginBottom: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  scoreText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  percentBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  percentText: { fontSize: 16, fontWeight: 'bold' },
  progressBar: { width: '100%', height: 8, backgroundColor: '#3e3e44', borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4 },
});