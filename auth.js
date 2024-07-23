const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./connection');
const jwt = require('jsonwebtoken');

const router = express.Router();
router.use(bodyParser.json());

router.post('/login', async (req, res) => {
  const { matricula, password } = req.body;
  const matriculaNum = Number(matricula);

  if (isNaN(matriculaNum)) { 
      return res.status(400).json({ error: 'Matrícula no válida' });
  }

  const client = await pool.connect();
  try {
      const query = `
          SELECT * FROM usuarios WHERE matricula = $1 OR matricula_tutor = $1
      `;
      const result = await client.query(query, [matriculaNum]);

      if (result.rows.length > 0) {
          const user = result.rows[0];

          if (password === user.contraseña) {
              // Determinar qué matrícula usar en el token
              const userMatricula = user.matricula || user.matricula_tutor;
              
              const token = jwt.sign({ matricula: userMatricula }, 'tu_secreto', { expiresIn: '1h' });
              res.json({
                  token,
                  id_rol: user.id_rol,
                  nombre: user.nombre,
                  app: user.app,
                  apm: user.apm,
                  correo: user.correo,
                  matricula: userMatricula
              });
          } else {
              res.status(401).json({ error: 'Contraseña incorrecta' });
          }
      } else {
          res.status(401).json({ error: 'Usuario no encontrado' });
      }
  } catch (err) {
      console.error('Error en la autenticación', err);
      res.status(500).json({ error: 'Error en la autenticación' });
  } finally {
      client.release();
  }
});


router.get('/usuario', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
      const decoded = jwt.verify(token, 'tu_secreto');
      const matriculaNum = Number(decoded.matricula);

      if (isNaN(matriculaNum)) {
          return res.status(400).json({ error: 'Matrícula no válida' });
      }

      const client = await pool.connect();
      try {
          const query = `
              SELECT nombre, app, apm, correo, matricula, matricula_tutor FROM usuarios
              WHERE matricula = $1 OR matricula_tutor = $1
          `;
          const result = await client.query(query, [matriculaNum]);

          if (result.rows.length > 0) {
              res.json(result.rows[0]);
          } else {
              res.status(404).json({ error: 'Usuario no encontrado' });
          }
      } catch (err) {
          console.error('Error al obtener el usuario', err);
          res.status(500).json({ error: 'Error al obtener el usuario' });
      } finally {
          client.release();
      }
  } catch (err) {
      console.error('Error al verificar el token', err);
      res.status(401).json({ error: 'Token no válido' });
  }
});

// Endpoint para registrar tutoría
router.post('/registro-tutoria', async (req, res) => {
    const { matricula, nombre_alumno, app, apm, correo_alumno, asesoria, comentarios } = req.body;

    if (!matricula || !nombre_alumno || !app || !apm || !correo_alumno) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        const query = `
            INSERT INTO registro_tutoria (matricula, nombre_alumno, app, apm, correo_alumno, asesoria, comentarios)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [matricula, nombre_alumno, app, apm, correo_alumno, asesoria, comentarios];

        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al insertar en registro_tutoria', err);
        res.status(500).json({ error: 'Error al registrar la tutoría' });
    }
});

module.exports = router;


module.exports = router;
