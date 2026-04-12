import { requisitarApi } from './api';
import { requisitarListaApi } from './listas';

function listarCadastroConfiguracao(caminho, opcoes) {
  return requisitarListaApi(caminho, opcoes);
}

export function listarGruposProdutoConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/gruposProduto', opcoes);
}

export function listarGruposEmpresaConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/gruposEmpresa', opcoes);
}

export function incluirGrupoEmpresa(payload) {
  return requisitarApi('/gruposEmpresa', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarGrupoEmpresa(idGrupoEmpresa, payload) {
  return requisitarApi(`/gruposEmpresa/${idGrupoEmpresa}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarContatosGruposEmpresaConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/contatosGruposEmpresa', opcoes);
}

export function incluirContatoGrupoEmpresa(payload) {
  return requisitarApi('/contatosGruposEmpresa', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarContatoGrupoEmpresa(idContatoGrupoEmpresa, payload) {
  return requisitarApi(`/contatosGruposEmpresa/${idContatoGrupoEmpresa}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
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

export function listarTamanhosConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/tamanhos', opcoes);
}

export function incluirTamanho(payload) {
  return requisitarApi('/tamanhos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarTamanho(idTamanho, payload) {
  return requisitarApi(`/tamanhos/${idTamanho}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarGruposProdutoTamanhosConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/gruposProdutoTamanhos', opcoes);
}

export function incluirGrupoProdutoTamanho(payload) {
  return requisitarApi('/gruposProdutoTamanhos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarGrupoProdutoTamanho(idGrupoProdutoTamanho, payload) {
  return requisitarApi(`/gruposProdutoTamanhos/${idGrupoProdutoTamanho}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function excluirGrupoProdutoTamanho(idGrupoProdutoTamanho) {
  return requisitarApi(`/gruposProdutoTamanhos/${idGrupoProdutoTamanho}`, {
    method: 'DELETE'
  });
}

export function listarMarcasConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/marcas', opcoes);
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

export function listarRamosAtividadeConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/ramosAtividade', opcoes);
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

export function listarVendedoresConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/vendedores', opcoes);
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

export function listarCamposOrcamentoConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/camposOrcamento', opcoes);
}

export function incluirCampoOrcamento(payload) {
  return requisitarApi('/camposOrcamento', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarCampoOrcamento(idCampoOrcamento, payload) {
  return requisitarApi(`/camposOrcamento/${idCampoOrcamento}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarCamposPedidoConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/camposPedido', opcoes);
}

export function incluirCampoPedido(payload) {
  return requisitarApi('/camposPedido', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarCampoPedido(idCampoPedido, payload) {
  return requisitarApi(`/camposPedido/${idCampoPedido}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarUnidadesMedidaConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/unidadesMedida', opcoes);
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

export function listarMetodosPagamentoConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/metodosPagamento', opcoes);
}

export function listarTiposPedidoConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/tiposPedido', opcoes);
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

export function incluirTipoPedido(payload) {
  return requisitarApi('/tiposPedido', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarTipoPedido(idTipoPedido, payload) {
  return requisitarApi(`/tiposPedido/${idTipoPedido}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarPrazosPagamentoConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/prazosPagamento', opcoes);
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

export function listarMotivosPerdaConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/motivosPerda', opcoes);
}

export function listarMotivosDevolucaoConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/motivosDevolucao', opcoes);
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

export function incluirMotivoDevolucao(payload) {
  return requisitarApi('/motivosDevolucao', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarMotivoDevolucao(idMotivoDevolucao, payload) {
  return requisitarApi(`/motivosDevolucao/${idMotivoDevolucao}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function listarEtapasPedidoConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/etapasPedido', opcoes);
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

export function listarEtapasOrcamentoConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/etapasOrcamento', opcoes);
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

export function listarLocaisAgendaConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/locaisAgenda', opcoes);
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

export function listarTiposRecursoConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/tiposRecurso', opcoes);
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

export function listarRecursosConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/recursos', opcoes);
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

export function listarTiposAgendaConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/tiposAgenda', opcoes);
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

export function listarStatusVisitaConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/statusVisita', opcoes);
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

export function listarCanaisAtendimentoConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/canaisAtendimento', opcoes);
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

export function listarOrigensAtendimentoConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/origensAtendimento', opcoes);
}

export function listarTiposAtendimentoConfiguracao(opcoes) {
  return listarCadastroConfiguracao('/tiposAtendimento', opcoes);
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

export function incluirTipoAtendimento(payload) {
  return requisitarApi('/tiposAtendimento', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function atualizarTipoAtendimento(idTipoAtendimento, payload) {
  return requisitarApi(`/tiposAtendimento/${idTipoAtendimento}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

export function obterConfiguracaoAtualizacaoSistema() {
  return requisitarApi('/atualizacaoSistema');
}

export function salvarConfiguracaoAtualizacaoSistema(payload) {
  return requisitarApi('/atualizacaoSistema', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}
