import { useEffect, useMemo, useRef, useState } from 'react';
import '../../recursos/estilos/cabecalhoPagina.css';
import { Botao } from '../../componentes/comuns/botao';
import { ModalBuscaClientes } from '../../componentes/comuns/modalBuscaClientes';
import { ModalFiltros } from '../../componentes/comuns/modalFiltros';
import { CorpoPagina } from '../../componentes/layout/corpoPagina';
import {
  incluirAtendimento,
  listarAtendimentosGrid,
  listarCanaisAtendimento,
  listarOrigensAtendimento
} from '../../servicos/atendimentos';
import {
  atualizarPrazoPagamento,
  incluirPrazoPagamento,
  listarCamposOrcamentoConfiguracao,
  listarCamposPedidoConfiguracao,
  listarEtapasOrcamentoConfiguracao,
  listarEtapasPedidoConfiguracao,
  listarMetodosPagamentoConfiguracao,
  listarMotivosPerdaConfiguracao,
  listarPrazosPagamentoConfiguracao
} from '../../servicos/configuracoes';
import { listarClientes, listarContatos, listarRamosAtividade, listarVendedores } from '../../servicos/clientes';
import { listarEmpresas } from '../../servicos/empresa';
import {
  atualizarOrcamento,
  incluirOrcamento,
  listarOrcamentos
} from '../../servicos/orcamentos';
import {
  incluirPedido
} from '../../servicos/pedidos';
import { listarProdutos } from '../../servicos/produtos';
import { listarUsuarios } from '../../servicos/usuarios';
import {
  atualizarAgendamento,
  atualizarStatusAgendamentoUsuario,
  excluirAgendamento,
  incluirAgendamento,
  listarAgendamentos,
  listarLocaisAgenda,
  listarRecursosAgenda,
  listarStatusVisita,
  listarTiposAgenda,
  listarTiposRecurso
} from '../../servicos/agenda';
import {
  normalizarFiltrosPorPadrao,
  normalizarListaFiltroPersistido,
  useFiltrosPersistidos
} from '../../utilitarios/useFiltrosPersistidos';
import { registroEstaAtivo } from '../../utilitarios/statusRegistro';
import { ModalAtendimento } from '../atendimentos/modalAtendimento';
import { ModalPedido } from '../pedidos/modalPedido';
import { ModalAgendamento } from './modalAgendamento';
import { ModalManualAgenda } from './modalManualAgenda';

const minutosInicioPadrao = 8 * 60;
const minutosFimPadrao = 18 * 60;
const intervaloMinutos = 15;
const alturaLinhaAgenda = 20;
const espacoVerticalCelulaAgenda = 4;
const configuracaoExpedientePadrao = {
  horaInicioManha: '08:00',
  horaFimManha: '12:00',
  horaInicioTarde: '13:00',
  horaFimTarde: '18:00',
  trabalhaSabado: false,
  horaInicioSabado: '08:00',
  horaFimSabado: '12:00'
};
const filtrosIniciaisAgenda = {
  idUsuario: [],
  idVendedor: [],
  idCliente: '',
  idLocal: [],
  idRecurso: [],
  idStatusVisita: []
};
const ID_STATUS_VISITA_REALIZADO = 3;

export function PaginaAgenda({ usuarioLogado }) {
  const [dataBase, definirDataBase] = useState(new Date());
  const [agendamentos, definirAgendamentos] = useState([]);
  const [locais, definirLocais] = useState([]);
  const [recursos, definirRecursos] = useState([]);
  const [tiposAgenda, definirTiposAgenda] = useState([]);
  const [statusVisita, definirStatusVisita] = useState([]);
  const [clientes, definirClientes] = useState([]);
  const [contatos, definirContatos] = useState([]);
  const [usuarios, definirUsuarios] = useState([]);
  const [vendedores, definirVendedores] = useState([]);
  const [ramosAtividade, definirRamosAtividade] = useState([]);
  const [canaisAtendimento, definirCanaisAtendimento] = useState([]);
  const [origensAtendimento, definirOrigensAtendimento] = useState([]);
  const [orcamentos, definirOrcamentos] = useState([]);
  const [metodosPagamento, definirMetodosPagamento] = useState([]);
  const [prazosPagamento, definirPrazosPagamento] = useState([]);
  const [etapasOrcamento, definirEtapasOrcamento] = useState([]);
  const [etapasPedido, definirEtapasPedido] = useState([]);
  const [motivosPerda, definirMotivosPerda] = useState([]);
  const [produtos, definirProdutos] = useState([]);
  const [camposOrcamento, definirCamposOrcamento] = useState([]);
  const [camposPedido, definirCamposPedido] = useState([]);
  const [empresa, definirEmpresa] = useState(null);
  const [contextoCarregado, definirContextoCarregado] = useState(false);
  const [modalAberto, definirModalAberto] = useState(false);
  const [modalManualAberto, definirModalManualAberto] = useState(false);
  const [modalFiltrosAberto, definirModalFiltrosAberto] = useState(false);
  const [modalBuscaClienteFiltrosAberto, definirModalBuscaClienteFiltrosAberto] = useState(false);
  const [filtrosEmEdicao, definirFiltrosEmEdicao] = useState(null);
  const [modalAtendimentoAberto, definirModalAtendimentoAberto] = useState(false);
  const [modalPedidoAberto, definirModalPedidoAberto] = useState(false);
  const [confirmacaoAtendimentoAberta, definirConfirmacaoAtendimentoAberta] = useState(false);
  const [menuStatusAgenda, definirMenuStatusAgenda] = useState(null);
  const [dadosIniciaisModal, definirDadosIniciaisModal] = useState(null);
  const [dadosIniciaisAtendimento, definirDadosIniciaisAtendimento] = useState(null);
  const [dadosIniciaisPedido, definirDadosIniciaisPedido] = useState(null);
  const [orcamentoPedidoEmCriacao, definirOrcamentoPedidoEmCriacao] = useState(null);
  const [etapaOrcamentoAtualizadaExternamente, definirEtapaOrcamentoAtualizadaExternamente] = useState(null);
  const [agendamentoPendenteAtendimento, definirAgendamentoPendenteAtendimento] = useState(null);
  const [idAgendamentoSelecionado, definirIdAgendamentoSelecionado] = useState(null);
  const [agendamentoCopiado, definirAgendamentoCopiado] = useState(null);
  const [faixaSelecionada, definirFaixaSelecionada] = useState(null);
  const [arrastandoFaixa, definirArrastandoFaixa] = useState(null);
  const temporizadorCliqueAgenda = useRef(null);
  const usuarioSomenteConsultaConfiguracao = usuarioLogado?.tipo === 'Usuario padrao';
  const filtrosIniciais = useMemo(
    () => criarFiltrosIniciaisAgenda(usuarioLogado),
    [usuarioLogado?.idUsuario]
  );
  const [filtros, definirFiltros] = useFiltrosPersistidos({
    chave: 'paginaAgenda',
    usuario: usuarioLogado,
    filtrosPadrao: filtrosIniciais,
    normalizarFiltros: normalizarFiltrosAgenda
  });

  const inicioSemana = useMemo(() => obterInicioSemana(dataBase), [dataBase]);
  const diasSemana = useMemo(
    () => criarDiasSemana(inicioSemana, empresa, agendamentos),
    [inicioSemana, empresa, agendamentos]
  );
  const faixaHorariosSemana = useMemo(
    () => calcularFaixaHorariosSemana(agendamentos, diasSemana, empresa),
    [agendamentos, diasSemana, empresa]
  );
  const horarios = useMemo(
    () => criarHorarios(faixaHorariosSemana.minutosInicio, faixaHorariosSemana.minutosFim),
    [faixaHorariosSemana]
  );
  const estiloGradeAgenda = useMemo(
    () => ({
      gridTemplateColumns: `52px repeat(${diasSemana.length}, minmax(0, 1fr))`
    }),
    [diasSemana.length]
  );
  const filtrosAtivos = Object.values(filtros).some((valor) => (
    Array.isArray(valor) ? valor.length > 0 : Boolean(valor)
  ));

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (!contextoCarregado) {
      return;
    }

    carregarGradeAgenda();
  }, [contextoCarregado, dataBase, usuarioLogado?.idUsuario, usuarioLogado?.idVendedor, JSON.stringify(filtros)]);

  useEffect(() => {
    if (!arrastandoFaixa) {
      return undefined;
    }

    function finalizarSelecaoFaixa() {
      definirArrastandoFaixa(null);
    }

    window.addEventListener('mouseup', finalizarSelecaoFaixa);

    return () => {
      window.removeEventListener('mouseup', finalizarSelecaoFaixa);
    };
  }, [arrastandoFaixa]);

  useEffect(() => () => {
    if (temporizadorCliqueAgenda.current) {
      window.clearTimeout(temporizadorCliqueAgenda.current);
    }
  }, []);

  useEffect(() => {
    if (!menuStatusAgenda) {
      return undefined;
    }

    function fecharMenuStatus() {
      definirMenuStatusAgenda(null);
    }

    function tratarTeclaMenuStatus(evento) {
      if (evento.key === 'Escape') {
        definirMenuStatusAgenda(null);
      }
    }

    window.addEventListener('mousedown', fecharMenuStatus);
    window.addEventListener('contextmenu', fecharMenuStatus);
    window.addEventListener('keydown', tratarTeclaMenuStatus);

    return () => {
      window.removeEventListener('mousedown', fecharMenuStatus);
      window.removeEventListener('contextmenu', fecharMenuStatus);
      window.removeEventListener('keydown', tratarTeclaMenuStatus);
    };
  }, [menuStatusAgenda]);

  useEffect(() => {
    function tratarAtalhosAgenda(evento) {
      if (evento.key === 'F1') {
        evento.preventDefault();

        if (!modalAberto && !modalManualAberto && !modalFiltrosAberto && !modalAtendimentoAberto && !modalPedidoAberto && !confirmacaoAtendimentoAberta) {
          definirModalManualAberto(true);
        }

        return;
      }

      if (modalAberto || modalManualAberto || modalFiltrosAberto || modalAtendimentoAberto || modalPedidoAberto || confirmacaoAtendimentoAberta || evento.defaultPrevented) {
        return;
      }

      const elementoAtivo = evento.target;
      const nomeTag = elementoAtivo?.tagName;

      if (elementoAtivo?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(nomeTag)) {
        return;
      }

      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'c') {
        const agendamentoSelecionado = agendamentos.find(
          (agendamento) => String(agendamento.idAgendamento) === String(idAgendamentoSelecionado)
        );

        if (!agendamentoSelecionado) {
          return;
        }

        evento.preventDefault();
        definirAgendamentoCopiado(agendamentoSelecionado);
        return;
      }

      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'v') {
        if (!agendamentoCopiado || !faixaSelecionada?.data || !faixaSelecionada?.horaInicio) {
          return;
        }

        evento.preventDefault();
        colarAgendamentoCopiado();
      }
    }

    window.addEventListener('keydown', tratarAtalhosAgenda);

    return () => {
      window.removeEventListener('keydown', tratarAtalhosAgenda);
    };
  }, [
    agendamentos,
    agendamentoCopiado,
    faixaSelecionada,
    idAgendamentoSelecionado,
    modalAberto,
    modalManualAberto,
    modalAtendimentoAberto,
    modalFiltrosAberto,
    modalPedidoAberto,
    confirmacaoAtendimentoAberta
  ]);

  async function carregarDados() {
    try {
      const contexto = await carregarContexto();
      await carregarGradeAgenda(contexto);
    } catch (_erro) {
      definirAgendamentos([]);
    }
  }

  async function carregarContexto() {
    const resultados = await Promise.allSettled([
      listarLocaisAgenda(),
      listarRecursosAgenda(),
      listarTiposRecurso(),
      listarTiposAgenda(),
      listarStatusVisita(),
      listarCanaisAtendimento(),
      listarOrigensAtendimento(),
      listarOrcamentos(),
      listarMetodosPagamentoConfiguracao(),
      listarPrazosPagamentoConfiguracao(),
      listarEtapasOrcamentoConfiguracao(),
      listarEtapasPedidoConfiguracao(),
      listarMotivosPerdaConfiguracao(),
      listarProdutos(),
      listarCamposOrcamentoConfiguracao(),
      listarCamposPedidoConfiguracao(),
      listarClientes(),
      listarContatos(),
      listarVendedores(),
      listarRamosAtividade(),
      listarUsuarios(),
      listarEmpresas()
    ]);

    const [
      locaisResultado,
      recursosResultado,
      tiposRecursoResultado,
      tiposAgendaResultado,
      statusVisitaResultado,
      canaisResultado,
      origensResultado,
      orcamentosResultado,
      metodosResultado,
      prazosResultado,
      etapasOrcamentoResultado,
      etapasPedidoResultado,
      motivosPerdaResultado,
      produtosResultado,
      camposOrcamentoResultado,
      camposPedidoResultado,
      clientesResultado,
      contatosResultado,
      vendedoresResultado,
      ramosResultado,
      usuariosResultado,
      empresasResultado
    ] = resultados;

    const locaisCarregados = locaisResultado.status === 'fulfilled' ? locaisResultado.value : [];
    const recursosCarregados = recursosResultado.status === 'fulfilled' ? recursosResultado.value : [];
    const tiposRecursoCarregados = tiposRecursoResultado.status === 'fulfilled' ? tiposRecursoResultado.value : [];
    const tiposAgendaCarregados = tiposAgendaResultado.status === 'fulfilled' ? tiposAgendaResultado.value : [];
    const statusVisitaCarregados = statusVisitaResultado.status === 'fulfilled' ? statusVisitaResultado.value : [];
    const canaisAtendimentoCarregados = canaisResultado.status === 'fulfilled' ? canaisResultado.value : [];
    const origensAtendimentoCarregadas = origensResultado.status === 'fulfilled' ? origensResultado.value : [];
    const orcamentosCarregados = orcamentosResultado.status === 'fulfilled' ? orcamentosResultado.value : [];
    const metodosCarregados = metodosResultado.status === 'fulfilled' ? metodosResultado.value : [];
    const prazosCarregados = prazosResultado.status === 'fulfilled' ? prazosResultado.value : [];
    const etapasOrcamentoCarregadas = etapasOrcamentoResultado.status === 'fulfilled' ? etapasOrcamentoResultado.value : [];
    const etapasPedidoCarregadas = etapasPedidoResultado.status === 'fulfilled' ? etapasPedidoResultado.value : [];
    const motivosPerdaCarregados = motivosPerdaResultado.status === 'fulfilled' ? motivosPerdaResultado.value : [];
    const produtosCarregados = produtosResultado.status === 'fulfilled' ? produtosResultado.value : [];
    const camposOrcamentoCarregados = camposOrcamentoResultado.status === 'fulfilled' ? camposOrcamentoResultado.value : [];
    const camposPedidoCarregados = camposPedidoResultado.status === 'fulfilled' ? camposPedidoResultado.value : [];
    const clientesCarregados = clientesResultado.status === 'fulfilled' ? clientesResultado.value : [];
    const contatosCarregados = contatosResultado.status === 'fulfilled' ? contatosResultado.value : [];
    const vendedoresCarregados = vendedoresResultado.status === 'fulfilled' ? vendedoresResultado.value : [];
    const ramosCarregados = ramosResultado.status === 'fulfilled' ? ramosResultado.value : [];
    const usuariosCarregados = usuariosResultado.status === 'fulfilled' ? usuariosResultado.value : [];
    const empresasCarregadas = empresasResultado.status === 'fulfilled' ? empresasResultado.value : [];

    const empresaCarregada = empresasCarregadas[0] || null;
    const tiposAgendaAtivos = ordenarRegistrosPorOrdem(
      tiposAgendaCarregados.filter((tipoAgenda) => registroEstaAtivo(tipoAgenda.status)),
      'idTipoAgenda'
    );
    const statusVisitaAtivos = ordenarRegistrosPorOrdem(
      statusVisitaCarregados.filter((status) => registroEstaAtivo(status.status)),
      'idStatusVisita'
    );
    const clientesAtivos = clientesCarregados.filter((cliente) => registroEstaAtivo(cliente.status));
    const contatosAtivos = contatosCarregados.filter((contato) => registroEstaAtivo(contato.status));
    const vendedoresAtivos = vendedoresCarregados.filter((vendedor) => registroEstaAtivo(vendedor.status));
    const usuariosAtivos = usuariosCarregados.filter((usuario) => registroEstaAtivo(usuario.ativo));
    const canaisAtivos = canaisAtendimentoCarregados.filter((canal) => registroEstaAtivo(canal.status));
    const origensAtivas = origensAtendimentoCarregadas.filter((origem) => registroEstaAtivo(origem.status));
    const produtosAtivos = produtosCarregados.filter((produto) => registroEstaAtivo(produto.status));
    const recursosEnriquecidos = enriquecerRecursos(recursosCarregados, tiposRecursoCarregados);
    const prazosEnriquecidos = enriquecerPrazosPagamento(prazosCarregados, metodosCarregados);
    const orcamentosAbertos = enriquecerOrcamentosAtendimento(
      orcamentosCarregados,
      clientesCarregados,
      contatosCarregados,
      usuariosCarregados,
      vendedoresCarregados,
      prazosCarregados.map((prazo) => ({
        ...prazo,
        descricaoFormatada: prazo.descricao || [prazo.prazo1, prazo.prazo2, prazo.prazo3, prazo.prazo4, prazo.prazo5, prazo.prazo6]
          .filter((valor) => valor !== null && valor !== undefined && valor !== '')
          .join(' / ')
      })),
      etapasOrcamentoCarregadas,
      produtosCarregados
    ).filter((orcamento) => orcamentoEstaAberto(orcamento));

    definirEmpresa(empresaCarregada);
    definirLocais(locaisCarregados);
    definirTiposAgenda(tiposAgendaAtivos);
    definirStatusVisita(statusVisitaAtivos);
    definirClientes(clientesAtivos);
    definirContatos(contatosAtivos);
    definirVendedores(vendedoresAtivos);
    definirRamosAtividade(ramosCarregados);
    definirCanaisAtendimento(canaisAtivos);
    definirOrigensAtendimento(origensAtivas);
    definirUsuarios(usuariosAtivos);
    definirMetodosPagamento(metodosCarregados);
    definirPrazosPagamento(prazosEnriquecidos);
    definirEtapasOrcamento(etapasOrcamentoCarregadas);
    definirEtapasPedido(etapasPedidoCarregadas.map((etapa) => ({
      ...etapa,
      idEtapaPedido: etapa.idEtapaPedido ?? etapa.idEtapa
    })));
    definirMotivosPerda(motivosPerdaCarregados);
    definirProdutos(produtosAtivos);
    definirCamposOrcamento(camposOrcamentoCarregados);
    definirCamposPedido(camposPedidoCarregados);
    definirOrcamentos(orcamentosAbertos);
    definirRecursos(recursosEnriquecidos);
    definirContextoCarregado(true);

    return {
      locais: locaisCarregados,
      recursos: recursosEnriquecidos,
      tiposAgenda: tiposAgendaAtivos,
      statusVisita: statusVisitaAtivos,
      clientes: clientesAtivos,
      contatos: contatosAtivos,
      vendedores: vendedoresAtivos,
      usuarios: usuariosAtivos
    };
  }

  async function carregarGradeAgenda(contextoAtual = null) {
    const dataInicioSemana = formatarDataIso(inicioSemana);
    const dataFimSemana = formatarDataIso(adicionarDias(inicioSemana, 6));
    const contexto = contextoAtual || {
      locais,
      recursos,
      tiposAgenda,
      statusVisita,
      clientes,
      contatos,
      vendedores,
      usuarios
    };
    const filtrosGrade = {
      dataInicio: dataInicioSemana,
      dataFim: dataFimSemana,
      ...filtros,
      ...(usuarioLogado?.tipo === 'Usuario padrao' && usuarioLogado?.idVendedor
        ? {
          escopoIdVendedor: usuarioLogado.idVendedor,
          escopoIdUsuario: usuarioLogado.idUsuario
        }
        : {})
    };

    const [agendamentosCarregados, atendimentosCarregados] = await Promise.all([
      listarAgendamentos(filtrosGrade),
      listarAtendimentosGrid({
        filtros: {
          dataInicio: dataInicioSemana,
          dataFim: dataFimSemana,
          ...(usuarioLogado?.tipo === 'Usuario padrao' && usuarioLogado?.idVendedor
            ? {
              escopoIdVendedor: usuarioLogado.idVendedor,
              escopoIdUsuario: usuarioLogado.idUsuario
            }
            : {})
        }
      })
    ]);

    definirAgendamentos(distribuirAgendamentosPorConflito(enriquecerAgendamentos(
      agendamentosCarregados,
      contexto.locais,
      contexto.recursos,
      [],
      contexto.tiposAgenda,
      contexto.statusVisita,
      atendimentosCarregados,
      contexto.clientes,
      contexto.contatos,
      contexto.vendedores,
      contexto.usuarios,
      usuarioLogado
    )));
    definirIdAgendamentoSelecionado((estadoAtual) => {
      if (!estadoAtual) {
        return null;
      }

      return agendamentosCarregados.some(
        (agendamento) => String(agendamento.idAgendamento) === String(estadoAtual)
      )
        ? estadoAtual
        : null;
    });
    definirAgendamentoCopiado((estadoAtual) => {
      if (!estadoAtual) {
        return null;
      }

      return agendamentosCarregados.find(
        (agendamento) => String(agendamento.idAgendamento) === String(estadoAtual.idAgendamento)
      ) || estadoAtual;
    });
  }

  async function salvarAgendamento(dadosAgendamento) {
    const tipoAgendaSelecionado = tiposAgenda.find(
      (tipoAgenda) => String(tipoAgenda.idTipoAgenda) === String(dadosAgendamento.idTipoAgenda)
    );

    const payload = {
      data: dadosAgendamento.data,
      assunto: dadosAgendamento.assunto.trim(),
      horaInicio: dadosAgendamento.horaInicio,
      horaFim: dadosAgendamento.horaFim,
      idLocal: dadosAgendamento.idLocal ? Number(dadosAgendamento.idLocal) : null,
      idRecurso: dadosAgendamento.idsRecursos[0] ? Number(dadosAgendamento.idsRecursos[0]) : null,
      idsRecursos: dadosAgendamento.idsRecursos.map((idRecurso) => Number(idRecurso)),
      idUsuario: dadosAgendamento.idsUsuarios[0] ? Number(dadosAgendamento.idsUsuarios[0]) : null,
      idsUsuarios: dadosAgendamento.idsUsuarios.map((idUsuario) => Number(idUsuario)),
      idCliente: dadosAgendamento.idCliente ? Number(dadosAgendamento.idCliente) : null,
      idContato: dadosAgendamento.idContato ? Number(dadosAgendamento.idContato) : null,
      tipo: tipoAgendaSelecionado?.descricao || null,
      idTipoAgenda: Number(dadosAgendamento.idTipoAgenda),
      idStatusVisita: Number(dadosAgendamento.idStatusVisita),
      status: 1
    };

    if (dadosAgendamento.idAgendamento) {
      await atualizarAgendamento(dadosAgendamento.idAgendamento, payload);
    } else {
      await incluirAgendamento(payload);
    }

    await carregarDados();
    fecharModalAgendamento();
  }

  function abrirNovoAgendamento(data, horario) {
    definirDadosIniciaisModal({
      data,
      assunto: '',
      horaInicio: horario,
      horaFim: somarMinutosHorario(horario, 60)
    });
    definirModalAberto(true);
  }

  function abrirNovoAgendamentoPorFaixa() {
    if (faixaSelecionada?.data && faixaSelecionada?.horaInicio && faixaSelecionada?.horaFim) {
      definirDadosIniciaisModal({
        data: faixaSelecionada.data,
        assunto: '',
        horaInicio: faixaSelecionada.horaInicio,
        horaFim: faixaSelecionada.horaFim
      });
      definirModalAberto(true);
      return;
    }

    abrirNovoAgendamento(formatarDataIso(new Date()), '08:00');
  }

  function abrirEdicaoAgendamento(agendamento) {
    definirDadosIniciaisModal({
      idAgendamento: String(agendamento.idAgendamento),
      data: agendamento.data,
      assunto: agendamento.assunto || '',
      horaInicio: agendamento.horaInicio,
      horaFim: agendamento.horaFim,
      idLocal: normalizarCampoSelectAgendamento(agendamento.idLocal),
      idsRecursos: agendamento.idsRecursos,
      idsUsuarios: agendamento.idsUsuarios,
      idCliente: normalizarCampoSelectAgendamento(agendamento.idCliente),
      idContato: normalizarCampoSelectAgendamento(agendamento.idContato),
      idTipoAgenda: normalizarCampoSelectAgendamento(agendamento.idTipoAgenda),
      idStatusVisita: normalizarCampoSelectAgendamento(agendamento.idStatusVisita)
    });
    definirModalAberto(true);
  }

  function tratarCliqueAgendamento(evento, agendamento) {
    evento.stopPropagation();
    definirIdAgendamentoSelecionado(agendamento.idAgendamento);

    if (temporizadorCliqueAgenda.current) {
      window.clearTimeout(temporizadorCliqueAgenda.current);
    }

    temporizadorCliqueAgenda.current = window.setTimeout(() => {
      temporizadorCliqueAgenda.current = null;
      void tentarGerarAtendimentoPorAgendamento(agendamento);
    }, 220);
  }

  function tratarDuploCliqueAgendamento(evento, agendamento) {
    evento.stopPropagation();
    definirIdAgendamentoSelecionado(agendamento.idAgendamento);

    if (temporizadorCliqueAgenda.current) {
      window.clearTimeout(temporizadorCliqueAgenda.current);
      temporizadorCliqueAgenda.current = null;
    }

    abrirEdicaoAgendamento(agendamento);
  }

  function fecharModalAgendamento() {
    definirModalAberto(false);
    definirDadosIniciaisModal(null);
  }

  function abrirModalFiltrosAgenda() {
    definirFiltrosEmEdicao({
      ...filtros,
      idUsuario: Array.isArray(filtros.idUsuario) ? [...filtros.idUsuario] : [],
      idVendedor: Array.isArray(filtros.idVendedor) ? [...filtros.idVendedor] : [],
      idLocal: Array.isArray(filtros.idLocal) ? [...filtros.idLocal] : [],
      idRecurso: Array.isArray(filtros.idRecurso) ? [...filtros.idRecurso] : [],
      idStatusVisita: Array.isArray(filtros.idStatusVisita) ? [...filtros.idStatusVisita] : []
    });
    definirModalFiltrosAberto(true);
  }

  function fecharModalFiltrosAgenda() {
    definirModalFiltrosAberto(false);
    definirFiltrosEmEdicao(null);
  }

  function colarAgendamentoCopiado() {
    if (!agendamentoCopiado || !faixaSelecionada?.data || !faixaSelecionada?.horaInicio) {
      return;
    }

    const duracaoOriginal = Math.max(
      intervaloMinutos,
      converterHorarioParaMinutos(agendamentoCopiado.horaFim) - converterHorarioParaMinutos(agendamentoCopiado.horaInicio)
    );
    const faixaTemDuracaoPersonalizada = (
      faixaSelecionada.horaFim &&
      faixaSelecionada.horaFim !== somarMinutosHorario(faixaSelecionada.horaInicio, intervaloMinutos)
    );
    const horaInicioDestino = faixaSelecionada.horaInicio;
    const horaFimDestino = faixaTemDuracaoPersonalizada
      ? faixaSelecionada.horaFim
      : somarMinutosHorario(horaInicioDestino, duracaoOriginal);

    definirDadosIniciaisModal({
      data: faixaSelecionada.data,
      assunto: agendamentoCopiado.assunto || '',
      horaInicio: horaInicioDestino,
      horaFim: horaFimDestino,
      idLocal: agendamentoCopiado.idLocal ? String(agendamentoCopiado.idLocal) : '',
      idsRecursos: Array.isArray(agendamentoCopiado.idsRecursos)
        ? agendamentoCopiado.idsRecursos.map((idRecurso) => String(idRecurso))
        : [],
      idsUsuarios: Array.isArray(agendamentoCopiado.idsUsuarios)
        ? agendamentoCopiado.idsUsuarios.map((idUsuario) => String(idUsuario))
        : [],
      idCliente: agendamentoCopiado.idCliente ? String(agendamentoCopiado.idCliente) : '',
      idContato: agendamentoCopiado.idContato ? String(agendamentoCopiado.idContato) : '',
      idTipoAgenda: agendamentoCopiado.idTipoAgenda ? String(agendamentoCopiado.idTipoAgenda) : '',
      idStatusVisita: agendamentoCopiado.idStatusVisita ? String(agendamentoCopiado.idStatusVisita) : ''
    });
    definirModalAberto(true);
  }

  async function excluirRegistroAgendamento(idAgendamento) {
    await excluirAgendamento(idAgendamento);
    await carregarDados();
    fecharModalAgendamento();
  }

  async function atualizarStatusAgendamento(agendamento, idStatusVisita) {
    if (!agendamento?.idAgendamento || !idStatusVisita || !usuarioLogado?.idUsuario) {
      return;
    }

    if (String(agendamento.idStatusVisita) === String(idStatusVisita)) {
      definirMenuStatusAgenda(null);
      return;
    }

    await atualizarStatusAgendamentoUsuario(Number(agendamento.idAgendamento), {
      idUsuario: Number(usuarioLogado.idUsuario),
      idStatusVisita: Number(idStatusVisita)
    });
    definirMenuStatusAgenda(null);
    await carregarDados();
  }

  function abrirMenuStatusAgenda(evento, agendamento) {
    const idsUsuariosAgendamento = Array.isArray(agendamento?.idsUsuarios)
      ? agendamento.idsUsuarios.map(String)
      : [];

    if (!usuarioLogado?.idUsuario || !idsUsuariosAgendamento.includes(String(usuarioLogado.idUsuario))) {
      return;
    }

    evento.preventDefault();
    evento.stopPropagation();
    definirIdAgendamentoSelecionado(agendamento.idAgendamento);
    definirMenuStatusAgenda({
      agendamento,
      posicaoX: evento.clientX,
      posicaoY: evento.clientY
    });
  }

  function tentarGerarAtendimentoPorAgendamento(agendamento) {
    if (!deveOferecerGeracaoAtendimento(agendamento, usuarioLogado)) {
      return;
    }

    definirAgendamentoPendenteAtendimento(agendamento);
    definirConfirmacaoAtendimentoAberta(true);
  }

  function fecharConfirmacaoAtendimento() {
    definirConfirmacaoAtendimentoAberta(false);
    definirAgendamentoPendenteAtendimento(null);
  }

  function confirmarGeracaoAtendimento() {
    if (!agendamentoPendenteAtendimento) {
      return;
    }

    definirDadosIniciaisAtendimento({
      idAgendamento: String(agendamentoPendenteAtendimento.idAgendamento),
      idCliente: normalizarCampoSelectAgendamento(agendamentoPendenteAtendimento.idCliente),
      idContato: normalizarCampoSelectAgendamento(agendamentoPendenteAtendimento.idContato),
      idUsuario: normalizarCampoSelectAgendamento(usuarioLogado?.idUsuario),
      nomeUsuario: usuarioLogado?.nome || '',
      assunto: String(agendamentoPendenteAtendimento.assunto || `Atendimento - ${agendamentoPendenteAtendimento.nomeTipoAgenda || 'Agenda'}`).trim(),
      descricao: criarDescricaoAtendimentoPorAgendamento(agendamentoPendenteAtendimento),
      data: agendamentoPendenteAtendimento.data,
      horaInicio: agendamentoPendenteAtendimento.horaInicio,
      horaFim: agendamentoPendenteAtendimento.horaFim,
      idCanalAtendimento: '',
      idOrigemAtendimento: ''
    });
    definirConfirmacaoAtendimentoAberta(false);
    definirModalAtendimentoAberto(true);
  }

  function fecharModalAtendimentoAgenda() {
    definirModalAtendimentoAberto(false);
    definirDadosIniciaisAtendimento(null);
    definirAgendamentoPendenteAtendimento(null);
  }

  async function salvarAtendimentoAgenda(dadosAtendimento) {
    const statusRealizado = statusVisita.find(
      (status) => Number(status.idStatusVisita) === ID_STATUS_VISITA_REALIZADO
    );

    await incluirAtendimento({
      idAgendamento: Number(dadosAtendimento.idAgendamento),
      idCliente: Number(dadosAtendimento.idCliente),
      idContato: dadosAtendimento.idContato ? Number(dadosAtendimento.idContato) : null,
      idUsuario: Number(usuarioLogado.idUsuario),
      assunto: String(dadosAtendimento.assunto || '').trim(),
      descricao: String(dadosAtendimento.descricao || '').trim() || null,
      data: dadosAtendimento.data,
      horaInicio: dadosAtendimento.horaInicio,
      horaFim: dadosAtendimento.horaFim,
      idCanalAtendimento: dadosAtendimento.idCanalAtendimento ? Number(dadosAtendimento.idCanalAtendimento) : null,
      idOrigemAtendimento: dadosAtendimento.idOrigemAtendimento ? Number(dadosAtendimento.idOrigemAtendimento) : null
    });

    if (statusRealizado && dadosAtendimento.idAgendamento) {
      await atualizarStatusAgendamentoUsuario(Number(dadosAtendimento.idAgendamento), {
        idUsuario: Number(usuarioLogado.idUsuario),
        idStatusVisita: Number(statusRealizado.idStatusVisita)
      });
    }

    await carregarDados();
    fecharModalAtendimentoAgenda();
  }

  async function incluirOrcamentoPelaAgenda(dadosOrcamento) {
    const orcamentoSalvo = await incluirOrcamento(normalizarPayloadOrcamento(dadosOrcamento, usuarioLogado));
    await carregarDados();
    return orcamentoSalvo;
  }

  async function atualizarOrcamentoPelaAgenda(dadosOrcamento) {
    if (!dadosOrcamento?.idOrcamento) {
      return null;
    }

    const orcamentoSalvo = await atualizarOrcamento(
      dadosOrcamento.idOrcamento,
      normalizarPayloadOrcamento(dadosOrcamento, usuarioLogado)
    );
    await carregarDados();
    return orcamentoSalvo;
  }

  async function salvarPrazoPagamentoPelaAgenda(dadosPrazo) {
    const payload = normalizarPayloadPrazoPagamento(dadosPrazo);
    const registroSalvo = dadosPrazo?.idPrazoPagamento
      ? await atualizarPrazoPagamento(dadosPrazo.idPrazoPagamento, payload)
      : await incluirPrazoPagamento(payload);

    await carregarDados();
    return enriquecerPrazoPagamento(registroSalvo, metodosPagamento);
  }

  async function inativarPrazoPagamentoPelaAgenda(prazo) {
    if (!prazo?.idPrazoPagamento) {
      return null;
    }

    const registroAtual = prazosPagamento.find(
      (item) => String(item.idPrazoPagamento) === String(prazo.idPrazoPagamento)
    ) || prazo;

    await atualizarPrazoPagamento(
      prazo.idPrazoPagamento,
      normalizarPayloadPrazoPagamento({
        ...registroAtual,
        status: false
      })
    );

    await carregarDados();
    return null;
  }

  async function atualizarStatusOrcamentoPelaAgenda({ idOrcamento, idEtapaOrcamento }) {
    const orcamentoAtual = orcamentos.find((item) => item.idOrcamento === idOrcamento);

    if (!orcamentoAtual || !idEtapaOrcamento || String(orcamentoAtual.idEtapaOrcamento) === String(idEtapaOrcamento)) {
      return orcamentoAtual || null;
    }

    const orcamentoSalvo = await atualizarOrcamento(
      idOrcamento,
      normalizarPayloadOrcamento(
        {
          ...orcamentoAtual,
          idEtapaOrcamento
        },
        usuarioLogado
      )
    );

    await carregarDados();
    return orcamentoSalvo;
  }

  function abrirPedidoPelaAgenda(dadosPedido, contexto = null) {
    definirOrcamentoPedidoEmCriacao(contexto);
    definirDadosIniciaisPedido(dadosPedido);
    definirModalPedidoAberto(true);
  }

  async function fecharModalPedidoAgenda() {
    if (orcamentoPedidoEmCriacao?.idOrcamento) {
      const etapaFechadoSemPedido = obterEtapaFechadoSemPedido(etapasOrcamento);

      if (etapaFechadoSemPedido?.idEtapaOrcamento) {
        await atualizarStatusOrcamentoPelaAgenda({
          idOrcamento: Number(orcamentoPedidoEmCriacao.idOrcamento),
          idEtapaOrcamento: Number(etapaFechadoSemPedido.idEtapaOrcamento)
        });
        definirEtapaOrcamentoAtualizadaExternamente({
          idOrcamento: Number(orcamentoPedidoEmCriacao.idOrcamento),
          idEtapaOrcamento: String(etapaFechadoSemPedido.idEtapaOrcamento)
        });
      }
    }

    definirModalPedidoAberto(false);
    definirDadosIniciaisPedido(null);
    definirOrcamentoPedidoEmCriacao(null);
  }

  async function salvarPedidoPelaAgenda(dadosPedido) {
    await incluirPedido(normalizarPayloadPedido(dadosPedido));
    await carregarDados();
    definirModalPedidoAberto(false);
    definirDadosIniciaisPedido(null);
    definirOrcamentoPedidoEmCriacao(null);
    definirEtapaOrcamentoAtualizadaExternamente(null);
  }

  function iniciarSelecaoFaixa(evento, data, horario) {
    evento.preventDefault();

    const faixaInicial = {
      data,
      horaInicio: horario,
      horaFim: somarMinutosHorario(horario, intervaloMinutos)
    };

    definirIdAgendamentoSelecionado(null);
    definirFaixaSelecionada(faixaInicial);
    definirArrastandoFaixa({
      data,
      horarioInicial: horario,
      horarioAtual: horario
    });
  }

  function expandirSelecaoFaixa(data, horario) {
    if (!arrastandoFaixa || arrastandoFaixa.data !== data) {
      return;
    }

    const faixaAtualizada = criarFaixaPorHorarios(data, arrastandoFaixa.horarioInicial, horario);
    definirArrastandoFaixa((estadoAtual) => ({
      ...estadoAtual,
      horarioAtual: horario
    }));
    definirFaixaSelecionada(faixaAtualizada);
  }

  return (
    <>
      <header className="cabecalhoPagina">
        <div>
          <h1>Agenda</h1>
          <p>Visualizacao semanal com grade de 15 em 15 minutos.</p>
        </div>

        <div className="acoesCabecalhoPagina">
          <Botao
            variante="primario"
            icone="adicionar"
            somenteIcone
            title="Incluir agendamento"
            aria-label="Incluir agendamento"
            onClick={abrirNovoAgendamentoPorFaixa}
          >
            Incluir agendamento
          </Botao>
          <Botao
            variante={filtrosAtivos ? 'primario' : 'secundario'}
            icone="filtro"
            somenteIcone
            title="Filtrar"
            aria-label="Filtrar"
            onClick={abrirModalFiltrosAgenda}
          >
            Filtrar
          </Botao>
          <Botao
            variante="secundario"
            icone="anterior"
            somenteIcone
            title="Semana anterior"
            aria-label="Semana anterior"
            onClick={() => definirDataBase(adicionarDias(inicioSemana, -7))}
          >
            Semana anterior
          </Botao>
          <Botao variante="secundario" onClick={() => definirDataBase(new Date())}>
            Hoje
          </Botao>
          <Botao
            variante="secundario"
            icone="proximo"
            somenteIcone
            title="Proxima semana"
            aria-label="Proxima semana"
            onClick={() => definirDataBase(adicionarDias(inicioSemana, 7))}
          >
            Proxima semana
          </Botao>
        </div>
      </header>

      <CorpoPagina>
        <section className="painelAgenda">
          <div className="agendaSemanal">
            <div className="cabecalhoAgendaGrade" style={estiloGradeAgenda}>
              <div className="colunaHorarioAgenda cabecalhoHorarioAgenda" />
              {diasSemana.map((dia) => (
                <div key={dia.iso} className="cabecalhoDiaAgenda">
                  <strong>{dia.rotulo}</strong>
                  <span>{dia.data}</span>
                </div>
              ))}
            </div>

            <div className="corpoAgendaGrade">
              <div className="linhaAgenda linhaAgendaEspaco" aria-hidden="true">
                <div className="linhaAgendaConteudo" style={estiloGradeAgenda}>
                  <div className="colunaHorarioAgenda colunaHorarioAgendaEspaco" />
                  {diasSemana.map((dia) => (
                    <div key={`espaco-${dia.iso}`} className="celulaAgenda celulaAgendaEspaco" />
                  ))}
                </div>
              </div>

              {horarios.map((horario) => (
                <div key={horario} className="linhaAgenda">
                      <div className="linhaAgendaConteudo" style={estiloGradeAgenda}>
                    <div className="colunaHorarioAgenda etiquetaHorarioAgenda">{horario}</div>
                    {diasSemana.map((dia, indiceDia) => {
                      const agendamentosCelula = agendamentos.filter(
                        (agendamento) => (
                          agendamento.data === dia.valor &&
                          obterHorarioLinhaAgendamento(agendamento.horaInicio) === horario
                        )
                      );

                      return (
                        <div
                          key={`${dia.iso}-${horario}`}
                          className={`celulaAgenda ${horarioNoIntervaloSemExpediente(horario, empresa) ? 'celulaAgendaSemExpediente' : ''} ${celulaEstaNaFaixaSelecionada(faixaSelecionada, dia.valor, horario) ? 'celulaAgendaSelecionada' : ''}`}
                          onMouseDown={(evento) => iniciarSelecaoFaixa(evento, dia.valor, horario)}
                          onMouseEnter={() => expandirSelecaoFaixa(dia.valor, horario)}
                          onDoubleClick={() => abrirNovoAgendamento(dia.valor, horario)}
                        >
                          {agendamentosCelula.map((agendamento) => (
                            <button
                              key={agendamento.idAgendamento}
                              type="button"
                              className={`cartaoAgendamentoAgenda ${calcularQuantidadeCelulasAgendamento(agendamento.horaInicio, agendamento.horaFim) === 1 ? 'compacto' : ''} ${String(idAgendamentoSelecionado) === String(agendamento.idAgendamento) ? 'selecionado' : ''} ${indiceDia >= diasSemana.length - 2 ? 'tooltipEsquerda' : 'tooltipDireita'}`}
                              style={{
                                height: `${calcularAlturaAgendamento(agendamento.horaInicio, agendamento.horaFim)}px`,
                                top: `${calcularDeslocamentoVerticalAgendamento(agendamento.horaInicio)}px`,
                                background: criarEstiloCartaoAgenda(agendamento.corTipoAgenda),
                                color: criarCorTextoCartaoAgenda(agendamento.corTipoAgenda),
                                boxShadow: criarSombraCartaoAgenda(agendamento.corTipoAgenda),
                                '--corSelecaoAgenda': converterHexParaRgba(agendamento.corTipoAgenda, 0.42),
                                '--corSelecaoAgendaSuave': converterHexParaRgba(agendamento.corTipoAgenda, 0.16),
                                ...criarPosicionamentoCartaoAgenda(
                                  agendamento.indiceColunaAgenda,
                                  agendamento.totalColunasAgenda
                                )
                              }}
                              onClick={(evento) => tratarCliqueAgendamento(evento, agendamento)}
                              onDoubleClick={(evento) => tratarDuploCliqueAgendamento(evento, agendamento)}
                              onContextMenu={(evento) => abrirMenuStatusAgenda(evento, agendamento)}
                            >
                              <strong>{agendamento.assunto || 'Sem assunto'}</strong>
                              <small>{agendamento.horaInicio} - {agendamento.horaFim}</small>
                              <div className="rodapeCartaoAgendamentoAgenda">
                                {agendamento.iconeStatusVisita ? (
                                  <span className="iconeStatusCartaoAgenda" aria-label={agendamento.nomeStatusVisita} title={agendamento.nomeStatusVisita}>
                                    {agendamento.iconeStatusVisita}
                                  </span>
                                ) : null}
                              </div>
                              <span className="tooltipAgendamentoAgenda" role="tooltip">
                                {criarLinhasTooltipAgendamento(agendamento).map((linha, indiceLinha) => (
                                  indiceLinha === 0
                                    ? <strong key={`${agendamento.idAgendamento}-tooltip-${indiceLinha}`}>{linha}</strong>
                                    : <span key={`${agendamento.idAgendamento}-tooltip-${indiceLinha}`}>{linha}</span>
                                ))}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </CorpoPagina>

      <ModalAgendamento
        aberto={modalAberto}
        dadosIniciais={dadosIniciaisModal}
        locais={locais.filter((local) => registroEstaAtivo(local.status))}
        recursos={recursos.filter((recurso) => registroEstaAtivo(recurso.status))}
        clientes={clientes}
        contatos={contatos}
        usuarios={usuarios}
        tiposAgenda={tiposAgenda}
        statusVisita={statusVisita}
        usuarioLogado={usuarioLogado}
        permitirExcluir={usuarioLogado?.tipo !== 'Usuario padrao'}
        aoFechar={fecharModalAgendamento}
        aoSalvar={salvarAgendamento}
        aoExcluir={excluirRegistroAgendamento}
      />

      <ModalManualAgenda
        aberto={modalManualAberto}
        aoFechar={() => definirModalManualAberto(false)}
        empresa={empresa}
        tiposAgenda={tiposAgenda}
        statusVisita={statusVisita}
        locais={locais}
        recursos={recursos}
        filtros={filtros}
        usuarioLogado={usuarioLogado}
      />

      <ModalAtendimento
        aberto={modalAtendimentoAberto}
        atendimento={dadosIniciaisAtendimento}
        clientes={clientes}
        contatos={contatos}
        usuarioLogado={usuarioLogado}
        vendedores={vendedores}
        ramosAtividade={ramosAtividade}
        canaisAtendimento={canaisAtendimento}
        origensAtendimento={origensAtendimento}
        modo="novo"
        permitirExcluir={false}
        aoIncluirCliente={undefined}
        aoIncluirOrcamento={incluirOrcamentoPelaAgenda}
        aoAtualizarOrcamento={atualizarOrcamentoPelaAgenda}
        dadosOrcamento={montarDadosIniciaisOrcamentoPeloAtendimento(dadosIniciaisAtendimento, clientes, vendedores, usuarioLogado)}
        clientesOrcamento={clientes}
        contatosOrcamento={contatos}
        usuariosOrcamento={usuarios}
        vendedoresOrcamento={vendedores}
        metodosPagamento={metodosPagamento}
        prazosPagamento={prazosPagamento}
        etapasOrcamento={etapasOrcamento}
        motivosPerda={motivosPerda}
        orcamentos={orcamentos}
        produtos={produtos}
        camposOrcamento={camposOrcamento}
        camposPedido={camposPedido}
        etapasPedido={etapasPedido}
        empresa={empresa}
        somenteConsultaPrazos={usuarioSomenteConsultaConfiguracao}
        etapaOrcamentoAtualizadaExternamente={etapaOrcamentoAtualizadaExternamente}
        aoAtualizarStatusOrcamento={atualizarStatusOrcamentoPelaAgenda}
        aoAbrirPedido={abrirPedidoPelaAgenda}
        aoSalvarPrazoPagamento={salvarPrazoPagamentoPelaAgenda}
        aoInativarPrazoPagamento={inativarPrazoPagamentoPelaAgenda}
        aoFechar={fecharModalAtendimentoAgenda}
        aoSalvar={salvarAtendimentoAgenda}
        aoExcluir={undefined}
      />

      <ModalPedido
        aberto={modalPedidoAberto}
        pedido={null}
        dadosIniciais={dadosIniciaisPedido}
        clientes={clientes}
        contatos={contatos}
        usuarios={usuarios}
        vendedores={vendedores}
        metodosPagamento={metodosPagamento}
        prazosPagamento={prazosPagamento}
        etapasPedido={etapasPedido}
        produtos={produtos}
        camposPedido={camposPedido}
        empresa={empresa}
        usuarioLogado={usuarioLogado}
        modo="novo"
        somenteConsultaPrazos={usuarioSomenteConsultaConfiguracao}
        aoFechar={fecharModalPedidoAgenda}
        aoSalvar={salvarPedidoPelaAgenda}
        aoSalvarPrazoPagamento={salvarPrazoPagamentoPelaAgenda}
        aoInativarPrazoPagamento={inativarPrazoPagamentoPelaAgenda}
      />

      {confirmacaoAtendimentoAberta ? (
        <div className="camadaConfirmacaoTela" role="presentation" onMouseDown={fecharConfirmacaoAtendimento}>
          <div
            className="modalConfirmacaoAgenda"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="tituloConfirmacaoAtendimentoAgenda"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <div className="cabecalhoConfirmacaoModal">
              <h4 id="tituloConfirmacaoAtendimentoAgenda">Gerar atendimento</h4>
            </div>

            <div className="corpoConfirmacaoModal">
              <p>Essa agenda ja terminou. Deseja abrir um atendimento com os dados dela?</p>
            </div>

            <div className="acoesConfirmacaoModal">
              <Botao variante="secundario" type="button" onClick={fecharConfirmacaoAtendimento}>
                Nao
              </Botao>
              <Botao variante="primario" type="button" onClick={confirmarGeracaoAtendimento}>
                Sim
              </Botao>
            </div>
          </div>
        </div>
      ) : null}

      {menuStatusAgenda ? (
        <div
          className="menuContextoAgenda"
          role="menu"
          aria-label="Alterar status da agenda"
          style={criarPosicaoMenuStatusAgenda(menuStatusAgenda.posicaoX, menuStatusAgenda.posicaoY)}
          onMouseDown={(evento) => evento.stopPropagation()}
        >
          <div className="cabecalhoMenuContextoAgenda">
            <strong>Status da agenda</strong>
            <span>{menuStatusAgenda.agendamento.assunto || 'Sem assunto'}</span>
          </div>

          <div className="listaMenuContextoAgenda">
            {statusVisita.map((status) => {
              const estaSelecionado = String(status.idStatusVisita) === String(menuStatusAgenda.agendamento.idStatusVisita);

              return (
                <button
                  key={status.idStatusVisita}
                  type="button"
                  role="menuitemradio"
                  aria-checked={estaSelecionado}
                  className={`itemMenuContextoAgenda ${estaSelecionado ? 'ativo' : ''}`}
                  onMouseDown={(evento) => evento.stopPropagation()}
                  onClick={() => atualizarStatusAgendamento(menuStatusAgenda.agendamento, status.idStatusVisita)}
                >
                  <span className="conteudoItemMenuContextoAgenda">
                    <span className="iconeItemMenuContextoAgenda">{status.icone || '•'}</span>
                    <span className="descricaoItemMenuContextoAgenda">{status.descricao}</span>
                  </span>
                  {estaSelecionado ? (
                    <span className="seloStatusAtualAgenda">Atual</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <ModalFiltros
        aberto={modalFiltrosAberto}
        titulo="Filtros da agenda"
        filtros={filtrosEmEdicao || filtros}
        campos={[
          {
            name: 'idUsuario',
            label: 'Usuario',
            multiple: true,
            placeholder: 'Todos os usuarios',
            options: usuarios.map((usuario) => ({
              valor: String(usuario.idUsuario),
              label: usuario.nome
            }))
          },
          {
            name: 'idVendedor',
            label: 'Vendedor',
            multiple: true,
            placeholder: 'Todos os vendedores',
            options: vendedores.map((vendedor) => ({
              valor: String(vendedor.idVendedor),
              label: vendedor.nome
            }))
          },
          {
            name: 'idCliente',
            label: 'Cliente',
            acaoExtra: (
                <Botao
                  variante="secundario"
                  icone="pesquisa"
                  type="button"
                  className="botaoCampoAcao"
                  onClick={() => definirModalBuscaClienteFiltrosAberto(true)}
                  somenteIcone
                title="Buscar cliente"
                aria-label="Buscar cliente"
              >
                Buscar cliente
              </Botao>
            ),
            options: clientes.map((cliente) => ({
              valor: String(cliente.idCliente),
              label: cliente.nomeFantasia || cliente.razaoSocial
            }))
          },
          {
            name: 'idLocal',
            label: 'Local',
            multiple: true,
            placeholder: 'Todos os locais',
            options: locais
              .filter((local) => registroEstaAtivo(local.status))
              .map((local) => ({
                valor: String(local.idLocal),
                label: local.descricao
              }))
          },
          {
            name: 'idRecurso',
            label: 'Recurso',
            multiple: true,
            placeholder: 'Todos os recursos',
            options: recursos
              .filter((recurso) => registroEstaAtivo(recurso.status))
              .map((recurso) => ({
                valor: String(recurso.idRecurso),
                label: recurso.descricao
              }))
          },
          {
            name: 'idStatusVisita',
            label: 'Status',
            multiple: true,
            placeholder: 'Todos os status',
            options: statusVisita.map((status) => ({
              valor: String(status.idStatusVisita),
              label: status.descricao
            }))
          }
        ]}
        aoFechar={fecharModalFiltrosAgenda}
        aoAplicar={(novosFiltros) => {
          definirFiltros(novosFiltros);
          fecharModalFiltrosAgenda();
        }}
        aoLimpar={() => definirFiltrosEmEdicao(criarFiltrosIniciaisAgenda(usuarioLogado))}
      />
      <ModalBuscaClientes
        aberto={modalBuscaClienteFiltrosAberto}
        empresa={empresa}
        clientes={clientes}
        placeholder="Pesquisar cliente no filtro"
        ariaLabelPesquisa="Pesquisar cliente no filtro"
        aoSelecionar={(cliente) => {
          definirFiltrosEmEdicao((estadoAtual) => ({
            ...(estadoAtual || criarFiltrosIniciaisAgenda(usuarioLogado)),
            idCliente: String(cliente.idCliente || '')
          }));
          definirModalBuscaClienteFiltrosAberto(false);
        }}
        aoFechar={() => definirModalBuscaClienteFiltrosAberto(false)}
      />
    </>
  );
}

function normalizarFiltrosAgenda(filtros, filtrosPadrao) {
  const filtrosNormalizados = normalizarFiltrosPorPadrao(filtros, filtrosPadrao);

  return {
    ...filtrosNormalizados,
    idUsuario: normalizarListaFiltroPersistido(filtrosNormalizados.idUsuario),
    idVendedor: normalizarListaFiltroPersistido(filtrosNormalizados.idVendedor),
    idLocal: normalizarListaFiltroPersistido(filtrosNormalizados.idLocal),
    idRecurso: normalizarListaFiltroPersistido(filtrosNormalizados.idRecurso),
    idStatusVisita: normalizarListaFiltroPersistido(filtrosNormalizados.idStatusVisita)
  };
}

function criarFiltrosIniciaisAgenda(usuarioLogado) {
  return {
    ...filtrosIniciaisAgenda,
    idUsuario: usuarioLogado?.idUsuario ? [String(usuarioLogado.idUsuario)] : []
  };
}

function normalizarCampoSelectAgendamento(valor) {
  if (valor === null || valor === undefined || valor === '' || Number(valor) <= 0) {
    return '';
  }

  return String(valor);
}

function ordenarRegistrosPorOrdem(registros, chavePrimaria) {
  if (!Array.isArray(registros)) {
    return [];
  }

  return [...registros].sort((registroA, registroB) => {
    const ordemA = normalizarOrdemOrdenacao(registroA?.ordem, registroA?.[chavePrimaria]);
    const ordemB = normalizarOrdemOrdenacao(registroB?.ordem, registroB?.[chavePrimaria]);

    if (ordemA !== ordemB) {
      return ordemA - ordemB;
    }

    return Number(registroA?.[chavePrimaria] || 0) - Number(registroB?.[chavePrimaria] || 0);
  });
}

function normalizarOrdemOrdenacao(ordem, fallback) {
  const ordemNumerica = Number(ordem);

  if (Number.isFinite(ordemNumerica) && ordemNumerica > 0) {
    return ordemNumerica;
  }

  const fallbackNumerico = Number(fallback);
  if (Number.isFinite(fallbackNumerico) && fallbackNumerico > 0) {
    return fallbackNumerico;
  }

  return Number.MAX_SAFE_INTEGER;
}

function obterInicioSemana(data) {
  const dataNormalizada = new Date(data);
  dataNormalizada.setHours(0, 0, 0, 0);

  const diaSemana = dataNormalizada.getDay();
  const diferenca = diaSemana === 0 ? -6 : 1 - diaSemana;
  dataNormalizada.setDate(dataNormalizada.getDate() + diferenca);

  return dataNormalizada;
}

function criarDiasSemana(inicioSemana, empresa, agendamentos) {
  const configuracaoExpediente = obterConfiguracaoExpediente(empresa);
  const indicesDias = [0, 1, 2, 3, 4];
  const datasComAgendamento = new Set((agendamentos || []).map((agendamento) => agendamento.data));
  const sabado = adicionarDias(inicioSemana, 5);
  const domingo = adicionarDias(inicioSemana, 6);
  const possuiSabadoNaSemana = configuracaoExpediente.trabalhaSabado || datasComAgendamento.has(formatarDataIso(sabado));
  const possuiDomingoNaSemana = datasComAgendamento.has(formatarDataIso(domingo));

  if (possuiSabadoNaSemana) {
    indicesDias.push(5);
  }

  if (possuiDomingoNaSemana) {
    indicesDias.push(6);
  }

  return indicesDias.map((indice) => {
    const data = adicionarDias(inicioSemana, indice);

    return {
      rotulo: obterRotuloDiaSemana(data),
      data: data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      }),
      valor: formatarDataIso(data),
      iso: data.toISOString()
    };
  });
}

function criarHorarios(minutosInicio, minutosFim) {
  const horarios = [];

  for (let minutos = minutosInicio; minutos <= minutosFim; minutos += intervaloMinutos) {
    const horas = String(Math.floor(minutos / 60)).padStart(2, '0');
    const restoMinutos = String(minutos % 60).padStart(2, '0');
    horarios.push(`${horas}:${restoMinutos}`);
  }

  return horarios;
}

function calcularFaixaHorariosSemana(agendamentos, diasSemana, empresa) {
  const datasSemana = new Set(diasSemana.map((dia) => dia.valor));
  const agendamentosSemana = agendamentos.filter((agendamento) => datasSemana.has(agendamento.data));
  const configuracaoExpediente = obterConfiguracaoExpediente(empresa);
  const inicioPadrao = converterHorarioParaMinutos(configuracaoExpediente.horaInicioManha);
  const fimPadrao = converterHorarioParaMinutos(configuracaoExpediente.horaFimTarde);

  if (agendamentosSemana.length === 0) {
    return {
      minutosInicio: inicioPadrao,
      minutosFim: fimPadrao
    };
  }

  const menorHorario = agendamentosSemana.reduce((menorAtual, agendamento) => (
    Math.min(menorAtual, converterHorarioParaMinutos(agendamento.horaInicio))
  ), Number.POSITIVE_INFINITY);

  const maiorHorario = agendamentosSemana.reduce((maiorAtual, agendamento) => (
    Math.max(maiorAtual, converterHorarioParaMinutos(agendamento.horaFim))
  ), 0);

  return {
    minutosInicio: Math.min(inicioPadrao, arredondarMinutosParaBaixo(menorHorario)),
    minutosFim: Math.max(fimPadrao, arredondarMinutosParaCima(maiorHorario))
  };
}

function adicionarDias(data, dias) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + dias);
  return novaData;
}

function obterRotuloDiaSemana(data) {
  const rotulos = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
  return rotulos[data.getDay()];
}

function formatarPeriodoSemana(diasSemana) {
  const primeiroDia = diasSemana[0];
  const ultimoDia = diasSemana[diasSemana.length - 1];

  return `${primeiroDia.data} a ${ultimoDia.data}`;
}

function formatarDataIso(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function somarMinutosHorario(horario, minutosSomados) {
  const [horas, minutos] = horario.split(':').map(Number);
  const totalMinutos = (horas * 60) + minutos + minutosSomados;
  const novasHoras = String(Math.floor(totalMinutos / 60)).padStart(2, '0');
  const novosMinutos = String(totalMinutos % 60).padStart(2, '0');
  return `${novasHoras}:${novosMinutos}`;
}

function calcularAlturaAgendamento(horaInicio, horaFim) {
  const duracaoMinutos = converterHorarioParaMinutos(horaFim) - converterHorarioParaMinutos(horaInicio);
  const alturaProporcional = (Math.max(intervaloMinutos, duracaoMinutos) / intervaloMinutos) * alturaLinhaAgenda;
  return Math.max(alturaLinhaAgenda - espacoVerticalCelulaAgenda, alturaProporcional - espacoVerticalCelulaAgenda);
}

function calcularDuracaoAgendamento(horaInicio, horaFim) {
  return converterHorarioParaMinutos(horaFim) - converterHorarioParaMinutos(horaInicio);
}

function calcularQuantidadeCelulasAgendamento(horaInicio, horaFim) {
  const duracaoMinutos = Math.max(intervaloMinutos, calcularDuracaoAgendamento(horaInicio, horaFim));
  return Math.max(1, Math.ceil(duracaoMinutos / intervaloMinutos));
}

function converterHorarioParaMinutos(horario) {
  const [horas, minutos] = String(horario || '00:00').split(':').map(Number);
  return (horas * 60) + minutos;
}

function obterHorarioLinhaAgendamento(horario) {
  const minutos = converterHorarioParaMinutos(horario);
  return converterMinutosParaHorario(arredondarMinutosParaBaixo(minutos));
}

function calcularDeslocamentoVerticalAgendamento(horario) {
  const minutos = converterHorarioParaMinutos(horario);
  const minutosLinha = arredondarMinutosParaBaixo(minutos);
  const diferencaMinutos = minutos - minutosLinha;
  const deslocamento = (diferencaMinutos / intervaloMinutos) * alturaLinhaAgenda;

  return 2 + deslocamento;
}

function arredondarMinutosParaBaixo(totalMinutos) {
  return Math.floor(totalMinutos / intervaloMinutos) * intervaloMinutos;
}

function arredondarMinutosParaCima(totalMinutos) {
  return Math.ceil(totalMinutos / intervaloMinutos) * intervaloMinutos;
}

function obterConfiguracaoExpediente(empresa) {
  return {
    horaInicioManha: empresa?.horaInicioManha || configuracaoExpedientePadrao.horaInicioManha,
    horaFimManha: empresa?.horaFimManha || configuracaoExpedientePadrao.horaFimManha,
    horaInicioTarde: empresa?.horaInicioTarde || configuracaoExpedientePadrao.horaInicioTarde,
    horaFimTarde: empresa?.horaFimTarde || configuracaoExpedientePadrao.horaFimTarde,
    trabalhaSabado: Boolean(empresa?.trabalhaSabado),
    horaInicioSabado: empresa?.horaInicioSabado || configuracaoExpedientePadrao.horaInicioSabado,
    horaFimSabado: empresa?.horaFimSabado || configuracaoExpedientePadrao.horaFimSabado
  };
}

function horarioNoIntervaloSemExpediente(horario, empresa) {
  const configuracaoExpediente = obterConfiguracaoExpediente(empresa);
  const minutosHorario = converterHorarioParaMinutos(horario);
  const minutosFimManha = converterHorarioParaMinutos(configuracaoExpediente.horaFimManha);
  const minutosInicioTarde = converterHorarioParaMinutos(configuracaoExpediente.horaInicioTarde);

  return minutosHorario >= minutosFimManha && minutosHorario < minutosInicioTarde;
}

function enriquecerRecursos(recursos, tiposRecurso) {
  const tiposPorId = new Map(
    tiposRecurso.map((tipo) => [tipo.idTipoRecurso, tipo.descricao])
  );

  return recursos.map((recurso) => ({
    ...recurso,
    nomeTipoRecurso: tiposPorId.get(recurso.idTipoRecurso) || 'Nao informado'
  }));
}

function enriquecerAgendamentos(
  agendamentos,
  locais,
  recursos,
  tiposRecurso,
  tiposAgenda,
  statusVisita,
  atendimentos,
  clientes,
  contatos,
  vendedores,
  usuarios,
  usuarioLogado
) {
  const locaisPorId = new Map(locais.map((local) => [local.idLocal, local.descricao]));
  const tiposPorId = new Map(tiposRecurso.map((tipo) => [tipo.idTipoRecurso, tipo.descricao]));
  const recursosPorId = new Map(
    recursos.map((recurso) => [
      recurso.idRecurso,
      `${recurso.descricao} (${tiposPorId.get(recurso.idTipoRecurso) || recurso.nomeTipoRecurso || 'Nao informado'})`
    ])
  );
  const clientesPorId = new Map(
    clientes.map((cliente) => [cliente.idCliente, cliente.nomeFantasia || cliente.razaoSocial])
  );
  const contatosPorId = new Map(
    contatos.map((contato) => [contato.idContato, contato.nome])
  );
  const vendedoresPorId = new Map(
    vendedores.map((vendedor) => [vendedor.idVendedor, vendedor.nome])
  );
  const usuariosPorId = new Map(
    usuarios.map((usuario) => [usuario.idUsuario, usuario.nome])
  );
  const tiposAgendaPorId = new Map(
    tiposAgenda.map((tipoAgenda) => [tipoAgenda.idTipoAgenda, tipoAgenda])
  );
  const statusVisitaPorId = new Map(
    statusVisita.map((status) => [status.idStatusVisita, status])
  );
  const atendimentosPorAgendamento = new Map();
  const idUsuarioLogado = Number(usuarioLogado?.idUsuario);

  (atendimentos || [])
    .filter((atendimento) => atendimento.idAgendamento)
    .forEach((atendimento) => {
      const chaveAgendamento = Number(atendimento.idAgendamento);
      const listaAtual = atendimentosPorAgendamento.get(chaveAgendamento) || [];
      listaAtual.push(atendimento);
      atendimentosPorAgendamento.set(chaveAgendamento, listaAtual);
    });

  return agendamentos.map((agendamento) => {
    const atendimentosVinculados = atendimentosPorAgendamento.get(Number(agendamento.idAgendamento)) || [];
    const statusUsuarioAtual = (Array.isArray(agendamento.statusUsuarios) ? agendamento.statusUsuarios : [])
      .find((statusUsuario) => String(statusUsuario.idUsuario) === String(idUsuarioLogado));
    const idStatusEfetivo = statusUsuarioAtual?.idStatusVisita || agendamento.idStatusVisita;
    const atendimentosUsuarioAtual = atendimentosVinculados.filter(
      (atendimento) => String(atendimento.idUsuario) === String(idUsuarioLogado)
    );

    return {
      ...agendamento,
      idsAtendimentosVinculados: atendimentosVinculados
        .map((atendimento) => atendimento.idAtendimento),
      idsAtendimentosVinculadosUsuarioAtual: atendimentosUsuarioAtual
        .map((atendimento) => atendimento.idAtendimento),
      idAtendimentoVinculado: atendimentosVinculados[0]?.idAtendimento || null,
      idAtendimentoVinculadoUsuarioAtual: atendimentosUsuarioAtual[0]?.idAtendimento || null,
      nomeLocal: locaisPorId.get(agendamento.idLocal) || 'Nao informado',
      nomeRecurso: recursosPorId.get(agendamento.idRecurso) || 'Nao informado',
      nomeCliente: clientesPorId.get(agendamento.idCliente) || 'Nao informado',
      idVendedor: clientes.find((cliente) => String(cliente.idCliente) === String(agendamento.idCliente))?.idVendedor || null,
      nomeVendedor: vendedoresPorId.get(
        clientes.find((cliente) => String(cliente.idCliente) === String(agendamento.idCliente))?.idVendedor
      ) || '',
      nomeContato: contatosPorId.get(agendamento.idContato) || '',
      nomeUsuario: usuariosPorId.get(agendamento.idUsuario) || 'Nao informado',
      nomesUsuarios: (Array.isArray(agendamento.idsUsuarios) ? agendamento.idsUsuarios : [])
        .map((idUsuario) => usuariosPorId.get(idUsuario))
        .filter(Boolean),
      nomesRecursos: (Array.isArray(agendamento.idsRecursos) ? agendamento.idsRecursos : [])
        .map((idRecurso) => recursosPorId.get(idRecurso))
        .filter(Boolean),
      nomeTipoAgenda: tiposAgendaPorId.get(agendamento.idTipoAgenda)?.descricao || agendamento.tipo || 'Nao informado',
      corTipoAgenda: tiposAgendaPorId.get(agendamento.idTipoAgenda)?.cor || '#D9EAF7',
      idStatusVisita: idStatusEfetivo,
      nomeStatusVisita: statusVisitaPorId.get(idStatusEfetivo)?.descricao || 'Nao informado',
      iconeStatusVisita: statusVisitaPorId.get(idStatusEfetivo)?.icone || ''
    };
  });
}

function criarEstiloCartaoAgenda(cor) {
  const corCartao = cor || '#D9EAF7';
  return `linear-gradient(180deg, ${misturarCorComBase(corCartao, '#0F172A', 0.42)}, ${misturarCorComBase(corCartao, '#08111F', 0.58)})`;
}

function criarCorTextoCartaoAgenda(cor) {
  return misturarCorComBase(cor || '#D9EAF7', '#FFFFFF', 0.72);
}

function criarSombraCartaoAgenda(cor) {
  const corSombra = cor || '#D9EAF7';
  return `0 4px 10px ${converterHexParaRgba(corSombra, 0.18)}`;
}

function criarPosicionamentoCartaoAgenda(indice, quantidade) {
  const total = Math.max(1, quantidade);
  const espacamentoHorizontal = 4;
  const recuoHorizontal = 4;
  const larguraColuna = `calc((100% - ${(recuoHorizontal * 2) + ((total - 1) * espacamentoHorizontal)}px) / ${total})`;

  return {
    width: larguraColuna,
    left: `calc(${recuoHorizontal}px + (${indice} * (${larguraColuna} + ${espacamentoHorizontal}px)))`
  };
}

function distribuirAgendamentosPorConflito(agendamentos) {
  const agendamentosPorData = new Map();

  agendamentos.forEach((agendamento) => {
    const listaData = agendamentosPorData.get(agendamento.data) || [];
    listaData.push(agendamento);
    agendamentosPorData.set(agendamento.data, listaData);
  });

  return Array.from(agendamentosPorData.values()).flatMap((agendamentosData) => {
    const ordenados = [...agendamentosData].sort((primeiro, segundo) => {
      const diferencaInicio = converterHorarioParaMinutos(primeiro.horaInicio) - converterHorarioParaMinutos(segundo.horaInicio);

      if (diferencaInicio !== 0) {
        return diferencaInicio;
      }

      return converterHorarioParaMinutos(primeiro.horaFim) - converterHorarioParaMinutos(segundo.horaFim);
    });

    const grupos = [];
    let grupoAtual = [];
    let fimGrupoAtual = -1;

    ordenados.forEach((agendamento) => {
      const inicioAtual = converterHorarioParaMinutos(agendamento.horaInicio);
      const fimAtual = converterHorarioParaMinutos(agendamento.horaFim);

      if (grupoAtual.length === 0 || inicioAtual < fimGrupoAtual) {
        grupoAtual.push(agendamento);
        fimGrupoAtual = Math.max(fimGrupoAtual, fimAtual);
        return;
      }

      grupos.push(grupoAtual);
      grupoAtual = [agendamento];
      fimGrupoAtual = fimAtual;
    });

    if (grupoAtual.length > 0) {
      grupos.push(grupoAtual);
    }

    return grupos.flatMap(distribuirGrupoAgendamentos);
  });
}

function distribuirGrupoAgendamentos(grupoAgendamentos) {
  const ativos = [];
  const agendamentosDistribuidos = [];

  grupoAgendamentos.forEach((agendamento) => {
    const inicioAtual = converterHorarioParaMinutos(agendamento.horaInicio);

    for (let indice = ativos.length - 1; indice >= 0; indice -= 1) {
      if (ativos[indice].fim <= inicioAtual) {
        ativos.splice(indice, 1);
      }
    }

    const colunasOcupadas = new Set(ativos.map((item) => item.coluna));
    let colunaDisponivel = 0;

    while (colunasOcupadas.has(colunaDisponivel)) {
      colunaDisponivel += 1;
    }

    ativos.push({
      coluna: colunaDisponivel,
      fim: converterHorarioParaMinutos(agendamento.horaFim)
    });

    agendamentosDistribuidos.push({
      ...agendamento,
      indiceColunaAgenda: colunaDisponivel
    });
  });

  return agendamentosDistribuidos.map((agendamento) => {
    const layoutCalculado = calcularLayoutAgendamento(
      agendamento,
      agendamentosDistribuidos
    );

    return {
      ...agendamento,
      indiceColunaAgenda: layoutCalculado.indiceColunaAgenda,
      totalColunasAgenda: layoutCalculado.totalColunasAgenda
    };
  });
}

function calcularLayoutAgendamento(agendamentoBase, agendamentosGrupo) {
  const conflitosDiretos = agendamentosGrupo
    .filter((agendamento) => agendamentosSeSobrepoem(agendamentoBase, agendamento))
    .sort((primeiro, segundo) => {
      const diferencaInicio = converterHorarioParaMinutos(primeiro.horaInicio) - converterHorarioParaMinutos(segundo.horaInicio);

      if (diferencaInicio !== 0) {
        return diferencaInicio;
      }

      return converterHorarioParaMinutos(primeiro.horaFim) - converterHorarioParaMinutos(segundo.horaFim);
    });

  const ativos = [];
  const layoutPorId = new Map();

  conflitosDiretos.forEach((agendamento) => {
    const inicioAtual = converterHorarioParaMinutos(agendamento.horaInicio);

    for (let indice = ativos.length - 1; indice >= 0; indice -= 1) {
      if (ativos[indice].fim <= inicioAtual) {
        ativos.splice(indice, 1);
      }
    }

    const colunasOcupadas = new Set(ativos.map((item) => item.coluna));
    let colunaDisponivel = 0;

    while (colunasOcupadas.has(colunaDisponivel)) {
      colunaDisponivel += 1;
    }

    ativos.push({
      coluna: colunaDisponivel,
      fim: converterHorarioParaMinutos(agendamento.horaFim)
    });

    layoutPorId.set(String(agendamento.idAgendamento), {
      indiceColunaAgenda: colunaDisponivel
    });
  });

  const inicioBase = converterHorarioParaMinutos(agendamentoBase.horaInicio);
  const fimBase = converterHorarioParaMinutos(agendamentoBase.horaFim);
  const pontosAnalise = new Set([inicioBase]);

  conflitosDiretos.forEach((agendamento) => {
    const inicioAtual = converterHorarioParaMinutos(agendamento.horaInicio);
    const fimAtual = converterHorarioParaMinutos(agendamento.horaFim);

    if (inicioAtual < fimBase && fimAtual > inicioBase) {
      pontosAnalise.add(Math.max(inicioBase, inicioAtual));
    }
  });

  let maximoSimultaneos = 1;
  pontosAnalise.forEach((pontoAnalise) => {
    const simultaneos = conflitosDiretos.filter((agendamento) => {
      const inicioAtual = converterHorarioParaMinutos(agendamento.horaInicio);
      const fimAtual = converterHorarioParaMinutos(agendamento.horaFim);
      return inicioAtual <= pontoAnalise && fimAtual > pontoAnalise;
    }).length;

    maximoSimultaneos = Math.max(maximoSimultaneos, simultaneos);
  });

  return {
    indiceColunaAgenda: layoutPorId.get(String(agendamentoBase.idAgendamento))?.indiceColunaAgenda ?? 0,
    totalColunasAgenda: maximoSimultaneos
  };
}

function agendamentosSeSobrepoem(primeiro, segundo) {
  if (String(primeiro.data) !== String(segundo.data)) {
    return false;
  }

  const inicioPrimeiro = converterHorarioParaMinutos(primeiro.horaInicio);
  const fimPrimeiro = converterHorarioParaMinutos(primeiro.horaFim);
  const inicioSegundo = converterHorarioParaMinutos(segundo.horaInicio);
  const fimSegundo = converterHorarioParaMinutos(segundo.horaFim);

  return inicioPrimeiro < fimSegundo && fimPrimeiro > inicioSegundo;
}

function misturarCorComBase(corPrincipal, corBase, intensidadeCorPrincipal) {
  const [redPrincipal, greenPrincipal, bluePrincipal] = converterHexParaRgb(corPrincipal);
  const [redBase, greenBase, blueBase] = converterHexParaRgb(corBase);
  const intensidadeBase = 1 - intensidadeCorPrincipal;

  const red = Math.round((redPrincipal * intensidadeCorPrincipal) + (redBase * intensidadeBase));
  const green = Math.round((greenPrincipal * intensidadeCorPrincipal) + (greenBase * intensidadeBase));
  const blue = Math.round((bluePrincipal * intensidadeCorPrincipal) + (blueBase * intensidadeBase));

  return `rgb(${red}, ${green}, ${blue})`;
}

function converterHexParaRgb(corHexadecimal) {
  const corNormalizada = String(corHexadecimal || '#D9EAF7').replace('#', '');
  const corExpandida = corNormalizada.length === 3
    ? corNormalizada.split('').map((caractere) => caractere + caractere).join('')
    : corNormalizada;

  const red = Number.parseInt(corExpandida.slice(0, 2), 16);
  const green = Number.parseInt(corExpandida.slice(2, 4), 16);
  const blue = Number.parseInt(corExpandida.slice(4, 6), 16);

  if ([red, green, blue].some((valor) => Number.isNaN(valor))) {
    return [217, 234, 247];
  }

  return [red, green, blue];
}

function converterHexParaRgba(corHexadecimal, opacidade) {
  const [red, green, blue] = converterHexParaRgb(corHexadecimal);
  return `rgba(${red}, ${green}, ${blue}, ${opacidade})`;
}

function formatarDataTooltip(dataIso) {
  if (!dataIso) {
    return 'Nao informado';
  }

  const [ano, mes, dia] = String(dataIso).split('-');

  if (!ano || !mes || !dia) {
    return dataIso;
  }

  return `${dia}/${mes}/${ano}`;
}

function criarLinhasTooltipAgendamento(agendamento) {
  const linhas = [agendamento.assunto || 'Sem assunto'];

  if (Array.isArray(agendamento.idsAtendimentosVinculados) && agendamento.idsAtendimentosVinculados.length > 0) {
    const codigosAtendimento = agendamento.idsAtendimentosVinculados
      .map((idAtendimento) => `#${String(idAtendimento).padStart(4, '0')}`)
      .join(', ');

    linhas.push(`Atendimentos: ${codigosAtendimento}`);
  }

  if (agendamento.data) {
    linhas.push(`Data: ${formatarDataTooltip(agendamento.data)}`);
  }

  if (agendamento.horaInicio && agendamento.horaFim) {
    linhas.push(`Horario: ${agendamento.horaInicio} - ${agendamento.horaFim}`);
  }

  if (agendamento.nomeTipoAgenda) {
    linhas.push(`Tipo: ${agendamento.nomeTipoAgenda}`);
  }

  if (agendamento.nomeStatusVisita) {
    linhas.push(`Status: ${agendamento.nomeStatusVisita}`);
  }

  if (agendamento.nomeCliente && agendamento.nomeCliente !== 'Nao informado') {
    linhas.push(`Cliente: ${agendamento.nomeCliente}`);
  }

  if (agendamento.nomeContato) {
    linhas.push(`Contato: ${agendamento.nomeContato}`);
  }

  if (agendamento.nomeVendedor) {
    linhas.push(`Vendedor: ${agendamento.nomeVendedor}`);
  }

  if (agendamento.nomeLocal && agendamento.nomeLocal !== 'Nao informado') {
    linhas.push(`Local: ${agendamento.nomeLocal}`);
  }

  if (Array.isArray(agendamento.nomesRecursos) && agendamento.nomesRecursos.length > 0) {
    linhas.push(`Recursos: ${agendamento.nomesRecursos.join(', ')}`);
  }

  if (Array.isArray(agendamento.nomesUsuarios) && agendamento.nomesUsuarios.length > 0) {
    linhas.push(`Usuarios: ${agendamento.nomesUsuarios.join(', ')}`);
  }

  return linhas;
}

function criarFaixaPorHorarios(data, primeiroHorario, segundoHorario) {
  const minutosPrimeiroHorario = converterHorarioParaMinutos(primeiroHorario);
  const minutosSegundoHorario = converterHorarioParaMinutos(segundoHorario);
  const minutosInicio = Math.min(minutosPrimeiroHorario, minutosSegundoHorario);
  const minutosFim = Math.max(minutosPrimeiroHorario, minutosSegundoHorario) + intervaloMinutos;

  return {
    data,
    horaInicio: converterMinutosParaHorario(minutosInicio),
    horaFim: converterMinutosParaHorario(minutosFim)
  };
}

function criarPosicaoMenuStatusAgenda(posicaoX, posicaoY) {
  const larguraMenu = 280;
  const alturaMaximaMenu = 360;
  const margemTela = 16;
  const larguraJanela = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const alturaJanela = typeof window !== 'undefined' ? window.innerHeight : 720;

  return {
    left: `${Math.min(posicaoX, larguraJanela - larguraMenu - margemTela)}px`,
    top: `${Math.min(posicaoY, alturaJanela - alturaMaximaMenu - margemTela)}px`
  };
}

function converterMinutosParaHorario(totalMinutos) {
  const horas = String(Math.floor(totalMinutos / 60)).padStart(2, '0');
  const minutos = String(totalMinutos % 60).padStart(2, '0');
  return `${horas}:${minutos}`;
}

function celulaEstaNaFaixaSelecionada(faixaSelecionada, data, horario) {
  if (!faixaSelecionada || faixaSelecionada.data !== data) {
    return false;
  }

  const minutosHorario = converterHorarioParaMinutos(horario);
  const minutosInicio = converterHorarioParaMinutos(faixaSelecionada.horaInicio);
  const minutosFim = converterHorarioParaMinutos(faixaSelecionada.horaFim);

  return minutosHorario >= minutosInicio && minutosHorario < minutosFim;
}

function deveOferecerGeracaoAtendimento(agendamento, usuarioLogado) {
  if (!agendamento?.idCliente || !usuarioLogado?.idUsuario) {
    return false;
  }

  if (agendamento.idAtendimentoVinculadoUsuarioAtual) {
    return false;
  }

  const idsUsuarios = Array.isArray(agendamento.idsUsuarios)
    ? agendamento.idsUsuarios.map((idUsuario) => String(idUsuario))
    : [];

  if (!idsUsuarios.includes(String(usuarioLogado.idUsuario))) {
    return false;
  }

  const dataHoraFimAgendamento = new Date(`${agendamento.data}T${agendamento.horaFim}:00`);

  return dataHoraFimAgendamento.getTime() < Date.now();
}

function criarDescricaoAtendimentoPorAgendamento(agendamento) {
  const linhas = [
    'Atendimento gerado automaticamente a partir da agenda.',
    `Data da agenda: ${formatarDataTooltip(agendamento.data)}`,
    `Horario: ${agendamento.horaInicio} - ${agendamento.horaFim}`
  ];

  if (agendamento.nomeTipoAgenda && agendamento.nomeTipoAgenda !== 'Nao informado') {
    linhas.push(`Tipo de agenda: ${agendamento.nomeTipoAgenda}`);
  }

  if (agendamento.nomeLocal && agendamento.nomeLocal !== 'Nao informado') {
    linhas.push(`Local: ${agendamento.nomeLocal}`);
  }

  if (agendamento.nomeContato) {
    linhas.push(`Contato: ${agendamento.nomeContato}`);
  }

  if (Array.isArray(agendamento.nomesUsuarios) && agendamento.nomesUsuarios.length > 0) {
    linhas.push(`Participantes: ${agendamento.nomesUsuarios.join(', ')}`);
  }

  if (Array.isArray(agendamento.nomesRecursos) && agendamento.nomesRecursos.length > 0) {
    linhas.push(`Recursos: ${agendamento.nomesRecursos.join(', ')}`);
  }

  return linhas.join('\n');
}

function enriquecerOrcamentosAtendimento(orcamentos, clientes, contatos, usuarios, vendedores, prazosPagamento, etapasOrcamento, produtos) {
  const clientesPorId = new Map(
    clientes.map((cliente) => [cliente.idCliente, cliente.nomeFantasia || cliente.razaoSocial || 'Nao informado'])
  );
  const contatosPorId = new Map(
    contatos.map((contato) => [contato.idContato, contato.nome])
  );
  const usuariosPorId = new Map(
    usuarios.map((usuario) => [usuario.idUsuario, usuario.nome])
  );
  const vendedoresPorId = new Map(
    vendedores.map((vendedor) => [vendedor.idVendedor, vendedor.nome])
  );
  const prazosPorId = new Map(
    prazosPagamento.map((prazo) => [prazo.idPrazoPagamento, prazo])
  );
  const etapasPorId = new Map(
    etapasOrcamento.map((etapa) => [etapa.idEtapaOrcamento, etapa])
  );
  const produtosPorId = new Map(
    produtos.map((produto) => [produto.idProduto, produto])
  );

  return orcamentos.map((orcamento) => ({
    ...orcamento,
    nomeCliente: clientesPorId.get(orcamento.idCliente) || 'Nao informado',
    nomeContato: contatosPorId.get(orcamento.idContato) || '',
    nomeUsuario: usuariosPorId.get(orcamento.idUsuario) || 'Nao informado',
    nomeVendedor: vendedoresPorId.get(orcamento.idVendedor) || 'Nao informado',
    nomePrazoPagamento: prazosPorId.get(orcamento.idPrazoPagamento)?.descricaoFormatada || '',
    nomeMetodoPagamento: prazosPorId.get(orcamento.idPrazoPagamento)?.nomeMetodoPagamento || '',
    etapaOrcamento: etapasPorId.get(orcamento.idEtapaOrcamento) || null,
    itens: Array.isArray(orcamento.itens) ? orcamento.itens.map((item) => {
      const produto = produtosPorId.get(item.idProduto);
      return {
        ...item,
        descricaoProdutoSnapshot: item.descricaoProdutoSnapshot || produto?.descricao || item.nomeProduto || '',
        referenciaProdutoSnapshot: item.referenciaProdutoSnapshot || produto?.referencia || '',
        unidadeProdutoSnapshot: item.unidadeProdutoSnapshot || produto?.nomeUnidadeMedida || produto?.siglaUnidadeMedida || '',
        imagem: item.imagem || produto?.imagem || ''
      };
    }) : []
  }));
}

function orcamentoEstaAberto(orcamento) {
  const idEtapa = Number(
    orcamento?.idEtapaOrcamento
    || orcamento?.etapaOrcamento?.idEtapaOrcamento
    || 0
  );

  return ![1, 2, 3, 4].includes(idEtapa);
}

const ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO = 2;

function obterEtapaFechadoSemPedido(etapasOrcamento) {
  return etapasOrcamento.find((etapa) => Number(etapa?.idEtapaOrcamento) === ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO) || null;
}

function normalizarPayloadOrcamento(dadosOrcamento, usuarioLogado) {
  return {
    idCliente: Number(dadosOrcamento.idCliente),
    idContato: dadosOrcamento.idContato ? Number(dadosOrcamento.idContato) : null,
    idUsuario: Number(dadosOrcamento.idUsuario || usuarioLogado?.idUsuario),
    idVendedor: dadosOrcamento.idVendedor ? Number(dadosOrcamento.idVendedor) : null,
    idPrazoPagamento: dadosOrcamento.idPrazoPagamento ? Number(dadosOrcamento.idPrazoPagamento) : null,
    idEtapaOrcamento: dadosOrcamento.idEtapaOrcamento ? Number(dadosOrcamento.idEtapaOrcamento) : null,
    idMotivoPerda: dadosOrcamento.idMotivoPerda ? Number(dadosOrcamento.idMotivoPerda) : null,
    idPedidoVinculado: dadosOrcamento.idPedidoVinculado ? Number(dadosOrcamento.idPedidoVinculado) : null,
    comissao: Number(dadosOrcamento.comissao || 0),
    dataInclusao: dadosOrcamento.dataInclusao || null,
    dataValidade: dadosOrcamento.dataValidade || null,
    observacao: String(dadosOrcamento.observacao || '').trim() || null,
    itens: Array.isArray(dadosOrcamento.itens) ? dadosOrcamento.itens.map((item) => ({
      idItemOrcamento: item.idItemOrcamento ? Number(item.idItemOrcamento) : undefined,
      idProduto: Number(item.idProduto),
      quantidade: Number(item.quantidade || 0),
      valorUnitario: normalizarNumeroMonetario(item.valorUnitario),
      valorTotal: normalizarNumeroMonetario(item.valorTotal),
      observacao: String(item.observacao || '').trim() || null,
      imagem: item.imagem || null
    })) : [],
    campos: Array.isArray(dadosOrcamento.campos) ? dadosOrcamento.campos.map((campo) => ({
      idCampoOrcamento: Number(campo.idCampoOrcamento),
      valor: String(campo.valor || '')
    })) : []
  };
}

function normalizarPayloadPedido(dadosPedido) {
  return {
    idOrcamento: dadosPedido.idOrcamento ? Number(dadosPedido.idOrcamento) : null,
    codigoOrcamentoOrigem: dadosPedido.codigoOrcamentoOrigem ? Number(dadosPedido.codigoOrcamentoOrigem) : null,
    idCliente: Number(dadosPedido.idCliente),
    idContato: dadosPedido.idContato ? Number(dadosPedido.idContato) : null,
    idUsuario: Number(dadosPedido.idUsuario),
    idVendedor: dadosPedido.idVendedor ? Number(dadosPedido.idVendedor) : null,
    idPrazoPagamento: dadosPedido.idPrazoPagamento ? Number(dadosPedido.idPrazoPagamento) : null,
    idEtapaPedido: dadosPedido.idEtapaPedido ? Number(dadosPedido.idEtapaPedido) : null,
    comissao: Number(dadosPedido.comissao || 0),
    dataInclusao: dadosPedido.dataInclusao || null,
    dataEntrega: dadosPedido.dataEntrega || null,
    observacao: String(dadosPedido.observacao || '').trim() || null,
    nomeClienteSnapshot: dadosPedido.nomeClienteSnapshot || null,
    nomeContatoSnapshot: dadosPedido.nomeContatoSnapshot || null,
    nomeUsuarioSnapshot: dadosPedido.nomeUsuarioSnapshot || null,
    nomeVendedorSnapshot: dadosPedido.nomeVendedorSnapshot || null,
    nomeMetodoPagamentoSnapshot: dadosPedido.nomeMetodoPagamentoSnapshot || null,
    nomePrazoPagamentoSnapshot: dadosPedido.nomePrazoPagamentoSnapshot || null,
    itens: Array.isArray(dadosPedido.itens) ? dadosPedido.itens.map((item) => ({
      idItemPedido: item.idItemPedido ? Number(item.idItemPedido) : undefined,
      idProduto: Number(item.idProduto),
      quantidade: Number(item.quantidade || 0),
      valorUnitario: normalizarNumeroMonetario(item.valorUnitario),
      valorTotal: normalizarNumeroMonetario(item.valorTotal),
      observacao: String(item.observacao || '').trim() || null,
      imagem: item.imagem || null,
      referenciaProdutoSnapshot: item.referenciaProdutoSnapshot || '',
      descricaoProdutoSnapshot: item.descricaoProdutoSnapshot || '',
      unidadeProdutoSnapshot: item.unidadeProdutoSnapshot || ''
    })) : [],
    campos: Array.isArray(dadosPedido.campos) ? dadosPedido.campos.map((campo) => ({
      idCampoPedido: Number(campo.idCampoPedido),
      valor: String(campo.valor || '')
    })) : []
  };
}

function normalizarPayloadPrazoPagamento(dadosPrazo) {
  const payload = {
    descricao: String(dadosPrazo.descricao || '').trim() || null,
    idMetodoPagamento: Number(dadosPrazo.idMetodoPagamento),
    status: dadosPrazo.status ? 1 : 0
  };

  ['prazo1', 'prazo2', 'prazo3', 'prazo4', 'prazo5', 'prazo6'].forEach((chave) => {
    const valor = String(dadosPrazo[chave] || '').trim();
    payload[chave] = valor ? Number(valor) : null;
  });

  return payload;
}

function enriquecerPrazosPagamento(prazosPagamento, metodosPagamento = []) {
  const metodosPorId = new Map(
    metodosPagamento.map((metodo) => [metodo.idMetodoPagamento, metodo.descricao])
  );

  return prazosPagamento.map((prazo) => {
    const parcelas = [prazo.prazo1, prazo.prazo2, prazo.prazo3, prazo.prazo4, prazo.prazo5, prazo.prazo6]
      .filter((valor) => valor !== null && valor !== undefined && valor !== '')
      .join(' / ');

    return {
      ...prazo,
      nomeMetodoPagamento: metodosPorId.get(prazo.idMetodoPagamento) || '',
      descricaoFormatada: prazo.descricao || (parcelas ? `${parcelas} dias` : 'Prazo sem descricao')
    };
  });
}

function enriquecerPrazoPagamento(prazo, metodosPagamento = []) {
  if (!prazo) {
    return null;
  }

  return enriquecerPrazosPagamento([prazo], metodosPagamento)[0] || null;
}

function normalizarNumeroMonetario(valor) {
  if (typeof valor === 'number') {
    return valor;
  }

  const texto = String(valor || '0')
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const numero = Number(texto);
  return Number.isNaN(numero) ? 0 : numero;
}

function montarDadosIniciaisOrcamentoPeloAtendimento(atendimento, clientes, vendedores, usuarioLogado) {
  const cliente = clientes.find((item) => String(item.idCliente) === String(atendimento?.idCliente || ''));
  const vendedor = vendedores.find((item) => String(item.idVendedor) === String(cliente?.idVendedor || ''));

  return {
    idCliente: atendimento?.idCliente || '',
    idContato: atendimento?.idContato || '',
    idUsuario: atendimento?.idUsuario || usuarioLogado?.idUsuario || '',
    nomeUsuario: atendimento?.nomeUsuario || usuarioLogado?.nome || '',
    idVendedor: cliente?.idVendedor || '',
    comissao: vendedor?.comissaoPadrao ?? 0,
    observacao: atendimento?.descricao || ''
  };
}
