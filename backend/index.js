const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config(); // Esto es vital para que lea tu archivo .env

const app = express();
app.use(cors());
app.use(express.json());

// Crear la conexión a MySQL (TiDB Cloud)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
    return;
  }
  console.log('✅ Conectado exitosamente a la base de datos MySQL (TiDB)');
});

// Iniciar el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});