import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { getAllTests } from '../../services/database';

type TestRow = {
  id: number;
  testLanguage: string;
  testScore: number;
  testTotal: number;
  timestamp: string;
};

const flagMap: { [key: string]: string } = {
  English: '🇬🇧',
  German: '🇩🇪',
  French: '🇫🇷',
  Spanish: '🇪🇸',
};

export default function TestHistoryScreen() {
  const [tests, setTests] = useState<TestRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      const data = getAllTests();
      setTests(data);
    }, [])
  );

  const getEmoji = (score: number, total: number) => {
    const percent = (score / total) * 100;
    if (percent >= 80) return '🎉';
    if (percent >= 50) return '😊';
    return '💪';
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
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
    const flag = flagMap[item.testLanguage] ?? '🌍';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.flag}>{flag}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.language}>{item.testLanguage}</Text>
            <Text style={styles.date}>{formatDate(item.timestamp)}</Text>
          </View>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>
            {item.testScore} / {item.testTotal} σωστά
          </Text>
          <View style={[styles.percentBadge, { backgroundColor: percent >= 80 ? '#d4edda' : percent >= 50 ? '#fff3cd' : '#f8d7da' }]}>
            <Text style={[styles.percentText, { color: percent >= 80 ? '#28a745' : percent >= 50 ? '#856404' : '#dc3545' }]}>
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
      {tests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.empty}>Δεν έχεις κάνει κάποιο τεστ ακόμα!</Text>
        </View>
      ) : (
        <FlatList
          data={tests}
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
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 20, textAlign: 'center', color: '#fff' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  empty: { textAlign: 'center', color: '#ccc', fontSize: 16 },
  list: { flex: 1, backgroundColor: '#1D1D21' },
  card: { backgroundColor: '#2e2e33', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  flag: { fontSize: 30, marginRight: 10 },
  cardInfo: { flex: 1 },
  language: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  date: { fontSize: 12, color: '#aaa', marginTop: 2 },
  emoji: { fontSize: 28 },
  divider: { height: 1, backgroundColor: '#3e3e44', marginBottom: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  scoreText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  percentBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  percentText: { fontSize: 16, fontWeight: 'bold' },
  progressBar: { width: '100%', height: 8, backgroundColor: '#3e3e44', borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4 },
});