function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

import { listaIncluiValorFiltro } from './compararValoresFiltro';
import { normalizarStatusRegistro, registroEstaAtivo } from './statusRegistro';
import { normalizarPreco } from './normalizarPreco';

export function filtrarProdutos(produtos, pesquisa, filtros = {}) {
  const termo = normalizarTexto(pesquisa);

  return produtos.filter((produto) => {
    const passouFiltros = (
      listaIncluiValorFiltro(filtros.idGrupo, produto.idGrupo) &&
      listaIncluiValorFiltro(filtros.idMarca, produto.idMarca) &&
      listaIncluiValorFiltro(filtros.idUnidade, produto.idUnidade) &&
      listaIncluiValorFiltro(filtros.status, normalizarStatusRegistro(produto.status))
    );

    if (!passouFiltros) {
      return false;
    }

    if (!termo) {
      return true;
    }

    const camposPesquisa = [
      produto.idProduto,
      produto.referencia,
      produto.descricao,
      produto.nomeGrupo,
      produto.nomeMarca,
      produto.nomeUnidade,
      normalizarPreco(produto.preco),
      registroEstaAtivo(produto.status) ? 'ativo' : 'inativo'
    ];

    return camposPesquisa.some((campo) => normalizarTexto(campo).includes(termo));
  });
}
