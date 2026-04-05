import { requisitarApi } from './api';
import { requisitarListaApi } from './listas';
import { montarParametrosConsulta } from '../utilitarios/montarParametrosConsulta';

export function listarProdutos(parametros) {
  return requisitarApi(`/produtos${montarParametrosConsulta(parametros)}`);
}

export function listarProdutosGrid({ pesquisa = '', filtros = {} } = {}) {
  return requisitarApi(`/listagens/produtos${montarParametrosConsulta({
    search: pesquisa,
    ...filtros
  })}`);
}

export function incluirProduto(payload) {
  return requisitarApi('/produtos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarProduto(idProduto, payload) {
  return requisitarApi(`/produtos/${idProduto}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function importarProdutosPlanilha(payload) {
  return requisitarApi('/importacao/produtos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarGruposProduto(opcoes) {
  return requisitarListaApi('/gruposProduto', opcoes);
}

export function listarMarcas(opcoes) {
  return requisitarListaApi('/marcas', opcoes);
}

export function listarUnidadesMedida(opcoes) {
  return requisitarListaApi('/unidadesMedida', opcoes);
}
