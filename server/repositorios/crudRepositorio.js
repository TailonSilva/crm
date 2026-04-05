const { consultarTodos, consultarUm, executar } = require('../configuracoes/banco');
const {
  ehDataUrlImagem,
  ehCaminhoImagemLocal,
  removerArquivoImagem,
  salvarImagemBase64
} = require('../utilitarios/imagens');
const { montarUrlArquivo, obterBaseUrlApi } = require('../utilitarios/urlApi');
const { validarReferenciasAtivasDaEntidade } = require('../utilitarios/validarReferenciasAtivas');
const {
  sincronizarGrupoEmpresaDoCliente,
  sincronizarGrupoEmpresaParaClientesVinculados,
  sincronizarContatoGrupoParaClientesVinculados
} = require('../utilitarios/sincronizarGrupoEmpresa');

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
  await validarReferenciasAtivasDaEntidade(entidade.nome, payload);
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

  const registro = await consultarRegistroPorId(entidade, resultado.id);
  await executarHooksPosPersistencia(entidade, registro);
  return consultarRegistroPorId(entidade, resultado.id);
}

async function atualizarRegistro(entidade, id, payload) {
  const registroAtual = await consultarUm(
    `SELECT * FROM ${entidade.nome} WHERE ${entidade.chavePrimaria} = ?`,
    [id]
  );
  await validarReferenciasAtivasDaEntidade(entidade.nome, {
    ...registroAtual,
    ...payload
  });
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

  const registroAtualizado = await consultarRegistroPorId(entidade, id);
  await executarHooksPosPersistencia(entidade, registroAtualizado);
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

  return montarUrlArquivo(valorImagem);
}

function desnormalizarCaminhoImagem(valorImagem) {
  if (typeof valorImagem !== 'string') {
    return valorImagem;
  }

  const imagemSemSufixo = removerQueryStringImagem(valorImagem.trim());
  const prefixoCompleto = `${obterBaseUrlApi()}/api/arquivos/`;
  const prefixoRelativo = '/api/arquivos/';

  if (imagemSemSufixo.startsWith(prefixoCompleto)) {
    return imagemSemSufixo.slice(prefixoCompleto.length);
  }

  if (imagemSemSufixo.startsWith(prefixoRelativo)) {
    return imagemSemSufixo.slice(prefixoRelativo.length);
  }

  return imagemSemSufixo;
}

function removerQueryStringImagem(valorImagem) {
  const indiceQuery = valorImagem.indexOf('?');
  const indiceHash = valorImagem.indexOf('#');
  const indices = [indiceQuery, indiceHash].filter((indice) => indice >= 0);

  if (indices.length === 0) {
    return valorImagem;
  }

  return valorImagem.slice(0, Math.min(...indices));
}

module.exports = {
  listarRegistros,
  consultarRegistroPorId,
  inserirRegistro,
  atualizarRegistro,
  excluirRegistro,
  montarCampos
};

async function executarHooksPosPersistencia(entidade, registro) {
  if (!registro) {
    return;
  }

  if (entidade.nome === 'cliente') {
    await sincronizarGrupoEmpresaDoCliente(registro.idCliente, registro.idGrupoEmpresa || null);
    return;
  }

  if (entidade.nome === 'grupoEmpresa') {
    await sincronizarGrupoEmpresaParaClientesVinculados(registro.idGrupoEmpresa);
    return;
  }

  if (entidade.nome === 'contatoGrupoEmpresa') {
    await sincronizarContatoGrupoParaClientesVinculados(registro.idContatoGrupoEmpresa);
  }
}
