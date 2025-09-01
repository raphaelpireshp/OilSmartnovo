const express = require("express");
const router = express.Router();
const db = require("../database/db");

// Rota para obter todas as marcas
router.get("/", (req, res) => {
  const sql = "SELECT * FROM marca";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar marcas:", err);
      res.status(500).json({ error: "Erro interno do servidor" });
      return;
    }
    res.json(results);
  });
});

module.exports = router;


