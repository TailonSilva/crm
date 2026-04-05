import { useEffect, useMemo, useState } from 'react';
import '../../recursos/estilos/cabecalhoPagina.css';
import { AcoesRegistro } from '../../componentes/comuns/acoesRegistro';
import { Botao } from '../../componentes/comuns/botao';
import { CampoPesquisa } from '../../componentes/comuns/campoPesquisa';
import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';
import { GradePadrao } from '../../componentes/comuns/gradePadrao';
import { ModalBuscaClientes } from '../../componentes/comuns/modalBuscaClientes';
import { ModalFiltros } from '../../componentes/comuns/modalFiltros';
import { TextoGradeClamp } from '../../componentes/comuns/textoGradeClamp';
import { CorpoPagina } from '../../componentes/layout/corpoPagina';
import { listarClientes, listarContatos, listarVendedores } from '../../servicos/clientes';
import {
  atualizarPrazoPagamento,
  incluirPrazoPagamento,
  listarCamposPedidoConfiguracao,
  listarEtapasPedidoConfiguracao,
  listarCamposOrcamentoConfiguracao,
  listarEtapasOrcamentoConfiguracao,
  listarMetodosPagamentoConfiguracao,
  listarMotivosPerdaConfiguracao,
  listarPrazosPagamentoConfiguracao
} from '../../servicos/configuracoes';
import { incluirPedido } from '../../servicos/pedidos';
import {
  listarOrcamentos,
  atualizarOrcamento,
  excluirOrcamento,
  incluirOrcamento
} from '../../servicos/orcamentos';
import { listarEmpresas } from '../../servicos/empresa';
import { listarProdutos } from '../../servicos/produtos';
import { listarUsuarios } from '../../servicos/usuarios';
import {
  normalizarColunasGridOrcamentos,
  TOTAL_COLUNAS_GRID_ORCAMENTOS
} from '../../utilitarios/colunasGridOrcamentos';
import { normalizarPreco } from '../../utilitarios/normalizarPreco';
import { obterValorGrid } from '../../utilitarios/valorPadraoGrid';
import {
  normalizarFiltrosPorPadrao,
  normalizarListaFiltroPersistido,
  useFiltrosPersistidos
} from '../../utilitarios/useFiltrosPersistidos';
import { ModalOrcamento } from './modalOrcamento';
import { ModalManualOrcamentos } from './modalManualOrcamentos';
import { ModalPedido } from '../pedidos/modalPedido';

function criarFiltrosIniciaisOrcamentos(usuarioLogado, empresa = null) {
  return {
    idCliente: '',
    idUsuario: [],
    idVendedorCliente: [],
    idVendedor: usuarioLogado?.idVendedor ? [String(usuarioLogado.idVendedor)] : [],
    idsEtapaOrcamento: obterEtapasFiltroPadraoOrcamento(empresa),
    dataInclusaoInicio: '',
    dataInclusaoFim: '',
    dataFechamentoInicio: '',
    dataFechamentoFim: ''
  };
}

  const ID_ETAPA_ORCAMENTO_FECHAMENTO = 1;
  const ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO = 2;
  const ID_ETAPA_ORCAMENTO_PEDIDO_EXCLUIDO = 3;

function criarFiltrosLimposOrcamentos(usuarioLogado, empresa = null) {
  return {
    idCliente: '',
    idUsuario: [],
    idVendedorCliente: [],
    idVendedor: usuarioLogado?.idVendedor ? [String(usuarioLogado.idVendedor)] : [],
    idsEtapaOrcamento: obterEtapasFiltroPadraoOrcamento(empresa),
    dataInclusaoInicio: '',
    dataInclusaoFim: '',
    dataFechamentoInicio: '',
    dataFechamentoFim: ''
  };
}

export function PaginaOrcamentos({ usuarioLogado }) {
  const [pesquisa, definirPesquisa] = useState('');
  const [orcamentos, definirOrcamentos] = useState([]);
  const [clientes, definirClientes] = useState([]);
  const [contatos, definirContatos] = useState([]);
  const [usuarios, definirUsuarios] = useState([]);
  const [vendedores, definirVendedores] = useState([]);
  const [metodosPagamento, definirMetodosPagamento] = useState([]);
  const [prazosPagamento, definirPrazosPagamento] = useState([]);
  const [etapasOrcamento, definirEtapasOrcamento] = useState([]);
  const [motivosPerda, definirMotivosPerda] = useState([]);
  const [produtos, definirProdutos] = useState([]);
  const [camposOrcamento, definirCamposOrcamento] = useState([]);
  const [camposPedido, definirCamposPedido] = useState([]);
  const [etapasPedido, definirEtapasPedido] = useState([]);
  const [empresa, definirEmpresa] = useState(null);
  const [carregandoContexto, definirCarregandoContexto] = useState(true);
  const [carregandoGrade, definirCarregandoGrade] = useState(true);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [modalAberto, definirModalAberto] = useState(false);
  const [modalManualAberto, definirModalManualAberto] = useState(false);
  const [modalFiltrosAberto, definirModalFiltrosAberto] = useState(false);
  const [modalBuscaClienteFiltrosAberto, definirModalBuscaClienteFiltrosAberto] = useState(false);
  const [filtrosEmEdicao, definirFiltrosEmEdicao] = useState(null);
  const [orcamentoSelecionado, definirOrcamentoSelecionado] = useState(null);
  const [orcamentoExclusaoPendente, definirOrcamentoExclusaoPendente] = useState(null);
  const [alteracaoEtapaPendente, definirAlteracaoEtapaPendente] = useState(null);
  const [motivoPerdaEtapaRapida, definirMotivoPerdaEtapaRapida] = useState('');
  const [orcamentoPedidoPendente, definirOrcamentoPedidoPendente] = useState(null);
  const [orcamentoPedidoEmCriacao, definirOrcamentoPedidoEmCriacao] = useState(null);
  const [dadosIniciaisPedido, definirDadosIniciaisPedido] = useState(null);
  const [modalPedidoAberto, definirModalPedidoAberto] = useState(false);
  const [modoModal, definirModoModal] = useState('novo');
  const usuarioSomenteVendedor = usuarioLogado?.tipo === 'Usuario padrao' && usuarioLogado?.idVendedor;
  const usuarioSomenteConsultaConfiguracao = usuarioLogado?.tipo === 'Usuario padrao';
  const permitirExcluir = usuarioLogado?.tipo !== 'Usuario padrao';
  const filtrosIniciais = useMemo(
    () => criarFiltrosIniciaisOrcamentos(usuarioLogado, empresa),
    [usuarioLogado?.idUsuario, usuarioLogado?.idVendedor, empresa?.etapasFiltroPadraoOrcamento]
  );
  const [filtros, definirFiltros] = useFiltrosPersistidos({
    chave: 'paginaOrcamentos',
    usuario: usuarioLogado,
    filtrosPadrao: filtrosIniciais,
    normalizarFiltros: normalizarFiltrosOrcamentos
  });

  useEffect(() => {
    carregarContexto();
  }, [usuarioSomenteVendedor, usuarioLogado?.idVendedor]);

  useEffect(() => {
    carregarGradeOrcamentos();
  }, [usuarioSomenteVendedor, usuarioLogado?.idVendedor, usuarioLogado?.idUsuario, pesquisa, JSON.stringify(filtros)]);

  useEffect(() => {
    function tratarGrupoEmpresaAtualizado() {
      carregarContexto();
      carregarGradeOrcamentos();
    }

    window.addEventListener('grupo-empresa-atualizado', tratarGrupoEmpresaAtualizado);

    return () => {
      window.removeEventListener('grupo-empresa-atualizado', tratarGrupoEmpresaAtualizado);
    };
  }, [usuarioSomenteVendedor, usuarioLogado?.idVendedor, usuarioLogado?.idUsuario, pesquisa, JSON.stringify(filtros)]);

  useEffect(() => {
    function tratarEmpresaAtualizada() {
      carregarContexto();
      carregarGradeOrcamentos();
    }

    window.addEventListener('empresa-atualizada', tratarEmpresaAtualizada);

    return () => {
      window.removeEventListener('empresa-atualizada', tratarEmpresaAtualizada);
    };
  }, [usuarioSomenteVendedor, usuarioLogado?.idVendedor]);

  useEffect(() => {
    function tratarAtalhosOrcamentos(evento) {
      if (evento.key !== 'F1') {
        return;
      }

      evento.preventDefault();

      if (
        !modalAberto
        && !modalManualAberto
        && !modalFiltrosAberto
        && !modalPedidoAberto
        && !orcamentoExclusaoPendente
        && !alteracaoEtapaPendente
        && !orcamentoPedidoPendente
        && !orcamentoPedidoEmCriacao
      ) {
        definirModalManualAberto(true);
      }
    }

    window.addEventListener('keydown', tratarAtalhosOrcamentos);

    return () => {
      window.removeEventListener('keydown', tratarAtalhosOrcamentos);
    };
  }, [
    alteracaoEtapaPendente,
    modalAberto,
    modalManualAberto,
    modalFiltrosAberto,
    modalPedidoAberto,
    orcamentoExclusaoPendente,
    orcamentoPedidoEmCriacao,
    orcamentoPedidoPendente
  ]);

  async function carregarContexto() {
    definirCarregandoContexto(true);
    definirMensagemErro('');

    try {
      const [
        clientesCarregados,
        contatosCarregados,
        usuariosCarregados,
        vendedoresCarregados,
        metodosCarregados,
        prazosCarregados,
        etapasCarregadas,
        motivosPerdaCarregados,
        produtosCarregados,
        camposCarregados,
        camposPedidoCarregados,
        etapasPedidoCarregadas,
        empresasCarregadas
      ] = await Promise.all([
        listarClientes(),
        listarContatos(),
        listarUsuarios(),
        listarVendedores(),
        listarMetodosPagamentoConfiguracao(),
        listarPrazosPagamentoConfiguracao(),
        listarEtapasOrcamentoConfiguracao(),
        listarMotivosPerdaConfiguracao(),
        listarProdutos(),
        listarCamposOrcamentoConfiguracao(),
        listarCamposPedidoConfiguracao(),
        listarEtapasPedidoConfiguracao(),
        listarEmpresas()
      ]);

      const clientesCarteira = usuarioSomenteVendedor
        ? clientesCarregados.filter((cliente) => cliente.idVendedor === usuarioLogado.idVendedor)
        : clientesCarregados;
      const etapasCarregadasOrdenadas = ordenarEtapasPorOrdem(etapasCarregadas, 'idEtapaOrcamento');
      const clientesDisponiveis = usuarioSomenteVendedor ? clientesCarteira : clientesCarregados;
      const idsClientesDisponiveis = new Set(clientesDisponiveis.map((cliente) => cliente.idCliente));

      definirClientes(clientesDisponiveis);
      definirContatos(contatosCarregados.filter((contato) => idsClientesDisponiveis.has(contato.idCliente)));
      definirUsuarios(usuariosCarregados);
      definirVendedores(vendedoresCarregados);
      definirMetodosPagamento(metodosCarregados);
      definirPrazosPagamento(enriquecerPrazosPagamento(prazosCarregados, metodosCarregados));
      definirEtapasOrcamento(etapasCarregadasOrdenadas);
      definirMotivosPerda(motivosPerdaCarregados);
      definirProdutos(produtosCarregados.filter((produto) => produto.status !== 0));
      definirCamposOrcamento(camposCarregados);
      definirCamposPedido(camposPedidoCarregados);
      definirEtapasPedido(etapasPedidoCarregadas);
      definirEmpresa(empresasCarregadas[0] || null);
    } catch (_erro) {
      definirMensagemErro('Nao foi possivel carregar os orcamentos.');
    } finally {
      definirCarregandoContexto(false);
    }
  }

  async function carregarGradeOrcamentos() {
    definirCarregandoGrade(true);
    definirMensagemErro('');

    try {
      const orcamentosCarregados = await listarOrcamentos({
        search: pesquisa,
        ...filtros,
        ...(usuarioSomenteVendedor
          ? {
            escopoIdVendedor: usuarioLogado?.idVendedor,
            escopoIdUsuario: usuarioLogado?.idUsuario
          }
          : {})
      });

      definirOrcamentos(
        enriquecerOrcamentos(
          orcamentosCarregados,
          clientes,
          contatos,
          usuarios,
          vendedores,
          prazosPagamento,
          etapasOrcamento,
          produtos,
          motivosPerda
        )
      );
    } catch (_erro) {
      definirMensagemErro('Nao foi possivel carregar os orcamentos.');
    } finally {
      definirCarregandoGrade(false);
    }
  }

  async function recarregarPagina() {
    await Promise.all([carregarContexto(), carregarGradeOrcamentos()]);
  }

  async function salvarOrcamento(dadosOrcamento) {
    const payload = normalizarPayloadOrcamento(dadosOrcamento, usuarioLogado);
    const etapaAnterior = orcamentoSelecionado?.idEtapaOrcamento || null;
    const etapaAtual = dadosOrcamento.idEtapaOrcamento || null;
    let registroSalvo = null;

    if (orcamentoSelecionado?.idOrcamento) {
      registroSalvo = await atualizarOrcamento(orcamentoSelecionado.idOrcamento, payload);
    } else {
      registroSalvo = await incluirOrcamento(payload);
    }

    await recarregarPagina();
    fecharModal();

    if (etapaAcabouDeFechar(etapaAnterior, etapaAtual, etapasOrcamento) && !registroSalvo?.idPedidoVinculado) {
      const orcamentoEnriquecido = enriquecerOrcamentoParaPedido(
        registroSalvo || { ...dadosOrcamento, idOrcamento: orcamentoSelecionado?.idOrcamento },
        {
          clientes,
          contatos,
          usuarios,
          vendedores,
          prazosPagamento,
          etapasOrcamento,
          produtos
        }
      );

      const pendenciaPedido = {
        dadosPedido: montarDadosIniciaisPedidoAPartirDoOrcamento(orcamentoEnriquecido),
        idOrcamento: orcamentoEnriquecido.idOrcamento,
        idEtapaAnterior: etapaAnterior,
        idEtapaDestino: etapaAtual,
        etapaJaAtualizada: true
      };

      if (dadosOrcamento.solicitarPedidoAoSalvar) {
        definirOrcamentoPedidoEmCriacao(pendenciaPedido);
        definirDadosIniciaisPedido(pendenciaPedido.dadosPedido);
        definirModalPedidoAberto(true);
        return;
      }

      definirOrcamentoPedidoPendente(pendenciaPedido);
    }
  }

  async function salvarPrazoPagamento(dadosPrazo) {
    const payload = normalizarPayloadPrazoPagamento(dadosPrazo);
    const registroSalvo = dadosPrazo?.idPrazoPagamento
      ? await atualizarPrazoPagamento(dadosPrazo.idPrazoPagamento, payload)
      : await incluirPrazoPagamento(payload);

    await recarregarPagina();
    return enriquecerPrazoPagamento(registroSalvo, metodosPagamento);
  }

  async function inativarPrazoPagamento(prazo) {
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

    await recarregarPagina();
    return null;
  }

  async function alterarEtapaRapidamente(orcamento, idEtapaOrcamento, idMotivoPerda = null) {
    const payload = normalizarPayloadOrcamento(
      {
        ...orcamento,
        idEtapaOrcamento,
        idMotivoPerda,
        dataFechamento: entrouEmEtapaFechada(orcamento.idEtapaOrcamento, idEtapaOrcamento)
          ? obterDataAtualFormatoInput()
          : orcamento.dataFechamento
      },
      usuarioLogado
    );

    const registroAtualizado = await atualizarOrcamento(orcamento.idOrcamento, payload);
    await recarregarPagina();
    return registroAtualizado;
  }

  async function selecionarEtapaNoGrid(orcamento, proximoIdEtapa) {
    if (orcamento.idPedidoVinculado) {
      return;
    }

    const valorEtapa = String(proximoIdEtapa || '').trim();

    if (!valorEtapa || String(orcamento.idEtapaOrcamento || '') === valorEtapa) {
      return;
    }

    const etapaSelecionada = etapasOrcamento.find(
      (etapa) => String(etapa.idEtapaOrcamento) === valorEtapa
    );

    if (etapaSelecionada?.obrigarMotivoPerda && !String(orcamento.idMotivoPerda || '').trim()) {
      definirAlteracaoEtapaPendente({
        orcamento,
        idEtapaOrcamento: valorEtapa,
        nomeEtapa: etapaSelecionada.descricao
      });
      definirMotivoPerdaEtapaRapida('');
      return;
    }

    if (Number(valorEtapa) === ID_ETAPA_ORCAMENTO_FECHAMENTO) {
      const orcamentoEnriquecido = enriquecerOrcamentoParaPedido(
        orcamento,
        {
          clientes,
          contatos,
          usuarios,
          vendedores,
          prazosPagamento,
          etapasOrcamento,
          produtos
        }
      );

      definirOrcamentoPedidoPendente({
        dadosPedido: montarDadosIniciaisPedidoAPartirDoOrcamento(orcamentoEnriquecido),
        idOrcamento: orcamento.idOrcamento,
        idEtapaAnterior: orcamento.idEtapaOrcamento || null,
        idEtapaDestino: Number(valorEtapa),
        etapaJaAtualizada: false
      });
      return;
    }

    const registroAtualizado = await alterarEtapaRapidamente(
      orcamento,
      Number(valorEtapa),
      etapaSelecionada?.obrigarMotivoPerda ? orcamento.idMotivoPerda || null : null
    );

    if (etapaAcabouDeFechar(orcamento.idEtapaOrcamento, valorEtapa, etapasOrcamento) && !registroAtualizado?.idPedidoVinculado) {
      const orcamentoEnriquecido = enriquecerOrcamentoParaPedido(
        registroAtualizado || { ...orcamento, idEtapaOrcamento: Number(valorEtapa) },
        {
          clientes,
          contatos,
          usuarios,
          vendedores,
          prazosPagamento,
          etapasOrcamento,
          produtos
        }
      );

      definirOrcamentoPedidoPendente({
        dadosPedido: montarDadosIniciaisPedidoAPartirDoOrcamento(orcamentoEnriquecido),
        idOrcamento: orcamento.idOrcamento,
        idEtapaAnterior: orcamento.idEtapaOrcamento || null,
        idEtapaDestino: Number(valorEtapa),
        etapaJaAtualizada: true
      });
    }
  }

  function abrirNovoOrcamento() {
    definirOrcamentoSelecionado(null);
    definirModoModal('novo');
    definirModalAberto(true);
  }

  function abrirEdicaoOrcamento(orcamento) {
    if (orcamentoBloqueadoParaUsuarioPadrao(orcamento, usuarioLogado)) {
      abrirConsultaOrcamento(orcamento);
      return;
    }

    definirOrcamentoSelecionado(orcamento);
    definirModoModal('edicao');
    definirModalAberto(true);
  }

  function abrirConsultaOrcamento(orcamento) {
    definirOrcamentoSelecionado(orcamento);
    definirModoModal('consulta');
    definirModalAberto(true);
  }

  function fecharModal() {
    definirModalAberto(false);
    definirOrcamentoSelecionado(null);
    definirModoModal('novo');
  }

  function abrirModalFiltrosOrcamentos() {
    definirFiltrosEmEdicao({
      ...filtros,
      idUsuario: Array.isArray(filtros.idUsuario) ? [...filtros.idUsuario] : [],
      idVendedorCliente: Array.isArray(filtros.idVendedorCliente) ? [...filtros.idVendedorCliente] : [],
      idVendedor: Array.isArray(filtros.idVendedor) ? [...filtros.idVendedor] : [],
      idsEtapaOrcamento: Array.isArray(filtros.idsEtapaOrcamento) ? [...filtros.idsEtapaOrcamento] : []
    });
    definirModalFiltrosAberto(true);
  }

  function fecharModalFiltrosOrcamentos() {
    definirModalFiltrosAberto(false);
    definirFiltrosEmEdicao(null);
  }

  function abrirExclusaoOrcamento(orcamento) {
    if (!permitirExcluir || orcamento.idPedidoVinculado) {
      return;
    }

    definirOrcamentoExclusaoPendente(orcamento);
  }

  function cancelarExclusaoOrcamento() {
    definirOrcamentoExclusaoPendente(null);
  }

  async function confirmarExclusaoOrcamento() {
    if (!orcamentoExclusaoPendente) {
      return;
    }

    await excluirOrcamento(orcamentoExclusaoPendente.idOrcamento);
    definirOrcamentoExclusaoPendente(null);
    await recarregarPagina();
  }

  async function abrirPedidoAPartirDoOrcamento() {
    if (!orcamentoPedidoPendente) {
      return;
    }

    let pendenciaPedido = orcamentoPedidoPendente;

    if (!pendenciaPedido.etapaJaAtualizada && pendenciaPedido.idOrcamento && pendenciaPedido.idEtapaDestino) {
      const orcamentoAtual = orcamentos.find((item) => item.idOrcamento === pendenciaPedido.idOrcamento);

      if (!orcamentoAtual) {
        return;
      }

      const registroAtualizado = await alterarEtapaRapidamente(
        orcamentoAtual,
        Number(pendenciaPedido.idEtapaDestino),
        orcamentoAtual.idMotivoPerda || null
      );

      const orcamentoEnriquecido = enriquecerOrcamentoParaPedido(
        registroAtualizado || {
          ...orcamentoAtual,
          idEtapaOrcamento: Number(pendenciaPedido.idEtapaDestino)
        },
        {
          clientes,
          contatos,
          usuarios,
          vendedores,
          prazosPagamento,
          etapasOrcamento,
          produtos
        }
      );

      pendenciaPedido = {
        ...pendenciaPedido,
        dadosPedido: montarDadosIniciaisPedidoAPartirDoOrcamento(orcamentoEnriquecido),
        etapaJaAtualizada: true
      };
    }

    definirOrcamentoPedidoEmCriacao(pendenciaPedido);
    definirDadosIniciaisPedido(pendenciaPedido.dadosPedido);
    definirModalPedidoAberto(true);
    definirOrcamentoPedidoPendente(null);
  }

  async function cancelarCriacaoPedido() {
    const pendencia = orcamentoPedidoPendente || orcamentoPedidoEmCriacao;

    if (!pendencia?.idOrcamento) {
      definirOrcamentoPedidoPendente(null);
      definirOrcamentoPedidoEmCriacao(null);
      return;
    }

    const orcamentoAtual = orcamentos.find((item) => item.idOrcamento === pendencia.idOrcamento);
    const etapaFechadoSemPedido = obterEtapaFechadoSemPedido(etapasOrcamento);

    if (orcamentoAtual && etapaFechadoSemPedido?.idEtapaOrcamento) {
      await alterarEtapaRapidamente(
        orcamentoAtual,
        Number(etapaFechadoSemPedido.idEtapaOrcamento),
        orcamentoAtual.idMotivoPerda || null
      );
    } else {
      await recarregarPagina();
    }

    definirOrcamentoPedidoPendente(null);
    definirOrcamentoPedidoEmCriacao(null);
  }

  function fecharModalPedido() {
    definirModalPedidoAberto(false);
    definirDadosIniciaisPedido(null);
    if (orcamentoPedidoEmCriacao) {
      cancelarCriacaoPedido();
    }
  }

  async function salvarPedido(dadosPedido) {
    await incluirPedido(normalizarPayloadPedido(dadosPedido));
    await recarregarPagina();
    definirOrcamentoPedidoEmCriacao(null);
    fecharModalPedido();
  }

  const carregando = carregandoContexto || carregandoGrade;
  const colunasVisiveisOrcamentos = useMemo(
    () => normalizarColunasGridOrcamentos(empresa?.colunasGridOrcamentos),
    [empresa?.colunasGridOrcamentos]
  );
  const filtrosAtivos = JSON.stringify(filtros) !== JSON.stringify(filtrosIniciais);

  return (
    <>
      <header className="cabecalhoPagina">
        <div>
          <h1>Orcamentos</h1>
          <p>Cadastre, acompanhe e organize as propostas comerciais do CRM.</p>
        </div>

        <div className="acoesCabecalhoPagina">
          <CampoPesquisa
            valor={pesquisa}
            aoAlterar={definirPesquisa}
            placeholder="Pesquisar orcamentos"
            ariaLabel="Pesquisar orcamentos"
          />
          <Botao
            variante={filtrosAtivos ? 'primario' : 'secundario'}
            icone="filtro"
            somenteIcone
            title="Filtrar"
            aria-label="Filtrar"
            onClick={abrirModalFiltrosOrcamentos}
          />
          <Botao
            variante="primario"
            icone="adicionar"
            somenteIcone
            title="Novo orcamento"
            aria-label="Novo orcamento"
            onClick={abrirNovoOrcamento}
          />
        </div>
      </header>

      <CorpoPagina>
        <GradePadrao
          modo="layout"
          totalColunasLayout={TOTAL_COLUNAS_GRID_ORCAMENTOS}
          cabecalho={<CabecalhoGradeOrcamentos colunas={colunasVisiveisOrcamentos} />}
          carregando={carregando}
          mensagemErro={mensagemErro}
          temItens={orcamentos.length > 0}
          mensagemCarregando="Carregando orcamentos..."
          mensagemVazia="Nenhum orcamento encontrado."
        >
          {orcamentos.map((orcamento) => (
            <LinhaOrcamento
              key={orcamento.idOrcamento}
              orcamento={orcamento}
              colunas={colunasVisiveisOrcamentos}
              etapasOrcamento={etapasOrcamento}
              permitirExcluir={permitirExcluir}
              permitirEdicao={!orcamentoBloqueadoParaUsuarioPadrao(orcamento, usuarioLogado)}
              permitirAlteracaoEtapa={
                !orcamentoBloqueadoParaUsuarioPadrao(orcamento, usuarioLogado)
                && !orcamento.idPedidoVinculado
              }
              aoAlterarEtapa={(idEtapaOrcamento) => selecionarEtapaNoGrid(orcamento, idEtapaOrcamento)}
              aoConsultar={() => abrirConsultaOrcamento(orcamento)}
              aoEditar={() => abrirEdicaoOrcamento(orcamento)}
              aoExcluir={() => abrirExclusaoOrcamento(orcamento)}
            />
          ))}
        </GradePadrao>
      </CorpoPagina>

      <ModalFiltros
        aberto={modalFiltrosAberto}
        titulo="Filtros de orcamentos"
        filtros={filtrosEmEdicao || filtros}
        campos={[
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
            name: 'idUsuario',
            label: 'Usuario do registro',
            multiple: true,
            placeholder: 'Todos os usuarios',
            options: usuarios.map((usuario) => ({
              valor: String(usuario.idUsuario),
              label: usuario.nome
            }))
          },
          {
            name: 'idVendedorCliente',
            label: 'Clientes do vendedor',
            multiple: true,
            placeholder: 'Todos os vendedores',
            options: vendedores.map((vendedor) => ({
              valor: String(vendedor.idVendedor),
              label: vendedor.nome
            }))
          },
          {
            name: 'idVendedor',
            label: 'Vendedor do orcamento',
            multiple: true,
            placeholder: 'Todos os vendedores',
            options: vendedores.map((vendedor) => ({
              valor: String(vendedor.idVendedor),
              label: vendedor.nome
            }))
          },
          {
            name: 'idsEtapaOrcamento',
            label: 'Status do orcamento',
            multiple: true,
            tituloSelecao: 'Status do orcamento',
            options: etapasOrcamento.map((etapa) => ({
              valor: String(etapa.idEtapaOrcamento),
              label: etapa.descricao
            }))
          },
          {
            name: 'periodosDatasOrcamento',
            label: 'Datas',
            type: 'date-filters-modal',
            tituloSelecao: 'Filtros de datas do orcamento',
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
        aoFechar={fecharModalFiltrosOrcamentos}
        aoAplicar={(proximosFiltros) => {
          definirFiltros(proximosFiltros);
          fecharModalFiltrosOrcamentos();
        }}
        aoLimpar={() => definirFiltrosEmEdicao(criarFiltrosLimposOrcamentos(usuarioLogado, empresa))}
      />
      <ModalBuscaClientes
        aberto={modalBuscaClienteFiltrosAberto}
        empresa={empresa}
        clientes={clientes}
        placeholder="Pesquisar cliente no filtro"
        ariaLabelPesquisa="Pesquisar cliente no filtro"
        aoSelecionar={(cliente) => {
          definirFiltrosEmEdicao((estadoAtual) => ({
            ...(estadoAtual || criarFiltrosIniciaisOrcamentos(usuarioLogado, empresa)),
            idCliente: String(cliente.idCliente || '')
          }));
          definirModalBuscaClienteFiltrosAberto(false);
        }}
        aoFechar={() => definirModalBuscaClienteFiltrosAberto(false)}
      />

      <ModalOrcamento
        aberto={modalAberto}
        orcamento={orcamentoSelecionado}
        clientes={clientes}
        contatos={contatos}
        usuarios={usuarios}
        vendedores={vendedores}
        metodosPagamento={metodosPagamento}
        prazosPagamento={prazosPagamento}
        etapasOrcamento={etapasOrcamento}
        motivosPerda={motivosPerda}
        produtos={produtos}
        camposOrcamento={camposOrcamento}
        camposPedido={camposPedido}
        empresa={empresa}
        usuarioLogado={usuarioLogado}
        modo={modoModal}
        somenteConsultaPrazos={usuarioSomenteConsultaConfiguracao}
        aoFechar={fecharModal}
        aoSalvar={salvarOrcamento}
        aoSalvarPrazoPagamento={salvarPrazoPagamento}
        aoInativarPrazoPagamento={inativarPrazoPagamento}
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
        aoFechar={fecharModalPedido}
        aoSalvar={salvarPedido}
        aoSalvarPrazoPagamento={salvarPrazoPagamento}
        aoInativarPrazoPagamento={inativarPrazoPagamento}
      />

      <ModalManualOrcamentos
        aberto={modalManualAberto}
        aoFechar={() => definirModalManualAberto(false)}
        orcamentos={orcamentos}
        etapasOrcamento={etapasOrcamento}
        motivosPerda={motivosPerda}
        prazosPagamento={prazosPagamento}
        filtros={filtros}
        empresa={empresa}
        usuarioLogado={usuarioLogado}
      />

      {orcamentoExclusaoPendente ? (
        <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={cancelarExclusaoOrcamento}>
          <div
            className="modalConfirmacaoAgenda"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="tituloConfirmacaoExclusaoOrcamento"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <div className="cabecalhoConfirmacaoModal">
              <h4 id="tituloConfirmacaoExclusaoOrcamento">Excluir orcamento</h4>
            </div>

            <div className="corpoConfirmacaoModal">
              <p>Tem certeza que deseja excluir este orcamento?</p>
            </div>

            <div className="acoesConfirmacaoModal">
              <Botao variante="secundario" type="button" onClick={cancelarExclusaoOrcamento}>
                Nao
              </Botao>
              <Botao variante="perigo" type="button" onClick={confirmarExclusaoOrcamento}>
                Sim
              </Botao>
            </div>
          </div>
        </div>
      ) : null}

      {alteracaoEtapaPendente ? (
        <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={() => definirAlteracaoEtapaPendente(null)}>
          <div
            className="modalConfirmacaoAgenda modalEtapaRapidaOrcamento"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloMotivoPerdaEtapaRapida"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <div className="cabecalhoConfirmacaoModal">
              <h4 id="tituloMotivoPerdaEtapaRapida">Motivo da perda</h4>
            </div>

            <div className="corpoConfirmacaoModal corpoModalEtapaRapidaOrcamento">
              <p>
                A etapa <strong>{alteracaoEtapaPendente.nomeEtapa}</strong> exige um motivo da perda.
              </p>
              <div className="campoFormulario campoFormularioIntegral">
                <label htmlFor="motivoPerdaEtapaRapida">Selecione o motivo</label>
                <select
                  id="motivoPerdaEtapaRapida"
                  className="entradaFormulario"
                  value={motivoPerdaEtapaRapida}
                  onChange={(evento) => definirMotivoPerdaEtapaRapida(evento.target.value)}
                >
                  <option value="">Selecione</option>
                  {motivosPerda.map((motivo) => (
                    <option key={motivo.idMotivo} value={motivo.idMotivo}>
                      {motivo.descricao}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="acoesConfirmacaoModal">
              <Botao
                variante="secundario"
                type="button"
                onClick={() => {
                  definirAlteracaoEtapaPendente(null);
                  definirMotivoPerdaEtapaRapida('');
                }}
              >
                Cancelar
              </Botao>
              <Botao
                variante="primario"
                type="button"
                onClick={async () => {
                  if (!String(motivoPerdaEtapaRapida || '').trim()) {
                    return;
                  }

                  const alteracao = alteracaoEtapaPendente;
                  const motivoSelecionado = motivoPerdaEtapaRapida;
                  definirAlteracaoEtapaPendente(null);
                  definirMotivoPerdaEtapaRapida('');
                  const registroAtualizado = await alterarEtapaRapidamente(
                    alteracao.orcamento,
                    Number(alteracao.idEtapaOrcamento),
                    Number(motivoSelecionado)
                  );

                  if (etapaAcabouDeFechar(
                    alteracao.orcamento.idEtapaOrcamento,
                    alteracao.idEtapaOrcamento,
                    etapasOrcamento
                  ) && !registroAtualizado?.idPedidoVinculado) {
                    const orcamentoEnriquecido = enriquecerOrcamentoParaPedido(
                      registroAtualizado || {
                        ...alteracao.orcamento,
                        idEtapaOrcamento: Number(alteracao.idEtapaOrcamento),
                        idMotivoPerda: Number(motivoSelecionado)
                      },
                      {
                        clientes,
                        contatos,
                        usuarios,
                        vendedores,
                        prazosPagamento,
                        etapasOrcamento,
                        produtos
                      }
                    );

                    definirOrcamentoPedidoPendente({
                      dadosPedido: montarDadosIniciaisPedidoAPartirDoOrcamento(orcamentoEnriquecido),
                      idOrcamento: alteracao.orcamento.idOrcamento,
                      idEtapaAnterior: alteracao.orcamento.idEtapaOrcamento || null,
                      idEtapaDestino: Number(alteracao.idEtapaOrcamento),
                      etapaJaAtualizada: true
                    });
                  }
                }}
              >
                Confirmar
              </Botao>
            </div>
          </div>
        </div>
      ) : null}

      {orcamentoPedidoPendente ? (
        <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={cancelarCriacaoPedido}>
          <div
            className="modalConfirmacaoAgenda"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloConfirmacaoCriarPedido"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <div className="cabecalhoConfirmacaoModal">
              <h4 id="tituloConfirmacaoCriarPedido">Criar pedido</h4>
            </div>

            <div className="corpoConfirmacaoModal">
              <p>Este orcamento foi fechado. Deseja criar um pedido a partir dele?</p>
            </div>

            <div className="acoesConfirmacaoModal">
              <Botao variante="secundario" type="button" onClick={cancelarCriacaoPedido}>
                Nao
              </Botao>
              <Botao variante="primario" type="button" onClick={abrirPedidoAPartirDoOrcamento}>
                Sim
              </Botao>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CabecalhoGradeOrcamentos({ colunas }) {
  return (
    <div className="cabecalhoLayoutGradePadrao cabecalhoGradeOrcamentos">
      {colunas.map((coluna) => (
        <div key={coluna.id} className={coluna.classe} style={obterEstiloColunaLayout(coluna)}>
          {coluna.rotulo}
        </div>
      ))}
    </div>
  );
}

function LinhaOrcamento({
  orcamento,
  colunas,
  etapasOrcamento,
  permitirExcluir,
  permitirEdicao,
  permitirAlteracaoEtapa,
  aoAlterarEtapa,
  aoConsultar,
  aoEditar,
  aoExcluir
}) {
  return (
    <div className="linhaLayoutGradePadrao linhaOrcamento">
      {colunas.map((coluna) => renderizarCelulaOrcamento({
        coluna,
        orcamento,
        etapasOrcamento,
        permitirExcluir,
        permitirEdicao,
        permitirAlteracaoEtapa,
        aoAlterarEtapa,
        aoConsultar,
        aoEditar,
        aoExcluir
      }))}
    </div>
  );
}

function renderizarCelulaOrcamento({
  coluna,
  orcamento,
  etapasOrcamento,
  permitirExcluir,
  permitirEdicao,
  permitirAlteracaoEtapa,
  aoAlterarEtapa,
  aoConsultar,
  aoEditar,
  aoExcluir
}) {
  const propriedadesCelula = {
    key: coluna.id,
    className: `celulaLayoutGradePadrao ${coluna.classe}`.trim(),
    style: obterEstiloColunaLayout(coluna)
  };

  if (coluna.id === 'codigo') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <CodigoRegistro valor={orcamento.idOrcamento} />
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'idOrcamento') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <CodigoRegistro valor={orcamento.idOrcamento} />
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'cliente') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(orcamento.nomeCliente)}</TextoGradeClamp>
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'idCliente') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(orcamento.nomeCliente)}</TextoGradeClamp>
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'contato') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(orcamento.nomeContato)}</TextoGradeClamp>
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'idContato') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(orcamento.nomeContato)}</TextoGradeClamp>
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'usuario' || coluna.id === 'idUsuario') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(orcamento.nomeUsuario)}</TextoGradeClamp>
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'idPedidoVinculado') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        {orcamento.idPedidoVinculado ? (
          <CodigoRegistro valor={orcamento.idPedidoVinculado} />
        ) : (
          '-'
        )}
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'idVendedor') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(orcamento.nomeVendedor)}</TextoGradeClamp>
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'etapa') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <div className="campoEtapaGridOrcamento">
          <select
            className="selectEtapaGridOrcamento"
            style={criarEstiloEtapaOrcamento(orcamento.corEtapaOrcamento)}
            value={orcamento.idEtapaOrcamento ? String(orcamento.idEtapaOrcamento) : ''}
            onChange={(evento) => aoAlterarEtapa(evento.target.value)}
            aria-label={`Alterar etapa do orcamento ${orcamento.idOrcamento}`}
            disabled={!permitirAlteracaoEtapa}
          >
            <option value="">Sem etapa</option>
            {etapasOrcamento.map((etapa) => (
              <option key={etapa.idEtapaOrcamento} value={etapa.idEtapaOrcamento}>
                {etapa.descricao}
              </option>
            ))}
          </select>
        </div>
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'idEtapaOrcamento') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(orcamento.nomeEtapaOrcamento)}</TextoGradeClamp>
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'vendedor') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(orcamento.nomeVendedor)}</TextoGradeClamp>
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'comissao') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        {normalizarPreco(orcamento.comissao || 0)}
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'prazoPagamento' || coluna.id === 'idPrazoPagamento') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(orcamento.nomePrazoPagamento)}</TextoGradeClamp>
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'metodoPagamento') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(orcamento.nomeMetodoPagamento)}</TextoGradeClamp>
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'idMotivoPerda') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(orcamento.nomeMotivoPerda)}</TextoGradeClamp>
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'dataInclusao') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        {formatarDataGridOrcamento(orcamento.dataInclusao)}
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'dataValidade') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        {formatarDataGridOrcamento(orcamento.dataValidade)}
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'dataFechamento') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        {formatarDataGridOrcamento(orcamento.dataFechamento)}
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'observacao') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(orcamento.observacao)}</TextoGradeClamp>
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'total') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        {normalizarPreco(orcamento.totalOrcamento)}
      </CelulaLayoutOrcamento>
    );
  }

  if (coluna.id === 'acoes') {
    return (
      <CelulaLayoutOrcamento coluna={coluna} {...propriedadesCelula}>
        <AcoesRegistro
          rotuloConsulta="Consultar orcamento"
          rotuloEdicao={permitirEdicao ? 'Editar orcamento' : 'Orcamento fechado: usuario padrao consulta apenas.'}
          rotuloInativacao="Excluir orcamento"
          iconeInativacao="limpar"
          exibirInativacao={permitirExcluir && !orcamento.idPedidoVinculado}
          desabilitarEdicao={!permitirEdicao}
          aoConsultar={aoConsultar}
          aoEditar={aoEditar}
          aoInativar={aoExcluir}
        />
      </CelulaLayoutOrcamento>
    );
  }

  return null;
}

function CelulaLayoutOrcamento({ coluna, children, ...propriedades }) {
  return (
    <div {...propriedades}>
      <span className="rotuloCelulaLayoutGradePadrao">{coluna.rotulo}</span>
      {children}
    </div>
  );
}

function obterEstiloColunaLayout(coluna) {
  return {
    order: coluna.ordem,
    gridColumn: `span ${Math.max(1, Number(coluna.span || 1))}`
  };
}

function formatarDataGridOrcamento(valor) {
  if (!valor) {
    return '-';
  }

  const texto = String(valor).slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return '-';
  }

  const [ano, mes, dia] = texto.split('-');
  return `${dia}/${mes}/${ano}`;
}

function normalizarFiltrosOrcamentos(filtros, filtrosPadrao) {
  const filtrosNormalizados = normalizarFiltrosPorPadrao(filtros, filtrosPadrao);

  return {
    ...filtrosNormalizados,
    idUsuario: normalizarListaFiltroPersistido(filtrosNormalizados.idUsuario),
    idVendedorCliente: normalizarListaFiltroPersistido(filtrosNormalizados.idVendedorCliente),
    idVendedor: filtrosPadrao.idVendedor?.length > 0
      ? [...filtrosPadrao.idVendedor]
      : normalizarListaFiltroPersistido(filtrosNormalizados.idVendedor),
    idsEtapaOrcamento: normalizarListaFiltroPersistido(filtrosNormalizados.idsEtapaOrcamento),
    ...normalizarIntervaloDatasFiltros(
      filtrosNormalizados,
      filtrosPadrao,
      'dataInclusaoInicio',
      'dataInclusaoFim'
    ),
    ...normalizarIntervaloDatasFiltros(
      filtrosNormalizados,
      filtrosPadrao,
      'dataFechamentoInicio',
      'dataFechamentoFim'
    )
  };
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

function normalizarIntervaloDatasFiltros(filtros, filtrosPadrao, chaveInicio, chaveFim) {
  const dataInicio = normalizarDataFiltro(filtros?.[chaveInicio]) || normalizarDataFiltro(filtrosPadrao?.[chaveInicio]);
  const dataFim = normalizarDataFiltro(filtros?.[chaveFim]) || normalizarDataFiltro(filtrosPadrao?.[chaveFim]);

  if (dataInicio && dataFim && dataInicio > dataFim) {
    return {
      [chaveInicio]: dataFim,
      [chaveFim]: dataInicio
    };
  }

  return {
    [chaveInicio]: dataInicio,
    [chaveFim]: dataFim
  };
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

  return texto.slice(0, 10);
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

function enriquecerOrcamentos(
  orcamentos,
  clientes,
  contatos,
  usuarios,
  vendedores,
  prazosPagamento,
  etapasOrcamento,
  produtos,
  motivosPerda = []
) {
  const clientesPorId = new Map(
    clientes.map((cliente) => [cliente.idCliente, cliente])
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
  const motivosPorId = new Map(
    motivosPerda.map((motivo) => [motivo.idMotivo, motivo.descricao])
  );

  return orcamentos.map((orcamento) => {
    const cliente = clientesPorId.get(orcamento.idCliente);
    const totalOrcamento = Array.isArray(orcamento.itens)
      ? orcamento.itens.reduce((total, item) => total + (Number(item.valorTotal) || 0), 0)
      : 0;

    return {
      ...orcamento,
      itens: Array.isArray(orcamento.itens) ? orcamento.itens.map((item) => ({
        ...item,
        nomeProduto: obterValorGrid(produtosPorId.get(item.idProduto)?.descricao)
      })) : [],
      nomeCliente: obterValorGrid(cliente?.nomeFantasia || cliente?.razaoSocial),
      nomeContato: obterValorGrid(contatosPorId.get(orcamento.idContato)),
      idVendedorCliente: cliente?.idVendedor || null,
      nomeVendedorCliente: obterValorGrid(vendedoresPorId.get(cliente?.idVendedor)),
      nomeUsuario: obterValorGrid(usuariosPorId.get(orcamento.idUsuario)),
      nomeVendedor: obterValorGrid(vendedoresPorId.get(orcamento.idVendedor)),
      nomeMetodoPagamento: obterValorGrid(prazosPorId.get(orcamento.idPrazoPagamento)?.nomeMetodoPagamento),
      nomePrazoPagamento: obterValorGrid(prazosPorId.get(orcamento.idPrazoPagamento)?.descricaoFormatada),
      nomePrazoPagamentoDias: obterValorGrid(prazosPorId.get(orcamento.idPrazoPagamento)?.descricaoDias),
      nomeEtapaOrcamento: obterValorGrid(etapasPorId.get(orcamento.idEtapaOrcamento)?.descricao),
      nomeMotivoPerda: obterValorGrid(motivosPorId.get(orcamento.idMotivoPerda)),
      corEtapaOrcamento: etapasPorId.get(orcamento.idEtapaOrcamento)?.cor || '',
      obrigarMotivoPerdaEtapa: Boolean(etapasPorId.get(orcamento.idEtapaOrcamento)?.obrigarMotivoPerda),
      totalOrcamento
    };
  });
}

function enriquecerPrazosPagamento(prazosPagamento, metodosPagamento = []) {
  const metodosPorId = new Map(
    metodosPagamento.map((metodo) => [metodo.idMetodoPagamento, metodo.descricao])
  );

  return prazosPagamento.map((prazo) => {
    const parcelas = [prazo.prazo1, prazo.prazo2, prazo.prazo3, prazo.prazo4, prazo.prazo5, prazo.prazo6]
      .filter((valor) => valor !== null && valor !== undefined && valor !== '')
      .join(' / ');
    const descricaoFormatada = prazo.descricao || (parcelas ? `${parcelas} dias` : 'Prazo sem descricao');
    const descricaoDias = parcelas ? `${parcelas} dias` : '';

    return {
      ...prazo,
      nomeMetodoPagamento: metodosPorId.get(prazo.idMetodoPagamento) || '',
      descricaoDias,
      descricaoFormatada
    };
  });
}

function enriquecerPrazoPagamento(prazo, metodosPagamento = []) {
  if (!prazo) {
    return null;
  }

  return enriquecerPrazosPagamento([prazo], metodosPagamento)[0] || null;
}

function normalizarPayloadPrazoPagamento(dadosPrazo) {
  const payload = {
    descricao: limparTextoOpcional(dadosPrazo.descricao),
    idMetodoPagamento: Number(dadosPrazo.idMetodoPagamento),
    status: dadosPrazo.status ? 1 : 0
  };

  ['prazo1', 'prazo2', 'prazo3', 'prazo4', 'prazo5', 'prazo6'].forEach((chave) => {
    const valor = String(dadosPrazo[chave] || '').trim();
    payload[chave] = valor ? Number(valor) : null;
  });

  return payload;
}

function normalizarPayloadOrcamento(dadosOrcamento, usuarioLogado) {
  return {
    idCliente: Number(dadosOrcamento.idCliente),
    idContato: dadosOrcamento.idContato ? Number(dadosOrcamento.idContato) : null,
    idUsuario: Number(dadosOrcamento.idUsuario || usuarioLogado.idUsuario),
    idVendedor: Number(dadosOrcamento.idVendedor),
    comissao: normalizarNumeroDecimal(dadosOrcamento.comissao),
    idPrazoPagamento: dadosOrcamento.idPrazoPagamento ? Number(dadosOrcamento.idPrazoPagamento) : null,
    idEtapaOrcamento: dadosOrcamento.idEtapaOrcamento ? Number(dadosOrcamento.idEtapaOrcamento) : null,
    idMotivoPerda: dadosOrcamento.idMotivoPerda ? Number(dadosOrcamento.idMotivoPerda) : null,
    dataInclusao: limparTextoOpcional(dadosOrcamento.dataInclusao),
    dataValidade: limparTextoOpcional(dadosOrcamento.dataValidade),
    dataFechamento: limparTextoOpcional(dadosOrcamento.dataFechamento),
    observacao: limparTextoOpcional(dadosOrcamento.observacao),
    itens: dadosOrcamento.itens.map((item) => ({
      idProduto: Number(item.idProduto),
      quantidade: normalizarNumeroDecimal(item.quantidade),
      valorUnitario: normalizarNumeroDecimal(item.valorUnitario),
      valorTotal: normalizarNumeroDecimal(item.valorTotal),
      imagem: limparTextoOpcional(item.imagem),
      observacao: limparTextoOpcional(item.observacao)
    })),
    camposExtras: dadosOrcamento.camposExtras.map((campo) => ({
      idCampoOrcamento: Number(campo.idCampoOrcamento),
      valor: limparTextoOpcional(campo.valor)
    }))
  };
}

function normalizarPayloadPedido(dadosPedido) {
  return {
    idOrcamento: dadosPedido.idOrcamento ? Number(dadosPedido.idOrcamento) : null,
    idCliente: dadosPedido.idCliente ? Number(dadosPedido.idCliente) : null,
    idContato: dadosPedido.idContato ? Number(dadosPedido.idContato) : null,
    idUsuario: dadosPedido.idUsuario ? Number(dadosPedido.idUsuario) : null,
    idVendedor: dadosPedido.idVendedor ? Number(dadosPedido.idVendedor) : null,
    idPrazoPagamento: dadosPedido.idPrazoPagamento ? Number(dadosPedido.idPrazoPagamento) : null,
    idEtapaPedido: dadosPedido.idEtapaPedido ? Number(dadosPedido.idEtapaPedido) : null,
    comissao: normalizarNumeroDecimal(dadosPedido.comissao),
    dataInclusao: limparTextoOpcional(dadosPedido.dataInclusao),
    dataEntrega: limparTextoOpcional(dadosPedido.dataEntrega),
    observacao: limparTextoOpcional(dadosPedido.observacao),
    codigoOrcamentoOrigem: dadosPedido.codigoOrcamentoOrigem ? Number(dadosPedido.codigoOrcamentoOrigem) : null,
    nomeClienteSnapshot: limparTextoOpcional(dadosPedido.nomeClienteSnapshot),
    nomeContatoSnapshot: limparTextoOpcional(dadosPedido.nomeContatoSnapshot),
    nomeUsuarioSnapshot: limparTextoOpcional(dadosPedido.nomeUsuarioSnapshot),
    nomeVendedorSnapshot: limparTextoOpcional(dadosPedido.nomeVendedorSnapshot),
    nomeMetodoPagamentoSnapshot: limparTextoOpcional(dadosPedido.nomeMetodoPagamentoSnapshot),
    nomePrazoPagamentoSnapshot: limparTextoOpcional(dadosPedido.nomePrazoPagamentoSnapshot),
    nomeEtapaPedidoSnapshot: limparTextoOpcional(dadosPedido.nomeEtapaPedidoSnapshot),
    itens: Array.isArray(dadosPedido.itens) ? dadosPedido.itens.map((item) => ({
      idProduto: item.idProduto ? Number(item.idProduto) : null,
      quantidade: normalizarNumeroDecimal(item.quantidade),
      valorUnitario: normalizarNumeroDecimal(item.valorUnitario),
      valorTotal: normalizarNumeroDecimal(item.valorTotal),
      imagem: limparTextoOpcional(item.imagem),
      observacao: limparTextoOpcional(item.observacao),
      referenciaProdutoSnapshot: limparTextoOpcional(item.referenciaProdutoSnapshot),
      descricaoProdutoSnapshot: limparTextoOpcional(item.descricaoProdutoSnapshot),
      unidadeProdutoSnapshot: limparTextoOpcional(item.unidadeProdutoSnapshot)
    })) : [],
    camposExtras: Array.isArray(dadosPedido.camposExtras) ? dadosPedido.camposExtras.map((campo) => ({
      idCampoPedido: campo.idCampoPedido ? Number(campo.idCampoPedido) : null,
      tituloSnapshot: limparTextoOpcional(campo.tituloSnapshot || campo.titulo),
      valor: limparTextoOpcional(campo.valor)
    })) : []
  };
}

function limparTextoOpcional(valor) {
  const texto = String(valor || '').trim();
  return texto || null;
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

function criarEstiloEtapaOrcamento(cor) {
  const corBase = normalizarCorHexadecimal(cor || '#1791e2');

  return {
    background: converterHexParaRgba(corBase, 0.22),
    color: escurecerCorHexadecimal(corBase, 0.18)
  };
}

function obterEtapasFiltroPadraoOrcamento(empresa) {
  if (!empresa?.etapasFiltroPadraoOrcamento) {
    return [];
  }

  try {
    const lista = JSON.parse(empresa.etapasFiltroPadraoOrcamento);
    return Array.isArray(lista) ? lista.map(String) : [];
  } catch (_erro) {
    return String(empresa.etapasFiltroPadraoOrcamento)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function etapaAcabouDeFechar(idEtapaAnterior, idEtapaAtual, etapasOrcamento) {
  const etapaAnterior = etapasOrcamento.find((etapa) => String(etapa.idEtapaOrcamento) === String(idEtapaAnterior || ''));
  const etapaAtual = etapasOrcamento.find((etapa) => String(etapa.idEtapaOrcamento) === String(idEtapaAtual || ''));

  return !etapaOrcamentoEhFechamento(etapaAnterior) && etapaOrcamentoEhFechamento(etapaAtual);
}

function etapaOrcamentoEhFechadoPorId(idEtapaOrcamento) {
  return [
    ID_ETAPA_ORCAMENTO_FECHAMENTO,
    ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO,
    ID_ETAPA_ORCAMENTO_PEDIDO_EXCLUIDO
  ].includes(Number(idEtapaOrcamento));
}

function entrouEmEtapaFechada(idEtapaAnterior, idEtapaAtual) {
  return !etapaOrcamentoEhFechadoPorId(idEtapaAnterior) && etapaOrcamentoEhFechadoPorId(idEtapaAtual);
}

function orcamentoBloqueadoParaUsuarioPadrao(orcamento, usuarioLogado) {
  return usuarioLogado?.tipo === 'Usuario padrao' && etapaOrcamentoEhFechadoPorId(orcamento?.idEtapaOrcamento);
}

function etapaOrcamentoEhFechamento(etapa) {
  return Number(etapa?.idEtapaOrcamento) === ID_ETAPA_ORCAMENTO_FECHAMENTO;
}

function obterEtapaFechadoSemPedido(etapasOrcamento) {
  return etapasOrcamento.find((etapa) => Number(etapa?.idEtapaOrcamento) === ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO) || null;
}

function enriquecerOrcamentoParaPedido(orcamento, contexto) {
  const cliente = contexto.clientes.find((item) => String(item.idCliente) === String(orcamento.idCliente));
  const contato = contexto.contatos.find((item) => String(item.idContato) === String(orcamento.idContato));
  const usuario = contexto.usuarios.find((item) => String(item.idUsuario) === String(orcamento.idUsuario));
  const vendedor = contexto.vendedores.find((item) => String(item.idVendedor) === String(orcamento.idVendedor));
  const prazo = contexto.prazosPagamento.find((item) => String(item.idPrazoPagamento) === String(orcamento.idPrazoPagamento));
  const etapa = contexto.etapasOrcamento.find((item) => String(item.idEtapaOrcamento) === String(orcamento.idEtapaOrcamento));

  return {
    ...orcamento,
    nomeCliente: orcamento.nomeCliente || cliente?.nomeFantasia || cliente?.razaoSocial || '',
    nomeContato: orcamento.nomeContato || contato?.nome || '',
    nomeUsuario: orcamento.nomeUsuario || usuario?.nome || '',
    nomeVendedor: orcamento.nomeVendedor || vendedor?.nome || '',
    nomePrazoPagamento: orcamento.nomePrazoPagamento || prazo?.descricaoFormatada || prazo?.descricao || '',
    nomeMetodoPagamento: orcamento.nomeMetodoPagamento || prazo?.nomeMetodoPagamento || '',
    nomeEtapaOrcamento: orcamento.nomeEtapaOrcamento || etapa?.descricao || '',
    itens: Array.isArray(orcamento.itens) ? orcamento.itens.map((item) => {
      const produto = contexto.produtos.find((registro) => String(registro.idProduto) === String(item.idProduto));
      return {
        ...item,
        descricaoProdutoSnapshot: item.descricaoProdutoSnapshot || produto?.descricao || item.nomeProduto || '',
        referenciaProdutoSnapshot: item.referenciaProdutoSnapshot || produto?.referencia || '',
        unidadeProdutoSnapshot: item.unidadeProdutoSnapshot || produto?.nomeUnidadeMedida || produto?.siglaUnidadeMedida || '',
        imagem: item.imagem || produto?.imagem || ''
      };
    }) : []
  };
}

function montarDadosIniciaisPedidoAPartirDoOrcamento(orcamento) {
  return {
    idOrcamento: orcamento.idOrcamento,
    codigoOrcamentoOrigem: orcamento.idOrcamento,
    idCliente: orcamento.idCliente,
    idContato: orcamento.idContato,
    idUsuario: orcamento.idUsuario,
    idVendedor: orcamento.idVendedor,
    idPrazoPagamento: orcamento.idPrazoPagamento,
    comissao: orcamento.comissao,
    dataInclusao: obterDataAtualFormatoInput(),
    nomeClienteSnapshot: orcamento.nomeCliente || '',
    nomeContatoSnapshot: orcamento.nomeContato || '',
    nomeUsuarioSnapshot: orcamento.nomeUsuario || '',
    nomeVendedorSnapshot: orcamento.nomeVendedor || '',
    nomeMetodoPagamentoSnapshot: orcamento.nomeMetodoPagamento || '',
    nomePrazoPagamentoSnapshot: orcamento.nomePrazoPagamento || '',
    observacao: orcamento.observacao || '',
    itens: Array.isArray(orcamento.itens) ? orcamento.itens.map((item) => ({
      idProduto: item.idProduto,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      valorTotal: item.valorTotal,
      imagem: item.imagem || '',
      observacao: item.observacao || '',
      referenciaProdutoSnapshot: item.referenciaProdutoSnapshot || '',
      descricaoProdutoSnapshot: item.descricaoProdutoSnapshot || item.nomeProduto || '',
      unidadeProdutoSnapshot: item.unidadeProdutoSnapshot || ''
    })) : []
  };
}

function obterDataAtualFormatoInput() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function normalizarCorHexadecimal(cor) {
  const texto = String(cor || '').trim();
  return /^#([0-9a-fA-F]{6})$/.test(texto) ? texto : '#1791e2';
}

function escurecerCorHexadecimal(cor, intensidade = 0.2) {
  const corNormalizada = normalizarCorHexadecimal(cor).replace('#', '');
  const fator = Math.max(0, Math.min(1, 1 - intensidade));
  const vermelho = Math.round(Number.parseInt(corNormalizada.slice(0, 2), 16) * fator);
  const verde = Math.round(Number.parseInt(corNormalizada.slice(2, 4), 16) * fator);
  const azul = Math.round(Number.parseInt(corNormalizada.slice(4, 6), 16) * fator);

  return `#${[vermelho, verde, azul].map((canal) => canal.toString(16).padStart(2, '0')).join('')}`;
}

function converterHexParaRgba(cor, opacidade = 1) {
  const corNormalizada = normalizarCorHexadecimal(cor).replace('#', '');
  const vermelho = Number.parseInt(corNormalizada.slice(0, 2), 16);
  const verde = Number.parseInt(corNormalizada.slice(2, 4), 16);
  const azul = Number.parseInt(corNormalizada.slice(4, 6), 16);

  return `rgba(${vermelho}, ${verde}, ${azul}, ${opacidade})`;
}
