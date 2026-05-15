import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getChallenges, getTotalPoints } from '../../services/database';

type Challenge = {
  id: number;
  language: string;
  requiredWords: number;
  completed: number;
};

const flagMap: { [key: string]: string } = {
  English: '🇬🇧',
  German: '🇩🇪',
  French: '🇫🇷',
  Spanish: '🇪🇸',
};

const LEVELS = [
  { level: 1, title: 'Αρχάριος', emoji: '🌱', minPoints: 0, maxPoints: 100 },
  { level: 2, title: 'Μαθητής', emoji: '📚', minPoints: 100, maxPoints: 250 },
  { level: 3, title: 'Προχωρημένος', emoji: '⭐', minPoints: 250, maxPoints: 500 },
  { level: 4, title: 'Έμπειρος', emoji: '🏆', minPoints: 500, maxPoints: 1000 },
  { level: 5, title: 'Ειδικός', emoji: '🎓', minPoints: 1000, maxPoints: 1000 },
];

// ← Τοπική συνάρτηση αντί από database
const getLevel = (points: number) => {
  if (points >= 1000) return { level: 5, title: 'Ειδικός', emoji: '🎓', nextLevelPoints: 1000 };
  if (points >= 500) return { level: 4, title: 'Έμπειρος', emoji: '🏆', nextLevelPoints: 1000 };
  if (points >= 250) return { level: 3, title: 'Προχωρημένος', emoji: '⭐', nextLevelPoints: 500 };
  if (points >= 100) return { level: 2, title: 'Μαθητής', emoji: '📚', nextLevelPoints: 250 };
  return { level: 1, title: 'Αρχάριος', emoji: '🌱', nextLevelPoints: 100 };
};

export default function ChallengesScreen() {
  const [points, setPoints] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useFocusEffect(
    useCallback(() => {
      setPoints(getTotalPoints());
      setChallenges(getChallenges());
    }, [])
  );

  const levelInfo = getLevel(points);
  const currentLevelData = LEVELS.find((l) => l.level === levelInfo.level)!;
  const prevLevelPoints = currentLevelData.minPoints;
  const nextLevelPoints = levelInfo.nextLevelPoints;
  const progressPercent = levelInfo.level === 5
    ? 100
    : Math.min(((points - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100, 100);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.levelCard}>
        <Text style={styles.levelEmoji}>{levelInfo.emoji}</Text>
        <Text style={styles.levelTitle}>{levelInfo.title}</Text>
        <Text style={styles.levelSubtitle}>Επίπεδο {levelInfo.level}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` as any }]} />
          </View>
          <Text style={styles.progressLabel}>
            {levelInfo.level === 5
              ? `${points} πόντοι — Μέγιστο επίπεδο!`
              : `${points} / ${nextLevelPoints} πόντοι`}
          </Text>
        </View>
      </View>

      <View style={styles.pointsRow}>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsValue}>⭐ {points}</Text>
          <Text style={styles.pointsLabel}>Συνολικοί Πόντοι</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Πώς κερδίζεις πόντους</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📷</Text>
            <Text style={styles.infoText}>Σκάναρισμα νέας λέξης</Text>
            <Text style={styles.infoPoints}>+10</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏅</Text>
            <Text style={styles.infoText}>Ολοκλήρωση Challenge</Text>
            <Text style={styles.infoPoints}>+50</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Επίπεδα</Text>
        <View style={styles.infoCard}>
          {LEVELS.map((l, index) => (
            <View key={l.level}>
              <View style={[styles.levelRow, levelInfo.level === l.level && styles.activeLevelRow]}>
                <Text style={styles.levelRowEmoji}>{l.emoji}</Text>
                <Text style={[styles.levelRowTitle, levelInfo.level === l.level && styles.activeLevelText]}>
                  {l.title}
                </Text>
                <Text style={styles.levelRowPoints}>
                  {l.level === 5 ? '1000+' : `${l.minPoints}-${l.maxPoints}`} πόντοι
                </Text>
                {levelInfo.level > l.level && <Text style={styles.checkmark}>✓</Text>}
                {levelInfo.level === l.level && <Text style={styles.currentBadge}>Τώρα</Text>}
              </View>
              {index < LEVELS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Challenges</Text>
        {challenges.map((challenge) => {
          const flag = flagMap[challenge.language] ?? '🌍';
          return (
            <View
              key={challenge.id}
              style={[styles.challengeCard, challenge.completed === 1 && styles.challengeCompleted]}
            >
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeFlag}>{flag}</Text>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle}>
                    Σκάναρισε {challenge.requiredWords} λέξεις στα {challenge.language}
                  </Text>
                  <Text style={styles.challengeReward}>+50 πόντοι</Text>
                </View>
                {challenge.completed === 1
                  ? <Text style={styles.completedBadge}>✅</Text>
                  : <Text style={styles.pendingBadge}>⏳</Text>
                }
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#1D1D21' },
  container: { padding: 20, paddingTop: 50, paddingBottom: 40 },
  levelCard: { backgroundColor: '#2e2e33', borderRadius: 20, padding: 25, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#3e3e44' },
  levelEmoji: { fontSize: 60, marginBottom: 8 },
  levelTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  levelSubtitle: { fontSize: 14, color: '#aaa', marginTop: 4, marginBottom: 15 },
  progressContainer: { width: '100%', alignItems: 'center' },
  progressBg: { width: '100%', height: 12, backgroundColor: '#3e3e44', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: 12, backgroundColor: '#007AFF', borderRadius: 6 },
  progressLabel: { fontSize: 12, color: '#aaa', marginTop: 6 },
  pointsRow: { marginBottom: 20 },
  pointsBadge: { backgroundColor: '#1a3a5c', borderRadius: 15, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#007AFF' },
  pointsValue: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  pointsLabel: { fontSize: 13, color: '#aaa', marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  infoCard: { backgroundColor: '#2e2e33', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: '#3e3e44' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  infoIcon: { fontSize: 22, marginRight: 12 },
  infoText: { flex: 1, fontSize: 15, color: '#fff' },
  infoPoints: { fontSize: 16, fontWeight: 'bold', color: '#28a745' },
  divider: { height: 1, backgroundColor: '#3e3e44', marginVertical: 4 },
  levelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  activeLevelRow: { backgroundColor: '#1a3a5c', borderRadius: 10, paddingHorizontal: 8 },
  levelRowEmoji: { fontSize: 22, marginRight: 10 },
  levelRowTitle: { flex: 1, fontSize: 15, color: '#aaa', fontWeight: '600' },
  activeLevelText: { color: '#fff' },
  levelRowPoints: { fontSize: 12, color: '#888', marginRight: 8 },
  checkmark: { fontSize: 16, color: '#28a745' },
  currentBadge: { fontSize: 11, color: '#007AFF', fontWeight: 'bold', backgroundColor: '#1a3a5c', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  challengeCard: { backgroundColor: '#2e2e33', borderRadius: 15, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#3e3e44' },
  challengeCompleted: { borderColor: '#28a745', backgroundColor: '#1a3a2a' },
  challengeHeader: { flexDirection: 'row', alignItems: 'center' },
  challengeFlag: { fontSize: 30, marginRight: 12 },
  challengeInfo: { flex: 1 },
  challengeTitle: { fontSize: 15, color: '#fff', fontWeight: '600' },
  challengeReward: { fontSize: 12, color: '#28a745', marginTop: 3 },
  completedBadge: { fontSize: 24 },
  pendingBadge: { fontSize: 24 },
});