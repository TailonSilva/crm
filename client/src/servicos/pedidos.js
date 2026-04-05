import { requisitarApi } from './api';
import { montarParametrosConsulta } from '../utilitarios/montarParametrosConsulta';

export function listarPedidos(parametros) {
  return requisitarApi(`/pedidos${montarParametrosConsulta(parametros)}`);
}

export function consultarPedido(idPedido) {
  return requisitarApi(`/pedidos/${idPedido}`);
}

export function incluirPedido(payload) {
  return requisitarApi('/pedidos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarPedido(idPedido, payload) {
  return requisitarApi(`/pedidos/${idPedido}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function excluirPedido(idPedido) {
  return requisitarApi(`/pedidos/${idPedido}`, {
    method: 'DELETE'
  });
}
