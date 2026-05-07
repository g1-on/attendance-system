const db = require('./database');
db.query("UPDATE employees SET status = 'Active', password = 'admin' WHERE id = 'admin'")
  .then(() => {
    console.log('Admin account activated and password set to admin');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
