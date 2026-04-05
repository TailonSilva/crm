const express = require('express');
const {
  ID_ETAPA_ORCAMENTO_PEDIDO_EXCLUIDO,
  ID_ETAPA_PEDIDO_ENTREGUE,
  consultarTodos,
  consultarUm,
  executar
} = require('../configuracoes/banco');
const {
  ehCaminhoImagemLocal,
  ehDataUrlImagem,
  removerArquivoImagem,
  salvarImagemItemPedido
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

const rotaPedidos = express.Router();

rotaPedidos.get('/', async (requisicao, resposta) => {
  try {
    const clausulas = [];
    const parametros = [];
    const { query } = requisicao;

    adicionarFiltroBusca(clausulas, parametros, query.search, [
      'CAST(pedido.idPedido AS TEXT)',
      'CAST(pedido.codigoOrcamentoOrigem AS TEXT)',
      'pedido.nomeClienteSnapshot',
      'pedido.nomeContatoSnapshot',
      'pedido.nomeUsuarioSnapshot',
      'pedido.nomeVendedorSnapshot',
      'pedido.nomePrazoPagamentoSnapshot',
      'pedido.nomeEtapaPedidoSnapshot',
      'pedido.observacao'
    ]);
    adicionarFiltroIgual(clausulas, parametros, 'pedido.idCliente', query.idCliente, Number);
    adicionarFiltroIgual(clausulas, parametros, 'pedido.idUsuario', query.idUsuario, Number);
    adicionarFiltroIgual(clausulas, parametros, 'pedido.idVendedor', query.idVendedor, Number);
    adicionarFiltroLista(clausulas, parametros, 'pedido.idEtapaPedido', query.idEtapaPedido, Number);
    adicionarFiltroPeriodo(clausulas, parametros, 'pedido.dataInclusao', query.dataInclusaoInicio, query.dataInclusaoFim);
    adicionarFiltroPeriodo(clausulas, parametros, 'pedido.dataEntrega', query.dataEntregaInicio, query.dataEntregaFim);

    const registros = await consultarTodos(`
      SELECT pedido.idPedido
      FROM pedido
      ${montarWhere(clausulas)}
      ORDER BY pedido.idPedido DESC
    `, parametros);

    const registrosCompletos = await Promise.all(
      registros.map((registro) => consultarPedidoCompleto(registro.idPedido))
    );

    resposta.json(registrosCompletos.filter(Boolean));
  } catch (_erro) {
    resposta.status(500).json({ mensagem: 'Ocorreu um erro ao processar a requisicao.' });
  }
});

rotaPedidos.get('/:id', async (requisicao, resposta) => {
  try {
    const registro = await consultarPedidoCompleto(Number(requisicao.params.id));

    if (!registro) {
      resposta.status(404).json({ mensagem: 'Registro nao encontrado.' });
      return;
    }

    resposta.json(registro);
  } catch (_erro) {
    resposta.status(500).json({ mensagem: 'Ocorreu um erro ao processar a requisicao.' });
  }
});

rotaPedidos.post('/', async (requisicao, resposta) => {
  try {
    const payload = aplicarAutomacoesPedido(normalizarPayloadPedido(requisicao.body || {}));
    await validarReferenciasAtivasDaEntidade('pedido', payload);
    const snapshots = await montarSnapshotsPedido(payload);
    const mensagemValidacao = validarPayloadPedido(payload);

    if (mensagemValidacao) {
      resposta.status(400).json({ mensagem: mensagemValidacao });
      return;
    }

    await executar('BEGIN TRANSACTION');

    const resultado = await executar(
      `INSERT INTO pedido (
        idOrcamento,
        idCliente,
        idContato,
        idUsuario,
        idVendedor,
        comissao,
        idPrazoPagamento,
        idEtapaPedido,
        dataInclusao,
        dataEntrega,
        dataValidade,
        observacao,
        codigoOrcamentoOrigem,
        nomeClienteSnapshot,
        nomeContatoSnapshot,
        nomeUsuarioSnapshot,
        nomeVendedorSnapshot,
        nomeMetodoPagamentoSnapshot,
        nomePrazoPagamentoSnapshot,
        nomeEtapaPedidoSnapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.idOrcamento,
        payload.idCliente,
        payload.idContato,
        payload.idUsuario,
        payload.idVendedor,
        payload.comissao,
        payload.idPrazoPagamento,
        payload.idEtapaPedido,
        payload.dataInclusao,
        payload.dataEntrega,
        payload.dataValidade,
        payload.observacao,
        snapshots.codigoOrcamentoOrigem,
        snapshots.nomeClienteSnapshot,
        snapshots.nomeContatoSnapshot,
        snapshots.nomeUsuarioSnapshot,
        snapshots.nomeVendedorSnapshot,
        snapshots.nomeMetodoPagamentoSnapshot,
        snapshots.nomePrazoPagamentoSnapshot,
        snapshots.nomeEtapaPedidoSnapshot
      ]
    );

    await salvarItensPedido(resultado.id, payload.itens, snapshots.nomeClienteSnapshot);
    await salvarCamposPedido(resultado.id, payload.camposExtras);
    await sincronizarVinculoOrcamentoPedido(null, payload.idOrcamento, resultado.id);
    await executar('COMMIT');

    const registro = await consultarPedidoCompleto(resultado.id);
    resposta.status(201).json(registro);
  } catch (_erro) {
    if (_erro.statusCode === 400) {
      resposta.status(400).json({ mensagem: _erro.message });
      return;
    }

    console.error('Erro ao incluir pedido:', _erro);
    await tentarRollback();
    resposta.status(500).json({ mensagem: 'Nao foi possivel concluir a operacao por violacao de integridade dos dados.' });
  }
});

rotaPedidos.put('/:id', async (requisicao, resposta) => {
  try {
    const idPedido = Number(requisicao.params.id);
    const existente = await consultarUm('SELECT * FROM pedido WHERE idPedido = ?', [idPedido]);

    if (!existente) {
      resposta.status(404).json({ mensagem: 'Registro nao encontrado.' });
      return;
    }

    const payload = aplicarAutomacoesPedido(
      normalizarPayloadPedido({ ...existente, ...(requisicao.body || {}) }),
      existente
    );
    await validarReferenciasAtivasDaEntidade('pedido', payload);
    const snapshots = await montarSnapshotsPedido(payload);
    const itensAtuais = await consultarTodos('SELECT imagem FROM itemPedido WHERE idPedido = ?', [idPedido]);
    const mensagemValidacao = validarPayloadPedido(payload);

    if (mensagemValidacao) {
      resposta.status(400).json({ mensagem: mensagemValidacao });
      return;
    }

    await executar('BEGIN TRANSACTION');

    await executar(
      `UPDATE pedido SET
        idOrcamento = ?,
        idCliente = ?,
        idContato = ?,
        idUsuario = ?,
        idVendedor = ?,
        comissao = ?,
        idPrazoPagamento = ?,
        idEtapaPedido = ?,
        dataInclusao = ?,
        dataEntrega = ?,
        dataValidade = ?,
        observacao = ?,
        codigoOrcamentoOrigem = ?,
        nomeClienteSnapshot = ?,
        nomeContatoSnapshot = ?,
        nomeUsuarioSnapshot = ?,
        nomeVendedorSnapshot = ?,
        nomeMetodoPagamentoSnapshot = ?,
        nomePrazoPagamentoSnapshot = ?,
        nomeEtapaPedidoSnapshot = ?
      WHERE idPedido = ?`,
      [
        payload.idOrcamento,
        payload.idCliente,
        payload.idContato,
        payload.idUsuario,
        payload.idVendedor,
        payload.comissao,
        payload.idPrazoPagamento,
        payload.idEtapaPedido,
        payload.dataInclusao,
        payload.dataEntrega,
        payload.dataValidade,
        payload.observacao,
        snapshots.codigoOrcamentoOrigem,
        snapshots.nomeClienteSnapshot,
        snapshots.nomeContatoSnapshot,
        snapshots.nomeUsuarioSnapshot,
        snapshots.nomeVendedorSnapshot,
        snapshots.nomeMetodoPagamentoSnapshot,
        snapshots.nomePrazoPagamentoSnapshot,
        snapshots.nomeEtapaPedidoSnapshot,
        idPedido
      ]
    );

    await executar('DELETE FROM itemPedido WHERE idPedido = ?', [idPedido]);
    await executar('DELETE FROM valorCampoPedido WHERE idPedido = ?', [idPedido]);
    await salvarItensPedido(idPedido, payload.itens, snapshots.nomeClienteSnapshot);
    await salvarCamposPedido(idPedido, payload.camposExtras);
    await sincronizarVinculoOrcamentoPedido(existente.idOrcamento, payload.idOrcamento, idPedido);
    await executar('COMMIT');

    removerImagensItensNaoUtilizadas(
      itensAtuais.map((item) => item.imagem),
      payload.itens.map((item) => item.imagem)
    );

    const registro = await consultarPedidoCompleto(idPedido);
    resposta.json(registro);
  } catch (_erro) {
    if (_erro.statusCode === 400) {
      resposta.status(400).json({ mensagem: _erro.message });
      return;
    }

    console.error('Erro ao atualizar pedido:', _erro);
    await tentarRollback();
    resposta.status(500).json({ mensagem: 'Nao foi possivel concluir a operacao por violacao de integridade dos dados.' });
  }
});

rotaPedidos.delete('/:id', async (requisicao, resposta) => {
  try {
    const idPedido = Number(requisicao.params.id);
    const existente = await consultarUm('SELECT * FROM pedido WHERE idPedido = ?', [idPedido]);
    const itensAtuais = await consultarTodos('SELECT imagem FROM itemPedido WHERE idPedido = ?', [idPedido]);

    if (!existente) {
      resposta.status(404).json({ mensagem: 'Registro nao encontrado.' });
      return;
    }

    await executar('BEGIN TRANSACTION');
    await marcarOrcamentosComPedidoExcluido(idPedido);
    await sincronizarVinculoOrcamentoPedido(existente.idOrcamento, null, idPedido);
    await executar('DELETE FROM itemPedido WHERE idPedido = ?', [idPedido]);
    await executar('DELETE FROM valorCampoPedido WHERE idPedido = ?', [idPedido]);
    await executar('DELETE FROM pedido WHERE idPedido = ?', [idPedido]);
    await executar('COMMIT');

    itensAtuais.forEach((item) => {
      if (ehCaminhoImagemLocal(item.imagem)) {
        removerArquivoImagem(item.imagem);
      }
    });

    resposta.status(204).send();
  } catch (_erro) {
    console.error('Erro ao excluir pedido:', _erro);
    await tentarRollback();
    resposta.status(500).json({ mensagem: 'Ocorreu um erro ao processar a requisicao.' });
  }
});

async function consultarPedidoCompleto(idPedido) {
  const pedido = await consultarUm('SELECT * FROM pedido WHERE idPedido = ?', [idPedido]);

  if (!pedido) {
    return null;
  }

  const [itens, camposExtras] = await Promise.all([
    consultarTodos(
      'SELECT * FROM itemPedido WHERE idPedido = ? ORDER BY idItemPedido ASC',
      [idPedido]
    ),
    consultarTodos(
      'SELECT * FROM valorCampoPedido WHERE idPedido = ? ORDER BY idValorCampoPedido ASC',
      [idPedido]
    )
  ]);

  return {
    ...pedido,
    itens: itens.map(normalizarItemImagem),
    camposExtras
  };
}

function normalizarPayloadPedido(payload = {}) {
  return {
    idOrcamento: payload.idOrcamento ? Number(payload.idOrcamento) : null,
    idCliente: payload.idCliente ? Number(payload.idCliente) : null,
    idContato: payload.idContato ? Number(payload.idContato) : null,
    idUsuario: payload.idUsuario ? Number(payload.idUsuario) : null,
    idVendedor: payload.idVendedor ? Number(payload.idVendedor) : null,
    comissao: payload.comissao === '' || payload.comissao === null || payload.comissao === undefined
      ? 0
      : Number(payload.comissao),
    idPrazoPagamento: payload.idPrazoPagamento ? Number(payload.idPrazoPagamento) : null,
    idEtapaPedido: payload.idEtapaPedido ? Number(payload.idEtapaPedido) : null,
    dataInclusao: limparTexto(payload.dataInclusao),
    dataEntrega: limparTexto(payload.dataEntrega || payload.dataValidade),
    dataValidade: limparTexto(payload.dataValidade),
    observacao: limparTexto(payload.observacao),
    codigoOrcamentoOrigem: payload.codigoOrcamentoOrigem ? Number(payload.codigoOrcamentoOrigem) : null,
    nomeClienteSnapshot: limparTexto(payload.nomeClienteSnapshot),
    nomeContatoSnapshot: limparTexto(payload.nomeContatoSnapshot),
    nomeUsuarioSnapshot: limparTexto(payload.nomeUsuarioSnapshot),
    nomeVendedorSnapshot: limparTexto(payload.nomeVendedorSnapshot),
    nomeMetodoPagamentoSnapshot: limparTexto(payload.nomeMetodoPagamentoSnapshot),
    nomePrazoPagamentoSnapshot: limparTexto(payload.nomePrazoPagamentoSnapshot),
    nomeEtapaPedidoSnapshot: limparTexto(payload.nomeEtapaPedidoSnapshot),
    itens: normalizarItensPedido(payload.itens),
    camposExtras: normalizarCamposPedido(payload.camposExtras)
  };
}

function aplicarAutomacoesPedido(payload, pedidoAtual = null) {
  const proximoPayload = {
    ...payload
  };
  const entrouNaEtapaEntregue = !etapaPedidoEhEntregue(pedidoAtual?.idEtapaPedido)
    && etapaPedidoEhEntregue(proximoPayload.idEtapaPedido);

  if (entrouNaEtapaEntregue && (!proximoPayload.dataEntrega || proximoPayload.dataEntrega === limparTexto(pedidoAtual?.dataEntrega))) {
    proximoPayload.dataEntrega = obterDataAtualFormatoInput();
  }

  if (etapaPedidoEhEntregue(proximoPayload.idEtapaPedido) && !proximoPayload.dataEntrega) {
    proximoPayload.dataEntrega = obterDataAtualFormatoInput();
  }

  return proximoPayload;
}

function normalizarItensPedido(itens) {
  if (!Array.isArray(itens)) {
    return [];
  }

  return itens
    .map((item) => ({
      idProduto: item.idProduto ? Number(item.idProduto) : null,
      quantidade: item.quantidade === '' || item.quantidade === null || item.quantidade === undefined ? null : Number(item.quantidade),
      valorUnitario: item.valorUnitario === '' || item.valorUnitario === null || item.valorUnitario === undefined ? null : Number(item.valorUnitario),
      valorTotal: item.valorTotal === '' || item.valorTotal === null || item.valorTotal === undefined ? null : Number(item.valorTotal),
      imagem: normalizarImagemItemPayload(item.imagem),
      observacao: limparTexto(item.observacao),
      referenciaProdutoSnapshot: limparTexto(item.referenciaProdutoSnapshot),
      descricaoProdutoSnapshot: limparTexto(item.descricaoProdutoSnapshot),
      unidadeProdutoSnapshot: limparTexto(item.unidadeProdutoSnapshot)
    }))
    .filter((item) => item.quantidade && item.valorUnitario !== null);
}

function normalizarCamposPedido(camposExtras) {
  if (!Array.isArray(camposExtras)) {
    return [];
  }

  return camposExtras
    .map((campo) => ({
      idCampoPedido: campo.idCampoPedido ? Number(campo.idCampoPedido) : null,
      idCampoOrcamento: campo.idCampoOrcamento ? Number(campo.idCampoOrcamento) : null,
      tituloSnapshot: limparTexto(campo.tituloSnapshot || campo.titulo),
      valor: limparTexto(campo.valor)
    }))
    .filter((campo) => campo.idCampoPedido || campo.idCampoOrcamento || campo.tituloSnapshot);
}

function validarPayloadPedido(payload) {
  if (!payload.idCliente) {
    return 'Selecione o cliente do pedido.';
  }

  if (!payload.idUsuario) {
    return 'Selecione o usuario do registro.';
  }

  if (!payload.idVendedor) {
    return 'Selecione o vendedor.';
  }

  if (payload.itens.length === 0) {
    return 'Inclua ao menos um item no pedido.';
  }

  return '';
}

async function montarSnapshotsPedido(payload) {
  const [
    cliente,
    contato,
    usuario,
    vendedor,
    prazo,
    etapaPedido,
    orcamento
  ] = await Promise.all([
    obterCliente(payload.idCliente),
    obterContato(payload.idContato),
    obterUsuario(payload.idUsuario),
    obterVendedor(payload.idVendedor),
    obterPrazoPagamento(payload.idPrazoPagamento),
    obterEtapaPedido(payload.idEtapaPedido),
    obterOrcamento(payload.idOrcamento)
  ]);

  return {
    codigoOrcamentoOrigem: payload.codigoOrcamentoOrigem || orcamento?.idOrcamento || payload.idOrcamento || null,
    nomeClienteSnapshot: payload.nomeClienteSnapshot || cliente?.nomeFantasia || cliente?.razaoSocial || null,
    nomeContatoSnapshot: payload.nomeContatoSnapshot || contato?.nome || null,
    nomeUsuarioSnapshot: payload.nomeUsuarioSnapshot || usuario?.nome || null,
    nomeVendedorSnapshot: payload.nomeVendedorSnapshot || vendedor?.nome || null,
    nomeMetodoPagamentoSnapshot: payload.nomeMetodoPagamentoSnapshot || prazo?.nomeMetodoPagamento || null,
    nomePrazoPagamentoSnapshot: payload.nomePrazoPagamentoSnapshot || prazo?.descricaoFormatada || null,
    nomeEtapaPedidoSnapshot: payload.nomeEtapaPedidoSnapshot || etapaPedido?.descricao || null
  };
}

async function salvarItensPedido(idPedido, itens, nomeCliente) {
  for (const item of itens) {
    const produto = await obterProduto(item.idProduto);
    const resultado = await executar(
      `INSERT INTO itemPedido (
        idPedido,
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
        idPedido,
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
      const caminhoImagem = salvarImagemItemPedido({
        idPedido,
        nomeCliente: nomeCliente || 'cliente',
        idItemPedido: resultado.id,
        valorImagem: item.imagem
      });

      await executar(
        'UPDATE itemPedido SET imagem = ? WHERE idItemPedido = ?',
        [caminhoImagem, resultado.id]
      );
    }
  }
}

async function salvarCamposPedido(idPedido, camposExtras) {
  for (const campo of camposExtras) {
    await executar(
      `INSERT INTO valorCampoPedido (
        idPedido,
        idCampoPedido,
        idCampoOrcamento,
        tituloSnapshot,
        valor
      ) VALUES (?, ?, ?, ?, ?)`,
      [idPedido, campo.idCampoPedido, campo.idCampoOrcamento, campo.tituloSnapshot, campo.valor]
    );
  }
}

async function sincronizarVinculoOrcamentoPedido(idOrcamentoAnterior, idOrcamentoAtual, idPedido) {
  if (!idOrcamentoAtual) {
    await executar(
      'UPDATE orcamento SET idPedidoVinculado = NULL WHERE idPedidoVinculado = ?',
      [idPedido]
    );
  }

  if (idOrcamentoAnterior && String(idOrcamentoAnterior) !== String(idOrcamentoAtual || '')) {
    await executar(
      'UPDATE orcamento SET idPedidoVinculado = NULL WHERE idOrcamento = ? AND idPedidoVinculado = ?',
      [idOrcamentoAnterior, idPedido]
    );
  }

  if (idOrcamentoAtual) {
    await executar(
      'UPDATE orcamento SET idPedidoVinculado = ? WHERE idOrcamento = ?',
      [idPedido, idOrcamentoAtual]
    );
  }
}

async function marcarOrcamentosComPedidoExcluido(idPedido) {
  const etapaPedidoExcluido = await obterEtapaPedidoExcluido();

  if (!etapaPedidoExcluido?.idEtapaOrcamento) {
    return;
  }

  await executar(
    'UPDATE orcamento SET idEtapaOrcamento = ? WHERE idPedidoVinculado = ?',
    [etapaPedidoExcluido.idEtapaOrcamento, idPedido]
  );
}

async function obterCliente(idCliente) {
  if (!idCliente) {
    return null;
  }

  return consultarUm('SELECT idCliente, nomeFantasia, razaoSocial FROM cliente WHERE idCliente = ?', [idCliente]);
}

async function obterContato(idContato) {
  if (!idContato) {
    return null;
  }

  return consultarUm('SELECT idContato, nome FROM contato WHERE idContato = ?', [idContato]);
}

async function obterUsuario(idUsuario) {
  if (!idUsuario) {
    return null;
  }

  return consultarUm('SELECT idUsuario, nome FROM usuario WHERE idUsuario = ?', [idUsuario]);
}

async function obterVendedor(idVendedor) {
  if (!idVendedor) {
    return null;
  }

  return consultarUm('SELECT idVendedor, nome FROM vendedor WHERE idVendedor = ?', [idVendedor]);
}

async function obterPrazoPagamento(idPrazoPagamento) {
  if (!idPrazoPagamento) {
    return null;
  }

  return consultarUm(
    `SELECT
      prazoPagamento.*,
      metodoPagamento.descricao AS nomeMetodoPagamento
    FROM prazoPagamento
    LEFT JOIN metodoPagamento ON metodoPagamento.idMetodoPagamento = prazoPagamento.idMetodoPagamento
    WHERE prazoPagamento.idPrazoPagamento = ?`,
    [idPrazoPagamento]
  ).then((prazo) => {
    if (!prazo) {
      return null;
    }

    const parcelas = [prazo.prazo1, prazo.prazo2, prazo.prazo3, prazo.prazo4, prazo.prazo5, prazo.prazo6]
      .filter((valor) => valor !== null && valor !== undefined && valor !== '')
      .join(' / ');

    return {
      ...prazo,
      descricaoFormatada: prazo.descricao || (parcelas ? `${parcelas} dias` : null)
    };
  });
}

async function obterEtapaPedido(idEtapaPedido) {
  if (!idEtapaPedido) {
    return null;
  }

  return consultarUm(
    `SELECT
      idEtapa AS idEtapaPedido,
      descricao
    FROM etapaPedido
    WHERE idEtapa = ?`,
    [idEtapaPedido]
  );
}

async function obterOrcamento(idOrcamento) {
  if (!idOrcamento) {
    return null;
  }

  return consultarUm('SELECT idOrcamento FROM orcamento WHERE idOrcamento = ?', [idOrcamento]);
}

async function obterEtapaPedidoExcluido() {
  return consultarUm(
    `SELECT idEtapaOrcamento, descricao
    FROM etapaOrcamento
    WHERE idEtapaOrcamento = ?
    LIMIT 1`
    , [ID_ETAPA_ORCAMENTO_PEDIDO_EXCLUIDO]
  );
}

async function obterProduto(idProduto) {
  if (!idProduto) {
    return null;
  }

  return consultarUm(
    `SELECT
      produto.idProduto,
      produto.referencia,
      produto.descricao,
      produto.imagem,
      unidadeMedida.descricao AS nomeUnidadeMedida,
      unidadeMedida.descricao AS siglaUnidadeMedida
    FROM produto
    LEFT JOIN unidadeMedida ON unidadeMedida.idUnidade = produto.idUnidade
    WHERE produto.idProduto = ?`,
    [idProduto]
  );
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

function etapaPedidoEhEntregue(idEtapaPedido) {
  return Number(idEtapaPedido) === ID_ETAPA_PEDIDO_ENTREGUE;
}

function obterDataAtualFormatoInput() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
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

async function tentarRollback() {
  try {
    await executar('ROLLBACK');
  } catch (_erro) {
    return;
  }
}

module.exports = {
  rotaPedidos
};
