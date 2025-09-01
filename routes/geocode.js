const express = require("express");
const router = express.Router();
const axios = require("axios");

// Rota para geocodificação usando Domination
router.get("/", async (req, res) => {
  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ error: "Endereço não fornecido" });
  }

  try {
    // Exemplo de URL da API Domination (substitua pela URL e chave reais)
    const response = await axios.get("https://api.domination.com/geocode", {
      params: {
        address: address,
        key: "SUA_CHAVE_DOMINATION"
      }
    });

    // Retorna a resposta da Domination diretamente
    res.json(response.data);

  } catch (error) {
    console.error("Erro na geocodificação:", error.response?.data || error.message);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;
