import { requisitarApi } from './api';

export function listarAtendimentos() {
  return requisitarApi('/atendimentos');
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

export function listarCanaisAtendimento() {
  return requisitarApi('/canaisAtendimento');
}

export function listarOrigensAtendimento() {
  return requisitarApi('/origensAtendimento');
}
