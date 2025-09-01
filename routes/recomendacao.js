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

  // Primeiro, verificar se as colunas de preço existem
  const checkColumnsSql = `
    SELECT 
      COUNT(*) AS has_oleo_preco 
    FROM information_schema.columns 
    WHERE table_name = 'produto_oleo' AND column_name = 'preco'
    UNION ALL
    SELECT 
      COUNT(*) AS has_filtro_preco 
    FROM information_schema.columns 
    WHERE table_name = 'produto_filtro' AND column_name = 'preco'
  `;

  db.query(checkColumnsSql, (err, columnResults) => {
    if (err) {
      console.error("Erro ao verificar colunas:", err);
      // Continuar mesmo com erro, assumindo que preços não existem
      return executeMainQuery(false, false);
    }

    const hasOleoPreco = columnResults[0]?.has_oleo_preco > 0;
    const hasFiltroPreco = columnResults[1]?.has_filtro_preco > 0;

    console.log("Colunas encontradas - oleo_preco:", hasOleoPreco, "filtro_preco:", hasFiltroPreco);
    executeMainQuery(hasOleoPreco, hasFiltroPreco);
  });

// Substitua a função executeMainQuery por esta versão corrigida
function executeMainQuery(hasOleoPreco, hasFiltroPreco) {
  let sql = `
    SELECT 
      r.id AS recomendacao_id,
      oleo.id AS oleo_id,
      oleo.nome AS oleo_nome,
      oleo.tipo AS oleo_tipo,
      oleo.viscosidade AS oleo_viscosidade,
      oleo.especificacao AS oleo_especificacao,
      oleo.marca AS oleo_marca,
      filtro.id AS filtro_id,
      filtro.nome AS filtro_nome,
      filtro.tipo AS filtro_tipo,
      filtro.compatibilidade_modelo AS filtro_compatibilidade
  `;

  // Adicionar colunas de preço apenas se existirem
  if (hasOleoPreco) {
    sql += `, oleo.preco AS oleo_preco`;
  } else {
    sql += `, 0.00 AS oleo_preco`;
  }

  if (hasFiltroPreco) {
    sql += `, filtro.preco AS filtro_preco`;
  } else {
    sql += `, 0.00 AS filtro_preco`;
  }

  sql += `
    FROM recomendacao r
    LEFT JOIN produto_oleo oleo ON r.oleo_id = oleo.id
    LEFT JOIN produto_filtro filtro ON r.filtro_id = filtro.id
    WHERE r.modelo_ano_id = ?
    ORDER BY oleo.id, filtro.id
    LIMIT 1
  `;

  console.log("Executando SQL:", sql);
  console.log("Com parâmetros:", [modelo_ano_id]);

  db.query(sql, [modelo_ano_id], (err, results) => {
    if (err) {
      console.error("Erro MySQL ao buscar recomendação:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor ao buscar recomendação." 
      });
    }

    console.log("Resultados da query:", results);

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
        oleo: recomendacao.oleo_id ? {
          id: recomendacao.oleo_id,
          nome: recomendacao.oleo_nome,
          tipo: recomendacao.oleo_tipo,
          viscosidade: recomendacao.oleo_viscosidade,
          especificacao: recomendacao.oleo_especificacao,
          marca: recomendacao.oleo_marca,
          preco: parseFloat(recomendacao.oleo_preco) || 0
        } : null,
        filtro: recomendacao.filtro_id ? {
          id: recomendacao.filtro_id,
          nome: recomendacao.filtro_nome,
          tipo: recomendacao.filtro_tipo,
          compatibilidade_modelo: recomendacao.filtro_compatibilidade,
          preco: parseFloat(recomendacao.filtro_preco) || 0
        } : null,
        total: ((parseFloat(recomendacao.oleo_preco || 0) + parseFloat(recomendacao.filtro_preco || 0)).toFixed(2))
      }
    };

    res.json(response);
  });
}
});

module.exports = router;