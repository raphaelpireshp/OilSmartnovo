const express = require("express");
const router = express.Router();
const db = require("../database/db");

// Rota para obter todos os veículos
router.get("/", (req, res) => {
  const sql = "SELECT * FROM veiculo";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar veículos:", err);
      res.status(500).json({ error: "Erro interno do servidor" });
      return;
    }
    res.json(results);
  });
});

module.exports = router;


