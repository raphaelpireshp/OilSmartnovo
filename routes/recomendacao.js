const express = require("express");
const router = express.Router();
const db = require("../database/db");

router.get("/", (req, res) => {
  const { modelo_ano_id } = req.query;

  console.log("Recebida requisição para modelo_ano_id:", modelo_ano_id);

  if (!modelo_ano_id) {
    return res.status(400).json({ 
      success: false, 
      message: "O 'modelo_ano_id' é obrigatório." 
    });
  }

  // Consulta otimizada para buscar recomendações
  const sql = `
    SELECT 
      r.id AS recomendacao_id,
      oleo.id AS oleo_id,
      oleo.nome AS oleo_nome,
      oleo.tipo AS oleo_tipo,
      oleo.viscosidade AS oleo_viscosidade,
      oleo.especificacao AS oleo_especificacao,
      oleo.marca AS oleo_marca,
      COALESCE(oleo.preco, 0) AS oleo_preco,
      filtro.id AS filtro_id,
      filtro.nome AS filtro_nome,
      filtro.tipo AS filtro_tipo,
      filtro.compatibilidade_modelo AS filtro_compatibilidade,
      COALESCE(filtro.preco, 0) AS filtro_preco,
      m.nome AS modelo_nome,
      mar.nome AS marca_nome,
      ma.ano AS ano_modelo
    FROM recomendacao r
    LEFT JOIN produto_oleo oleo ON r.oleo_id = oleo.id
    LEFT JOIN produto_filtro filtro ON r.filtro_id = filtro.id
    LEFT JOIN modelo_ano ma ON r.modelo_ano_id = ma.id
    LEFT JOIN modelo m ON ma.modelo_id = m.id
    LEFT JOIN marca mar ON m.marca_id = mar.id
    WHERE r.modelo_ano_id = ?
    LIMIT 1
  `;

  console.log("Executando SQL para recomendação");
  
  db.query(sql, [modelo_ano_id], (err, results) => {
    if (err) {
      console.error("Erro MySQL ao buscar recomendação:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor ao buscar recomendação." 
      });
    }

    console.log("Resultados encontrados:", results.length);

    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Nenhuma recomendação encontrada para o veículo selecionado." 
      });
    }

    const recomendacao = results[0];
    
    // Formatar resposta
    const response = {
      success: true,
      data: {
        veiculo: {
          modelo: recomendacao.modelo_nome,
          marca: recomendacao.marca_nome,
          ano: recomendacao.ano_modelo
        },
        oleo: recomendacao.oleo_id ? {
          id: recomendacao.oleo_id,
          nome: recomendacao.oleo_nome,
          tipo: recomendacao.oleo_tipo,
          viscosidade: recomendacao.oleo_viscosidade,
          especificacao: recomendacao.oleo_especificacao,
          marca: recomendacao.oleo_marca,
          preco: parseFloat(recomendacao.oleo_preco)
        } : null,
        filtro: recomendacao.filtro_id ? {
          id: recomendacao.filtro_id,
          nome: recomendacao.filtro_nome,
          tipo: recomendacao.filtro_tipo,
          compatibilidade_modelo: recomendacao.filtro_compatibilidade,
          preco: parseFloat(recomendacao.filtro_preco)
        } : null,
        total: (parseFloat(recomendacao.oleo_preco || 0) + parseFloat(recomendacao.filtro_preco || 0)).toFixed(2)
      }
    };

    console.log("Recomendação enviada com sucesso");
    res.json(response);
  });
});

// Nova rota para buscar recomendações por modelo, marca e ano
router.get("/por-veiculo", (req, res) => {
  const { marca_id, modelo_id, ano } = req.query;

  if (!marca_id || !modelo_id || !ano) {
    return res.status(400).json({ 
      success: false, 
      message: "Os parâmetros 'marca_id', 'modelo_id' e 'ano' são obrigatórios." 
    });
  }

  const sql = `
    SELECT 
      r.id AS recomendacao_id,
      oleo.id AS oleo_id,
      oleo.nome AS oleo_nome,
      oleo.tipo AS oleo_tipo,
      oleo.viscosidade AS oleo_viscosidade,
      oleo.especificacao AS oleo_especificacao,
      oleo.marca AS oleo_marca,
      COALESCE(oleo.preco, 0) AS oleo_preco,
      filtro.id AS filtro_id,
      filtro.nome AS filtro_nome,
      filtro.tipo AS filtro_tipo,
      filtro.compatibilidade_modelo AS filtro_compatibilidade,
      COALESCE(filtro.preco, 0) AS filtro_preco,
      m.nome AS modelo_nome,
      mar.nome AS marca_nome,
      ma.ano AS ano_modelo
    FROM recomendacao r
    LEFT JOIN produto_oleo oleo ON r.oleo_id = oleo.id
    LEFT JOIN produto_filtro filtro ON r.filtro_id = filtro.id
    LEFT JOIN modelo_ano ma ON r.modelo_ano_id = ma.id
    LEFT JOIN modelo m ON ma.modelo_id = m.id
    LEFT JOIN marca mar ON m.marca_id = mar.id
    WHERE m.marca_id = ? AND m.id = ? AND ma.ano = ?
    LIMIT 1
  `;

  db.query(sql, [marca_id, modelo_id, ano], (err, results) => {
    if (err) {
      console.error("Erro MySQL ao buscar recomendação por veículo:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor." 
      });
    }

    if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Nenhuma recomendação encontrada para o veículo especificado." 
      });
    }

    const recomendacao = results[0];
    
    const response = {
      success: true,
      data: {
        veiculo: {
          modelo: recomendacao.modelo_nome,
          marca: recomendacao.marca_nome,
          ano: recomendacao.ano_modelo
        },
        oleo: {
          id: recomendacao.oleo_id,
          nome: recomendacao.oleo_nome,
          tipo: recomendacao.oleo_tipo,
          viscosidade: recomendacao.oleo_viscosidade,
          especificacao: recomendacao.oleo_especificacao,
          marca: recomendacao.oleo_marca,
          preco: parseFloat(recomendacao.oleo_preco)
        },
        filtro: {
          id: recomendacao.filtro_id,
          nome: recomendacao.filtro_nome,
          tipo: recomendacao.filtro_tipo,
          compatibilidade_modelo: recomendacao.filtro_compatibilidade,
          preco: parseFloat(recomendacao.filtro_preco)
        },
        total: (parseFloat(recomendacao.oleo_preco || 0) + parseFloat(recomendacao.filtro_preco || 0)).toFixed(2)
      }
    };

    res.json(response);
  });
});

module.exports = router;