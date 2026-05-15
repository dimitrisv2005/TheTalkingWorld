import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('AiScanner.db');


export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS object (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      objectNameGr TEXT,
      objectNameEnglish TEXT,
      objectNameGerman TEXT,
      objectNameFrench TEXT,
      objectNameSpanish TEXT
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS test (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      testLanguage TEXT,
      testScore INTEGER,
      testTotal INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      totalPoints INTEGER DEFAULT 0
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      language TEXT,
      requiredWords INTEGER,
      completed INTEGER DEFAULT 0
    );
  `);

  // Migration
  try {
    db.execSync(`ALTER TABLE test ADD COLUMN testTotal INTEGER;`);
  } catch (e) {}

  // Αρχικοποίηση πόντων αν δεν υπάρχουν
  const pointsRow = db.getAllSync('SELECT * FROM points') as any[];
  if (pointsRow.length === 0) {
    db.runSync('INSERT INTO points (totalPoints) VALUES (0)');
  }

  // Αρχικοποίηση challenges
  const challengeRows = db.getAllSync('SELECT * FROM challenges') as any[];
  if (challengeRows.length === 0) {
    const langs = ['English', 'German', 'French', 'Spanish'];
    langs.forEach((lang) => {
      db.runSync(
        'INSERT INTO challenges (language, requiredWords, completed) VALUES (?, ?, 0)',
        [lang, 5]
      );
    });
  }

  console.log("Η βάση αρχικοποιήθηκε!");
};

export const saveObject = ({ gr, tr, lang }: { gr: string, tr: string, lang: string }) => {
  const langMap: { [key: string]: string } = {
    'English': 'objectNameEnglish',
    'German': 'objectNameGerman',
    'French': 'objectNameFrench',
    'Spanish': 'objectNameSpanish',
  };

  const column = langMap[lang] || 'objectNameEnglish';

  db.runSync(
    `INSERT INTO object (objectNameGr, ${column}) VALUES (?, ?)`,
    [gr, tr]
  );

  // +10 πόντοι για νέα λέξη
  addPoints(10);

  // Έλεγχος challenge
  checkAndCompleteChallenge(lang);

  console.log("Αποθηκεύτηκε επιτυχώς!");
};

export const addPoints = (points: number) => {
  db.runSync('UPDATE points SET totalPoints = totalPoints + ?', [points]);
};

export const getTotalPoints = (): number => {
  const result = db.getAllSync('SELECT totalPoints FROM points') as any[];
  return result[0]?.totalPoints || 0;
};

export const checkAndCompleteChallenge = (lang: string) => {
  // Μέτρησε πόσες λέξεις έχουν σκαναριστεί σε αυτή τη γλώσσα
  const langMap: { [key: string]: string } = {
    'English': 'objectNameEnglish',
    'German': 'objectNameGerman',
    'French': 'objectNameFrench',
    'Spanish': 'objectNameSpanish',
  };
  const col = langMap[lang];
  const countResult = db.getAllSync(
    `SELECT COUNT(*) as count FROM object WHERE ${col} IS NOT NULL`
  ) as any[];
  const count = countResult[0]?.count || 0;

  // Βρες το challenge για αυτή τη γλώσσα
  const challenge = db.getAllSync(
    'SELECT * FROM challenges WHERE language = ?', [lang]
  ) as any[];

  if (challenge.length > 0 && !challenge[0].completed && count >= challenge[0].requiredWords) {
    // Ολοκλήρωσε το challenge
    db.runSync('UPDATE challenges SET completed = 1 WHERE language = ?', [lang]);
    // +50 πόντοι για challenge
    addPoints(50);
    console.log(`Challenge completed για ${lang}!`);
    return true; // επιστρέφει true αν ολοκληρώθηκε
  }
  return false;
};

export const getChallenges = (): any[] => {
  return db.getAllSync('SELECT * FROM challenges') as any[];
};

export const getLevel = (points: number): { level: number; title: string; emoji: string; nextLevelPoints: number } => {
  if (points >= 1000) return { level: 5, title: 'Ειδικός', emoji: '🎓', nextLevelPoints: 1000 };
  if (points >= 500) return { level: 4, title: 'Έμπειρος', emoji: '🏆', nextLevelPoints: 1000 };
  if (points >= 250) return { level: 3, title: 'Προχωρημένος', emoji: '⭐', nextLevelPoints: 500 };
  if (points >= 100) return { level: 2, title: 'Μαθητής', emoji: '📚', nextLevelPoints: 250 };
  return { level: 1, title: 'Αρχάριος', emoji: '🌱', nextLevelPoints: 100 };
};

export const getAllObjects = (): any[] => {
  return db.getAllSync('SELECT * FROM object');
};

export const saveTest = ({ lang, score, total }: { lang: string, score: number, total: number }) => {
  db.runSync(
    `INSERT INTO test (testLanguage, testScore, testTotal) VALUES (?, ?, ?)`,
    [lang, score, total]
  );
  console.log("Τεστ αποθηκεύτηκε!");
};

export const getAllTests = (): any[] => {
  return db.getAllSync('SELECT * FROM test ORDER BY timestamp DESC');
};

export const getTotalScore = (): { totalScore: number; totalTests: number; totalQuestions: number } => {
  const result = db.getAllSync(
    `SELECT 
      COUNT(*) as totalTests,
      SUM(testScore) as totalScore,
      SUM(testTotal) as totalQuestions
    FROM test`
  ) as any[];

  const row = result[0];
  return {
    totalTests: row?.totalTests || 0,
    totalScore: row?.totalScore || 0,
    totalQuestions: row?.totalQuestions || 0,
  };
};
console.log('DB exports:', { getTotalPoints, getChallenges, getLevel, getTotalScore });