export function normalizarValorComparacaoFiltro(valor) {
  return String(valor ?? '').trim();
}

export function listaIncluiValorFiltro(lista, valorComparacao, normalizador = normalizarValorComparacaoFiltro) {
  if (!Array.isArray(lista) || lista.length === 0) {
    return true;
  }

  const valorNormalizado = normalizador(valorComparacao);
  return lista.some((item) => normalizador(item) === valorNormalizado);
}
