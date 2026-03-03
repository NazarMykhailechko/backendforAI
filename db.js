import duckdb from 'duckdb';
const db = new duckdb.Database('./bank.duckdb');

// створюємо таблицю
db.run("CREATE TABLE IF NOT EXISTS bank_balance(date DATE, code VARCHAR, label VARCHAR, value DOUBLE)");

// додаємо кілька рядків
db.run("INSERT INTO bank_balance VALUES ('2026-01-01','A','Загальні активи',23808941.47)");
db.run("INSERT INTO bank_balance VALUES ('2026-01-01','LsP2','Депозити клієнтів',22383955.73)");
db.run("INSERT INTO bank_balance VALUES ('2026-02-01','A','Загальні активи',23138378.30)");
db.run("INSERT INTO bank_balance VALUES ('2026-02-01','LsP2','Депозити клієнтів',21668549.45)");

// тестовий SELECT
db.all("SELECT * FROM bank_balance", (err, rows) => {
  if (err) throw err;
  console.log(rows);
});
