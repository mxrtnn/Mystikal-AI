const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Pool de conexiones a TiDB Cloud
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

// Probar conexión al arrancar
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
  } else {
    console.log('✅ Conectado exitosamente a la base de datos MySQL (TiDB)');
    connection.release();
  }
});

// Ruta raíz de prueba
app.get('/', (req, res) => {
  res.send('Backend de Mystikal-AI funcionando correctamente');
});

// Endpoint para guardar registros de usuarios
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';

  db.query(query, [name, email, password], (err, result) => {
    if (err) {
      console.error('❌ Error al guardar usuario:', err);
      return res.status(500).json({ error: 'Error al registrar en la base de datos' });
    }
    console.log('👤 Usuario guardado con ID:', result.insertId);
    res.status(201).json({ message: 'Usuario registrado con éxito', id: result.insertId });
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});