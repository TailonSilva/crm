function normalizarTextoQuery(valor) {
  return String(valor ?? '').trim();
}

function valorTransformadoValido(valor) {
  if (valor === null || valor === undefined) {
    return false;
  }

  if (typeof valor === 'number') {
    return !Number.isNaN(valor);
  }

  return String(valor).trim() !== '';
}

function normalizarListaQuery(valor) {
  if (Array.isArray(valor)) {
    return valor.map(normalizarTextoQuery).filter(Boolean);
  }

  const texto = normalizarTextoQuery(valor);
  return texto ? [texto] : [];
}

function adicionarFiltroIgual(clausulas, parametros, coluna, valor, transformador = (item) => item) {
  const texto = normalizarTextoQuery(valor);

  if (!texto) {
    return;
  }

  const valorTransformado = transformador(texto);

  if (!valorTransformadoValido(valorTransformado)) {
    return;
  }

  clausulas.push(`${coluna} = ?`);
  parametros.push(valorTransformado);
}

function adicionarFiltroLista(clausulas, parametros, coluna, valores, transformador = (item) => item) {
  const lista = normalizarListaQuery(valores);

  if (lista.length === 0) {
    return;
  }

  const listaTransformada = lista
    .map(transformador)
    .filter(valorTransformadoValido);

  if (listaTransformada.length === 0) {
    return;
  }

  const placeholders = listaTransformada.map(() => '?').join(', ');
  clausulas.push(`${coluna} IN (${placeholders})`);
  parametros.push(...listaTransformada);
}

function adicionarFiltroPeriodo(clausulas, parametros, coluna, valorInicio, valorFim) {
  const inicio = normalizarTextoQuery(valorInicio);
  const fim = normalizarTextoQuery(valorFim);

  if (inicio) {
    clausulas.push(`${coluna} >= ?`);
    parametros.push(inicio);
  }

  if (fim) {
    clausulas.push(`${coluna} <= ?`);
    parametros.push(fim);
  }
}

function adicionarFiltroBusca(clausulas, parametros, busca, colunas) {
  const termo = normalizarTextoQuery(busca).toLowerCase();

  if (!termo || !Array.isArray(colunas) || colunas.length === 0) {
    return;
  }

  const termoLike = `%${termo}%`;
  clausulas.push(`(${colunas.map((coluna) => `LOWER(COALESCE(${coluna}, '')) LIKE ?`).join(' OR ')})`);
  parametros.push(...colunas.map(() => termoLike));
}

function montarWhere(clausulas) {
  return clausulas.length > 0 ? `WHERE ${clausulas.join(' AND ')}` : '';
}

module.exports = {
  normalizarTextoQuery,
  normalizarListaQuery,
  adicionarFiltroIgual,
  adicionarFiltroLista,
  adicionarFiltroPeriodo,
  adicionarFiltroBusca,
  montarWhere
};
