import { useEffect, useMemo, useState } from 'react';
import { listarAtendimentos, listarCanaisAtendimento, listarOrigensAtendimento, listarTiposAtendimento } from '../../servicos/atendimentos';
import { Botao } from '../comuns/botao';
import { ModalFiltros } from '../comuns/modalFiltros';
import { ModalBuscaClientes } from '../comuns/modalBuscaClientes';
import { ModalRelatorioGrade } from '../comuns/modalRelatorioGrade';
import { PopupAvisos } from '../comuns/popupAvisos';
import { TabelaHistoricoAtendimentos } from '../comuns/tabelaHistoricoAtendimentos';
import { TabelaHistoricoOrcamentos } from '../comuns/tabelaHistoricoOrcamentos';
import { TabelaHistoricoPedidos } from '../comuns/tabelaHistoricoPedidos';
import { listarClientes, listarContatos, listarGruposEmpresa, listarVendedores } from '../../servicos/clientes';
import { listarEtapasOrcamentoConfiguracao, listarEtapasPedidoConfiguracao, listarTiposPedidoConfiguracao } from '../../servicos/configuracoes';
import { desktopTemExportacaoPdf } from '../../servicos/desktop';
import { listarOrcamentos } from '../../servicos/orcamentos';
import { listarPedidos } from '../../servicos/pedidos';
import { listarGruposProduto, listarMarcas, listarProdutos } from '../../servicos/produtos';
import { listarUsuarios } from '../../servicos/usuarios';
import { normalizarPreco } from '../../utilitarios/normalizarPreco';
import { exportarRelatorioAtendimentosPdf } from '../../utilitarios/configuracoes/exportarRelatorioAtendimentosPdf';
import { exportarRelatorioConversaoPdf } from '../../utilitarios/configuracoes/exportarRelatorioConversaoPdf';
import { exportarRelatorioPedidosFechadosPdf } from '../../utilitarios/configuracoes/exportarRelatorioPedidosFechadosPdf';

const relatoriosConfiguracao = {
  relatorioPedidosFechados: {
    titulo: 'Vendas',
    subtitulo: 'Leitura baseada nas datas de inclusao e entrega dos pedidos.',
    tituloFiltro: 'Filtrar vendas',
    ariaFiltro: 'Filtrar vendas'
  },
  relatorioPedidosEntregues: {
    titulo: 'Conversao',
    subtitulo: 'Leitura consolidada dos orcamentos para acompanhar geracao, fechamento e conversao.',
    tituloFiltro: 'Filtrar conversao',
    ariaFiltro: 'Filtrar conversao'
  },
  relatorioAtendimentos: {
    titulo: 'Atendimentos',
    subtitulo: 'Leitura consolidada dos atendimentos comerciais com foco em cliente, canal e origem.',
    tituloFiltro: 'Filtrar atendimentos',
    ariaFiltro: 'Filtrar atendimentos'
  }
};

export function ModalRelatorioConfiguracao({ relatorio, usuarioLogado, aoFechar }) {
  const configuracao = relatoriosConfiguracao[relatorio] || null;
  const aberto = Boolean(configuracao);
  const exportacaoPdfDisponivel = desktopTemExportacaoPdf();
  const filtrosPadraoPedidosFechados = useMemo(() => obterFiltrosPadraoPedidosFechados(), [aberto, relatorio, usuarioLogado?.idUsuario]);
  const filtrosPadraoConversao = useMemo(() => obterFiltrosPadraoConversao(), [aberto, relatorio, usuarioLogado?.idUsuario]);
  const filtrosPadraoAtendimentos = useMemo(() => obterFiltrosPadraoAtendimentos(), [aberto, relatorio, usuarioLogado?.idUsuario]);
  const [modalFiltrosAberto, definirModalFiltrosAberto] = useState(false);
  const [modalBuscaClienteAberto, definirModalBuscaClienteAberto] = useState(false);
  const [carregandoPedidos, definirCarregandoPedidos] = useState(false);
  const [mensagemErroPedidos, definirMensagemErroPedidos] = useState('');
  const [pedidos, definirPedidos] = useState([]);
  const [clientes, definirClientes] = useState([]);
  const [vendedores, definirVendedores] = useState([]);
  const [gruposEmpresaRelatorio, definirGruposEmpresaRelatorio] = useState([]);
  const [gruposProdutoRelatorio, definirGruposProdutoRelatorio] = useState([]);
  const [marcasRelatorio, definirMarcasRelatorio] = useState([]);
  const [etapasPedido, definirEtapasPedido] = useState([]);
  const [tiposPedidoRelatorio, definirTiposPedidoRelatorio] = useState([]);
  const [avisosPopup, definirAvisosPopup] = useState([]);
  const [gerandoPdf, definirGerandoPdf] = useState(false);
  const [filtrosPedidosFechados, definirFiltrosPedidosFechados] = useState(() => obterFiltrosPadraoPedidosFechados());
  const [rascunhoFiltrosPedidosFechados, definirRascunhoFiltrosPedidosFechados] = useState(() => obterFiltrosPadraoPedidosFechados());
  const [carregandoConversao, definirCarregandoConversao] = useState(false);
  const [mensagemErroConversao, definirMensagemErroConversao] = useState('');
  const [orcamentosConversao, definirOrcamentosConversao] = useState([]);
  const [usuariosConversao, definirUsuariosConversao] = useState([]);
  const [etapasOrcamentoConversao, definirEtapasOrcamentoConversao] = useState([]);
  const [modalFiltrosConversaoAberto, definirModalFiltrosConversaoAberto] = useState(false);
  const [modalBuscaClienteConversaoAberto, definirModalBuscaClienteConversaoAberto] = useState(false);
  const [gerandoPdfConversao, definirGerandoPdfConversao] = useState(false);
  const [filtrosConversao, definirFiltrosConversao] = useState(() => obterFiltrosPadraoConversao());
  const [rascunhoFiltrosConversao, definirRascunhoFiltrosConversao] = useState(() => obterFiltrosPadraoConversao());
  const [carregandoAtendimentosRelatorio, definirCarregandoAtendimentosRelatorio] = useState(false);
  const [mensagemErroAtendimentosRelatorio, definirMensagemErroAtendimentosRelatorio] = useState('');
  const [atendimentosRelatorio, definirAtendimentosRelatorio] = useState([]);
  const [usuariosRelatorio, definirUsuariosRelatorio] = useState([]);
  const [tiposAtendimentoRelatorio, definirTiposAtendimentoRelatorio] = useState([]);
  const [canaisAtendimentoRelatorio, definirCanaisAtendimentoRelatorio] = useState([]);
  const [origensAtendimentoRelatorio, definirOrigensAtendimentoRelatorio] = useState([]);
  const [modalFiltrosAtendimentosAberto, definirModalFiltrosAtendimentosAberto] = useState(false);
  const [modalBuscaClienteAtendimentosAberto, definirModalBuscaClienteAtendimentosAberto] = useState(false);
  const [gerandoPdfAtendimentos, definirGerandoPdfAtendimentos] = useState(false);
  const [filtrosAtendimentosRelatorio, definirFiltrosAtendimentosRelatorio] = useState(() => obterFiltrosPadraoAtendimentos());
  const [rascunhoFiltrosAtendimentosRelatorio, definirRascunhoFiltrosAtendimentosRelatorio] = useState(() => obterFiltrosPadraoAtendimentos());

  useEffect(() => {
    if (!aberto || relatorio !== 'relatorioPedidosFechados') {
      if (!aberto) {
        definirModalFiltrosAberto(false);
        definirModalBuscaClienteAberto(false);
        definirMensagemErroPedidos('');
        definirGruposEmpresaRelatorio([]);
        definirGruposProdutoRelatorio([]);
        definirMarcasRelatorio([]);
        definirAvisosPopup([]);
      }
      return undefined;
    }

    let cancelado = false;

    async function carregarPedidosFechados() {
      definirCarregandoPedidos(true);
      definirMensagemErroPedidos('');

      try {
        const resultados = await Promise.allSettled([
          listarPedidos(),
          listarClientes(),
          listarVendedores(),
          listarEtapasPedidoConfiguracao(),
          listarTiposPedidoConfiguracao(),
          listarGruposEmpresa(),
          listarGruposProduto(),
          listarMarcas(),
          listarProdutos()
        ]);

        const [
          pedidosResultado,
          clientesResultado,
          vendedoresResultado,
          etapasResultado,
          tiposPedidoResultado,
          gruposEmpresaResultado,
          gruposProdutoResultado,
          marcasResultado,
          produtosResultado
        ] = resultados;

        if (cancelado) {
          return;
        }

        const pedidosCarregados = pedidosResultado.status === 'fulfilled' ? pedidosResultado.value : [];
        const clientesCarregados = clientesResultado.status === 'fulfilled' ? clientesResultado.value : [];
        const vendedoresCarregados = vendedoresResultado.status === 'fulfilled' ? vendedoresResultado.value : [];
        const etapasCarregadas = etapasResultado.status === 'fulfilled' ? etapasResultado.value : [];
        const tiposPedidoCarregados = tiposPedidoResultado.status === 'fulfilled' ? tiposPedidoResultado.value : [];
        const gruposEmpresaCarregados = gruposEmpresaResultado.status === 'fulfilled' ? gruposEmpresaResultado.value : [];
        const gruposProdutoCarregados = gruposProdutoResultado.status === 'fulfilled' ? gruposProdutoResultado.value : [];
        const marcasCarregadas = marcasResultado.status === 'fulfilled' ? marcasResultado.value : [];
        const produtosCarregados = produtosResultado.status === 'fulfilled' ? produtosResultado.value : [];

        const clientesAtivos = filtrarRegistrosAtivosLocais(clientesCarregados);
        const gruposEmpresaAtivos = filtrarRegistrosAtivosLocais(gruposEmpresaCarregados, 'status');
        const gruposProdutoAtivos = filtrarRegistrosAtivosLocais(gruposProdutoCarregados, 'status');
        const marcasAtivas = filtrarRegistrosAtivosLocais(marcasCarregadas, 'status');

        definirPedidos(enriquecerPedidosRelatorio(
          pedidosCarregados,
          clientesAtivos,
          produtosCarregados,
          gruposEmpresaAtivos,
          gruposProdutoAtivos,
          marcasAtivas
        ));
        definirClientes(clientesAtivos);
        definirVendedores(filtrarRegistrosAtivosLocais(vendedoresCarregados));
        definirGruposEmpresaRelatorio(gruposEmpresaAtivos);
        definirGruposProdutoRelatorio(gruposProdutoAtivos);
        definirMarcasRelatorio(marcasAtivas);
        definirEtapasPedido(normalizarEtapasPedido(filtrarRegistrosAtivosLocais(etapasCarregadas, 'status')));
        definirTiposPedidoRelatorio(filtrarRegistrosAtivosLocais(tiposPedidoCarregados, 'status'));
      } catch (_erro) {
        if (!cancelado) {
          definirMensagemErroPedidos('Nao foi possivel carregar os pedidos do relatorio.');
          definirPedidos([]);
          definirClientes([]);
          definirVendedores([]);
          definirGruposEmpresaRelatorio([]);
          definirGruposProdutoRelatorio([]);
          definirMarcasRelatorio([]);
          definirEtapasPedido([]);
          definirTiposPedidoRelatorio([]);
        }
      } finally {
        if (!cancelado) {
          definirCarregandoPedidos(false);
        }
      }
    }

    carregarPedidosFechados();

    return () => {
      cancelado = true;
    };
  }, [aberto, relatorio]);

  useEffect(() => {
    if (!aberto || relatorio !== 'relatorioPedidosEntregues') {
      if (!aberto) {
        definirMensagemErroConversao('');
        definirOrcamentosConversao([]);
        definirUsuariosConversao([]);
        definirEtapasOrcamentoConversao([]);
        definirGruposEmpresaRelatorio([]);
        definirGruposProdutoRelatorio([]);
        definirMarcasRelatorio([]);
        definirModalFiltrosConversaoAberto(false);
        definirModalBuscaClienteConversaoAberto(false);
      }
      return undefined;
    }

    let cancelado = false;

    async function carregarRelatorioConversao() {
      definirCarregandoConversao(true);
      definirMensagemErroConversao('');

      try {
        const resultados = await Promise.allSettled([
          listarOrcamentos(),
          listarClientes(),
          listarContatos(),
          listarUsuarios(),
          listarVendedores(),
          listarEtapasOrcamentoConfiguracao(),
          listarGruposEmpresa(),
          listarGruposProduto(),
          listarMarcas(),
          listarProdutos()
        ]);

        if (cancelado) {
          return;
        }

        const [
          orcamentosResultado,
          clientesResultado,
          contatosResultado,
          usuariosResultado,
          vendedoresResultado,
          etapasResultado,
          gruposEmpresaResultado,
          gruposProdutoResultado,
          marcasResultado,
          produtosResultado
        ] = resultados;

        const orcamentosCarregados = orcamentosResultado.status === 'fulfilled' ? orcamentosResultado.value : [];
        const clientesCarregados = clientesResultado.status === 'fulfilled' ? clientesResultado.value : [];
        const contatosCarregados = contatosResultado.status === 'fulfilled' ? contatosResultado.value : [];
        const usuariosCarregados = usuariosResultado.status === 'fulfilled' ? usuariosResultado.value : [];
        const vendedoresCarregados = vendedoresResultado.status === 'fulfilled' ? vendedoresResultado.value : [];
        const etapasCarregadas = etapasResultado.status === 'fulfilled' ? etapasResultado.value : [];
        const gruposEmpresaCarregados = gruposEmpresaResultado.status === 'fulfilled' ? gruposEmpresaResultado.value : [];
        const gruposProdutoCarregados = gruposProdutoResultado.status === 'fulfilled' ? gruposProdutoResultado.value : [];
        const marcasCarregadas = marcasResultado.status === 'fulfilled' ? marcasResultado.value : [];
        const produtosCarregados = produtosResultado.status === 'fulfilled' ? produtosResultado.value : [];

        const clientesAtivos = filtrarRegistrosAtivosLocais(clientesCarregados);
        const contatosAtivos = filtrarRegistrosAtivosLocais(contatosCarregados);
        const usuariosAtivos = filtrarRegistrosAtivosLocais(usuariosCarregados, 'status');
        const vendedoresAtivos = filtrarRegistrosAtivosLocais(vendedoresCarregados);
        const gruposEmpresaAtivos = filtrarRegistrosAtivosLocais(gruposEmpresaCarregados, 'status');
        const gruposProdutoAtivos = filtrarRegistrosAtivosLocais(gruposProdutoCarregados, 'status');
        const marcasAtivas = filtrarRegistrosAtivosLocais(marcasCarregadas, 'status');
        const etapasAtivas = normalizarEtapasOrcamentoConversao(filtrarRegistrosAtivosLocais(etapasCarregadas, 'status'));

        definirClientes(clientesAtivos);
        definirVendedores(vendedoresAtivos);
        definirGruposEmpresaRelatorio(gruposEmpresaAtivos);
        definirGruposProdutoRelatorio(gruposProdutoAtivos);
        definirMarcasRelatorio(marcasAtivas);
        definirUsuariosConversao(usuariosAtivos);
        definirEtapasOrcamentoConversao(ordenarEtapasPorOrdem(etapasAtivas, 'idEtapaOrcamento'));
        definirOrcamentosConversao(
          enriquecerOrcamentosConversao(
            orcamentosCarregados,
            clientesAtivos,
            contatosAtivos,
            usuariosAtivos,
            vendedoresAtivos,
            etapasAtivas,
            produtosCarregados,
            gruposEmpresaAtivos,
            gruposProdutoAtivos,
            marcasAtivas
          )
        );
      } catch (_erro) {
        if (!cancelado) {
          definirMensagemErroConversao('Nao foi possivel carregar os orcamentos do relatorio.');
          definirOrcamentosConversao([]);
          definirGruposEmpresaRelatorio([]);
          definirGruposProdutoRelatorio([]);
          definirMarcasRelatorio([]);
        }
      } finally {
        if (!cancelado) {
          definirCarregandoConversao(false);
        }
      }
    }

    carregarRelatorioConversao();

    return () => {
      cancelado = true;
    };
  }, [aberto, relatorio]);

  useEffect(() => {
    if (!aberto || relatorio !== 'relatorioAtendimentos') {
      if (!aberto) {
        definirMensagemErroAtendimentosRelatorio('');
        definirAtendimentosRelatorio([]);
        definirUsuariosRelatorio([]);
        definirCanaisAtendimentoRelatorio([]);
        definirOrigensAtendimentoRelatorio([]);
        definirGruposEmpresaRelatorio([]);
        definirModalFiltrosAtendimentosAberto(false);
        definirModalBuscaClienteAtendimentosAberto(false);
      }
      return undefined;
    }

    let cancelado = false;

    async function carregarAtendimentosRelatorio() {
      definirCarregandoAtendimentosRelatorio(true);
      definirMensagemErroAtendimentosRelatorio('');

      try {
        const resultados = await Promise.allSettled([
          listarAtendimentos(),
          listarClientes(),
          listarContatos(),
          listarUsuarios(),
          listarTiposAtendimento(),
          listarCanaisAtendimento(),
          listarOrigensAtendimento(),
          listarGruposEmpresa()
        ]);

        if (cancelado) {
          return;
        }

        const [
          atendimentosResultado,
          clientesResultado,
          contatosResultado,
          usuariosResultado,
          tiposAtendimentoResultado,
          canaisResultado,
          origensResultado,
          gruposEmpresaResultado
        ] = resultados;

        const atendimentosCarregados = atendimentosResultado.status === 'fulfilled' ? atendimentosResultado.value : [];
        const clientesCarregados = clientesResultado.status === 'fulfilled' ? clientesResultado.value : [];
        const contatosCarregados = contatosResultado.status === 'fulfilled' ? contatosResultado.value : [];
        const usuariosCarregados = usuariosResultado.status === 'fulfilled' ? usuariosResultado.value : [];
        const tiposAtendimentoCarregados = tiposAtendimentoResultado.status === 'fulfilled' ? tiposAtendimentoResultado.value : [];
        const canaisCarregados = canaisResultado.status === 'fulfilled' ? canaisResultado.value : [];
        const origensCarregadas = origensResultado.status === 'fulfilled' ? origensResultado.value : [];
        const gruposEmpresaCarregados = gruposEmpresaResultado.status === 'fulfilled' ? gruposEmpresaResultado.value : [];

        const clientesAtivos = filtrarRegistrosAtivosLocais(clientesCarregados);
        const contatosAtivos = filtrarRegistrosAtivosLocais(contatosCarregados);
        const usuariosAtivos = filtrarRegistrosAtivosLocais(usuariosCarregados, 'status');
        const tiposAtendimentoAtivos = filtrarRegistrosAtivosLocais(tiposAtendimentoCarregados, 'status');
        const canaisAtivos = filtrarRegistrosAtivosLocais(canaisCarregados, 'status');
        const origensAtivas = filtrarRegistrosAtivosLocais(origensCarregadas, 'status');
        const gruposEmpresaAtivos = filtrarRegistrosAtivosLocais(gruposEmpresaCarregados, 'status');

        definirClientes(clientesAtivos);
        definirGruposEmpresaRelatorio(gruposEmpresaAtivos);
        definirUsuariosRelatorio(usuariosAtivos);
        definirTiposAtendimentoRelatorio(tiposAtendimentoAtivos);
        definirCanaisAtendimentoRelatorio(canaisAtivos);
        definirOrigensAtendimentoRelatorio(origensAtivas);
        definirAtendimentosRelatorio(
          enriquecerAtendimentosRelatorio(
            atendimentosCarregados,
            clientesAtivos,
            contatosAtivos,
            usuariosAtivos,
            tiposAtendimentoAtivos,
            canaisAtivos,
            origensAtivas,
            gruposEmpresaAtivos
          )
        );
      } catch (_erro) {
        if (!cancelado) {
          definirMensagemErroAtendimentosRelatorio('Nao foi possivel carregar os atendimentos do relatorio.');
          definirAtendimentosRelatorio([]);
          definirGruposEmpresaRelatorio([]);
        }
      } finally {
        if (!cancelado) {
          definirCarregandoAtendimentosRelatorio(false);
        }
      }
    }

    carregarAtendimentosRelatorio();

    return () => {
      cancelado = true;
    };
  }, [aberto, relatorio]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    function tratarTecla(evento) {
      if (evento.key === 'Escape') {
        aoFechar();
      }
    }

    window.addEventListener('keydown', tratarTecla);

    return () => {
      window.removeEventListener('keydown', tratarTecla);
    };
  }, [aberto, aoFechar]);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirFiltrosPedidosFechados(filtrosPadraoPedidosFechados);
    definirRascunhoFiltrosPedidosFechados(filtrosPadraoPedidosFechados);
  }, [aberto, filtrosPadraoPedidosFechados, relatorio, usuarioLogado?.idUsuario]);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirFiltrosConversao(filtrosPadraoConversao);
    definirRascunhoFiltrosConversao(filtrosPadraoConversao);
  }, [aberto, filtrosPadraoConversao, relatorio, usuarioLogado?.idUsuario]);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirFiltrosAtendimentosRelatorio(filtrosPadraoAtendimentos);
    definirRascunhoFiltrosAtendimentosRelatorio(filtrosPadraoAtendimentos);
  }, [aberto, filtrosPadraoAtendimentos, relatorio, usuarioLogado?.idUsuario]);

  useEffect(() => {
    if (avisosPopup.length === 0) {
      return undefined;
    }

    const temporizadores = avisosPopup.map((aviso) => window.setTimeout(() => {
      definirAvisosPopup((estadoAtual) => estadoAtual.filter((item) => item.id !== aviso.id));
    }, 4200));

    return () => {
      temporizadores.forEach((temporizador) => window.clearTimeout(temporizador));
    };
  }, [avisosPopup]);

  const pedidosFechadosFiltrados = useMemo(
    () => filtrarPedidosFechados(pedidos, filtrosPedidosFechados),
    [pedidos, filtrosPedidosFechados]
  );

  const cardsPedidosFechados = useMemo(
    () => montarCardsPedidosFechados(pedidosFechadosFiltrados),
    [pedidosFechadosFiltrados]
  );

  const filtrosPedidosFechadosAtivos = useMemo(
    () => possuiFiltrosAtivos(filtrosPedidosFechados),
    [filtrosPedidosFechados]
  );

  const chipsPedidosFechados = useMemo(
      () => montarChipsFiltrosPedidosFechados(filtrosPedidosFechados, {
        clientes,
        vendedores,
        etapasPedido,
        gruposEmpresa: gruposEmpresaRelatorio,
        gruposProduto: gruposProdutoRelatorio,
        marcas: marcasRelatorio,
        tiposPedido: tiposPedidoRelatorio
      }),
    [clientes, etapasPedido, filtrosPedidosFechados, gruposEmpresaRelatorio, gruposProdutoRelatorio, marcasRelatorio, tiposPedidoRelatorio, vendedores]
  );

  const quantidadeTotalPedidosFechados = useMemo(
    () => pedidosFechadosFiltrados.reduce((total, pedido) => total + (Number(pedido.quantidadeTotalPedido) || 0), 0),
    [pedidosFechadosFiltrados]
  );

  const orcamentosConversaoFiltrados = useMemo(
    () => filtrarOrcamentosConversao(orcamentosConversao, filtrosConversao),
    [orcamentosConversao, filtrosConversao]
  );

  const cardsConversao = useMemo(
    () => montarCardsConversao(orcamentosConversaoFiltrados),
    [orcamentosConversaoFiltrados]
  );

  const filtrosConversaoAtivos = useMemo(
    () => possuiFiltrosConversaoAtivos(filtrosConversao),
    [filtrosConversao]
  );

  const chipsConversao = useMemo(
    () => montarChipsFiltrosConversao(filtrosConversao, {
      clientes,
      usuarios: usuariosConversao,
      vendedores,
      etapasOrcamento: etapasOrcamentoConversao,
      gruposEmpresa: gruposEmpresaRelatorio,
      gruposProduto: gruposProdutoRelatorio,
      marcas: marcasRelatorio
    }),
    [clientes, etapasOrcamentoConversao, filtrosConversao, gruposEmpresaRelatorio, gruposProdutoRelatorio, marcasRelatorio, usuariosConversao, vendedores]
  );

  const atendimentosRelatorioFiltrados = useMemo(
    () => filtrarAtendimentosRelatorio(atendimentosRelatorio, filtrosAtendimentosRelatorio),
    [atendimentosRelatorio, filtrosAtendimentosRelatorio]
  );

  const cardsAtendimentosRelatorio = useMemo(
    () => montarCardsRelatorioAtendimentos(atendimentosRelatorioFiltrados),
    [atendimentosRelatorioFiltrados]
  );

  const filtrosAtendimentosRelatorioAtivos = useMemo(
    () => possuiFiltrosAtendimentosAtivos(filtrosAtendimentosRelatorio),
    [filtrosAtendimentosRelatorio]
  );

  const chipsAtendimentosRelatorio = useMemo(
    () => montarChipsFiltrosAtendimentosRelatorio(filtrosAtendimentosRelatorio, {
      clientes,
      usuarios: usuariosRelatorio,
      tiposAtendimento: tiposAtendimentoRelatorio,
      canaisAtendimento: canaisAtendimentoRelatorio,
      origensAtendimento: origensAtendimentoRelatorio,
      gruposEmpresa: gruposEmpresaRelatorio
    }),
    [canaisAtendimentoRelatorio, clientes, filtrosAtendimentosRelatorio, gruposEmpresaRelatorio, origensAtendimentoRelatorio, tiposAtendimentoRelatorio, usuariosRelatorio]
  );

  async function gerarPdfRelatorioPedidosFechados() {
    if (gerandoPdf) {
      return;
    }

    if (pedidosFechadosFiltrados.length === 0) {
      adicionarAvisoPdf('erro', 'Nao foi possivel gerar o PDF.', 'Nao ha pedidos no recorte atual para exportar o relatorio.');
      return;
    }

    definirGerandoPdf(true);

    try {
      const resultado = await exportarRelatorioPedidosFechadosPdf({
        pedidos: pedidosFechadosFiltrados,
        filtros: filtrosPedidosFechados,
        chips: chipsPedidosFechados,
        clientes,
        vendedores,
        etapasPedido,
        cards: cardsPedidosFechados,
        usuarioLogado,
        quantidadeTotal: quantidadeTotalPedidosFechados
      });

      if (resultado.cancelado) {
        return;
      }

      if (!resultado.sucesso) {
        adicionarAvisoPdf('erro', 'Nao foi possivel gerar o PDF.', resultado.mensagem || 'Nao foi possivel exportar o PDF do relatorio.');
        return;
      }

      adicionarAvisoPdf('sucesso', 'PDF gerado com sucesso.', 'O relatorio foi enviado para exportacao.');
    } catch (erro) {
      adicionarAvisoPdf('erro', 'Nao foi possivel gerar o PDF.', erro.message || 'Nao foi possivel exportar o PDF do relatorio.');
    } finally {
      definirGerandoPdf(false);
    }
  }

  async function gerarPdfRelatorioAtendimentos() {
    if (gerandoPdfAtendimentos) {
      return;
    }

    if (atendimentosRelatorioFiltrados.length === 0) {
      adicionarAvisoPdf('erro', 'Nao foi possivel gerar o PDF.', 'Nao ha atendimentos no recorte atual para exportar o relatorio.');
      return;
    }

    definirGerandoPdfAtendimentos(true);

    try {
      const resultado = await exportarRelatorioAtendimentosPdf({
        atendimentos: atendimentosRelatorioFiltrados,
        chips: chipsAtendimentosRelatorio,
        cards: cardsAtendimentosRelatorio,
        usuarioLogado
      });

      if (resultado.cancelado) {
        return;
      }

      if (!resultado.sucesso) {
        adicionarAvisoPdf('erro', 'Nao foi possivel gerar o PDF.', resultado.mensagem || 'Nao foi possivel exportar o PDF do relatorio.');
        return;
      }

      adicionarAvisoPdf('sucesso', 'PDF gerado com sucesso.', 'O relatorio foi enviado para exportacao.');
    } catch (erro) {
      adicionarAvisoPdf('erro', 'Nao foi possivel gerar o PDF.', erro.message || 'Nao foi possivel exportar o PDF do relatorio.');
    } finally {
      definirGerandoPdfAtendimentos(false);
    }
  }

  async function gerarPdfRelatorioConversao() {
    if (gerandoPdfConversao) {
      return;
    }

    if (orcamentosConversaoFiltrados.length === 0) {
      adicionarAvisoPdf('erro', 'Nao foi possivel gerar o PDF.', 'Nao ha orcamentos no recorte atual para exportar o relatorio.');
      return;
    }

    definirGerandoPdfConversao(true);

    try {
      const resultado = await exportarRelatorioConversaoPdf({
        orcamentos: orcamentosConversaoFiltrados,
        chips: chipsConversao,
        cards: cardsConversao,
        usuarioLogado
      });

      if (resultado.cancelado) {
        return;
      }

      if (!resultado.sucesso) {
        adicionarAvisoPdf('erro', 'Nao foi possivel gerar o PDF.', resultado.mensagem || 'Nao foi possivel exportar o PDF do relatorio.');
        return;
      }

      adicionarAvisoPdf('sucesso', 'PDF gerado com sucesso.', 'O relatorio foi enviado para exportacao.');
    } catch (erro) {
      adicionarAvisoPdf('erro', 'Nao foi possivel gerar o PDF.', erro.message || 'Nao foi possivel exportar o PDF do relatorio.');
    } finally {
      definirGerandoPdfConversao(false);
    }
  }

  function adicionarAvisoPdf(tipo, titulo, mensagem) {
    const id = `pdf-relatorio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    definirAvisosPopup((estadoAtual) => ([
      {
        id,
        icone: tipo === 'sucesso' ? 'confirmar' : 'alerta',
        titulo,
        mensagem: mensagem || undefined
      },
      ...estadoAtual
    ].slice(0, 4)));
  }

  if (!aberto) {
    return null;
  }

  if (relatorio === 'relatorioPedidosFechados') {
    return (
      <>
        <ModalRelatorioGrade
          aberto={aberto}
          titulo={configuracao.titulo}
          subtitulo={configuracao.subtitulo}
          chips={chipsPedidosFechados}
          filtrosAtivos={filtrosPedidosFechadosAtivos}
          tituloFiltro={configuracao.tituloFiltro}
          ariaFiltro={configuracao.ariaFiltro}
          onAbrirFiltros={() => {
            definirRascunhoFiltrosPedidosFechados(filtrosPedidosFechados);
            definirModalFiltrosAberto(true);
          }}
          acaoPdf={{
            title: gerandoPdf
              ? 'Gerando PDF do relatorio'
              : exportacaoPdfDisponivel
                ? 'Gerar PDF do relatorio'
                : 'Abrir impressao para salvar como PDF',
            ariaLabel: gerandoPdf
              ? 'Gerando PDF do relatorio'
              : 'Gerar PDF do relatorio',
            disabled: gerandoPdf || carregandoPedidos,
            onClick: gerarPdfRelatorioPedidosFechados
          }}
          onFechar={aoFechar}
          cards={cardsPedidosFechados}
        >
          <section className="modalRelatorioGradePainelTabela painelContatosModalCliente painelPedidosCliente modalHistoricoVendasClientePainel">
            <TabelaHistoricoPedidos
              carregando={carregandoPedidos}
              mensagemErro={mensagemErroPedidos}
              pedidos={pedidosFechadosFiltrados}
              contextoSalvo
              mensagemSemContexto="O relatorio ficara disponivel apos carregar os pedidos."
              mensagemVazia="Nenhum pedido encontrado para o periodo informado."
              exibirCliente
              exibirTipoPedido
              exibirAcoes={false}
            />
          </section>
        </ModalRelatorioGrade>

        <ModalFiltros
          aberto={modalFiltrosAberto}
          titulo="Filtros de vendas"
          filtros={rascunhoFiltrosPedidosFechados}
          campos={[
            {
              name: 'idCliente',
              label: 'Cliente',
              placeholder: 'Todos os clientes',
              options: clientes.map((cliente) => ({
                valor: String(cliente.idCliente),
                label: cliente.nomeFantasia || cliente.razaoSocial || `Cliente #${cliente.idCliente}`
              })),
              acaoExtra: (
                <Botao
                  variante="secundario"
                  type="button"
                  icone="pesquisa"
                  className="botaoCampoAcao"
                  somenteIcone
                  title="Buscar cliente"
                  aria-label="Buscar cliente"
                  onClick={() => definirModalBuscaClienteAberto(true)}
                >
                  Buscar cliente
                </Botao>
              )
            },
            {
              name: 'idsVendedores',
              label: 'Vendedor',
              multiple: true,
              tituloSelecao: 'Selecionar vendedores',
              placeholder: 'Todos os vendedores',
              options: vendedores.map((vendedor) => ({
                valor: String(vendedor.idVendedor),
                label: vendedor.nome || `Vendedor #${vendedor.idVendedor}`
              }))
            },
            {
              name: 'idsGruposEmpresa',
              label: 'Grupo de empresa',
              multiple: true,
              tituloSelecao: 'Selecionar grupos de empresa',
              placeholder: 'Todos os grupos',
              options: gruposEmpresaRelatorio.map((grupo) => ({
                valor: String(grupo.idGrupoEmpresa),
                label: grupo.descricao || `Grupo #${grupo.idGrupoEmpresa}`
              }))
            },
            {
              name: 'idsGruposProduto',
              label: 'Grupo de produto',
              multiple: true,
              tituloSelecao: 'Selecionar grupos de produto',
              placeholder: 'Todos os grupos',
              options: gruposProdutoRelatorio.map((grupo) => ({
                valor: String(grupo.idGrupo),
                label: grupo.descricao || `Grupo #${grupo.idGrupo}`
              }))
            },
            {
              name: 'idsMarcas',
              label: 'Marca',
              multiple: true,
              tituloSelecao: 'Selecionar marcas',
              placeholder: 'Todas as marcas',
              options: marcasRelatorio.map((marca) => ({
                valor: String(marca.idMarca),
                label: marca.descricao || `Marca #${marca.idMarca}`
              }))
            },
              {
                name: 'idsEtapasPedido',
                label: 'Etapa',
                multiple: true,
                tituloSelecao: 'Selecionar etapas do pedido',
                placeholder: 'Todas as etapas',
                options: etapasPedido.map((etapa) => ({
                  valor: String(etapa.idEtapaPedido),
                  label: etapa.descricao || `Etapa #${etapa.idEtapaPedido}`
                }))
              },
              {
                name: 'idsTiposPedido',
                label: 'Tipo de venda',
                multiple: true,
                tituloSelecao: 'Selecionar tipos de venda',
                placeholder: 'Todos os tipos',
                options: tiposPedidoRelatorio.map((tipoPedido) => ({
                  valor: String(tipoPedido.idTipoPedido),
                  label: tipoPedido.descricao || `Tipo #${tipoPedido.idTipoPedido}`
                }))
              },
              {
                name: 'periodoInclusaoPedidosFechados',
              label: 'Datas',
              type: 'date-filters-modal',
              tituloSelecao: 'Filtro por datas de vendas',
              placeholder: 'Selecionar periodo',
              periodos: [
                {
                  titulo: 'Data de inclusao',
                  nomeInicio: 'dataInclusaoInicio',
                  nomeFim: 'dataInclusaoFim',
                  labelInicio: 'Inicio da inclusao',
                  labelFim: 'Fim da inclusao'
                },
                {
                  titulo: 'Data de entrega',
                  nomeInicio: 'dataEntregaInicio',
                  nomeFim: 'dataEntregaFim',
                  labelInicio: 'Inicio da entrega',
                  labelFim: 'Fim da entrega'
                }
              ]
            }
          ]}
          aoFechar={() => {
            definirModalFiltrosAberto(false);
            definirModalBuscaClienteAberto(false);
            definirRascunhoFiltrosPedidosFechados(filtrosPedidosFechados);
          }}
          aoAplicar={(proximosFiltros) => {
            const filtrosNormalizados = normalizarFiltrosPedidosFechados(proximosFiltros);
            definirFiltrosPedidosFechados(filtrosNormalizados);
            definirRascunhoFiltrosPedidosFechados(filtrosNormalizados);
            definirModalFiltrosAberto(false);
            definirModalBuscaClienteAberto(false);
          }}
          aoLimpar={() => {
            definirFiltrosPedidosFechados(filtrosPadraoPedidosFechados);
            definirRascunhoFiltrosPedidosFechados(filtrosPadraoPedidosFechados);
          }}
        />

        <ModalBuscaClientes
          aberto={modalBuscaClienteAberto}
          clientes={clientes}
          aoSelecionar={(cliente) => {
            definirRascunhoFiltrosPedidosFechados((estadoAtual) => ({
              ...estadoAtual,
              idCliente: String(cliente.idCliente || '')
            }));
            definirModalBuscaClienteAberto(false);
          }}
          aoFechar={() => definirModalBuscaClienteAberto(false)}
        />

        <PopupAvisos
          avisos={avisosPopup}
          aoFechar={(idAviso) => {
            definirAvisosPopup((estadoAtual) => estadoAtual.filter((aviso) => aviso.id !== idAviso));
          }}
        />
      </>
    );
  }

  if (relatorio === 'relatorioAtendimentos') {
    return (
      <>
        <ModalRelatorioGrade
          aberto={aberto}
          titulo={configuracao.titulo}
          subtitulo={configuracao.subtitulo}
          chips={chipsAtendimentosRelatorio}
          filtrosAtivos={filtrosAtendimentosRelatorioAtivos}
          tituloFiltro={configuracao.tituloFiltro}
          ariaFiltro={configuracao.ariaFiltro}
          onAbrirFiltros={() => {
            definirRascunhoFiltrosAtendimentosRelatorio(filtrosAtendimentosRelatorio);
            definirModalFiltrosAtendimentosAberto(true);
          }}
          acaoPdf={{
            title: gerandoPdfAtendimentos
              ? 'Gerando PDF do relatorio'
              : exportacaoPdfDisponivel
                ? 'Gerar PDF do relatorio'
                : 'Abrir impressao para salvar como PDF',
            ariaLabel: gerandoPdfAtendimentos
              ? 'Gerando PDF do relatorio'
              : 'Gerar PDF do relatorio',
            disabled: gerandoPdfAtendimentos || carregandoAtendimentosRelatorio,
            onClick: gerarPdfRelatorioAtendimentos
          }}
          onFechar={aoFechar}
          cards={cardsAtendimentosRelatorio}
        >
          <section className="modalRelatorioGradePainelTabela painelContatosModalCliente modalHistoricoAtendimentosClientePainel">
            <TabelaHistoricoAtendimentos
              carregando={carregandoAtendimentosRelatorio}
              mensagemErro={mensagemErroAtendimentosRelatorio}
              atendimentos={atendimentosRelatorioFiltrados}
              contextoSalvo
              mensagemSemContexto="O relatorio ficara disponivel apos carregar os atendimentos."
              mensagemVazia="Nenhum atendimento encontrado para o relatorio."
              exibirCliente
              exibirAcoes={false}
            />
          </section>
        </ModalRelatorioGrade>

        <ModalFiltros
          aberto={modalFiltrosAtendimentosAberto}
          titulo="Filtros de atendimentos"
          filtros={rascunhoFiltrosAtendimentosRelatorio}
          campos={[
            {
              name: 'idCliente',
              label: 'Cliente',
              placeholder: 'Todos os clientes',
              options: clientes.map((cliente) => ({
                valor: String(cliente.idCliente),
                label: cliente.nomeFantasia || cliente.razaoSocial || `Cliente #${cliente.idCliente}`
              })),
              acaoExtra: (
                <Botao
                  variante="secundario"
                  type="button"
                  icone="pesquisa"
                  className="botaoCampoAcao"
                  somenteIcone
                  title="Buscar cliente"
                  aria-label="Buscar cliente"
                  onClick={() => definirModalBuscaClienteAtendimentosAberto(true)}
                >
                  Buscar cliente
                </Botao>
              )
            },
            {
              name: 'idsUsuarios',
              label: 'Usuario do registro',
              multiple: true,
              tituloSelecao: 'Selecionar usuarios',
              placeholder: 'Todos os usuarios',
              options: usuariosRelatorio.map((usuario) => ({
                valor: String(usuario.idUsuario),
                label: usuario.nome || `Usuario #${usuario.idUsuario}`
              }))
            },
            {
              name: 'idsGruposEmpresa',
              label: 'Grupo de empresa',
              multiple: true,
              tituloSelecao: 'Selecionar grupos de empresa',
              placeholder: 'Todos os grupos',
              options: gruposEmpresaRelatorio.map((grupo) => ({
                valor: String(grupo.idGrupoEmpresa),
                label: grupo.descricao || `Grupo #${grupo.idGrupoEmpresa}`
              }))
            },
            {
              name: 'idsTiposAtendimento',
              label: 'Tipo de atendimento',
              multiple: true,
              tituloSelecao: 'Selecionar tipos de atendimento',
              placeholder: 'Todos os tipos',
              options: tiposAtendimentoRelatorio.map((tipoAtendimento) => ({
                valor: String(tipoAtendimento.idTipoAtendimento),
                label: tipoAtendimento.descricao || `Tipo #${tipoAtendimento.idTipoAtendimento}`
              }))
            },
            {
              name: 'idsCanaisAtendimento',
              label: 'Canal',
              multiple: true,
              tituloSelecao: 'Selecionar canais',
              placeholder: 'Todos os canais',
              options: canaisAtendimentoRelatorio.map((canal) => ({
                valor: String(canal.idCanalAtendimento),
                label: canal.descricao || `Canal #${canal.idCanalAtendimento}`
              }))
            },
            {
              name: 'idsOrigensAtendimento',
              label: 'Origem',
              multiple: true,
              tituloSelecao: 'Selecionar origens',
              placeholder: 'Todas as origens',
              options: origensAtendimentoRelatorio.map((origem) => ({
                valor: String(origem.idOrigemAtendimento),
                label: origem.descricao || `Origem #${origem.idOrigemAtendimento}`
              }))
            },
            {
              name: 'periodoAtendimentosRelatorio',
              label: 'Data',
              type: 'date-filters-modal',
              tituloSelecao: 'Filtro por data de atendimento',
              placeholder: 'Selecionar periodo',
              periodos: [
                {
                  titulo: 'Data do atendimento',
                  nomeInicio: 'dataInicio',
                  nomeFim: 'dataFim',
                  labelInicio: 'Inicio do periodo',
                  labelFim: 'Fim do periodo'
                }
              ]
            }
          ]}
          aoFechar={() => {
            definirModalFiltrosAtendimentosAberto(false);
            definirModalBuscaClienteAtendimentosAberto(false);
            definirRascunhoFiltrosAtendimentosRelatorio(filtrosAtendimentosRelatorio);
          }}
          aoAplicar={(proximosFiltros) => {
            const filtrosNormalizados = normalizarFiltrosAtendimentosRelatorio(proximosFiltros);
            definirFiltrosAtendimentosRelatorio(filtrosNormalizados);
            definirRascunhoFiltrosAtendimentosRelatorio(filtrosNormalizados);
            definirModalFiltrosAtendimentosAberto(false);
            definirModalBuscaClienteAtendimentosAberto(false);
          }}
          aoLimpar={() => {
            definirFiltrosAtendimentosRelatorio(filtrosPadraoAtendimentos);
            definirRascunhoFiltrosAtendimentosRelatorio(filtrosPadraoAtendimentos);
          }}
        />

        <ModalBuscaClientes
          aberto={modalBuscaClienteAtendimentosAberto}
          clientes={clientes}
          aoSelecionar={(cliente) => {
            definirRascunhoFiltrosAtendimentosRelatorio((estadoAtual) => ({
              ...estadoAtual,
              idCliente: String(cliente.idCliente || '')
            }));
            definirModalBuscaClienteAtendimentosAberto(false);
          }}
          aoFechar={() => definirModalBuscaClienteAtendimentosAberto(false)}
        />

        <PopupAvisos
          avisos={avisosPopup}
          aoFechar={(idAviso) => {
            definirAvisosPopup((estadoAtual) => estadoAtual.filter((aviso) => aviso.id !== idAviso));
          }}
        />
      </>
    );
  }

  if (relatorio === 'relatorioPedidosEntregues') {
    return (
      <>
        <ModalRelatorioGrade
          aberto={aberto}
          titulo={configuracao.titulo}
          subtitulo={configuracao.subtitulo}
          chips={chipsConversao}
          filtrosAtivos={filtrosConversaoAtivos}
          tituloFiltro={configuracao.tituloFiltro}
          ariaFiltro={configuracao.ariaFiltro}
          onAbrirFiltros={() => {
            definirRascunhoFiltrosConversao(filtrosConversao);
            definirModalFiltrosConversaoAberto(true);
          }}
          acaoPdf={{
            title: gerandoPdfConversao
              ? 'Gerando PDF do relatorio'
              : exportacaoPdfDisponivel
                ? 'Gerar PDF do relatorio'
                : 'Abrir impressao para salvar como PDF',
            ariaLabel: gerandoPdfConversao
              ? 'Gerando PDF do relatorio'
              : 'Gerar PDF do relatorio',
            disabled: gerandoPdfConversao || carregandoConversao,
            onClick: gerarPdfRelatorioConversao
          }}
          onFechar={aoFechar}
          cards={cardsConversao}
        >
          <section className="modalRelatorioGradePainelTabela painelContatosModalCliente">
            <TabelaHistoricoOrcamentos
              carregando={carregandoConversao}
              mensagemErro={mensagemErroConversao}
              orcamentos={orcamentosConversaoFiltrados}
              contextoSalvo
              mensagemSemContexto="O relatorio ficara disponivel apos carregar os orcamentos."
              mensagemVazia="Nenhum orcamento encontrado para o periodo informado."
            />
          </section>
        </ModalRelatorioGrade>

        <ModalFiltros
          aberto={modalFiltrosConversaoAberto}
          titulo="Filtros de conversao"
          filtros={rascunhoFiltrosConversao}
          campos={[
            {
              name: 'idCliente',
              label: 'Cliente',
              placeholder: 'Todos os clientes',
              options: clientes.map((cliente) => ({
                valor: String(cliente.idCliente),
                label: cliente.nomeFantasia || cliente.razaoSocial || `Cliente #${cliente.idCliente}`
              })),
              acaoExtra: (
                <Botao
                  variante="secundario"
                  type="button"
                  icone="pesquisa"
                  className="botaoCampoAcao"
                  somenteIcone
                  title="Buscar cliente"
                  aria-label="Buscar cliente"
                  onClick={() => definirModalBuscaClienteConversaoAberto(true)}
                >
                  Buscar cliente
                </Botao>
              )
            },
            {
              name: 'idUsuario',
              label: 'Usuario do registro',
              multiple: true,
              placeholder: 'Todos os usuarios',
              options: usuariosConversao.map((usuario) => ({
                valor: String(usuario.idUsuario),
                label: usuario.nome || `Usuario #${usuario.idUsuario}`
              }))
            },
            {
              name: 'idVendedorCliente',
              label: 'Clientes do vendedor',
              multiple: true,
              placeholder: 'Todos os vendedores',
              options: vendedores.map((vendedor) => ({
                valor: String(vendedor.idVendedor),
                label: vendedor.nome || `Vendedor #${vendedor.idVendedor}`
              }))
            },
            {
              name: 'idVendedor',
              label: 'Vendedor do orcamento',
              multiple: true,
              placeholder: 'Todos os vendedores',
              options: vendedores.map((vendedor) => ({
                valor: String(vendedor.idVendedor),
                label: vendedor.nome || `Vendedor #${vendedor.idVendedor}`
              }))
            },
            {
              name: 'idsGruposEmpresa',
              label: 'Grupo de empresa',
              multiple: true,
              tituloSelecao: 'Selecionar grupos de empresa',
              placeholder: 'Todos os grupos',
              options: gruposEmpresaRelatorio.map((grupo) => ({
                valor: String(grupo.idGrupoEmpresa),
                label: grupo.descricao || `Grupo #${grupo.idGrupoEmpresa}`
              }))
            },
            {
              name: 'idsGruposProduto',
              label: 'Grupo de produto',
              multiple: true,
              tituloSelecao: 'Selecionar grupos de produto',
              placeholder: 'Todos os grupos',
              options: gruposProdutoRelatorio.map((grupo) => ({
                valor: String(grupo.idGrupo),
                label: grupo.descricao || `Grupo #${grupo.idGrupo}`
              }))
            },
            {
              name: 'idsMarcas',
              label: 'Marca',
              multiple: true,
              tituloSelecao: 'Selecionar marcas',
              placeholder: 'Todas as marcas',
              options: marcasRelatorio.map((marca) => ({
                valor: String(marca.idMarca),
                label: marca.descricao || `Marca #${marca.idMarca}`
              }))
            },
            {
              name: 'idsEtapaOrcamento',
              label: 'Etapa',
              multiple: true,
              tituloSelecao: 'Selecionar etapas do orcamento',
              placeholder: 'Todas as etapas',
              options: etapasOrcamentoConversao.map((etapa) => ({
                valor: String(etapa.idEtapaOrcamento),
                label: etapa.descricao || `Etapa #${etapa.idEtapaOrcamento}`
              }))
            },
            {
              name: 'periodosDatasConversao',
              label: 'Datas',
              type: 'date-filters-modal',
              tituloSelecao: 'Filtros de datas da conversao',
              placeholder: 'Selecionar datas',
              periodos: [
                {
                  titulo: 'Data de inclusao',
                  nomeInicio: 'dataInclusaoInicio',
                  nomeFim: 'dataInclusaoFim',
                  labelInicio: 'Inicio da inclusao',
                  labelFim: 'Fim da inclusao'
                },
                {
                  titulo: 'Data de fechamento',
                  nomeInicio: 'dataFechamentoInicio',
                  nomeFim: 'dataFechamentoFim',
                  labelInicio: 'Inicio do fechamento',
                  labelFim: 'Fim do fechamento'
                }
              ]
            }
          ]}
          aoFechar={() => {
            definirModalFiltrosConversaoAberto(false);
            definirModalBuscaClienteConversaoAberto(false);
            definirRascunhoFiltrosConversao(filtrosConversao);
          }}
          aoAplicar={(proximosFiltros) => {
            const filtrosNormalizados = normalizarFiltrosConversao(proximosFiltros);
            definirFiltrosConversao(filtrosNormalizados);
            definirRascunhoFiltrosConversao(filtrosNormalizados);
            definirModalFiltrosConversaoAberto(false);
            definirModalBuscaClienteConversaoAberto(false);
          }}
          aoLimpar={() => {
            definirFiltrosConversao(filtrosPadraoConversao);
            definirRascunhoFiltrosConversao(filtrosPadraoConversao);
          }}
        />

        <ModalBuscaClientes
          aberto={modalBuscaClienteConversaoAberto}
          clientes={clientes}
          aoSelecionar={(cliente) => {
            definirRascunhoFiltrosConversao((estadoAtual) => ({
              ...estadoAtual,
              idCliente: String(cliente.idCliente || '')
            }));
            definirModalBuscaClienteConversaoAberto(false);
          }}
          aoFechar={() => definirModalBuscaClienteConversaoAberto(false)}
        />

        <PopupAvisos
          avisos={avisosPopup}
          aoFechar={(idAviso) => {
            definirAvisosPopup((estadoAtual) => estadoAtual.filter((aviso) => aviso.id !== idAviso));
          }}
        />
      </>
    );
  }

  return (
    <ModalRelatorioGrade
      aberto={aberto}
      titulo={configuracao.titulo}
      subtitulo={configuracao.subtitulo}
      onFechar={aoFechar}
      cards={montarCardsPlaceholder(configuracao.titulo)}
    >
      <section className="modalRelatorioGradePainelVazio">
        <h3>Estrutura padronizada criada</h3>
        <p>
          Este relatorio ja usa o mesmo padrao visual da area de relatorios: modal amplo, cards de resumo no topo e espaco preparado para grade e filtros.
        </p>
      </section>
    </ModalRelatorioGrade>
  );
}

function enriquecerPedidosRelatorio(pedidos, clientes = [], produtos = [], gruposEmpresa = [], gruposProduto = [], marcas = []) {
  const clientesPorId = new Map(
    (clientes || []).map((cliente) => [
      cliente.idCliente,
      {
        idGrupoEmpresa: cliente.idGrupoEmpresa,
        nomeGrupoEmpresa: obterNomeGrupoEmpresaPorId(gruposEmpresa, cliente.idGrupoEmpresa)
      }
    ])
  );
  const produtosPorId = new Map(
    (produtos || []).map((produto) => [
      produto.idProduto,
      {
        idGrupo: produto.idGrupo,
        nomeGrupoProduto: obterNomeGrupoProdutoPorId(gruposProduto, produto.idGrupo),
        idMarca: produto.idMarca,
        nomeMarca: obterNomeMarcaPorId(marcas, produto.idMarca)
      }
    ])
  );

  return [...(pedidos || [])]
    .map((pedido) => ({
      ...pedido,
      idGrupoEmpresa: clientesPorId.get(pedido.idCliente)?.idGrupoEmpresa || null,
      nomeGrupoEmpresa: clientesPorId.get(pedido.idCliente)?.nomeGrupoEmpresa || 'Sem grupo',
      idsGruposProduto: Array.from(new Set(
        (Array.isArray(pedido.itens) ? pedido.itens : [])
          .map((item) => produtosPorId.get(item.idProduto)?.idGrupo)
          .filter((valor) => valor !== null && valor !== undefined && valor !== '')
          .map(String)
      )),
      idsMarcas: Array.from(new Set(
        (Array.isArray(pedido.itens) ? pedido.itens : [])
          .map((item) => produtosPorId.get(item.idProduto)?.idMarca)
          .filter((valor) => valor !== null && valor !== undefined && valor !== '')
          .map(String)
      )),
      totalPedido: Array.isArray(pedido.itens)
        ? pedido.itens.reduce((total, item) => total + (Number(item.valorTotal) || 0), 0)
        : 0,
      quantidadeTotalPedido: Array.isArray(pedido.itens)
        ? pedido.itens.reduce((total, item) => total + (Number(item.quantidade) || 0), 0)
        : 0
    }))
    .sort((pedidoA, pedidoB) => {
      const dataA = normalizarDataFiltro(pedidoA.dataInclusao);
      const dataB = normalizarDataFiltro(pedidoB.dataInclusao);

      if (dataA !== dataB) {
        return dataB.localeCompare(dataA);
      }

      return Number(pedidoB.idPedido || 0) - Number(pedidoA.idPedido || 0);
    });
}

function filtrarPedidosFechados(pedidos, filtros) {
  return (pedidos || []).filter((pedido) => {
    if (!validarPeriodoData(pedido.dataInclusao, filtros.dataInclusaoInicio, filtros.dataInclusaoFim)) {
      return false;
    }

    if (!validarPeriodoData(pedido.dataEntrega, filtros.dataEntregaInicio, filtros.dataEntregaFim)) {
      return false;
    }

    if (filtros.idCliente && String(pedido.idCliente || '') !== String(filtros.idCliente)) {
      return false;
    }

    if (
      Array.isArray(filtros.idsVendedores)
      && filtros.idsVendedores.length > 0
      && !filtros.idsVendedores.map(String).includes(String(pedido.idVendedor || ''))
    ) {
      return false;
    }

    if (
      Array.isArray(filtros.idsGruposEmpresa)
      && filtros.idsGruposEmpresa.length > 0
      && !filtros.idsGruposEmpresa.map(String).includes(String(pedido.idGrupoEmpresa || ''))
    ) {
      return false;
    }

    if (
      Array.isArray(filtros.idsGruposProduto)
      && filtros.idsGruposProduto.length > 0
      && !filtros.idsGruposProduto.some((idGrupo) => (pedido.idsGruposProduto || []).includes(String(idGrupo)))
    ) {
      return false;
    }

    if (
      Array.isArray(filtros.idsMarcas)
      && filtros.idsMarcas.length > 0
      && !filtros.idsMarcas.some((idMarca) => (pedido.idsMarcas || []).includes(String(idMarca)))
    ) {
      return false;
    }

    if (
      Array.isArray(filtros.idsEtapasPedido)
      && filtros.idsEtapasPedido.length > 0
      && !filtros.idsEtapasPedido.map(String).includes(String(pedido.idEtapaPedido || ''))
    ) {
      return false;
    }

    if (
      Array.isArray(filtros.idsTiposPedido)
      && filtros.idsTiposPedido.length > 0
      && !filtros.idsTiposPedido.map(String).includes(String(pedido.idTipoPedido || ''))
    ) {
      return false;
    }

    return true;
  });
}

function montarCardsPedidosFechados(pedidos) {
  const totalPedidos = pedidos.length;
  const valorTotal = pedidos.reduce((total, pedido) => total + (Number(pedido.totalPedido) || 0), 0);
  const quantidadeTotal = pedidos.reduce((total, pedido) => total + (Number(pedido.quantidadeTotalPedido) || 0), 0);
  const positivacao = new Set(
    pedidos
      .map((pedido) => String(pedido.idCliente || '').trim())
      .filter(Boolean)
  ).size;

  return [
    {
      titulo: 'Pedidos no recorte',
      valor: String(totalPedidos)
    },
    {
      titulo: 'Valor total',
      valor: normalizarPreco(valorTotal)
    },
    {
      titulo: 'Quantidade',
      valor: formatarQuantidadeResumo(quantidadeTotal)
    },
    {
      titulo: 'Positivacao',
      valor: String(positivacao)
    }
  ];
}

function montarCardsPlaceholder(titulo) {
  return [
    {
      titulo: 'Status da estrutura',
      valor: 'Inicial',
      descricao: `Base compartilhada de ${titulo.toLowerCase()} criada no padrao da area.`
    },
    {
      titulo: 'Cards de topo',
      valor: 'Prontos',
      descricao: 'O modal ja aceita indicadores executivos no mesmo layout dos demais relatorios.'
    },
    {
      titulo: 'Grade principal',
      valor: 'Reservada',
      descricao: 'O corpo do modal ja esta preparado para receber a grade operacional do relatorio.'
    },
    {
      titulo: 'Filtro de cabecalho',
      valor: 'Expansivel',
      descricao: 'A mesma base pode receber filtros no cabecalho sempre que o fluxo for evoluido.'
    }
  ];
}

function normalizarFiltrosPedidosFechados(filtros = {}) {
  const idCliente = normalizarIdentificadorFiltro(filtros.idCliente);
  const idsVendedores = normalizarListaIdentificadoresFiltro(filtros.idsVendedores);
  const idsGruposEmpresa = normalizarListaIdentificadoresFiltro(filtros.idsGruposEmpresa);
  const idsGruposProduto = normalizarListaIdentificadoresFiltro(filtros.idsGruposProduto);
  const idsMarcas = normalizarListaIdentificadoresFiltro(filtros.idsMarcas);
  const idsEtapasPedido = normalizarListaIdentificadoresFiltro(filtros.idsEtapasPedido);
  const idsTiposPedido = normalizarListaIdentificadoresFiltro(filtros.idsTiposPedido);
  const dataInclusaoInicio = normalizarDataFiltro(filtros.dataInclusaoInicio);
  const dataInclusaoFim = normalizarDataFiltro(filtros.dataInclusaoFim);
  const dataEntregaInicio = normalizarDataFiltro(filtros.dataEntregaInicio);
  const dataEntregaFim = normalizarDataFiltro(filtros.dataEntregaFim);
  const periodoInclusao = ordenarPeriodo(dataInclusaoInicio, dataInclusaoFim);
  const periodoEntrega = ordenarPeriodo(dataEntregaInicio, dataEntregaFim);

  return {
    idCliente,
    idsVendedores,
    idsGruposEmpresa,
    idsGruposProduto,
    idsMarcas,
    idsEtapasPedido,
    idsTiposPedido,
    dataInclusaoInicio: periodoInclusao.dataInicio,
    dataInclusaoFim: periodoInclusao.dataFim,
    dataEntregaInicio: periodoEntrega.dataInicio,
    dataEntregaFim: periodoEntrega.dataFim
  };
}

function normalizarIdentificadorFiltro(valor) {
  return String(valor || '').trim();
}

function normalizarListaIdentificadoresFiltro(valores) {
  return Array.from(new Set(
    (Array.isArray(valores) ? valores : [])
      .map((valor) => String(valor || '').trim())
      .filter(Boolean)
  ));
}

function possuiFiltrosAtivos(filtros = {}) {
  return Boolean(
    filtros.idCliente
    || (Array.isArray(filtros.idsVendedores) && filtros.idsVendedores.length > 0)
    || (Array.isArray(filtros.idsGruposEmpresa) && filtros.idsGruposEmpresa.length > 0)
    || (Array.isArray(filtros.idsGruposProduto) && filtros.idsGruposProduto.length > 0)
    || (Array.isArray(filtros.idsMarcas) && filtros.idsMarcas.length > 0)
    || (Array.isArray(filtros.idsEtapasPedido) && filtros.idsEtapasPedido.length > 0)
    || (Array.isArray(filtros.idsTiposPedido) && filtros.idsTiposPedido.length > 0)
    || filtros.dataInclusaoInicio
    || filtros.dataInclusaoFim
    || filtros.dataEntregaInicio
    || filtros.dataEntregaFim
  );
}

function montarChipsFiltrosPedidosFechados(filtros, {
  clientes,
  vendedores,
  etapasPedido,
  gruposEmpresa,
  gruposProduto,
  marcas,
  tiposPedido
}) {
  const chips = [];

  if (filtros.idCliente) {
    const cliente = clientes.find((item) => String(item.idCliente) === String(filtros.idCliente));
    chips.push({
      id: 'cliente',
      rotulo: `Cliente: ${cliente?.nomeFantasia || cliente?.razaoSocial || `#${filtros.idCliente}`}`
    });
  }

  if (Array.isArray(filtros.idsVendedores) && filtros.idsVendedores.length > 0) {
    filtros.idsVendedores.forEach((idVendedor) => {
      const vendedor = vendedores.find((item) => String(item.idVendedor) === String(idVendedor));
      chips.push({
        id: `vendedor-${idVendedor}`,
        rotulo: `Vendedor: ${vendedor?.nome || `#${idVendedor}`}`
      });
    });
  }

  if (Array.isArray(filtros.idsEtapasPedido) && filtros.idsEtapasPedido.length > 0) {
    filtros.idsEtapasPedido.forEach((idEtapaPedido) => {
      const etapa = etapasPedido.find((item) => String(item.idEtapaPedido) === String(idEtapaPedido));
      chips.push({
        id: `etapa-${idEtapaPedido}`,
        rotulo: `Etapa: ${etapa?.descricao || `#${idEtapaPedido}`}`
      });
    });
  }

  if (filtros.dataInclusaoInicio || filtros.dataInclusaoFim) {
    chips.push({
      id: 'periodo-inclusao',
      rotulo: `Inclusao: ${montarResumoPeriodoIndividual(filtros.dataInclusaoInicio, filtros.dataInclusaoFim)}`
    });
  }

  if (filtros.dataEntregaInicio || filtros.dataEntregaFim) {
    chips.push({
      id: 'periodo-entrega',
      rotulo: `Entrega: ${montarResumoPeriodoIndividual(filtros.dataEntregaInicio, filtros.dataEntregaFim)}`
    });
  }

  return chips;
}

function formatarQuantidadeResumo(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function filtrarRegistrosAtivosLocais(registros, campoAtivo = 'ativo') {
  return (Array.isArray(registros) ? registros : []).filter((registro) => {
    if (Object.prototype.hasOwnProperty.call(registro || {}, campoAtivo)) {
      return Boolean(registro[campoAtivo]);
    }

    if (Object.prototype.hasOwnProperty.call(registro || {}, 'ativo')) {
      return Boolean(registro.ativo);
    }

    if (Object.prototype.hasOwnProperty.call(registro || {}, 'status')) {
      return Boolean(registro.status);
    }

    return true;
  });
}

function normalizarEtapasPedido(registros) {
  return (Array.isArray(registros) ? registros : []).map((registro) => ({
    ...registro,
    idEtapaPedido: registro?.idEtapaPedido ?? registro?.idEtapa ?? null
  }));
}

function obterFiltrosPadraoPedidosFechados() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  return {
    idCliente: '',
    idsVendedores: [],
    idsGruposEmpresa: [],
    idsGruposProduto: [],
    idsMarcas: [],
    idsEtapasPedido: [],
    idsTiposPedido: [],
    dataInclusaoInicio: formatarDataInput(inicioMes),
    dataInclusaoFim: formatarDataInput(fimMes),
    dataEntregaInicio: '',
    dataEntregaFim: ''
  };
}

function ordenarPeriodo(dataInicio, dataFim) {
  if (dataInicio && dataFim && dataInicio > dataFim) {
    return {
      dataInicio: dataFim,
      dataFim: dataInicio
    };
  }

  return {
    dataInicio,
    dataFim
  };
}

function formatarDataInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function montarResumoPeriodoIndividual(dataInicio, dataFim) {
  if (dataInicio && dataFim) {
    return `${formatarDataResumo(dataInicio)} ate ${formatarDataResumo(dataFim)}`;
  }

  if (dataInicio) {
    return `A partir de ${formatarDataResumo(dataInicio)}`;
  }

  return `Ate ${formatarDataResumo(dataFim)}`;
}

function formatarDataResumo(valor) {
  if (!valor) {
    return '';
  }

  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${valor}T00:00:00`));
}

function validarPeriodoData(valorData, dataInicio, dataFim) {
  const dataNormalizada = normalizarDataFiltro(valorData);

  if (!dataInicio && !dataFim) {
    return true;
  }

  if (!dataNormalizada) {
    return false;
  }

  if (dataInicio && dataNormalizada < dataInicio) {
    return false;
  }

  if (dataFim && dataNormalizada > dataFim) {
    return false;
  }

  return true;
}

function normalizarDataFiltro(valor) {
  const texto = String(valor || '').trim();

  if (!texto) {
    return '';
  }

  const dataNormalizada = texto.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dataNormalizada) ? dataNormalizada : '';
}

function montarCardsRelatorioAtendimentos(atendimentos) {
  const totalAtendimentos = Array.isArray(atendimentos) ? atendimentos.length : 0;
  const totalClientes = new Set(
    (Array.isArray(atendimentos) ? atendimentos : [])
      .map((atendimento) => String(atendimento.idCliente || '').trim())
      .filter(Boolean)
  ).size;
  const resumoCanal = obterResumoPercentualCategoria(atendimentos, 'nomeCanalAtendimento');
  const resumoOrigem = obterResumoPercentualCategoria(atendimentos, 'nomeOrigemAtendimento');

  return [
    {
      titulo: 'Total de atendimentos',
      valor: String(totalAtendimentos)
    },
    {
      titulo: 'Clientes atendidos',
      valor: String(totalClientes)
    },
    {
      titulo: 'Canal lider',
      valor: resumoCanal.valorExibicao
    },
    {
      titulo: 'Origem lider',
      valor: resumoOrigem.valorExibicao
    }
  ];
}

function obterResumoPercentualCategoria(registros, campo) {
  const lista = Array.isArray(registros) ? registros : [];

  if (lista.length === 0) {
    return {
      valorExibicao: '0%'
    };
  }

  const contagens = new Map();

  lista.forEach((registro) => {
    const chave = String(registro?.[campo] || 'Nao informado').trim() || 'Nao informado';
    contagens.set(chave, (contagens.get(chave) || 0) + 1);
  });

  const [nomeCategoria, quantidade] = [...contagens.entries()]
    .sort((itemA, itemB) => {
      if (itemB[1] !== itemA[1]) {
        return itemB[1] - itemA[1];
      }

      return itemA[0].localeCompare(itemB[0]);
    })[0];

  const percentual = (quantidade / lista.length) * 100;

  return {
    valorExibicao: `${formatarPercentualResumo(percentual)} ${nomeCategoria}`
  };
}

function formatarPercentualResumo(valor) {
  return `${Number(valor || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  })}%`;
}

function enriquecerAtendimentosRelatorio(
  atendimentos,
  clientes,
  contatos,
  usuarios,
  tiposAtendimento,
  canaisAtendimento,
  origensAtendimento,
  gruposEmpresa = []
) {
  const clientesPorId = new Map(
    (clientes || []).map((cliente) => [
      cliente.idCliente,
      {
        nome: cliente.nomeFantasia || cliente.razaoSocial || `Cliente #${cliente.idCliente}`,
        idGrupoEmpresa: cliente.idGrupoEmpresa,
        nomeGrupoEmpresa: obterNomeGrupoEmpresaPorId(gruposEmpresa, cliente.idGrupoEmpresa)
      }
    ])
  );
  const contatosPorId = new Map(
    (contatos || []).map((contato) => [contato.idContato, contato.nome])
  );
  const usuariosPorId = new Map(
    (usuarios || []).map((usuario) => [usuario.idUsuario, usuario.nome])
  );
  const tiposAtendimentoPorId = new Map(
    (tiposAtendimento || []).map((tipoAtendimento) => [tipoAtendimento.idTipoAtendimento, tipoAtendimento.descricao])
  );
  const canaisPorId = new Map(
    (canaisAtendimento || []).map((canal) => [canal.idCanalAtendimento, canal.descricao])
  );
  const origensPorId = new Map(
    (origensAtendimento || []).map((origem) => [origem.idOrigemAtendimento, origem.descricao])
  );

  return [...(atendimentos || [])]
    .map((atendimento) => ({
      ...atendimento,
      nomeCliente: clientesPorId.get(atendimento.idCliente)?.nome || atendimento.nomeClienteSnapshot || 'Nao informado',
      idGrupoEmpresa: clientesPorId.get(atendimento.idCliente)?.idGrupoEmpresa || null,
      nomeGrupoEmpresa: clientesPorId.get(atendimento.idCliente)?.nomeGrupoEmpresa || 'Sem grupo',
      nomeContato: contatosPorId.get(atendimento.idContato) || atendimento.nomeContatoSnapshot || '',
      nomeUsuario: usuariosPorId.get(atendimento.idUsuario) || 'Nao informado',
      nomeTipoAtendimento: tiposAtendimentoPorId.get(atendimento.idTipoAtendimento) || 'Nao informado',
      nomeCanalAtendimento: canaisPorId.get(atendimento.idCanalAtendimento) || 'Nao informado',
      nomeOrigemAtendimento: origensPorId.get(atendimento.idOrigemAtendimento) || 'Nao informado'
    }))
    .sort(ordenarAtendimentosMaisRecentes);
}

function ordenarAtendimentosMaisRecentes(atendimentoA, atendimentoB) {
  const dataHoraA = `${atendimentoA.data || ''}T${atendimentoA.horaInicio || '00:00'}`;
  const dataHoraB = `${atendimentoB.data || ''}T${atendimentoB.horaInicio || '00:00'}`;

  return new Date(dataHoraB).getTime() - new Date(dataHoraA).getTime();
}

function normalizarFiltrosAtendimentosRelatorio(filtros = {}) {
  const idCliente = normalizarIdentificadorFiltro(filtros.idCliente);
  const idsUsuarios = normalizarListaIdentificadoresFiltro(filtros.idsUsuarios);
  const idsGruposEmpresa = normalizarListaIdentificadoresFiltro(filtros.idsGruposEmpresa);
  const idsTiposAtendimento = normalizarListaIdentificadoresFiltro(filtros.idsTiposAtendimento);
  const idsCanaisAtendimento = normalizarListaIdentificadoresFiltro(filtros.idsCanaisAtendimento);
  const idsOrigensAtendimento = normalizarListaIdentificadoresFiltro(filtros.idsOrigensAtendimento);
  const dataInicio = normalizarDataFiltro(filtros.dataInicio);
  const dataFim = normalizarDataFiltro(filtros.dataFim);
  const periodo = ordenarPeriodo(dataInicio, dataFim);

  return {
    idCliente,
    idsUsuarios,
    idsGruposEmpresa,
    idsTiposAtendimento,
    idsCanaisAtendimento,
    idsOrigensAtendimento,
    dataInicio: periodo.dataInicio,
    dataFim: periodo.dataFim
  };
}

function possuiFiltrosAtendimentosAtivos(filtros = {}) {
  return Boolean(
    filtros.idCliente
    || (Array.isArray(filtros.idsUsuarios) && filtros.idsUsuarios.length > 0)
    || (Array.isArray(filtros.idsGruposEmpresa) && filtros.idsGruposEmpresa.length > 0)
    || (Array.isArray(filtros.idsTiposAtendimento) && filtros.idsTiposAtendimento.length > 0)
    || (Array.isArray(filtros.idsCanaisAtendimento) && filtros.idsCanaisAtendimento.length > 0)
    || (Array.isArray(filtros.idsOrigensAtendimento) && filtros.idsOrigensAtendimento.length > 0)
    || filtros.dataInicio
    || filtros.dataFim
  );
}

function montarChipsFiltrosAtendimentosRelatorio(filtros, {
  clientes,
  usuarios,
  tiposAtendimento,
  canaisAtendimento,
  origensAtendimento,
  gruposEmpresa
}) {
  const chips = [];

  if (filtros.idCliente) {
    const cliente = clientes.find((item) => String(item.idCliente) === String(filtros.idCliente));
    chips.push({
      id: 'cliente',
      rotulo: `Cliente: ${cliente?.nomeFantasia || cliente?.razaoSocial || `#${filtros.idCliente}`}`
    });
  }

  if (Array.isArray(filtros.idsUsuarios) && filtros.idsUsuarios.length > 0) {
    filtros.idsUsuarios.forEach((idUsuario) => {
      const usuario = usuarios.find((item) => String(item.idUsuario) === String(idUsuario));
      chips.push({
        id: `usuario-${idUsuario}`,
        rotulo: `Usuario: ${usuario?.nome || `#${idUsuario}`}`
      });
    });
  }

  if (Array.isArray(filtros.idsGruposEmpresa) && filtros.idsGruposEmpresa.length > 0) {
    filtros.idsGruposEmpresa.forEach((idGrupoEmpresa) => {
      const grupo = gruposEmpresa.find((item) => String(item.idGrupoEmpresa) === String(idGrupoEmpresa));
      chips.push({
        id: `grupo-empresa-${idGrupoEmpresa}`,
        rotulo: `Grupo de empresa: ${grupo?.descricao || `#${idGrupoEmpresa}`}`
      });
    });
  }

  if (Array.isArray(filtros.idsCanaisAtendimento) && filtros.idsCanaisAtendimento.length > 0) {
    filtros.idsCanaisAtendimento.forEach((idCanalAtendimento) => {
      const canal = canaisAtendimento.find((item) => String(item.idCanalAtendimento) === String(idCanalAtendimento));
      chips.push({
        id: `canal-${idCanalAtendimento}`,
        rotulo: `Canal: ${canal?.descricao || `#${idCanalAtendimento}`}`
      });
    });
  }

  if (Array.isArray(filtros.idsTiposAtendimento) && filtros.idsTiposAtendimento.length > 0) {
    filtros.idsTiposAtendimento.forEach((idTipoAtendimento) => {
      const tipoAtendimento = tiposAtendimento.find((item) => String(item.idTipoAtendimento) === String(idTipoAtendimento));
      chips.push({
        id: `tipo-atendimento-${idTipoAtendimento}`,
        rotulo: `Tipo: ${tipoAtendimento?.descricao || `#${idTipoAtendimento}`}`
      });
    });
  }

  if (Array.isArray(filtros.idsOrigensAtendimento) && filtros.idsOrigensAtendimento.length > 0) {
    filtros.idsOrigensAtendimento.forEach((idOrigemAtendimento) => {
      const origem = origensAtendimento.find((item) => String(item.idOrigemAtendimento) === String(idOrigemAtendimento));
      chips.push({
        id: `origem-${idOrigemAtendimento}`,
        rotulo: `Origem: ${origem?.descricao || `#${idOrigemAtendimento}`}`
      });
    });
  }

  if (filtros.dataInicio || filtros.dataFim) {
    chips.push({
      id: 'periodo-data',
      rotulo: `Data: ${montarResumoPeriodoIndividual(filtros.dataInicio, filtros.dataFim)}`
    });
  }

  return chips;
}

function obterFiltrosPadraoAtendimentos() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  return {
    idCliente: '',
    idsUsuarios: [],
    idsGruposEmpresa: [],
    idsTiposAtendimento: [],
    idsCanaisAtendimento: [],
    idsOrigensAtendimento: [],
    dataInicio: formatarDataInput(inicioMes),
    dataFim: formatarDataInput(fimMes)
  };
}

function filtrarAtendimentosRelatorio(atendimentos, filtros) {
  return (atendimentos || []).filter((atendimento) => (
    validarPeriodoData(atendimento.data, filtros.dataInicio, filtros.dataFim)
    && (!filtros.idCliente || String(atendimento.idCliente || '') === String(filtros.idCliente))
    && (
      !Array.isArray(filtros.idsUsuarios)
      || filtros.idsUsuarios.length === 0
      || filtros.idsUsuarios.map(String).includes(String(atendimento.idUsuario || ''))
    )
    && (
      !Array.isArray(filtros.idsGruposEmpresa)
      || filtros.idsGruposEmpresa.length === 0
      || filtros.idsGruposEmpresa.map(String).includes(String(atendimento.idGrupoEmpresa || ''))
    )
    && (
      !Array.isArray(filtros.idsTiposAtendimento)
      || filtros.idsTiposAtendimento.length === 0
      || filtros.idsTiposAtendimento.map(String).includes(String(atendimento.idTipoAtendimento || ''))
    )
    && (
      !Array.isArray(filtros.idsCanaisAtendimento)
      || filtros.idsCanaisAtendimento.length === 0
      || filtros.idsCanaisAtendimento.map(String).includes(String(atendimento.idCanalAtendimento || ''))
    )
    && (
      !Array.isArray(filtros.idsOrigensAtendimento)
      || filtros.idsOrigensAtendimento.length === 0
      || filtros.idsOrigensAtendimento.map(String).includes(String(atendimento.idOrigemAtendimento || ''))
    )
  ));
}

function montarCardsConversao(orcamentos) {
  const totalGerados = Array.isArray(orcamentos) ? orcamentos.length : 0;
  const totalFechados = (Array.isArray(orcamentos) ? orcamentos : []).filter((orcamento) => etapaOrcamentoEhFechadoPorId(orcamento.idEtapaOrcamento)).length;
  const totalCancelados = (Array.isArray(orcamentos) ? orcamentos : []).filter((orcamento) => etapaOrcamentoEhRecusadoPorId(orcamento.idEtapaOrcamento)).length;
  const totalEmAberto = Math.max(0, totalGerados - totalFechados);
  const conversao = totalGerados > 0 ? (totalFechados / totalGerados) * 100 : 0;
  const perda = totalGerados > 0 ? (totalCancelados / totalGerados) * 100 : 0;

  return [
    {
      titulo: 'Orcamentos gerados',
      valor: String(totalGerados)
    },
    {
      titulo: 'Orcamentos fechados',
      valor: String(totalFechados)
    },
    {
      titulo: 'Conversao',
      valor: formatarPercentualResumo(conversao)
    },
    {
      titulo: 'Orcamentos cancelados',
      valor: String(totalCancelados)
    },
    {
      titulo: '% Perca',
      valor: formatarPercentualResumo(perda)
    },
    {
      titulo: 'Orcamentos em aberto',
      valor: String(totalEmAberto)
    }
  ];
}

function normalizarFiltrosConversao(filtros = {}) {
  const idCliente = normalizarIdentificadorFiltro(filtros.idCliente);
  const idUsuario = normalizarListaIdentificadoresFiltro(filtros.idUsuario);
  const idVendedorCliente = normalizarListaIdentificadoresFiltro(filtros.idVendedorCliente);
  const idVendedor = normalizarListaIdentificadoresFiltro(filtros.idVendedor);
  const idsGruposEmpresa = normalizarListaIdentificadoresFiltro(filtros.idsGruposEmpresa);
  const idsGruposProduto = normalizarListaIdentificadoresFiltro(filtros.idsGruposProduto);
  const idsMarcas = normalizarListaIdentificadoresFiltro(filtros.idsMarcas);
  const idsEtapaOrcamento = normalizarListaIdentificadoresFiltro(filtros.idsEtapaOrcamento);
  const dataInclusaoInicio = normalizarDataFiltro(filtros.dataInclusaoInicio);
  const dataInclusaoFim = normalizarDataFiltro(filtros.dataInclusaoFim);
  const dataFechamentoInicio = normalizarDataFiltro(filtros.dataFechamentoInicio);
  const dataFechamentoFim = normalizarDataFiltro(filtros.dataFechamentoFim);
  const periodoInclusao = ordenarPeriodo(dataInclusaoInicio, dataInclusaoFim);
  const periodoFechamento = ordenarPeriodo(dataFechamentoInicio, dataFechamentoFim);

  return {
    idCliente,
    idUsuario,
    idVendedorCliente,
    idVendedor,
    idsGruposEmpresa,
    idsGruposProduto,
    idsMarcas,
    idsEtapaOrcamento,
    dataInclusaoInicio: periodoInclusao.dataInicio,
    dataInclusaoFim: periodoInclusao.dataFim,
    dataFechamentoInicio: periodoFechamento.dataInicio,
    dataFechamentoFim: periodoFechamento.dataFim
  };
}

function possuiFiltrosConversaoAtivos(filtros = {}) {
  return Boolean(
    filtros.idCliente
    || (Array.isArray(filtros.idUsuario) && filtros.idUsuario.length > 0)
    || (Array.isArray(filtros.idVendedorCliente) && filtros.idVendedorCliente.length > 0)
    || (Array.isArray(filtros.idVendedor) && filtros.idVendedor.length > 0)
    || (Array.isArray(filtros.idsGruposEmpresa) && filtros.idsGruposEmpresa.length > 0)
    || (Array.isArray(filtros.idsGruposProduto) && filtros.idsGruposProduto.length > 0)
    || (Array.isArray(filtros.idsMarcas) && filtros.idsMarcas.length > 0)
    || (Array.isArray(filtros.idsEtapaOrcamento) && filtros.idsEtapaOrcamento.length > 0)
    || filtros.dataInclusaoInicio
    || filtros.dataInclusaoFim
    || filtros.dataFechamentoInicio
    || filtros.dataFechamentoFim
  );
}

function montarChipsFiltrosConversao(filtros, {
  clientes,
  usuarios,
  vendedores,
  etapasOrcamento,
  gruposEmpresa,
  gruposProduto,
  marcas
}) {
  const chips = [];

  if (filtros.idCliente) {
    const cliente = clientes.find((item) => String(item.idCliente) === String(filtros.idCliente));
    chips.push({
      id: 'cliente',
      rotulo: `Cliente: ${cliente?.nomeFantasia || cliente?.razaoSocial || `#${filtros.idCliente}`}`
    });
  }

  if (Array.isArray(filtros.idUsuario) && filtros.idUsuario.length > 0) {
    filtros.idUsuario.forEach((idUsuario) => {
      const usuario = usuarios.find((item) => String(item.idUsuario) === String(idUsuario));
      chips.push({
        id: `usuario-${idUsuario}`,
        rotulo: `Usuario: ${usuario?.nome || `#${idUsuario}`}`
      });
    });
  }

  if (Array.isArray(filtros.idsGruposEmpresa) && filtros.idsGruposEmpresa.length > 0) {
    filtros.idsGruposEmpresa.forEach((idGrupoEmpresa) => {
      const grupo = gruposEmpresa.find((item) => String(item.idGrupoEmpresa) === String(idGrupoEmpresa));
      chips.push({
        id: `grupo-empresa-${idGrupoEmpresa}`,
        rotulo: `Grupo de empresa: ${grupo?.descricao || `#${idGrupoEmpresa}`}`
      });
    });
  }

  if (Array.isArray(filtros.idsGruposProduto) && filtros.idsGruposProduto.length > 0) {
    filtros.idsGruposProduto.forEach((idGrupoProduto) => {
      const grupo = gruposProduto.find((item) => String(item.idGrupo) === String(idGrupoProduto));
      chips.push({
        id: `grupo-produto-${idGrupoProduto}`,
        rotulo: `Grupo de produto: ${grupo?.descricao || `#${idGrupoProduto}`}`
      });
    });
  }

  if (Array.isArray(filtros.idsMarcas) && filtros.idsMarcas.length > 0) {
    filtros.idsMarcas.forEach((idMarca) => {
      const marca = marcas.find((item) => String(item.idMarca) === String(idMarca));
      chips.push({
        id: `marca-${idMarca}`,
        rotulo: `Marca: ${marca?.descricao || `#${idMarca}`}`
      });
    });
  }

  if (Array.isArray(filtros.idVendedorCliente) && filtros.idVendedorCliente.length > 0) {
    filtros.idVendedorCliente.forEach((idVendedorCliente) => {
      const vendedor = vendedores.find((item) => String(item.idVendedor) === String(idVendedorCliente));
      chips.push({
        id: `vendedor-cliente-${idVendedorCliente}`,
        rotulo: `Vendedor do cliente: ${vendedor?.nome || `#${idVendedorCliente}`}`
      });
    });
  }

  if (Array.isArray(filtros.idVendedor) && filtros.idVendedor.length > 0) {
    filtros.idVendedor.forEach((idVendedor) => {
      const vendedor = vendedores.find((item) => String(item.idVendedor) === String(idVendedor));
      chips.push({
        id: `vendedor-orcamento-${idVendedor}`,
        rotulo: `Vendedor do orcamento: ${vendedor?.nome || `#${idVendedor}`}`
      });
    });
  }

  if (Array.isArray(filtros.idsEtapaOrcamento) && filtros.idsEtapaOrcamento.length > 0) {
    filtros.idsEtapaOrcamento.forEach((idEtapaOrcamento) => {
      const etapa = etapasOrcamento.find((item) => String(item.idEtapaOrcamento) === String(idEtapaOrcamento));
      chips.push({
        id: `etapa-${idEtapaOrcamento}`,
        rotulo: `Etapa: ${etapa?.descricao || `#${idEtapaOrcamento}`}`
      });
    });
  }

  if (filtros.dataInclusaoInicio || filtros.dataInclusaoFim) {
    chips.push({
      id: 'periodo-inclusao',
      rotulo: `Inclusao: ${montarResumoPeriodoIndividual(filtros.dataInclusaoInicio, filtros.dataInclusaoFim)}`
    });
  }

  if (filtros.dataFechamentoInicio || filtros.dataFechamentoFim) {
    chips.push({
      id: 'periodo-fechamento',
      rotulo: `Fechamento: ${montarResumoPeriodoIndividual(filtros.dataFechamentoInicio, filtros.dataFechamentoFim)}`
    });
  }

  return chips;
}

function obterFiltrosPadraoConversao() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  return {
    idCliente: '',
    idUsuario: [],
    idVendedorCliente: [],
    idVendedor: [],
    idsGruposEmpresa: [],
    idsGruposProduto: [],
    idsMarcas: [],
    idsEtapaOrcamento: [],
    dataInclusaoInicio: formatarDataInput(inicioMes),
    dataInclusaoFim: formatarDataInput(fimMes),
    dataFechamentoInicio: '',
    dataFechamentoFim: ''
  };
}

function filtrarOrcamentosConversao(orcamentos, filtros) {
  return (orcamentos || []).filter((orcamento) => (
    (!filtros.idCliente || String(orcamento.idCliente || '') === String(filtros.idCliente))
    && (
      !Array.isArray(filtros.idUsuario)
      || filtros.idUsuario.length === 0
      || filtros.idUsuario.map(String).includes(String(orcamento.idUsuario || ''))
    )
    && (
      !Array.isArray(filtros.idVendedorCliente)
      || filtros.idVendedorCliente.length === 0
      || filtros.idVendedorCliente.map(String).includes(String(orcamento.idVendedorCliente || ''))
    )
    && (
      !Array.isArray(filtros.idVendedor)
      || filtros.idVendedor.length === 0
      || filtros.idVendedor.map(String).includes(String(orcamento.idVendedor || ''))
    )
    && (
      !Array.isArray(filtros.idsGruposEmpresa)
      || filtros.idsGruposEmpresa.length === 0
      || filtros.idsGruposEmpresa.map(String).includes(String(orcamento.idGrupoEmpresa || ''))
    )
    && (
      !Array.isArray(filtros.idsGruposProduto)
      || filtros.idsGruposProduto.length === 0
      || filtros.idsGruposProduto.some((idGrupo) => (orcamento.idsGruposProduto || []).includes(String(idGrupo)))
    )
    && (
      !Array.isArray(filtros.idsMarcas)
      || filtros.idsMarcas.length === 0
      || filtros.idsMarcas.some((idMarca) => (orcamento.idsMarcas || []).includes(String(idMarca)))
    )
    && (
      !Array.isArray(filtros.idsEtapaOrcamento)
      || filtros.idsEtapaOrcamento.length === 0
      || filtros.idsEtapaOrcamento.includes(String(orcamento.idEtapaOrcamento || ''))
    )
    && validarPeriodoData(orcamento.dataInclusao, filtros.dataInclusaoInicio, filtros.dataInclusaoFim)
    && validarPeriodoData(orcamento.dataFechamento, filtros.dataFechamentoInicio, filtros.dataFechamentoFim)
  ));
}

function enriquecerOrcamentosConversao(
  orcamentos,
  clientes,
  contatos,
  usuarios,
  vendedores,
  etapasOrcamento,
  produtos = [],
  gruposEmpresa = [],
  gruposProduto = [],
  marcas = []
) {
  const clientesPorId = new Map(
    (clientes || []).map((cliente) => [
      cliente.idCliente,
      {
        nome: cliente.nomeFantasia || cliente.razaoSocial || `Cliente #${cliente.idCliente}`,
        idVendedor: cliente.idVendedor,
        idGrupoEmpresa: cliente.idGrupoEmpresa,
        nomeGrupoEmpresa: obterNomeGrupoEmpresaPorId(gruposEmpresa, cliente.idGrupoEmpresa)
      }
    ])
  );
  const contatosPorId = new Map(
    (contatos || []).map((contato) => [contato.idContato, contato.nome])
  );
  const usuariosPorId = new Map(
    (usuarios || []).map((usuario) => [usuario.idUsuario, usuario.nome])
  );
  const vendedoresPorId = new Map(
    (vendedores || []).map((vendedor) => [vendedor.idVendedor, vendedor.nome])
  );
  const etapasPorId = new Map(
    (etapasOrcamento || []).map((etapa) => [etapa.idEtapaOrcamento, etapa])
  );
  const produtosPorId = new Map(
    (produtos || []).map((produto) => [
      produto.idProduto,
      {
        idGrupo: produto.idGrupo,
        nomeGrupoProduto: obterNomeGrupoProdutoPorId(gruposProduto, produto.idGrupo),
        idMarca: produto.idMarca,
        nomeMarca: obterNomeMarcaPorId(marcas, produto.idMarca)
      }
    ])
  );

  return [...(orcamentos || [])]
    .map((orcamento) => {
      const cliente = clientesPorId.get(orcamento.idCliente);
      const idEtapaOrcamentoNormalizado = normalizarIdEtapaOrcamentoConversao(orcamento.idEtapaOrcamento, etapasOrcamento);
      const totalOrcamento = Array.isArray(orcamento.itens)
        ? orcamento.itens.reduce((total, item) => total + (Number(item.valorTotal) || 0), 0)
        : 0;

      return {
        ...orcamento,
        idEtapaOrcamento: idEtapaOrcamentoNormalizado,
        nomeCliente: cliente?.nome || 'Nao informado',
        idGrupoEmpresa: cliente?.idGrupoEmpresa || null,
        nomeGrupoEmpresa: cliente?.nomeGrupoEmpresa || 'Sem grupo',
        nomeContato: contatosPorId.get(orcamento.idContato) || '',
        idVendedorCliente: cliente?.idVendedor || null,
        nomeUsuario: usuariosPorId.get(orcamento.idUsuario) || 'Nao informado',
        nomeVendedor: vendedoresPorId.get(orcamento.idVendedor) || 'Nao informado',
        idsGruposProduto: Array.from(new Set(
          (Array.isArray(orcamento.itens) ? orcamento.itens : [])
            .map((item) => produtosPorId.get(item.idProduto)?.idGrupo)
            .filter((valor) => valor !== null && valor !== undefined && valor !== '')
            .map(String)
        )),
        idsMarcas: Array.from(new Set(
          (Array.isArray(orcamento.itens) ? orcamento.itens : [])
            .map((item) => produtosPorId.get(item.idProduto)?.idMarca)
            .filter((valor) => valor !== null && valor !== undefined && valor !== '')
            .map(String)
        )),
        nomeEtapaOrcamento: etapasPorId.get(idEtapaOrcamentoNormalizado)?.descricao || '',
        corEtapaOrcamento: etapasPorId.get(idEtapaOrcamentoNormalizado)?.cor || '',
        obrigarMotivoPerdaEtapa: Boolean(etapasPorId.get(idEtapaOrcamentoNormalizado)?.obrigarMotivoPerda),
        totalOrcamento
      };
    })
    .sort((orcamentoA, orcamentoB) => {
      const dataA = normalizarDataFiltro(orcamentoA.dataInclusao);
      const dataB = normalizarDataFiltro(orcamentoB.dataInclusao);

      if (dataA !== dataB) {
        return dataB.localeCompare(dataA);
      }

      return Number(orcamentoB.idOrcamento || 0) - Number(orcamentoA.idOrcamento || 0);
    });
}

function obterNomeGrupoEmpresaPorId(gruposEmpresa, idGrupoEmpresa) {
  const grupo = (gruposEmpresa || []).find((item) => String(item.idGrupoEmpresa) === String(idGrupoEmpresa || ''));
  return grupo?.descricao || 'Sem grupo';
}

function obterNomeGrupoProdutoPorId(gruposProduto, idGrupo) {
  const grupo = (gruposProduto || []).find((item) => String(item.idGrupo) === String(idGrupo || ''));
  return grupo?.descricao || 'Sem grupo';
}

function obterNomeMarcaPorId(marcas, idMarca) {
  const marca = (marcas || []).find((item) => String(item.idMarca) === String(idMarca || ''));
  return marca?.descricao || 'Sem marca';
}

function ordenarEtapasPorOrdem(etapas, chaveId) {
  if (!Array.isArray(etapas)) {
    return [];
  }

  return [...etapas].sort((etapaA, etapaB) => {
    const ordemA = obterValorOrdemEtapa(etapaA?.ordem, etapaA?.[chaveId]);
    const ordemB = obterValorOrdemEtapa(etapaB?.ordem, etapaB?.[chaveId]);

    if (ordemA !== ordemB) {
      return ordemA - ordemB;
    }

    return Number(etapaA?.[chaveId] || 0) - Number(etapaB?.[chaveId] || 0);
  });
}

function obterValorOrdemEtapa(ordem, fallback) {
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

function etapaOrcamentoEhFechadoPorId(idEtapaOrcamento) {
  return [1, 2, 3, 4].includes(Number(idEtapaOrcamento));
}

function etapaOrcamentoEhRecusadoPorId(idEtapaOrcamento) {
  return Number(idEtapaOrcamento) === 4;
}

function normalizarEtapasOrcamentoConversao(etapas) {
  if (!Array.isArray(etapas)) {
    return [];
  }

  const etapasNormalizadas = [];
  let recusadoInserido = false;

  etapas.forEach((etapa) => {
    if (etapaOrcamentoEhRecusado(etapa)) {
      if (!recusadoInserido) {
        etapasNormalizadas.push({
          ...etapa,
          idEtapaOrcamento: 4,
          descricao: 'Recusado',
          cor: etapa.cor || '#E5E7EB',
          obrigarMotivoPerda: 1,
          consideraFunilVendas: 0,
          ordem: 4,
          status: 1
        });
        recusadoInserido = true;
      }

      return;
    }

    etapasNormalizadas.push(etapa);
  });

  return etapasNormalizadas;
}

function normalizarIdEtapaOrcamentoConversao(idEtapaOrcamento, etapasOrcamento) {
  const etapa = (etapasOrcamento || []).find((item) => String(item.idEtapaOrcamento) === String(idEtapaOrcamento || ''));

  return etapaOrcamentoEhRecusado(etapa || { idEtapaOrcamento }) ? 4 : Number(idEtapaOrcamento || 0);
}

function etapaOrcamentoEhRecusado(etapa) {
  const descricao = String(etapa?.descricao || '').trim().toLowerCase();

  return Number(etapa?.idEtapaOrcamento) === 4 || descricao === 'recusado';
}

