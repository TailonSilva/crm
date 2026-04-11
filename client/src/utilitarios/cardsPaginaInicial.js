export const TOTAL_COLUNAS_CARDS_PAGINA_INICIAL = 10;
export const TOTAL_COLUNAS_MAXIMO_CARDS_PAGINA_INICIAL = 20;

export const cardsPaginaInicial = [
  {
    id: 'orcamentosAbertos',
    rotulo: 'Orcamentos em aberto',
    ajudaConfiguracao: 'Mostra quantos orcamentos estao em aberto e o valor total em negociacao.',
    ordemPadrao: 1,
    spanPadrao: 2,
    visivelPadrao: true
  },
  {
    id: 'pedidosMes',
    rotulo: 'Pedidos no mes',
    ajudaConfiguracao: 'Mostra a quantidade de pedidos do mes corrente e o valor liquido total.',
    ordemPadrao: 2,
    spanPadrao: 2,
    visivelPadrao: true
  },
  {
    id: 'mediaDiasConversaoMes',
    rotulo: 'Media de dias para conversao',
    ajudaConfiguracao: 'Mostra a media de dias entre inclusao e fechamento dos orcamentos que chegaram na etapa Fechado no mes corrente.',
    ordemPadrao: 3,
    spanPadrao: 2,
    visivelPadrao: true
  },
  {
    id: 'atendimentosMes',
    rotulo: 'Atendimentos no mes',
    ajudaConfiguracao: 'Mostra a quantidade total de atendimentos registrados no mes corrente.',
    ordemPadrao: 4,
    spanPadrao: 2,
    visivelPadrao: true
  },
  {
    id: 'quantidadeVendidaMes',
    rotulo: 'Quantidade vendida no mes',
    ajudaConfiguracao: 'Mostra a quantidade bruta de itens vendidos no mes corrente, sem debitar devolucoes.',
    ordemPadrao: 5,
    spanPadrao: 2,
    visivelPadrao: true
  },
  {
    id: 'comissaoMes',
    rotulo: 'Comissao no mes',
    ajudaConfiguracao: 'Mostra a comissao liquida do mes corrente com base na comissao dos pedidos.',
    ordemPadrao: 6,
    spanPadrao: 2,
    visivelPadrao: true
  },
  {
    id: 'positivacaoMes',
    rotulo: 'Positivacao no mes',
    ajudaConfiguracao: 'Mostra quantos clientes diferentes fizeram pedidos no mes corrente.',
    ordemPadrao: 7,
    spanPadrao: 2,
    visivelPadrao: true
  },
  {
    id: 'percentualPositivacaoCarteiraMes',
    rotulo: '% Positivacao da carteira',
    ajudaConfiguracao: 'Mostra o percentual da carteira ativa que comprou no mes corrente.',
    ordemPadrao: 8,
    spanPadrao: 2,
    visivelPadrao: true
  },
  {
    id: 'catalogo',
    rotulo: 'Catalogo',
    ajudaConfiguracao: 'Mostra a quantidade de produtos ativos no cadastro.',
    ordemPadrao: 9,
    spanPadrao: 2,
    visivelPadrao: true
  },
  {
    id: 'carteira',
    rotulo: 'Carteira',
    ajudaConfiguracao: 'Mostra a quantidade de clientes ativos no cadastro.',
    ordemPadrao: 10,
    spanPadrao: 2,
    visivelPadrao: true
  }
];

const idsPermitidosCardsPaginaInicial = new Set(cardsPaginaInicial.map((item) => item.id));
const mapaCardsPaginaInicial = new Map(cardsPaginaInicial.map((item) => [item.id, item]));

export function normalizarConfiguracoesCardsPaginaInicial(valor) {
  const lista = normalizarListaConfiguracoes(valor);
  const configuracoesPorId = new Map();

  lista.forEach((item, indice) => {
    const id = String(item?.id || '').trim();

    if (!idsPermitidosCardsPaginaInicial.has(id)) {
      return;
    }

    const definicao = mapaCardsPaginaInicial.get(id);
    const configuracaoExistente = configuracoesPorId.get(id);

    configuracoesPorId.set(id, {
      id,
      base: TOTAL_COLUNAS_CARDS_PAGINA_INICIAL,
      rotulo: item?.rotulo === undefined
        ? (configuracaoExistente?.rotulo ?? normalizarRotulo(item?.rotulo, definicao?.rotulo))
        : normalizarRotulo(item.rotulo, definicao?.rotulo),
      visivel: item?.visivel === undefined
        ? (configuracaoExistente?.visivel ?? Boolean(definicao?.visivelPadrao))
        : Boolean(item.visivel),
      ordem: item?.ordem === undefined
        ? (configuracaoExistente?.ordem ?? normalizarNumeroInteiro(item?.ordem, definicao?.ordemPadrao || (indice + 1)))
        : normalizarNumeroInteiro(item.ordem, definicao?.ordemPadrao || (indice + 1)),
      span: normalizarSpan(item?.span, definicao?.spanPadrao || 2)
    });
  });

  const configuracoesNormalizadas = cardsPaginaInicial.map((definicao, indice) => {
    const configuracao = configuracoesPorId.get(definicao.id);

    return {
      ...definicao,
      base: TOTAL_COLUNAS_CARDS_PAGINA_INICIAL,
      rotuloPadrao: definicao.rotulo,
      rotulo: normalizarRotulo(configuracao?.rotulo, definicao.rotulo),
      visivel: configuracao?.visivel ?? definicao.visivelPadrao,
      ordem: configuracao?.visivel ?? definicao.visivelPadrao
        ? normalizarNumeroInteiro(configuracao?.ordem, definicao.ordemPadrao || (indice + 1))
        : null,
      span: normalizarSpan(configuracao?.span, definicao.spanPadrao)
    };
  });

  return reordenarConfiguracoesCardsPaginaInicial(configuracoesNormalizadas);
}

export function reordenarConfiguracoesCardsPaginaInicial(configuracoes) {
  const lista = Array.isArray(configuracoes)
    ? configuracoes.map((item) => ({ ...item }))
    : [];
  const visiveis = lista
    .filter((item) => item.visivel)
    .sort(ordenarConfiguracoesCardsPaginaInicial)
    .map((item, indice) => ({
      ...item,
      ordem: indice + 1,
      visivel: true
    }));
  const ocultos = cardsPaginaInicial
    .map((definicao) => lista.find((item) => item.id === definicao.id))
    .filter(Boolean)
    .filter((item) => !item.visivel)
    .map((item) => ({
      ...item,
      ordem: null
    }));

  return [...visiveis, ...ocultos];
}

export function reposicionarConfiguracaoCardsPaginaInicial(configuracoes, idCard, ordemDesejada) {
  const lista = Array.isArray(configuracoes) ? configuracoes.map((item) => ({ ...item })) : [];
  const cardAlvo = lista.find((item) => item.id === idCard);

  if (!cardAlvo) {
    return reordenarConfiguracoesCardsPaginaInicial(lista);
  }

  const visiveis = lista
    .filter((item) => item.visivel)
    .sort(ordenarConfiguracoesCardsPaginaInicial)
    .filter((item) => item.id !== idCard);

  const indiceDestino = Math.min(
    Math.max(normalizarNumeroInteiro(ordemDesejada, 1) - 1, 0),
    visiveis.length
  );

  visiveis.splice(indiceDestino, 0, {
    ...cardAlvo,
    visivel: true
  });

  const visiveisReindexados = visiveis.map((item, indice) => ({
    ...item,
    ordem: indice + 1
  }));

  return reordenarConfiguracoesCardsPaginaInicial([
    ...visiveisReindexados,
    ...lista.filter((item) => !item.visivel)
  ]);
}

function normalizarListaConfiguracoes(valor) {
  if (Array.isArray(valor)) {
    return valor;
  }

  if (!valor) {
    return [];
  }

  try {
    const lista = JSON.parse(valor);
    return Array.isArray(lista) ? lista : [];
  } catch (_erro) {
    return [];
  }
}

function normalizarSpan(valor, fallback = 2) {
  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero <= 0) {
    return fallback;
  }

  return Math.max(1, Math.min(TOTAL_COLUNAS_CARDS_PAGINA_INICIAL, Math.floor(numero)));
}

function normalizarRotulo(valor, fallback = '') {
  const texto = String(valor || '').trim();
  return texto || fallback;
}

function normalizarNumeroInteiro(valor, fallback = 1) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : fallback;
}

function ordenarConfiguracoesCardsPaginaInicial(itemA, itemB) {
  const ordemA = itemA?.ordem == null ? Number.MAX_SAFE_INTEGER : Number(itemA.ordem || 0);
  const ordemB = itemB?.ordem == null ? Number.MAX_SAFE_INTEGER : Number(itemB.ordem || 0);

  if (ordemA !== ordemB) {
    return ordemA - ordemB;
  }

  return String(itemA?.id || '').localeCompare(String(itemB?.id || ''));
}
