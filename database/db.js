const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '277353Hp', // coloque sua senha aqui
    database: 'Oil'
});


// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'Root@123', // coloque sua senha aqui
//     database: 'Oil'
// });

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar no banco:', err);
    } else {
        console.log('MySQL conectado com sucesso!');
    }
});

module.exports = db;
