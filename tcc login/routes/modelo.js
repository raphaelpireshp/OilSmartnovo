const express = require("express");
const router = express.Router();
const db = require("../database/db");

// Rota para obter modelos por marca (via query parameter)
router.get("/", (req, res) => {
  const { marca_id } = req.query;
  if (!marca_id) {
    return res.status(400).json({ error: "marca_id é obrigatório" });
  }
  
  const sql = "SELECT * FROM modelo WHERE marca_id = ?";
  db.query(sql, [marca_id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar modelos:", err);
      res.status(500).json({ error: "Erro interno do servidor" });
      return;
    }
    res.json(results);
  });
});

// Rota para obter modelos por marca (via parâmetro de URL)
router.get("/:marcaId", (req, res) => {
  const { marcaId } = req.params;
  const sql = "SELECT * FROM modelo WHERE marca_id = ?";
  db.query(sql, [marcaId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar modelos:", err);
      res.status(500).json({ error: "Erro interno do servidor" });
      return;
    }
    res.json(results);
  });
});

module.exports = router;


