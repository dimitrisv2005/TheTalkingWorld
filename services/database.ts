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

  try {
    db.execSync(`ALTER TABLE test ADD COLUMN testTotal INTEGER;`);
    console.log("Migration: testTotal προστέθηκε!");
  } catch (e) {
    // Υπάρχει ήδη, αγνόησε
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
  console.log("Αποθηκεύτηκε επιτυχώς!");
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