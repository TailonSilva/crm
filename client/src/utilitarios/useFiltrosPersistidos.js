import { useEffect, useRef, useState } from 'react';

const PREFIXO_STORAGE_FILTROS = 'crm.filtros';

function obterStorageLocal() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (_erro) {
    return null;
  }
}

function copiarValor(valor) {
  if (Array.isArray(valor)) {
    return [...valor];
  }

  if (valor && typeof valor === 'object') {
    return { ...valor };
  }

  return valor;
}

function montarChaveStorage(chave, usuario) {
  const idUsuario = usuario?.idUsuario ? String(usuario.idUsuario) : 'anonimo';
  return `${PREFIXO_STORAGE_FILTROS}.${chave}.usuario.${idUsuario}`;
}

function combinarComPadrao(filtros, filtrosPadrao) {
  return Object.keys(filtrosPadrao || {}).reduce((resultado, chaveAtual) => {
    const possuiValorPersistido = filtros && Object.prototype.hasOwnProperty.call(filtros, chaveAtual);

    resultado[chaveAtual] = possuiValorPersistido
      ? filtros[chaveAtual]
      : copiarValor(filtrosPadrao[chaveAtual]);

    return resultado;
  }, {});
}

function normalizarEstado(filtros, filtrosPadrao, normalizarFiltros) {
  const filtrosBase = combinarComPadrao(filtros, filtrosPadrao);

  if (typeof normalizarFiltros !== 'function') {
    return filtrosBase;
  }

  return normalizarFiltros(filtrosBase, filtrosPadrao);
}

function carregarFiltros(chaveStorage, filtrosPadrao, normalizarFiltros) {
  const storage = obterStorageLocal();

  if (!storage) {
    return normalizarEstado(filtrosPadrao, filtrosPadrao, normalizarFiltros);
  }

  const valorPersistido = storage.getItem(chaveStorage);

  if (!valorPersistido) {
    return normalizarEstado(filtrosPadrao, filtrosPadrao, normalizarFiltros);
  }

  try {
    return normalizarEstado(JSON.parse(valorPersistido), filtrosPadrao, normalizarFiltros);
  } catch (_erro) {
    storage.removeItem(chaveStorage);
    return normalizarEstado(filtrosPadrao, filtrosPadrao, normalizarFiltros);
  }
}

function salvarFiltros(chaveStorage, filtros) {
  const storage = obterStorageLocal();

  if (!storage) {
    return;
  }

  storage.setItem(chaveStorage, JSON.stringify(filtros));
}

export function normalizarValorFiltroPersistido(valor) {
  if (valor === null || valor === undefined) {
    return '';
  }

  return String(valor).trim();
}

export function normalizarListaFiltroPersistido(valores) {
  const listaValores = Array.isArray(valores)
    ? valores
    : valores === null || valores === undefined || valores === ''
      ? []
      : [valores];

  return listaValores
    .map((valor) => normalizarValorFiltroPersistido(valor))
    .filter(Boolean);
}

export function normalizarFiltrosPorPadrao(filtros, filtrosPadrao) {
  return Object.keys(filtrosPadrao || {}).reduce((resultado, chaveAtual) => {
    resultado[chaveAtual] = Array.isArray(filtrosPadrao[chaveAtual])
      ? normalizarListaFiltroPersistido(filtros?.[chaveAtual])
      : normalizarValorFiltroPersistido(filtros?.[chaveAtual]);

    return resultado;
  }, {});
}

export function useFiltrosPersistidos({
  chave,
  usuario,
  filtrosPadrao,
  normalizarFiltros
}) {
  const normalizarFiltrosRef = useRef(normalizarFiltros);
  const ignorarPersistenciaRef = useRef(false);
  const chaveStorage = montarChaveStorage(chave, usuario);
  const assinaturaPadrao = JSON.stringify(filtrosPadrao);

  normalizarFiltrosRef.current = normalizarFiltros;

  const [filtros, definirEstadoFiltros] = useState(() => (
    carregarFiltros(chaveStorage, filtrosPadrao, normalizarFiltrosRef.current)
  ));

  useEffect(() => {
    ignorarPersistenciaRef.current = true;
    definirEstadoFiltros(carregarFiltros(chaveStorage, filtrosPadrao, normalizarFiltrosRef.current));
  }, [chaveStorage, assinaturaPadrao]);

  useEffect(() => {
    if (ignorarPersistenciaRef.current) {
      ignorarPersistenciaRef.current = false;
      return;
    }

    salvarFiltros(
      chaveStorage,
      normalizarEstado(filtros, filtrosPadrao, normalizarFiltrosRef.current)
    );
  }, [chaveStorage, assinaturaPadrao, filtros, filtrosPadrao]);

  function definirFiltros(valorOuFuncao) {
    definirEstadoFiltros((estadoAtual) => {
      const proximoEstado = typeof valorOuFuncao === 'function'
        ? valorOuFuncao(estadoAtual)
        : valorOuFuncao;

      return normalizarEstado(proximoEstado, filtrosPadrao, normalizarFiltrosRef.current);
    });
  }

  return [filtros, definirFiltros];
}
