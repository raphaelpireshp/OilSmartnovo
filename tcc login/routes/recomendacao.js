const express = require("express");
const router = express.Router();
const db = require("../database/db");

// Rota para obter todas as recomendações
router.get("/", (req, res) => {
  const sql = "SELECT * FROM recomendacao";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar recomendações:", err);
      res.status(500).json({ error: "Erro interno do servidor" });
      return;
    }
    res.json(results);
  });
});

module.exports = router;


