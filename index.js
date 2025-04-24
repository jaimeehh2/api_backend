const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(
  cors({
    origin: "https://mindsafe-web2.netlify.app", // <-- tu dominio real de Netlify
    credentials: true,
  }),
);

app.use(express.json());

// Configuración de la base de datos Railway
const db = mysql.createConnection({
  host: "switchyard.proxy.rlwy.net", // tu host de Railway
  user: "root", // tu usuario
  password: "RGRcWAMwQyOVLwFKQbgDMSqBwCLxAZUM", // tu contraseña (desbloqueada)
  database: "railway", // tu base
  port: 59150, // tu puerto
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error("❌ Error al conectar a la base de datos:", err);
    return;
  }
  console.log("✅ Conexión a la base de datos exitosa");
});
app.get("/pacientescontest", (req, res) => {
  const sql = `
    SELECT p.ID, p.Nombre, p.Apellido, p.Genero, p.HistorialClinico, p.Diagnostico,
           p.DNI, td.Estado, td.Fecha
    FROM Paciente p
    LEFT JOIN PacienteTestDiario td ON p.DNI = td.DNI
    ORDER BY td.Fecha DESC;
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Error al obtener pacientes con test:", err);
      res.status(500).send("Error en la base de datos");
      return;
    }

    res.json(result);
  });
});

app.get("/respuestas", (req, res) => {
  const dni = req.query.dni;

  const sql = `
    SELECT rt.Fecha, rt.PuntuacionTotal
    FROM RespuestasTotales rt
    JOIN Anonimo a ON rt.AnonimoID = a.ID
    JOIN PacienteAnonimo pa ON pa.AnonimoID = a.ID
    JOIN Paciente p ON p.ID = pa.PacienteID
    WHERE p.DNI = ?
    ORDER BY rt.Fecha;
  `;

  db.query(sql, [dni], (err, result) => {
    if (err) {
      console.error("❌ Error al obtener respuestas:", err);
      return res.status(500).send("Error en la base de datos");
    }

    res.json(result);
  });
});

// Ruta de prueba para que puedas verificar que funciona
app.get("/", (req, res) => {
  res.send("🎉 API activa desde Replit");
});

app.post("/login", (req, res) => {
  const { dni, password } = req.body;
  const sql = `
    SELECT * FROM Medico
    WHERE DNI = ? AND Contraseña = ?;
  `;
  db.query(sql, [dni, password], (err, result) => {
    if (err) {
      console.error("❌ Error en el login:", err);
      return res.status(500).send("Error en la base de datos");
    }
    if (result.length > 0) {
      res.status(200).json({ success: true, message: "Login correcto" });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Credenciales incorrectas" });
    }
  });
});

// Ruta para obtener los pacientes de un médico
app.get("/pacientes", (req, res) => {
  const medicoDNI = req.query.medicoDNI;
  const sql = `
    SELECT p.HistorialClinico, p.Nombre, p.Apellido, p.Edad, p.Diagnostico
    FROM MedicoPaciente mp
    JOIN Paciente p ON mp.PacienteDNI = p.DNI
    WHERE mp.MedicoDNI = ?;
  `;
  db.query(sql, [medicoDNI], (err, result) => {
    if (err) {
      console.error("❌ Error en la consulta:", err);
      res.status(500).send("Error en la base de datos");
      return;
    }
    res.json(result);
  });
});

app.get("/frases", (req, res) => {
  const sql = "SELECT MensajeMotivacional FROM Banco_Foro;";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error en la consulta de frases:", err);
      res.status(500).send("Error en la base de datos");
      return;
    }
    res.json(result);
  });
});

// Ruta para obtener resultados del test diario
app.get("/testdiario", (req, res) => {
  const pacienteDNI = req.query.pacienteDNI;
  const sql = `
    SELECT Fecha, Estado, Contador
    FROM PacienteTestDiario
    WHERE DNI = ?;
  `;
  db.query(sql, [pacienteDNI], (err, result) => {
    if (err) {
      console.error("❌ Error en la consulta:", err);
      res.status(500).send("Error en la base de datos");
      return;
    }
    res.json(result);
  });
});

// Iniciar servidor
const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Servidor API funcionando en el puerto ${port}`);
});
