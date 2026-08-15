const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config(); // Lee el archivo .env

const app = express();
app.use(cors());
app.use(express.json());

// Crear un pool de conexiones a MySQL (TiDB Cloud)
// El pool reconecta automáticamente si la conexión se interrumpe o queda inactiva
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Probar la conexión al arrancar
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
  } else {
    console.log('✅ Conectado exitosamente a la base de datos MySQL (TiDB)');
    connection.release(); // Liberamos la conexión de prueba para que vuelva al pool
  }
});

// Ruta simple para verificar que el servidor está vivo desde un navegador
app.get('/', (req, res) => {
  res.send('Backend de Mystikal-AI funcionando correctamente');
});

// Iniciar el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});