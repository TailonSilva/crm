import { requisitarApi } from './api';

export function listarAgendamentos() {
  return requisitarApi('/agendamentos');
}

export function incluirAgendamento(payload) {
  return requisitarApi('/agendamentos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarAgendamento(idAgendamento, payload) {
  return requisitarApi(`/agendamentos/${idAgendamento}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarStatusAgendamentoUsuario(idAgendamento, payload) {
  return requisitarApi(`/agendamentos/${idAgendamento}/status-usuario`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function excluirAgendamento(idAgendamento) {
  return requisitarApi(`/agendamentos/${idAgendamento}`, {
    method: 'DELETE'
  });
}

export function listarLocaisAgenda() {
  return requisitarApi('/locaisAgenda');
}

export function listarRecursosAgenda() {
  return requisitarApi('/recursos');
}

export function listarTiposRecurso() {
  return requisitarApi('/tiposRecurso');
}

export function listarTiposAgenda() {
  return requisitarApi('/tiposAgenda');
}

export function listarStatusVisita() {
  return requisitarApi('/statusVisita');
}
