import { requisitarApi } from './api';

export function listarGruposProdutoConfiguracao() {
  return requisitarApi('/gruposProduto');
}

export function incluirGrupoProduto(payload) {
  return requisitarApi('/gruposProduto', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarGrupoProduto(idGrupo, payload) {
  return requisitarApi(`/gruposProduto/${idGrupo}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarMarcasConfiguracao() {
  return requisitarApi('/marcas');
}

export function incluirMarca(payload) {
  return requisitarApi('/marcas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarMarca(idMarca, payload) {
  return requisitarApi(`/marcas/${idMarca}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarRamosAtividadeConfiguracao() {
  return requisitarApi('/ramosAtividade');
}

export function incluirRamoAtividade(payload) {
  return requisitarApi('/ramosAtividade', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarRamoAtividade(idRamo, payload) {
  return requisitarApi(`/ramosAtividade/${idRamo}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarVendedoresConfiguracao() {
  return requisitarApi('/vendedores');
}

export function incluirVendedor(payload) {
  return requisitarApi('/vendedores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarVendedor(idVendedor, payload) {
  return requisitarApi(`/vendedores/${idVendedor}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarUnidadesMedidaConfiguracao() {
  return requisitarApi('/unidadesMedida');
}

export function incluirUnidadeMedida(payload) {
  return requisitarApi('/unidadesMedida', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarUnidadeMedida(idUnidade, payload) {
  return requisitarApi(`/unidadesMedida/${idUnidade}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarMetodosPagamentoConfiguracao() {
  return requisitarApi('/metodosPagamento');
}

export function incluirMetodoPagamento(payload) {
  return requisitarApi('/metodosPagamento', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarMetodoPagamento(idMetodoPagamento, payload) {
  return requisitarApi(`/metodosPagamento/${idMetodoPagamento}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarPrazosPagamentoConfiguracao() {
  return requisitarApi('/prazosPagamento');
}

export function incluirPrazoPagamento(payload) {
  return requisitarApi('/prazosPagamento', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarPrazoPagamento(idPrazoPagamento, payload) {
  return requisitarApi(`/prazosPagamento/${idPrazoPagamento}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarMotivosPerdaConfiguracao() {
  return requisitarApi('/motivosPerda');
}

export function incluirMotivoPerda(payload) {
  return requisitarApi('/motivosPerda', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarMotivoPerda(idMotivo, payload) {
  return requisitarApi(`/motivosPerda/${idMotivo}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarEtapasPedidoConfiguracao() {
  return requisitarApi('/etapasPedido');
}

export function incluirEtapaPedido(payload) {
  return requisitarApi('/etapasPedido', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarEtapaPedido(idEtapa, payload) {
  return requisitarApi(`/etapasPedido/${idEtapa}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarEtapasOrcamentoConfiguracao() {
  return requisitarApi('/etapasOrcamento');
}

export function incluirEtapaOrcamento(payload) {
  return requisitarApi('/etapasOrcamento', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarEtapaOrcamento(idEtapaOrcamento, payload) {
  return requisitarApi(`/etapasOrcamento/${idEtapaOrcamento}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarLocaisAgendaConfiguracao() {
  return requisitarApi('/locaisAgenda');
}

export function incluirLocalAgenda(payload) {
  return requisitarApi('/locaisAgenda', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarLocalAgenda(idLocal, payload) {
  return requisitarApi(`/locaisAgenda/${idLocal}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarTiposRecursoConfiguracao() {
  return requisitarApi('/tiposRecurso');
}

export function incluirTipoRecurso(payload) {
  return requisitarApi('/tiposRecurso', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarTipoRecurso(idTipoRecurso, payload) {
  return requisitarApi(`/tiposRecurso/${idTipoRecurso}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarRecursosConfiguracao() {
  return requisitarApi('/recursos');
}

export function incluirRecurso(payload) {
  return requisitarApi('/recursos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarRecurso(idRecurso, payload) {
  return requisitarApi(`/recursos/${idRecurso}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarTiposAgendaConfiguracao() {
  return requisitarApi('/tiposAgenda');
}

export function incluirTipoAgenda(payload) {
  return requisitarApi('/tiposAgenda', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarTipoAgenda(idTipoAgenda, payload) {
  return requisitarApi(`/tiposAgenda/${idTipoAgenda}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarStatusVisitaConfiguracao() {
  return requisitarApi('/statusVisita');
}

export function incluirStatusVisita(payload) {
  return requisitarApi('/statusVisita', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarStatusVisita(idStatusVisita, payload) {
  return requisitarApi(`/statusVisita/${idStatusVisita}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarCanaisAtendimentoConfiguracao() {
  return requisitarApi('/canaisAtendimento');
}

export function incluirCanalAtendimento(payload) {
  return requisitarApi('/canaisAtendimento', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarCanalAtendimento(idCanalAtendimento, payload) {
  return requisitarApi(`/canaisAtendimento/${idCanalAtendimento}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarOrigensAtendimentoConfiguracao() {
  return requisitarApi('/origensAtendimento');
}

export function incluirOrigemAtendimento(payload) {
  return requisitarApi('/origensAtendimento', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarOrigemAtendimento(idOrigemAtendimento, payload) {
  return requisitarApi(`/origensAtendimento/${idOrigemAtendimento}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}
