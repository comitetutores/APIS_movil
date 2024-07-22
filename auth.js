const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./connection');  // Asegúrate de importar correctamente tu conexión a la base de datos
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware para parsear JSON
router.use(bodyParser.json());

router.post('/login', async (req, res) => {
    const { matricula, password } = req.body;

    // Convertir la matrícula a número
    const matriculaNum = Number(matricula);

    if (isNaN(matriculaNum)) {
        return res.status(400).json({ error: 'Matrícula no válida' });
    }

    // Obtener una conexión del pool
    const client = await pool.connect();
    try {
        // Buscar usuario por matrícula
        const query = `
            SELECT * FROM usuarios
            WHERE matricula = $1 OR matricula_tutor = $1
        `;
        const result = await client.query(query, [matriculaNum]);

        if (result.rows.length > 0) {
            const user = result.rows[0];

            // Verificación de la contraseña en texto plano
            if (password === user.contraseña) {
                const token = jwt.sign({ matricula: user.matricula }, 'tu_secreto', { expiresIn: '1h' });
                res.json({ 
                    token,
                    id_rol: user.id_rol,
                    nombre: user.nombre,
                    app: user.app,
                    apm: user.apm,
                    correo: user.correo,
                    matricula: user.matricula
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
        // Liberar la conexión de vuelta al pool
        client.release();
    }
});

router.get('/usuario', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
  
    try {
        // Aquí deberías validar y decodificar el token
        const decoded = jwt.verify(token, 'tu_secreto');
        const matriculaNum = Number(decoded.matricula);
    
        if (isNaN(matriculaNum)) {
          return res.status(400).json({ error: 'Matrícula no válida' });
        }
    
        // Obtener una conexión del pool
        const client = await pool.connect();
        try {
          const query = `
            SELECT nombre, app, apm, correo, matricula FROM usuarios
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
  

module.exports = router;
