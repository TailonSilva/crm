import { requisitarApi } from './api';
import { requisitarListaApi } from './listas';
import { montarParametrosConsulta } from '../utilitarios/montarParametrosConsulta';

export function listarAtendimentos(parametros) {
  return requisitarApi(`/atendimentos${montarParametrosConsulta(parametros)}`);
}

export function listarAtendimentosGrid({ pesquisa = '', filtros = {} } = {}) {
  return requisitarApi(`/listagens/atendimentos${montarParametrosConsulta({
    search: pesquisa,
    ...filtros
  })}`);
}

export function incluirAtendimento(payload) {
  return requisitarApi('/atendimentos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarAtendimento(idAtendimento, payload) {
  return requisitarApi(`/atendimentos/${idAtendimento}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function excluirAtendimento(idAtendimento) {
  return requisitarApi(`/atendimentos/${idAtendimento}`, {
    method: 'DELETE'
  });
}

export function listarCanaisAtendimento(opcoes) {
  return requisitarListaApi('/canaisAtendimento', opcoes);
}

export function listarOrigensAtendimento(opcoes) {
  return requisitarListaApi('/origensAtendimento', opcoes);
}
