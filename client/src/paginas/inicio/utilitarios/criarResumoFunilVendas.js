import { registroEstaAtivo } from '../../../utilitarios/statusRegistro';

export function criarResumoFunilVendas(etapasOrcamento, orcamentos) {
  const etapasAtivasFunil = Array.isArray(etapasOrcamento)
    ? [...etapasOrcamento]
      .filter((etapa) => registroEstaAtivo(etapa?.status) && registroEstaAtivo(etapa?.consideraFunilVendas))
      .sort((primeira, segunda) => {
        const ordemPrimeira = Number(primeira?.ordem || 0);
        const ordemSegunda = Number(segunda?.ordem || 0);
        return ordemPrimeira - ordemSegunda;
      })
    : [];

  const orcamentosPorEtapa = new Map();

  if (Array.isArray(orcamentos)) {
    orcamentos.forEach((orcamento) => {
      const idEtapa = Number(orcamento?.idEtapaOrcamento || 0);

      if (!idEtapa) {
        return;
      }

      const acumulado = orcamentosPorEtapa.get(idEtapa) || {
        quantidadeOrcamentos: 0,
        quantidadeItens: 0,
        valorTotal: 0
      };

      const quantidadeItensOrcamento = Array.isArray(orcamento?.itens)
        ? orcamento.itens.reduce((total, item) => total + normalizarNumeroDecimal(item?.quantidade), 0)
        : 0;
      const valorTotalOrcamento = Array.isArray(orcamento?.itens)
        ? orcamento.itens.reduce((total, item) => total + normalizarNumeroDecimal(item?.valorTotal), 0)
        : 0;

      orcamentosPorEtapa.set(idEtapa, {
        quantidadeOrcamentos: acumulado.quantidadeOrcamentos + 1,
        quantidadeItens: acumulado.quantidadeItens + quantidadeItensOrcamento,
        valorTotal: acumulado.valorTotal + valorTotalOrcamento
      });
    });
  }

  return etapasAtivasFunil.map((etapa) => {
    const acumulado = orcamentosPorEtapa.get(Number(etapa.idEtapaOrcamento)) || {
      quantidadeOrcamentos: 0,
      quantidadeItens: 0,
      valorTotal: 0
    };

    return {
      idEtapaOrcamento: etapa.idEtapaOrcamento,
      descricao: etapa.descricao,
      cor: etapa.cor,
      quantidadeOrcamentos: acumulado.quantidadeOrcamentos,
      quantidadeItens: acumulado.quantidadeItens,
      valorTotal: acumulado.valorTotal
    };
  });
}

function normalizarNumeroDecimal(valor) {
  const textoOriginal = String(valor ?? '').trim();

  if (!textoOriginal) {
    return 0;
  }

  const textoLimpo = textoOriginal
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '');
  const texto = textoLimpo.includes(',')
    ? textoLimpo.replace(',', '.')
    : textoLimpo;
  const numero = Number(texto);
  return Number.isNaN(numero) ? 0 : numero;
}
