const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// =====================================================
// BASE DE DATOS - TiDB CLOUD
// =====================================================

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

app.use(require('./accounts')(db.promise()));

// Verificación de conexión
db.getConnection((err, connection) => {
  if (err) {
    console.error(
      '❌ Error conectando a MySQL:',
      err.message
    );
  } else {
    console.log(
      '✅ Conectado exitosamente a la base de datos MySQL (TiDB)'
    );
    connection.release();
  }
});

// =====================================================
// RUTA PRINCIPAL
// =====================================================

app.get('/', (req, res) => {
  res.send('Backend de Mystikal-AI funcionando correctamente');
});

// =====================================================
// REGISTRO
// =====================================================

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Todos los campos son obligatorios'
    });
  }

  const query =
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';

  db.query(
    query,
    [name, email, password],
    (err, result) => {
      if (err) {
        console.error(
          '❌ Error al guardar usuario:',
          err
        );

        return res.status(500).json({
          error: 'Error al registrar en la base de datos'
        });
      }

      console.log(
        '👤 Usuario guardado con ID:',
        result.insertId
      );

      res.status(201).json({
        message: 'Usuario registrado con éxito',
        id: result.insertId
      });
    }
  );
});

// =====================================================
// LOGIN
// =====================================================

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email y contraseña son obligatorios'
    });
  }

  const query =
    'SELECT * FROM users WHERE email = ?';

  db.query(
    query,
    [email],
    (err, results) => {
      if (err) {
        console.error(
          '❌ Error al buscar usuario:',
          err
        );

        return res.status(500).json({
          error:
            'Error en el servidor al consultar credenciales'
        });
      }

      if (
        results.length === 0 ||
        results[0].password !== password
      ) {
        return res.status(401).json({
          error: 'Usuario o contraseña incorrectos'
        });
      }

      const user = results[0];

      res.status(200).json({
        message: 'Inicio de sesión exitoso',

        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    }
  );
});

// =====================================================
// ESTILOS
// =====================================================

const STYLE_PROMPTS = {
  'Photoreal':
    'photorealistic 8k RAW photo, ultra detailed, cinematic lighting',

  'Anime':
    'pixai style anime portrait, masterpiece, gacha game illustration, vibrant colors, detailed lineart',

  '3D Render':
    'octane render 3d, unreal engine 5, ray tracing lighting, hyper-realistic 3d model',

  'Retro':
    '90s retro synthwave, neon glow, nostalgic aesthetic, vintage film style',

  'Cyberpunk':
    'cyberpunk aesthetic, glowing neon lights, futuristic dark city background, high tech detail',

  'Concept Art':
    'digital art concept painting, sharp focus, atmospheric fantasy illustration'
};

// =====================================================
// GENERACIÓN DE IMÁGENES - FLUX 1.1 PRO
// =====================================================

app.post('/api/generate', (_req, res) => res.status(410).json({error: 'La generación remota fue retirada. Usa el estudio local.'}));

// SERVIDOR
// =====================================================

const PORT =
  process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(
    `🚀 Servidor de Mystikal-AI corriendo en el puerto ${PORT}`
  );
});