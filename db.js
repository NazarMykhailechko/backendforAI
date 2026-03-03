import duckdb from 'duckdb';
const db = new duckdb.Database('./bank.duckdb');

function runAsync(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, err => (err ? reject(err) : resolve()));
  });
}

function allAsync(sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

(async () => {
  await runAsync("CREATE TABLE IF NOT EXISTS bank_balance(date DATE, code VARCHAR, label VARCHAR, value DOUBLE)");
  await runAsync("INSERT INTO bank_balance VALUES ('2026-01-01','A','Загальні активи',23808941.47)");
  await runAsync("INSERT INTO bank_balance VALUES ('2026-01-01','LsP2','Депозити клієнтів',22383955.73)");
  await runAsync("INSERT INTO bank_balance VALUES ('2026-02-01','A','Загальні активи',23138378.30)");
  await runAsync("INSERT INTO bank_balance VALUES ('2026-02-01','LsP2','Депозити клієнтів',21668549.45)");

  const rows = await allAsync("SELECT * FROM bank_balance");
  console.log(rows);
})();

