export const TOTAL_COLUNAS_GRID_ATENDIMENTOS = 100;
const BASE_LEGADA_COLUNAS_GRID_ATENDIMENTOS = 24;
const MAX_SPAN_COLUNA_OCULTA = 19;

export const colunasGridAtendimentos = [
  {
    id: 'codigo',
    rotulo: 'Codigo',
    classe: 'colunaGradeCodigo',
    obrigatoria: false,
    ordemPadrao: 1,
    spanPadrao: 1,
    visivelPadrao: false
  },
  {
    id: 'agendamento',
    rotulo: 'Agendamento',
    classe: 'colunaGradeCodigo',
    obrigatoria: false,
    ordemPadrao: 2,
    spanPadrao: 2,
    visivelPadrao: false
  },
  {
    id: 'data',
    rotulo: 'Data',
    classe: 'colunaGradeData',
    obrigatoria: false,
    ordemPadrao: 3,
    spanPadrao: 2,
    visivelPadrao: true
  },
  {
    id: 'horaInicio',
    rotulo: 'Inicio',
    classe: 'colunaGradeTextoCurto',
    obrigatoria: false,
    ordemPadrao: 4,
    spanPadrao: 1,
    visivelPadrao: true
  },
  {
    id: 'horaFim',
    rotulo: 'Fim',
    classe: 'colunaGradeTextoCurto',
    obrigatoria: false,
    ordemPadrao: 5,
    spanPadrao: 1,
    visivelPadrao: true
  },
  {
    id: 'cliente',
    rotulo: 'Cliente',
    classe: 'colunaGradeTexto',
    obrigatoria: false,
    ordemPadrao: 6,
    spanPadrao: 4,
    visivelPadrao: true
  },
  {
    id: 'contato',
    rotulo: 'Contato',
    classe: 'colunaGradeTexto',
    obrigatoria: false,
    ordemPadrao: 7,
    spanPadrao: 3,
    visivelPadrao: false
  },
  {
    id: 'assunto',
    rotulo: 'Assunto',
    classe: 'colunaGradeTexto',
    obrigatoria: false,
    ordemPadrao: 8,
    spanPadrao: 4,
    visivelPadrao: true
  },
  {
    id: 'descricao',
    rotulo: 'Descricao',
    classe: 'colunaGradeTextoPrincipal',
    obrigatoria: false,
    ordemPadrao: 9,
    spanPadrao: 6,
    visivelPadrao: true
  },
  {
    id: 'canal',
    rotulo: 'Canal',
    classe: 'colunaGradeTextoCurto',
    obrigatoria: false,
    ordemPadrao: 10,
    spanPadrao: 2,
    visivelPadrao: false
  },
  {
    id: 'origem',
    rotulo: 'Origem',
    classe: 'colunaGradeTextoCurto',
    obrigatoria: false,
    ordemPadrao: 11,
    spanPadrao: 2,
    visivelPadrao: true
  },
  {
    id: 'tipoAtendimento',
    rotulo: 'Tipo',
    classe: 'colunaGradeTextoCurto',
    obrigatoria: false,
    ordemPadrao: 12,
    spanPadrao: 2,
    visivelPadrao: false
  },
  {
    id: 'usuario',
    rotulo: 'Usuario',
    classe: 'colunaGradeTextoCurto',
    obrigatoria: false,
    ordemPadrao: 13,
    spanPadrao: 2,
    visivelPadrao: true
  },
  {
    id: 'acoes',
    rotulo: 'Acoes',
    classe: 'colunaGradeAcoes',
    obrigatoria: true,
    ordemPadrao: 14,
    spanPadrao: 2,
    visivelPadrao: true
  }
];

const idsPermitidos = new Set(colunasGridAtendimentos.map((coluna) => coluna.id));
const mapaColunasGridAtendimentos = new Map(
  colunasGridAtendimentos.map((coluna) => [coluna.id, coluna])
);

export function normalizarConfiguracoesColunasGridAtendimentos(valor) {
  const listaNormalizada = normalizarListaConfiguracoes(valor);
  const configuracoesPorId = new Map();

  listaNormalizada.forEach((item, indice) => {
    const id = String(item?.id || '').trim();

    if (!idsPermitidos.has(id)) {
      return;
    }

    const colunaBase = mapaColunasGridAtendimentos.get(id);
    const spanPadraoColuna = normalizarSpanDefinicaoColuna(colunaBase?.spanPadrao || 1);
    const spanFixoColuna = normalizarSpanDefinicaoColuna(colunaBase?.spanFixo);
    const baseConfiguracao = normalizarBaseConfiguracao(item.base);
    const visivel = item.visivel === undefined
      ? true
      : Boolean(item.visivel);
    const ordem = normalizarNumeroInteiro(item.ordem, indice + 1);
    const span = normalizarSpanColuna(item.span, spanPadraoColuna, spanFixoColuna, baseConfiguracao);
    const configuracaoExistente = configuracoesPorId.get(id);

    configuracoesPorId.set(id, {
      id,
      base: item.base === undefined ? (configuracaoExistente?.base ?? baseConfiguracao) : baseConfiguracao,
      visivel: item.visivel === undefined ? (configuracaoExistente?.visivel ?? visivel) : visivel,
      ordem: item.ordem === undefined ? (configuracaoExistente?.ordem ?? ordem) : ordem,
      span: item.span === undefined ? (configuracaoExistente?.span ?? span) : span,
      rotulo: item.rotulo === undefined
        ? (configuracaoExistente?.rotulo ?? colunaBase?.rotulo)
        : normalizarRotuloColuna(item.rotulo, colunaBase?.rotulo)
    });
  });

  const configuracoesNormalizadas = colunasGridAtendimentos.map((coluna, indice) => {
    const configuracao = configuracoesPorId.get(coluna.id);
    const spanPadraoColuna = normalizarSpanDefinicaoColuna(coluna.spanPadrao || 1);
    const spanFixoColuna = normalizarSpanDefinicaoColuna(coluna.spanFixo);

    return {
      ...coluna,
      base: TOTAL_COLUNAS_GRID_ATENDIMENTOS,
      rotuloPadrao: coluna.rotulo,
      rotulo: normalizarRotuloColuna(configuracao?.rotulo, coluna.rotulo),
      spanPadrao: spanPadraoColuna,
      spanFixo: spanFixoColuna,
      visivel: coluna.obrigatoria ? true : (configuracao?.visivel ?? coluna.visivelPadrao),
      ordem: coluna.obrigatoria || (configuracao?.visivel ?? coluna.visivelPadrao)
        ? normalizarNumeroInteiro(configuracao?.ordem, coluna.ordemPadrao || (indice + 1))
        : null,
      span: normalizarSpanColuna(
        configuracao?.span,
        spanPadraoColuna,
        spanFixoColuna,
        normalizarBaseConfiguracao(configuracao?.base, TOTAL_COLUNAS_GRID_ATENDIMENTOS)
      )
    };
  }).map((coluna) => ({
    ...coluna,
    span: ajustarSpanColunaOculta(coluna.span, coluna.visivel || coluna.obrigatoria, coluna.spanPadrao)
  }));

  return reordenarConfiguracoesColunasGridAtendimentos(configuracoesNormalizadas);
}

export function normalizarColunasGridAtendimentos(valor) {
  return normalizarConfiguracoesColunasGridAtendimentos(valor)
    .filter((coluna) => coluna.visivel)
    .sort(ordenarColunasGridAtendimentos);
}

export function normalizarIdsColunasGridAtendimentos(valor) {
  return normalizarColunasGridAtendimentos(valor).map((coluna) => coluna.id);
}

export function reordenarConfiguracoesColunasGridAtendimentos(configuracoes) {
  const lista = Array.isArray(configuracoes) ? configuracoes.map((coluna) => ({ ...coluna })) : [];
  const visiveis = lista
    .filter((coluna) => coluna.visivel || coluna.obrigatoria)
    .sort(ordenarColunasGridAtendimentos)
    .map((coluna) => ({
      ...coluna,
      visivel: coluna.obrigatoria ? true : Boolean(coluna.visivel)
    }));
  const colunasFixasNoFim = visiveis.filter((coluna) => coluna.id === 'acoes');
  const colunasReordenaveis = visiveis.filter((coluna) => coluna.id !== 'acoes');
  const visiveisReordenadas = [...colunasReordenaveis, ...colunasFixasNoFim].map((coluna, indice) => ({
    ...coluna,
    ordem: indice + 1
  }));
  const invisiveis = lista
    .filter((coluna) => !coluna.visivel && !coluna.obrigatoria)
    .sort((colunaA, colunaB) => (colunaA.ordemPadrao || 0) - (colunaB.ordemPadrao || 0))
    .map((coluna) => ({
      ...coluna,
      ordem: null
    }));

  return [...visiveisReordenadas, ...invisiveis];
}

export function reposicionarConfiguracaoColunaGridAtendimentos(configuracoes, idColuna, ordemDesejada) {
  const lista = Array.isArray(configuracoes) ? configuracoes.map((coluna) => ({ ...coluna })) : [];
  const visiveisOrdenadas = lista
    .filter((coluna) => coluna.visivel || coluna.obrigatoria)
    .sort(ordenarColunasGridAtendimentos);
  const colunasFixasNoFim = visiveisOrdenadas.filter((coluna) => coluna.id === 'acoes');
  const colunasReordenaveis = visiveisOrdenadas.filter((coluna) => coluna.id !== 'acoes');
  const invisiveis = lista
    .filter((coluna) => !coluna.visivel && !coluna.obrigatoria)
    .sort((colunaA, colunaB) => (colunaA.ordemPadrao || 0) - (colunaB.ordemPadrao || 0))
    .map((coluna) => ({
      ...coluna,
      ordem: null
    }));
  if (idColuna === 'acoes') {
    return reordenarConfiguracoesColunasGridAtendimentos(lista);
  }

  const indiceAtual = colunasReordenaveis.findIndex((coluna) => coluna.id === idColuna);

  if (indiceAtual === -1) {
    return reordenarConfiguracoesColunasGridAtendimentos(lista);
  }

  const [colunaReposicionada] = colunasReordenaveis.splice(indiceAtual, 1);
  const ordemNormalizada = normalizarNumeroInteiro(ordemDesejada, colunaReposicionada.ordem || 1);
  const indiceDestino = Math.max(0, Math.min(colunasReordenaveis.length, ordemNormalizada - 1));

  colunasReordenaveis.splice(indiceDestino, 0, colunaReposicionada);

  const visiveisReordenadas = [...colunasReordenaveis, ...colunasFixasNoFim].map((coluna, indice) => ({
    ...coluna,
    visivel: coluna.obrigatoria ? true : Boolean(coluna.visivel),
    ordem: indice + 1
  }));

  return [...visiveisReordenadas, ...invisiveis];
}

function normalizarListaConfiguracoes(valor) {
  if (Array.isArray(valor)) {
    return normalizarItensConfiguracao(valor);
  }

  if (!valor) {
    return [];
  }

  try {
    const lista = JSON.parse(valor);
    return Array.isArray(lista) ? normalizarItensConfiguracao(lista) : [];
  } catch (_erro) {
    return String(valor)
      .split(',')
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .map((id) => ({ id }));
  }
}

function normalizarItensConfiguracao(lista) {
  return lista
    .map((item) => {
      if (typeof item === 'string' || typeof item === 'number') {
        return { id: String(item).trim() };
      }

      if (!item || typeof item !== 'object') {
        return null;
      }

      return {
        id: String(item.id || '').trim(),
        base: item.base,
        rotulo: item.rotulo,
        visivel: item.visivel,
        ordem: item.ordem,
        span: item.span
      };
    })
    .filter(Boolean);
}

function ordenarColunasGridAtendimentos(colunaA, colunaB) {
  if (colunaA.id === 'acoes' && colunaB.id !== 'acoes') {
    return 1;
  }

  if (colunaB.id === 'acoes' && colunaA.id !== 'acoes') {
    return -1;
  }

  if (colunaA.ordem !== colunaB.ordem) {
    return colunaA.ordem - colunaB.ordem;
  }

  return (colunaA.ordemPadrao || 0) - (colunaB.ordemPadrao || 0);
}

function normalizarNumeroInteiro(valor, valorPadrao = 1) {
  const numero = Number.parseInt(String(valor ?? '').trim(), 10);

  return Number.isFinite(numero) && numero > 0 ? numero : valorPadrao;
}

function normalizarSpanColuna(valor, valorPadrao = 1, valorFixo = null, baseConfiguracao = TOTAL_COLUNAS_GRID_ATENDIMENTOS) {
  if (Number.isFinite(Number(valorFixo)) && Number(valorFixo) > 0) {
    return Math.min(TOTAL_COLUNAS_GRID_ATENDIMENTOS, Math.max(1, Number(valorFixo)));
  }

  const numero = normalizarNumeroInteiro(valor, valorPadrao);
  return converterSpanParaBaseAtual(numero, baseConfiguracao);
}

function normalizarRotuloColuna(valor, valorPadrao = '') {
  const texto = String(valor ?? '').trim();
  return texto || String(valorPadrao || '').trim();
}

function normalizarBaseConfiguracao(valor, valorPadrao = BASE_LEGADA_COLUNAS_GRID_ATENDIMENTOS) {
  const numero = Number.parseInt(String(valor ?? '').trim(), 10);
  return Number.isFinite(numero) && numero > 0 ? numero : valorPadrao;
}

function normalizarSpanDefinicaoColuna(valor) {
  if (!Number.isFinite(Number(valor)) || Number(valor) <= 0) {
    return null;
  }

  return converterSpanParaBaseAtual(Number(valor), BASE_LEGADA_COLUNAS_GRID_ATENDIMENTOS);
}

function converterSpanParaBaseAtual(valor, baseOrigem = TOTAL_COLUNAS_GRID_ATENDIMENTOS) {
  const numero = normalizarNumeroInteiro(valor, 1);

  if (baseOrigem === TOTAL_COLUNAS_GRID_ATENDIMENTOS) {
    return Math.min(TOTAL_COLUNAS_GRID_ATENDIMENTOS, Math.max(1, numero));
  }

  return Math.min(
    TOTAL_COLUNAS_GRID_ATENDIMENTOS,
    Math.max(1, Math.floor((numero * TOTAL_COLUNAS_GRID_ATENDIMENTOS) / baseOrigem))
  );
}

function ajustarSpanColunaOculta(span, visivel, spanPadrao) {
  if (visivel) {
    return span;
  }

  const spanNormalizado = normalizarNumeroInteiro(span, spanPadrao || 1);
  return Math.min(MAX_SPAN_COLUNA_OCULTA, Math.max(1, spanNormalizado));
}
