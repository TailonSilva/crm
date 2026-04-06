const IDS_ETAPAS_ORCAMENTO_AUTOMATICAS = new Set([2, 3]);

export function etapaOrcamentoEhAutomatica(etapaOuId) {
  const idEtapaOrcamento = typeof etapaOuId === 'object'
    ? etapaOuId?.idEtapaOrcamento
    : etapaOuId;

  return IDS_ETAPAS_ORCAMENTO_AUTOMATICAS.has(Number(idEtapaOrcamento));
}

export function obterEtapasOrcamentoParaInputManual(etapas = [], idSelecionado = null) {
  return (Array.isArray(etapas) ? etapas : []).filter((etapa) => {
    const idEtapaOrcamento = String(etapa?.idEtapaOrcamento || '');

    if (String(idSelecionado || '') === idEtapaOrcamento) {
      return true;
    }

    return !etapaOrcamentoEhAutomatica(etapa);
  });
}
