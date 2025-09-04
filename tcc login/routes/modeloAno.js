const express = require("express");
const router = express.Router();
const db = require("../database/db");

// Rota para obter anos de modelo por modelo (via query parameter)
router.get("/", (req, res) => {
  const { modelo_id } = req.query;
  if (!modelo_id) {
    return res.status(400).json({ error: "modelo_id é obrigatório" });
  }
  
  const sql = "SELECT * FROM modelo_ano WHERE modelo_id = ?";
  db.query(sql, [modelo_id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar anos de modelo:", err);
      res.status(500).json({ error: "Erro interno do servidor" });
      return;
    }
    res.json(results);
  });
});

// Rota para obter anos de modelo por modelo (via parâmetro de URL)
router.get("/:modeloId", (req, res) => {
  const { modeloId } = req.params;
  const sql = "SELECT * FROM modelo_ano WHERE modelo_id = ?";
  db.query(sql, [modeloId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar anos de modelo:", err);
      res.status(500).json({ error: "Erro interno do servidor" });
      return;
    }
    res.json(results);
  });
});

module.exports = router;


