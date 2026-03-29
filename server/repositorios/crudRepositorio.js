const { consultarTodos, consultarUm, executar } = require('../configuracoes/banco');
const {
  ehDataUrlImagem,
  ehCaminhoImagemLocal,
  removerArquivoImagem,
  salvarImagemBase64
} = require('../utilitarios/imagens');

function montarCampos(payload, camposPermitidos) {
  return Object.entries(payload).filter(
    ([campo, valor]) =>
      camposPermitidos.includes(campo) && valor !== undefined
  );
}

async function listarRegistros(entidade) {
  const registros = await consultarTodos(
    `SELECT * FROM ${entidade.nome} ORDER BY ${entidade.chavePrimaria} DESC`
  );

  return registros.map(normalizarRegistroImagem);
}

async function consultarRegistroPorId(entidade, id) {
  const registro = await consultarUm(
    `SELECT * FROM ${entidade.nome} WHERE ${entidade.chavePrimaria} = ?`,
    [id]
  );

  return normalizarRegistroImagem(registro);
}

async function inserirRegistro(entidade, payload) {
  const payloadSemImagemBase64 = prepararPayloadImagemParaPersistencia(payload);
  const campos = montarCampos(payloadSemImagemBase64, entidade.camposPermitidos);
  const nomes = campos.map(([campo]) => campo);
  const placeholders = nomes.map(() => '?').join(', ');
  const valores = campos.map(([, valor]) => valor);

  const resultado = await executar(
    `INSERT INTO ${entidade.nome} (${nomes.join(', ')}) VALUES (${placeholders})`,
    valores
  );

  if (ehDataUrlImagem(payload.imagem)) {
    const caminhoImagem = salvarImagemBase64({
      nomeEntidade: entidade.nome,
      idRegistro: resultado.id,
      valorImagem: payload.imagem
    });

    await executar(
      `UPDATE ${entidade.nome} SET imagem = ? WHERE ${entidade.chavePrimaria} = ?`,
      [caminhoImagem, resultado.id]
    );
  }

  return consultarRegistroPorId(entidade, resultado.id);
}

async function atualizarRegistro(entidade, id, payload) {
  const registroAtual = await consultarUm(
    `SELECT * FROM ${entidade.nome} WHERE ${entidade.chavePrimaria} = ?`,
    [id]
  );
  const payloadSemImagemBase64 = prepararPayloadImagemParaPersistencia(payload);
  const campos = montarCampos(payloadSemImagemBase64, entidade.camposPermitidos);
  const declaracoes = campos.map(([campo]) => `${campo} = ?`);
  const valores = campos.map(([, valor]) => valor);

  if (campos.length > 0) {
    await executar(
      `UPDATE ${entidade.nome} SET ${declaracoes.join(', ')} WHERE ${entidade.chavePrimaria} = ?`,
      [...valores, id]
    );
  }

  if (ehDataUrlImagem(payload.imagem)) {
    if (ehCaminhoImagemLocal(registroAtual?.imagem)) {
      removerArquivoImagem(registroAtual.imagem);
    }

    const caminhoImagem = salvarImagemBase64({
      nomeEntidade: entidade.nome,
      idRegistro: id,
      valorImagem: payload.imagem
    });

    await executar(
      `UPDATE ${entidade.nome} SET imagem = ? WHERE ${entidade.chavePrimaria} = ?`,
      [caminhoImagem, id]
    );
  }

  if (payload.imagem === null && ehCaminhoImagemLocal(registroAtual?.imagem)) {
    removerArquivoImagem(registroAtual.imagem);
  }

  return consultarRegistroPorId(entidade, id);
}

async function excluirRegistro(entidade, id) {
  const registroAtual = await consultarUm(
    `SELECT * FROM ${entidade.nome} WHERE ${entidade.chavePrimaria} = ?`,
    [id]
  );

  if (ehCaminhoImagemLocal(registroAtual?.imagem)) {
    removerArquivoImagem(registroAtual.imagem);
  }

  return executar(
    `DELETE FROM ${entidade.nome} WHERE ${entidade.chavePrimaria} = ?`,
    [id]
  );
}

function prepararPayloadImagemParaPersistencia(payload) {
  if (!payload) {
    return payload;
  }

  if (ehDataUrlImagem(payload.imagem)) {
    return {
      ...payload,
      imagem: undefined
    };
  }

  return {
    ...payload,
    imagem: desnormalizarCaminhoImagem(payload.imagem)
  };
}

function normalizarRegistroImagem(registro) {
  if (!registro) {
    return null;
  }

  return {
    ...registro,
    imagem: normalizarCaminhoImagem(registro.imagem)
  };
}

function normalizarCaminhoImagem(valorImagem) {
  if (!ehCaminhoImagemLocal(valorImagem)) {
    return valorImagem || '';
  }

  return `http://127.0.0.1:3001/api/arquivos/${valorImagem}`;
}

function desnormalizarCaminhoImagem(valorImagem) {
  if (typeof valorImagem !== 'string') {
    return valorImagem;
  }

  const prefixoCompleto = 'http://127.0.0.1:3001/api/arquivos/';
  const prefixoRelativo = '/api/arquivos/';

  if (valorImagem.startsWith(prefixoCompleto)) {
    return valorImagem.slice(prefixoCompleto.length);
  }

  if (valorImagem.startsWith(prefixoRelativo)) {
    return valorImagem.slice(prefixoRelativo.length);
  }

  return valorImagem;
}

module.exports = {
  listarRegistros,
  consultarRegistroPorId,
  inserirRegistro,
  atualizarRegistro,
  excluirRegistro,
  montarCampos
};
