const express = require('express');
const { consultarTodos, consultarUm, executar } = require('../configuracoes/banco');
const {
  ehCaminhoImagemLocal,
  ehDataUrlImagem,
  removerArquivoImagem,
  salvarImagemItemOrcamento
} = require('../utilitarios/imagens');
const { montarUrlArquivo, obterBaseUrlApi } = require('../utilitarios/urlApi');
const { validarReferenciasAtivasDaEntidade } = require('../utilitarios/validarReferenciasAtivas');
const {
  adicionarFiltroBusca,
  adicionarFiltroIgual,
  adicionarFiltroLista,
  adicionarFiltroPeriodo,
  montarWhere
} = require('../utilitarios/filtrosSql');

const rotaOrcamentos = express.Router();
const IDS_ETAPAS_ORCAMENTO_FECHADAS = new Set([1, 2, 3]);

rotaOrcamentos.get('/', async (requisicao, resposta) => {
  try {
    const clausulas = [];
    const parametros = [];
    const { query } = requisicao;

    adicionarFiltroBusca(clausulas, parametros, query.search, [
      'COALESCE(cliente.nomeFantasia, cliente.razaoSocial)',
      'contato.nome',
      'usuario.nome',
      'vendedorCliente.nome',
      'vendedorOrcamento.nome',
      'prazoPagamento.descricao',
      'metodoPagamento.descricao',
      'etapaOrcamento.descricao',
      'motivoPerda.descricao',
      'orcamento.observacao',
      'CAST(orcamento.idOrcamento AS TEXT)'
    ]);
    adicionarFiltroIgual(clausulas, parametros, 'orcamento.idCliente', query.idCliente, Number);
    adicionarFiltroLista(clausulas, parametros, 'orcamento.idUsuario', query.idUsuario, Number);
    adicionarFiltroLista(clausulas, parametros, 'cliente.idVendedor', query.idVendedorCliente, Number);
    adicionarFiltroLista(clausulas, parametros, 'orcamento.idVendedor', query.idVendedor, Number);
    adicionarFiltroLista(clausulas, parametros, 'orcamento.idEtapaOrcamento', query.idsEtapaOrcamento, Number);
    adicionarFiltroPeriodo(clausulas, parametros, 'orcamento.dataInclusao', query.dataInclusaoInicio, query.dataInclusaoFim);
    adicionarFiltroPeriodo(clausulas, parametros, 'orcamento.dataFechamento', query.dataFechamentoInicio, query.dataFechamentoFim);

    if (query.escopoIdVendedor && query.escopoIdUsuario) {
      clausulas.push('(cliente.idVendedor = ? OR orcamento.idUsuario = ?)');
      parametros.push(Number(query.escopoIdVendedor), Number(query.escopoIdUsuario));
    }

    const registros = await consultarTodos(`
      SELECT
        orcamento.idOrcamento
      FROM orcamento
      LEFT JOIN cliente ON cliente.idCliente = orcamento.idCliente
      LEFT JOIN contato ON contato.idContato = orcamento.idContato
      LEFT JOIN usuario ON usuario.idUsuario = orcamento.idUsuario
      LEFT JOIN vendedor AS vendedorCliente ON vendedorCliente.idVendedor = cliente.idVendedor
      LEFT JOIN vendedor AS vendedorOrcamento ON vendedorOrcamento.idVendedor = orcamento.idVendedor
      LEFT JOIN prazoPagamento ON prazoPagamento.idPrazoPagamento = orcamento.idPrazoPagamento
      LEFT JOIN metodoPagamento ON metodoPagamento.idMetodoPagamento = prazoPagamento.idMetodoPagamento
      LEFT JOIN etapaOrcamento ON etapaOrcamento.idEtapaOrcamento = orcamento.idEtapaOrcamento
      LEFT JOIN motivoPerda ON motivoPerda.idMotivo = orcamento.idMotivoPerda
      ${montarWhere(clausulas)}
      ORDER BY orcamento.idOrcamento DESC
    `, parametros);

    const registrosCompletos = await Promise.all(
      registros.map((registro) => consultarOrcamentoCompleto(registro.idOrcamento))
    );

    resposta.json(registrosCompletos.filter(Boolean));
  } catch (_erro) {
    resposta.status(500).json({ mensagem: 'Ocorreu um erro ao processar a requisicao.' });
  }
});

rotaOrcamentos.get('/:id', async (requisicao, resposta) => {
  try {
    const registro = await consultarOrcamentoCompleto(Number(requisicao.params.id));

    if (!registro) {
      resposta.status(404).json({ mensagem: 'Registro nao encontrado.' });
      return;
    }

    resposta.json(registro);
  } catch (_erro) {
    resposta.status(500).json({ mensagem: 'Ocorreu um erro ao processar a requisicao.' });
  }
});

rotaOrcamentos.post('/', async (requisicao, resposta) => {
  try {
    const payload = aplicarAutomacoesFechamentoOrcamento(normalizarPayloadOrcamento(requisicao.body));
    await validarReferenciasAtivasDaEntidade('orcamento', payload);
    const etapaOrcamento = await obterEtapaOrcamento(payload.idEtapaOrcamento);
    const cliente = await obterCliente(payload.idCliente);
    const mensagemValidacao = validarPayloadOrcamento(payload, etapaOrcamento);

    if (mensagemValidacao) {
      resposta.status(400).json({ mensagem: mensagemValidacao });
      return;
    }

    await executar('BEGIN TRANSACTION');

    const resultado = await executar(
      `INSERT INTO orcamento (
        idCliente,
        idContato,
        idUsuario,
        idVendedor,
        comissao,
        idPrazoPagamento,
        idEtapaOrcamento,
        idMotivoPerda,
        dataInclusao,
        dataValidade,
        dataFechamento,
        observacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.idCliente,
        payload.idContato,
        payload.idUsuario,
        payload.idVendedor,
        payload.comissao,
        payload.idPrazoPagamento,
        payload.idEtapaOrcamento,
        payload.idMotivoPerda,
        payload.dataInclusao,
        payload.dataValidade,
        payload.dataFechamento,
        payload.observacao
      ]
    );

    await salvarItensOrcamento(resultado.id, payload.itens, cliente);
    await salvarCamposOrcamento(resultado.id, payload.camposExtras);
    await executar('COMMIT');

    const registro = await consultarOrcamentoCompleto(resultado.id);
    resposta.status(201).json(registro);
  } catch (_erro) {
    if (_erro.statusCode === 400) {
      resposta.status(400).json({ mensagem: _erro.message });
      return;
    }

    await tentarRollback();
    resposta.status(500).json({ mensagem: 'Nao foi possivel concluir a operacao por violacao de integridade dos dados.' });
  }
});

rotaOrcamentos.put('/:id', async (requisicao, resposta) => {
  try {
    const idOrcamento = Number(requisicao.params.id);
    const existente = await consultarUm('SELECT * FROM orcamento WHERE idOrcamento = ?', [idOrcamento]);

    if (!existente) {
      resposta.status(404).json({ mensagem: 'Registro nao encontrado.' });
      return;
    }

    const payload = aplicarAutomacoesFechamentoOrcamento(normalizarPayloadOrcamento({
      ...existente,
      ...requisicao.body
    }), existente);
    await validarReferenciasAtivasDaEntidade('orcamento', payload);
    const etapaOrcamento = await obterEtapaOrcamento(payload.idEtapaOrcamento);
    const cliente = await obterCliente(payload.idCliente);
    const itensAtuais = await consultarTodos('SELECT imagem FROM itemOrcamento WHERE idOrcamento = ?', [idOrcamento]);
    const mensagemValidacao = validarPayloadOrcamento(payload, etapaOrcamento);

    if (mensagemValidacao) {
      resposta.status(400).json({ mensagem: mensagemValidacao });
      return;
    }

    if (
      existente.idPedidoVinculado &&
      String(existente.idEtapaOrcamento || '') !== String(payload.idEtapaOrcamento || '')
    ) {
      resposta.status(400).json({ mensagem: 'Nao e possivel alterar a etapa de um orcamento com pedido vinculado.' });
      return;
    }

    await executar('BEGIN TRANSACTION');
    await executar(
      `UPDATE orcamento SET
        idCliente = ?,
        idContato = ?,
        idUsuario = ?,
        idVendedor = ?,
        comissao = ?,
        idPrazoPagamento = ?,
        idEtapaOrcamento = ?,
        idMotivoPerda = ?,
        dataInclusao = ?,
        dataValidade = ?,
        dataFechamento = ?,
        observacao = ?
      WHERE idOrcamento = ?`,
      [
        payload.idCliente,
        payload.idContato,
        payload.idUsuario,
        payload.idVendedor,
        payload.comissao,
        payload.idPrazoPagamento,
        payload.idEtapaOrcamento,
        payload.idMotivoPerda,
        payload.dataInclusao,
        payload.dataValidade,
        payload.dataFechamento,
        payload.observacao,
        idOrcamento
      ]
    );

    await executar('DELETE FROM itemOrcamento WHERE idOrcamento = ?', [idOrcamento]);
    await executar('DELETE FROM valorCampoOrcamento WHERE idOrcamento = ?', [idOrcamento]);
    await salvarItensOrcamento(idOrcamento, payload.itens, cliente);
    await salvarCamposOrcamento(idOrcamento, payload.camposExtras);
    await executar('COMMIT');

    removerImagensItensNaoUtilizadas(
      itensAtuais.map((item) => item.imagem),
      payload.itens.map((item) => item.imagem)
    );

    const registro = await consultarOrcamentoCompleto(idOrcamento);
    resposta.json(registro);
  } catch (_erro) {
    if (_erro.statusCode === 400) {
      resposta.status(400).json({ mensagem: _erro.message });
      return;
    }

    await tentarRollback();
    resposta.status(500).json({ mensagem: 'Nao foi possivel concluir a operacao por violacao de integridade dos dados.' });
  }
});

rotaOrcamentos.delete('/:id', async (requisicao, resposta) => {
  try {
    const idOrcamento = Number(requisicao.params.id);
    const existente = await consultarUm('SELECT * FROM orcamento WHERE idOrcamento = ?', [idOrcamento]);
    const itensAtuais = await consultarTodos('SELECT imagem FROM itemOrcamento WHERE idOrcamento = ?', [idOrcamento]);

    if (!existente) {
      resposta.status(404).json({ mensagem: 'Registro nao encontrado.' });
      return;
    }

    if (existente.idPedidoVinculado) {
      resposta.status(400).json({ mensagem: 'Nao e possivel excluir um orcamento com pedido vinculado.' });
      return;
    }

    await executar('BEGIN TRANSACTION');
    await executar('DELETE FROM itemOrcamento WHERE idOrcamento = ?', [idOrcamento]);
    await executar('DELETE FROM valorCampoOrcamento WHERE idOrcamento = ?', [idOrcamento]);
    await executar('DELETE FROM orcamento WHERE idOrcamento = ?', [idOrcamento]);
    await executar('COMMIT');

    itensAtuais.forEach((item) => {
      if (ehCaminhoImagemLocal(item.imagem)) {
        removerArquivoImagem(item.imagem);
      }
    });

    resposta.status(204).send();
  } catch (_erro) {
    await tentarRollback();
    resposta.status(500).json({ mensagem: 'Ocorreu um erro ao processar a requisicao.' });
  }
});

async function consultarOrcamentoCompleto(idOrcamento) {
  const orcamento = await consultarUm(
    'SELECT * FROM orcamento WHERE idOrcamento = ?',
    [idOrcamento]
  );

  if (!orcamento) {
    return null;
  }

  const [itens, camposExtras] = await Promise.all([
    consultarTodos(
      `SELECT * FROM itemOrcamento WHERE idOrcamento = ? ORDER BY idItemOrcamento ASC`,
      [idOrcamento]
    ),
    consultarTodos(
      `SELECT * FROM valorCampoOrcamento WHERE idOrcamento = ? ORDER BY idValorCampoOrcamento ASC`,
      [idOrcamento]
    )
  ]);

  return {
    ...orcamento,
    itens: itens.map(normalizarItemImagem),
    camposExtras
  };
}

function normalizarPayloadOrcamento(payload) {
  return {
    idCliente: payload.idCliente ? Number(payload.idCliente) : null,
    idContato: payload.idContato ? Number(payload.idContato) : null,
    idUsuario: payload.idUsuario ? Number(payload.idUsuario) : null,
    idVendedor: payload.idVendedor ? Number(payload.idVendedor) : null,
    comissao: payload.comissao === '' || payload.comissao === null || payload.comissao === undefined
      ? 0
      : Number(payload.comissao),
    idPrazoPagamento: payload.idPrazoPagamento ? Number(payload.idPrazoPagamento) : null,
    idEtapaOrcamento: payload.idEtapaOrcamento ? Number(payload.idEtapaOrcamento) : null,
    idMotivoPerda: payload.idMotivoPerda ? Number(payload.idMotivoPerda) : null,
    dataInclusao: limparTexto(payload.dataInclusao),
    dataValidade: limparTexto(payload.dataValidade),
    dataFechamento: limparTexto(payload.dataFechamento),
    observacao: limparTexto(payload.observacao),
    itens: normalizarItensOrcamento(payload.itens),
    camposExtras: normalizarCamposExtras(payload.camposExtras)
  };
}

function aplicarAutomacoesFechamentoOrcamento(payload, orcamentoAtual = null) {
  const proximoPayload = {
    ...payload
  };
  const entrouEmEtapaFechada = !etapaOrcamentoEhFechada(orcamentoAtual?.idEtapaOrcamento)
    && etapaOrcamentoEhFechada(proximoPayload.idEtapaOrcamento);

  if (entrouEmEtapaFechada && (!proximoPayload.dataFechamento || proximoPayload.dataFechamento === limparTexto(orcamentoAtual?.dataFechamento))) {
    proximoPayload.dataFechamento = obterDataAtualFormatoInput();
  }

  return proximoPayload;
}

function normalizarItensOrcamento(itens) {
  if (!Array.isArray(itens)) {
    return [];
  }

  return itens
    .map((item) => ({
      idProduto: item.idProduto ? Number(item.idProduto) : null,
      quantidade: item.quantidade === '' || item.quantidade === null || item.quantidade === undefined
        ? null
        : Number(item.quantidade),
      valorUnitario: item.valorUnitario === '' || item.valorUnitario === null || item.valorUnitario === undefined
        ? null
        : Number(item.valorUnitario),
      valorTotal: item.valorTotal === '' || item.valorTotal === null || item.valorTotal === undefined
        ? null
        : Number(item.valorTotal),
      imagem: normalizarImagemItemPayload(item.imagem),
      observacao: limparTexto(item.observacao),
      referenciaProdutoSnapshot: limparTexto(item.referenciaProdutoSnapshot),
      descricaoProdutoSnapshot: limparTexto(item.descricaoProdutoSnapshot),
      unidadeProdutoSnapshot: limparTexto(item.unidadeProdutoSnapshot)
    }))
    .filter((item) => item.idProduto && item.quantidade && item.valorUnitario !== null);
}

function normalizarCamposExtras(camposExtras) {
  if (!Array.isArray(camposExtras)) {
    return [];
  }

  return camposExtras
    .map((campo) => ({
      idCampoOrcamento: campo.idCampoOrcamento ? Number(campo.idCampoOrcamento) : null,
      valor: limparTexto(campo.valor)
    }))
    .filter((campo) => campo.idCampoOrcamento);
}

function validarPayloadOrcamento(payload, etapaOrcamento) {
  if (!payload.idCliente) {
    return 'Selecione o cliente do orcamento.';
  }

  if (!payload.idUsuario) {
    return 'Selecione o usuario do registro.';
  }

  if (!payload.idVendedor) {
    return 'Selecione o vendedor.';
  }

  if (payload.itens.length === 0) {
    return 'Inclua ao menos um item no orcamento.';
  }

  if (etapaOrcamentoEhFechada(payload.idEtapaOrcamento) && !payload.dataFechamento) {
    return 'Informe a data de fechamento para orcamentos nas etapas Fechado, Fechado sem pedido ou Recusado.';
  }

  if (etapaOrcamento?.obrigarMotivoPerda && !payload.idMotivoPerda) {
    return 'Selecione o motivo da perda para esta etapa do orcamento.';
  }

  return '';
}

async function salvarItensOrcamento(idOrcamento, itens, cliente) {
  for (const item of itens) {
    const produto = await obterProduto(item.idProduto);
    const resultado = await executar(
      `INSERT INTO itemOrcamento (
        idOrcamento,
        idProduto,
        quantidade,
        valorUnitario,
        valorTotal,
        imagem,
        observacao,
        referenciaProdutoSnapshot,
        descricaoProdutoSnapshot,
        unidadeProdutoSnapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idOrcamento,
        item.idProduto,
        item.quantidade,
        item.valorUnitario,
        item.valorTotal,
        ehDataUrlImagem(item.imagem) ? null : item.imagem,
        item.observacao,
        item.referenciaProdutoSnapshot || produto?.referencia || null,
        item.descricaoProdutoSnapshot || produto?.descricao || null,
        item.unidadeProdutoSnapshot || produto?.nomeUnidadeMedida || produto?.siglaUnidadeMedida || null
      ]
    );

    if (ehDataUrlImagem(item.imagem)) {
      const caminhoImagem = salvarImagemItemOrcamento({
        idOrcamento,
        nomeCliente: cliente?.nomeFantasia || cliente?.razaoSocial || `cliente-${cliente?.idCliente || ''}`,
        idItemOrcamento: resultado.id,
        valorImagem: item.imagem
      });

      await executar(
        'UPDATE itemOrcamento SET imagem = ? WHERE idItemOrcamento = ?',
        [caminhoImagem, resultado.id]
      );
    }
  }
}

async function salvarCamposOrcamento(idOrcamento, camposExtras) {
  for (const campo of camposExtras) {
    await executar(
      `INSERT INTO valorCampoOrcamento (
        idOrcamento,
        idCampoOrcamento,
        valor
      ) VALUES (?, ?, ?)`,
      [idOrcamento, campo.idCampoOrcamento, campo.valor]
    );
  }
}

async function obterEtapaOrcamento(idEtapaOrcamento) {
  if (!idEtapaOrcamento) {
    return null;
  }

  return consultarUm(
    'SELECT * FROM etapaOrcamento WHERE idEtapaOrcamento = ?',
    [idEtapaOrcamento]
  );
}

async function obterCliente(idCliente) {
  if (!idCliente) {
    return null;
  }

  return consultarUm('SELECT idCliente, nomeFantasia, razaoSocial FROM cliente WHERE idCliente = ?', [idCliente]);
}

async function obterProduto(idProduto) {
  if (!idProduto) {
    return null;
  }

  return consultarUm('SELECT * FROM produto WHERE idProduto = ?', [idProduto]);
}

function normalizarImagemItemPayload(valorImagem) {
  if (ehDataUrlImagem(valorImagem)) {
    return valorImagem;
  }

  return desnormalizarCaminhoImagem(valorImagem);
}

function normalizarItemImagem(item) {
  return {
    ...item,
    imagem: normalizarCaminhoImagem(item.imagem)
  };
}

function normalizarCaminhoImagem(valorImagem) {
  if (!ehCaminhoImagemLocal(valorImagem)) {
    return valorImagem || '';
  }

  return montarUrlArquivo(valorImagem);
}

function desnormalizarCaminhoImagem(valorImagem) {
  if (typeof valorImagem !== 'string') {
    return valorImagem || null;
  }

  const prefixoCompleto = `${obterBaseUrlApi()}/api/arquivos/`;
  const prefixoRelativo = '/api/arquivos/';

  if (valorImagem.startsWith(prefixoCompleto)) {
    return valorImagem.slice(prefixoCompleto.length);
  }

  if (valorImagem.startsWith(prefixoRelativo)) {
    return valorImagem.slice(prefixoRelativo.length);
  }

  return valorImagem || null;
}

function removerImagensItensNaoUtilizadas(imagensAtuais, imagensNovas) {
  const imagensMantidas = new Set(
    imagensNovas
      .filter((imagem) => ehCaminhoImagemLocal(desnormalizarCaminhoImagem(imagem)))
      .map((imagem) => desnormalizarCaminhoImagem(imagem))
  );

  imagensAtuais.forEach((imagem) => {
    if (ehCaminhoImagemLocal(imagem) && !imagensMantidas.has(imagem)) {
      removerArquivoImagem(imagem);
    }
  });
}

function limparTexto(valor) {
  const texto = String(valor || '').trim();
  return texto || null;
}

function etapaOrcamentoEhFechada(idEtapaOrcamento) {
  return IDS_ETAPAS_ORCAMENTO_FECHADAS.has(Number(idEtapaOrcamento));
}

function obterDataAtualFormatoInput() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

async function tentarRollback() {
  try {
    await executar('ROLLBACK');
  } catch (_erro) {
    return;
  }
}

module.exports = {
  rotaOrcamentos
};
