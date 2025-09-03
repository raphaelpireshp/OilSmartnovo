const express = require("express");
const router = express.Router();
const axios = require("axios");

// Rota para geocodificação usando Nominatim (OpenStreetMap)
router.get("/", async (req, res) => {
  const { address } = req.query;
  if (!address) {
    return res.status(400).json({ error: "Endereço não fornecido" });
  }

  try {
    // URL do Nominatim para geocodificação
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: address,       // endereço a ser buscado
        format: "json",   // formato da resposta
        addressdetails: 1,// detalhes do endereço
        limit: 1          // retornar apenas o resultado mais próximo
      },
      headers: {
        "User-Agent": "SeuAppNome/1.0 (seu-email@example.com)" // obrigatório pelo Nominatim
      }
    });

    if (response.data.length === 0) {
      return res.status(404).json({ error: "Endereço não encontrado" });
    }

    // Retorna latitude e longitude do primeiro resultado
    const result = response.data[0];
    res.json({
      latitude: result.lat,
      longitude: result.lon,
      display_name: result.display_name,
      address: result.address
    });

  } catch (error) {
    console.error("Erro na geocodificação:", error.message);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;
