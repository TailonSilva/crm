import { useEffect, useMemo, useState } from 'react';
import '../../recursos/estilos/cabecalhoPagina.css';
import { AcoesRegistro } from '../../componentes/comuns/acoesRegistro';
import { Botao } from '../../componentes/comuns/botao';
import { CampoPesquisa } from '../../componentes/comuns/campoPesquisa';
import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';
import { GradePadrao } from '../../componentes/comuns/gradePadrao';
import { ModalFiltros } from '../../componentes/comuns/modalFiltros';
import { TextoGradeClamp } from '../../componentes/comuns/textoGradeClamp';
import { CorpoPagina } from '../../componentes/layout/corpoPagina';
import {
  incluirCliente,
  incluirContato,
  listarClientes,
  listarContatos,
  listarRamosAtividade,
  listarVendedores
} from '../../servicos/clientes';
import {
  atualizarPrazoPagamento,
  incluirPrazoPagamento,
  listarCamposPedidoConfiguracao,
  listarEtapasPedidoConfiguracao,
  listarMetodosPagamentoConfiguracao,
  listarMotivosDevolucaoConfiguracao,
  listarPrazosPagamentoConfiguracao,
  listarTiposPedidoConfiguracao
} from '../../servicos/configuracoes';
import { atualizarEmpresa, criarPayloadAtualizacaoColunasGrid, listarEmpresas } from '../../servicos/empresa';
import { atualizarPedido, excluirPedido, incluirPedido, listarPedidos } from '../../servicos/pedidos';
import { listarProdutos } from '../../servicos/produtos';
import { listarUsuarios } from '../../servicos/usuarios';
import { normalizarPreco } from '../../utilitarios/normalizarPreco';
import { formatarCodigoCliente } from '../../utilitarios/codigoCliente';
import { obterValorGrid } from '../../utilitarios/valorPadraoGrid';
import {
  normalizarColunasGridPedidos,
  TOTAL_COLUNAS_GRID_PEDIDOS
} from '../../utilitarios/colunasGridPedidos';
import {
  normalizarFiltrosPorPadrao,
  normalizarListaFiltroPersistido,
  useFiltrosPersistidos
} from '../../utilitarios/useFiltrosPersistidos';
import { ModalPedido } from './modalPedido';
import { ModalManualPedidos } from './modalManualPedidos';
import { ModalColunasGridPedidos } from '../configuracoes/modalColunasGridPedidos';

const ID_ETAPA_PEDIDO_ENTREGUE = 5;
const ID_TIPO_PEDIDO_DEVOLUCAO = 2;

function criarFiltrosIniciaisPedidos(usuarioLogado) {
  return {
    idCliente: '',
    idUsuario: '',
    idVendedor: usuarioLogado?.idVendedor ? [String(usuarioLogado.idVendedor)] : [],
    idEtapaPedido: [],
    dataInclusaoInicio: '',
    dataInclusaoFim: '',
    dataEntregaInicio: '',
    dataEntregaFim: ''
  };
}

function normalizarEtapasPedido(etapasPedido) {
  if (!Array.isArray(etapasPedido)) {
    return [];
  }

  return etapasPedido.map((etapa) => ({
    ...etapa,
    idEtapaPedido: etapa.idEtapaPedido ?? etapa.idEtapa
  }));
}

function normalizarFiltrosPedidos(filtros, filtrosPadrao) {
  const filtrosNormalizados = normalizarFiltrosPorPadrao(filtros, filtrosPadrao);
  const periodoInclusao = normalizarIntervaloDatasFiltros(
    filtrosNormalizados,
    filtrosPadrao,
    'dataInclusaoInicio',
    'dataInclusaoFim'
  );
  const periodoEntrega = normalizarIntervaloDatasFiltros(
    filtrosNormalizados,
    filtrosPadrao,
    'dataEntregaInicio',
    'dataEntregaFim'
  );

  return {
    ...filtrosNormalizados,
    ...periodoInclusao,
    ...periodoEntrega,
    idVendedor: Array.isArray(filtros?.idVendedor)
      ? normalizarListaFiltroPersistido(filtros.idVendedor)
      : normalizarListaFiltroPersistido(
        filtros?.idVendedor
          ? [filtros.idVendedor]
          : []
      ),
    idEtapaPedido: Array.isArray(filtros?.idEtapaPedido)
      ? normalizarListaFiltroPersistido(filtros.idEtapaPedido)
      : normalizarListaFiltroPersistido(
        filtros?.idEtapaPedido
          ? [filtros.idEtapaPedido]
          : []
      )
  };
}

export function PaginaPedidos({ usuarioLogado }) {
  const [pesquisa, definirPesquisa] = useState('');
  const filtrosIniciais = useMemo(
    () => criarFiltrosIniciaisPedidos(usuarioLogado),
    [usuarioLogado?.idVendedor]
  );
  const [filtros, definirFiltros] = useFiltrosPersistidos({
    chave: 'paginaPedidos',
    usuario: usuarioLogado,
    filtrosPadrao: filtrosIniciais,
    normalizarFiltros: normalizarFiltrosPedidos
  });
  const [pedidos, definirPedidos] = useState([]);
  const [clientes, definirClientes] = useState([]);
  const [contatos, definirContatos] = useState([]);
  const [usuarios, definirUsuarios] = useState([]);
  const [ramosAtividade, definirRamosAtividade] = useState([]);
  const [vendedores, definirVendedores] = useState([]);
  const [metodosPagamento, definirMetodosPagamento] = useState([]);
  const [prazosPagamento, definirPrazosPagamento] = useState([]);
  const [tiposPedido, definirTiposPedido] = useState([]);
  const [motivosDevolucao, definirMotivosDevolucao] = useState([]);
  const [produtos, definirProdutos] = useState([]);
  const [camposPedido, definirCamposPedido] = useState([]);
  const [etapasPedido, definirEtapasPedido] = useState([]);
  const [empresa, definirEmpresa] = useState(null);
  const [carregandoContexto, definirCarregandoContexto] = useState(true);
  const [carregandoGrade, definirCarregandoGrade] = useState(true);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [pedidoSelecionado, definirPedidoSelecionado] = useState(null);
  const [modoModal, definirModoModal] = useState('consulta');
  const [modalAberto, definirModalAberto] = useState(false);
  const [modalManualAberto, definirModalManualAberto] = useState(false);
  const [modalFiltrosAberto, definirModalFiltrosAberto] = useState(false);
  const [modalColunasGridAberto, definirModalColunasGridAberto] = useState(false);
  const [pedidoExclusaoPendente, definirPedidoExclusaoPendente] = useState(null);
  const [alteracaoEtapaPendente, definirAlteracaoEtapaPendente] = useState(null);
  const [motivoDevolucaoEtapaRapida, definirMotivoDevolucaoEtapaRapida] = useState('');
  const usuarioSomenteVendedor = usuarioLogado?.tipo === 'Usuario padrao' && usuarioLogado?.idVendedor;
  const usuarioSomenteConsultaConfiguracao = usuarioLogado?.tipo === 'Usuario padrao';
  const permitirExcluir = usuarioLogado?.tipo !== 'Usuario padrao';

  useEffect(() => {
    carregarContexto();
  }, []);

  useEffect(() => {
    if (carregandoContexto) {
      return;
    }

    carregarGradePedidos();
  }, [carregandoContexto, pesquisa, JSON.stringify(filtros)]);

  useEffect(() => {
    function tratarGrupoEmpresaAtualizado() {
      carregarContexto();
      carregarGradePedidos();
    }

    window.addEventListener('grupo-empresa-atualizado', tratarGrupoEmpresaAtualizado);

    return () => {
      window.removeEventListener('grupo-empresa-atualizado', tratarGrupoEmpresaAtualizado);
    };
  }, [pesquisa, JSON.stringify(filtros)]);

  useEffect(() => {
    function tratarEmpresaAtualizada() {
      carregarContexto();
      carregarGradePedidos();
    }

    window.addEventListener('empresa-atualizada', tratarEmpresaAtualizada);

    return () => {
      window.removeEventListener('empresa-atualizada', tratarEmpresaAtualizada);
    };
  }, [pesquisa, JSON.stringify(filtros)]);

  useEffect(() => {
    function tratarAtalhosPedidos(evento) {
      if (evento.key !== 'F1') {
        return;
      }

      evento.preventDefault();

      if (!modalAberto && !modalManualAberto && !modalFiltrosAberto && !pedidoExclusaoPendente) {
        definirModalManualAberto(true);
      }
    }

    window.addEventListener('keydown', tratarAtalhosPedidos);

    return () => {
      window.removeEventListener('keydown', tratarAtalhosPedidos);
    };
  }, [modalAberto, modalManualAberto, modalFiltrosAberto, pedidoExclusaoPendente]);

  async function carregarContexto() {
    definirCarregandoContexto(true);
    definirMensagemErro('');

    try {
      const resultados = await Promise.allSettled([
        listarEtapasPedidoConfiguracao(),
        listarClientes(),
        listarContatos(),
        listarUsuarios(),
        listarRamosAtividade(),
        listarVendedores(),
        listarMetodosPagamentoConfiguracao(),
        listarPrazosPagamentoConfiguracao(),
        listarTiposPedidoConfiguracao(),
        listarMotivosDevolucaoConfiguracao(),
        listarProdutos(),
        listarCamposPedidoConfiguracao(),
        listarEmpresas()
      ]);

      const [
        etapasResultado,
        clientesResultado,
        contatosResultado,
        usuariosResultado,
        ramosResultado,
        vendedoresResultado,
        metodosResultado,
        prazosResultado,
        tiposPedidoResultado,
        motivosDevolucaoResultado,
        produtosResultado,
        camposResultado,
        empresasResultado
      ] = resultados;

      const etapasCarregadas = etapasResultado.status === 'fulfilled' ? etapasResultado.value : [];
      const clientesCarregados = clientesResultado.status === 'fulfilled' ? clientesResultado.value : [];
      const contatosCarregados = contatosResultado.status === 'fulfilled' ? contatosResultado.value : [];
      const usuariosCarregados = usuariosResultado.status === 'fulfilled' ? usuariosResultado.value : [];
      const ramosCarregados = ramosResultado.status === 'fulfilled' ? ramosResultado.value : [];
      const vendedoresCarregados = vendedoresResultado.status === 'fulfilled' ? vendedoresResultado.value : [];
      const metodosCarregados = metodosResultado.status === 'fulfilled' ? metodosResultado.value : [];
      const prazosCarregados = prazosResultado.status === 'fulfilled' ? prazosResultado.value : [];
      const tiposPedidoCarregados = tiposPedidoResultado.status === 'fulfilled' ? tiposPedidoResultado.value : [];
      const motivosDevolucaoCarregados = motivosDevolucaoResultado.status === 'fulfilled' ? motivosDevolucaoResultado.value : [];
      const produtosCarregados = produtosResultado.status === 'fulfilled' ? produtosResultado.value : [];
      const camposCarregados = camposResultado.status === 'fulfilled' ? camposResultado.value : [];
      const empresasCarregadas = empresasResultado.status === 'fulfilled' ? empresasResultado.value : [];

      const etapasNormalizadas = normalizarEtapasPedido(etapasCarregadas);

      definirEtapasPedido(etapasNormalizadas);
      definirClientes(clientesCarregados);
      definirContatos(contatosCarregados);
      definirUsuarios(usuariosCarregados);
      definirRamosAtividade(ramosCarregados);
      definirVendedores(vendedoresCarregados);
      definirMetodosPagamento(metodosCarregados);
      definirPrazosPagamento(enriquecerPrazosPagamento(prazosCarregados, metodosCarregados));
      definirTiposPedido(tiposPedidoCarregados);
      definirMotivosDevolucao(motivosDevolucaoCarregados);
      definirProdutos(produtosCarregados);
      definirCamposPedido(camposCarregados);
      definirEmpresa(empresasCarregadas[0] || null);

      return {
        etapasPedido: etapasNormalizadas,
        clientes: clientesCarregados,
        contatos: contatosCarregados,
        usuarios: usuariosCarregados,
        ramosAtividade: ramosCarregados,
        vendedores: vendedoresCarregados,
        metodosPagamento: metodosCarregados,
        prazosPagamento: prazosCarregados,
        tiposPedido: tiposPedidoCarregados,
        motivosDevolucao: motivosDevolucaoCarregados,
        produtos: produtosCarregados,
        camposPedido: camposCarregados,
        empresa: empresasCarregadas[0] || null
      };
    } catch (_erro) {
      definirMensagemErro('Nao foi possivel carregar os pedidos.');
      return null;
    } finally {
      definirCarregandoContexto(false);
    }
  }

  async function carregarGradePedidos(contextoAtual = null) {
    if (!contextoAtual && carregandoContexto) {
      return;
    }

    definirCarregandoGrade(true);
    definirMensagemErro('');

    try {
      const pedidosCarregados = await listarPedidos({
        search: pesquisa,
        ...filtros,
        ...(usuarioSomenteVendedor
          ? {
            escopoIdVendedor: usuarioLogado?.idVendedor
          }
          : {})
      });

      definirPedidos(enriquecerPedidos(
        pedidosCarregados,
        contextoAtual?.etapasPedido || etapasPedido
      ));
    } catch (_erro) {
      definirMensagemErro('Nao foi possivel carregar os pedidos.');
    } finally {
      definirCarregandoGrade(false);
    }
  }

  async function recarregarPagina() {
    const contextoAtualizado = await carregarContexto();
    await carregarGradePedidos(contextoAtualizado);
  }

  async function salvarColunasGridPedidos(dadosColunas) {
    if (!empresa?.idEmpresa) {
      throw new Error('Cadastre a empresa antes de configurar as colunas do grid.');
    }

    await atualizarEmpresa(
      empresa.idEmpresa,
      criarPayloadAtualizacaoColunasGrid('colunasGridPedidos', dadosColunas.colunasGridPedidos)
    );

    const empresasAtualizadas = await listarEmpresas();
    definirEmpresa(empresasAtualizadas[0] || null);
    window.dispatchEvent(new CustomEvent('empresa-atualizada'));
    definirModalColunasGridAberto(false);
  }

  function abrirNovoPedido() {
    definirPedidoSelecionado(null);
    definirModoModal('novo');
    definirModalAberto(true);
  }

  function abrirConsultaPedido(pedido) {
    definirPedidoSelecionado(pedido);
    definirModoModal('consulta');
    definirModalAberto(true);
  }

  function abrirEdicaoPedido(pedido) {
    if (pedidoBloqueadoParaUsuarioPadrao(pedido, usuarioLogado)) {
      abrirConsultaPedido(pedido);
      return;
    }

    definirPedidoSelecionado(pedido);
    definirModoModal('edicao');
    definirModalAberto(true);
  }

  function fecharModal() {
    definirPedidoSelecionado(null);
    definirModoModal('consulta');
    definirModalAberto(false);
  }

  async function salvarPedido(dadosPedido) {
    const payload = normalizarPayloadPedido(dadosPedido);

    if (pedidoSelecionado?.idPedido) {
      await atualizarPedido(pedidoSelecionado.idPedido, payload);
    } else {
      await incluirPedido(payload);
    }

    await recarregarPagina();
    fecharModal();
  }

  async function incluirClientePeloPedido(dadosCliente) {
    const payload = normalizarPayloadClienteCadastro({
      ...dadosCliente,
      idVendedor: usuarioSomenteVendedor ? String(usuarioLogado.idVendedor) : dadosCliente.idVendedor
    });

    const clienteSalvo = await incluirCliente(payload);
    await salvarContatosClienteCadastro(clienteSalvo.idCliente, dadosCliente.contatos || []);
    await recarregarPagina();

    const clientesAtualizados = await listarClientes();
    const clienteCompleto = clientesAtualizados.find((cliente) => cliente.idCliente === clienteSalvo.idCliente);

    return clienteCompleto || clienteSalvo;
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

  function abrirExclusaoPedido(pedido) {
    if (!permitirExcluir) {
      return;
    }

    definirPedidoExclusaoPendente(pedido);
  }

  function cancelarExclusaoPedido() {
    definirPedidoExclusaoPendente(null);
  }

  async function confirmarExclusaoPedido() {
    if (!pedidoExclusaoPendente) {
      return;
    }

    await excluirPedido(pedidoExclusaoPendente.idPedido);
    definirPedidoExclusaoPendente(null);
    await recarregarPagina();
  }

  async function alterarEtapaRapidamente(pedido, proximoIdEtapaPedido, idMotivoDevolucao = null) {
    const valorEtapa = String(proximoIdEtapaPedido || '').trim();

    if (!pedido?.idPedido || String(pedido.idEtapaPedido || '') === valorEtapa) {
      return;
    }

    if (
      pedidoEhDevolucao(pedido?.idTipoPedido)
      && etapaPedidoEhEntregue(valorEtapa)
      && !String(idMotivoDevolucao || pedido.idMotivoDevolucao || '').trim()
    ) {
      const etapaSelecionadaPendente = etapasPedido.find(
        (etapa) => String(etapa.idEtapaPedido) === valorEtapa
      );

      definirAlteracaoEtapaPendente({
        pedido,
        idEtapaPedido: valorEtapa,
        nomeEtapa: etapaSelecionadaPendente?.descricao || 'Entregue'
      });
      definirMotivoDevolucaoEtapaRapida('');
      return;
    }

    const etapaSelecionada = etapasPedido.find(
      (etapa) => String(etapa.idEtapaPedido) === valorEtapa
    );
    const payload = normalizarPayloadPedido({
      ...pedido,
      idEtapaPedido: valorEtapa,
      idMotivoDevolucao: idMotivoDevolucao ?? pedido.idMotivoDevolucao ?? null,
      nomeEtapaPedidoSnapshot: etapaSelecionada?.descricao || '',
      dataEntrega: entrouNaEtapaEntregue(pedido.idEtapaPedido, valorEtapa)
        ? obterDataAtualFormatoInput()
        : pedido.dataEntrega
    });

    await atualizarPedido(pedido.idPedido, payload);
    await recarregarPagina();
  }

  const carregando = carregandoContexto || carregandoGrade;
  const colunasVisiveisPedidos = useMemo(
    () => normalizarColunasGridPedidos(empresa?.colunasGridPedidos),
    [empresa?.colunasGridPedidos]
  );
  const filtrosAtivos = JSON.stringify(filtros) !== JSON.stringify(filtrosIniciais);

  return (
    <>
      <header className="cabecalhoPagina">
        <div>
          <h1>Pedidos</h1>
          <p>Acompanhe os pedidos gerados a partir das propostas comerciais do CRM.</p>
        </div>

        <div className="acoesCabecalhoPagina">
          <CampoPesquisa
            valor={pesquisa}
            aoAlterar={definirPesquisa}
            placeholder="Pesquisar pedidos"
            ariaLabel="Pesquisar pedidos"
          />
          <Botao
            variante={filtrosAtivos ? 'primario' : 'secundario'}
            icone="filtro"
            somenteIcone
            title="Filtrar"
            aria-label="Filtrar"
            onClick={() => definirModalFiltrosAberto(true)}
          />
          <Botao
            variante="secundario"
            icone="configuracoes"
            somenteIcone
            title="Configurar grid"
            aria-label="Configurar grid"
            onClick={() => definirModalColunasGridAberto(true)}
            disabled={usuarioSomenteConsultaConfiguracao || !empresa?.idEmpresa}
          />
          <Botao
            variante="primario"
            icone="adicionar"
            somenteIcone
            title="Novo pedido"
            aria-label="Novo pedido"
            onClick={abrirNovoPedido}
          />
        </div>
      </header>

      <CorpoPagina>
        <GradePadrao
          modo="layout"
          totalColunasLayout={TOTAL_COLUNAS_GRID_PEDIDOS}
          cabecalho={<CabecalhoGradePedidos colunas={colunasVisiveisPedidos} />}
          carregando={carregando}
          mensagemErro={mensagemErro}
          temItens={pedidos.length > 0}
          mensagemCarregando="Carregando pedidos..."
          mensagemVazia="Nenhum pedido encontrado."
        >
          {pedidos.map((pedido) => (
            <LinhaPedido
              key={pedido.idPedido}
              pedido={pedido}
              colunas={colunasVisiveisPedidos}
              etapasPedido={etapasPedido}
              empresa={empresa}
              clientes={clientes}
              permitirExcluir={permitirExcluir}
              permitirEdicao={!pedidoBloqueadoParaUsuarioPadrao(pedido, usuarioLogado)}
              permitirAlteracaoEtapa={!pedidoBloqueadoParaUsuarioPadrao(pedido, usuarioLogado)}
              aoAlterarEtapa={(idEtapaPedido) => alterarEtapaRapidamente(pedido, idEtapaPedido)}
              aoConsultar={() => abrirConsultaPedido(pedido)}
              aoEditar={() => abrirEdicaoPedido(pedido)}
              aoExcluir={() => abrirExclusaoPedido(pedido)}
            />
          ))}
        </GradePadrao>
      </CorpoPagina>

      <ModalFiltros
        aberto={modalFiltrosAberto}
        titulo="Filtros de pedidos"
        filtros={filtros}
        campos={[
          {
            name: 'idCliente',
            label: 'Cliente',
            options: clientes.map((cliente) => ({
              valor: String(cliente.idCliente),
              label: cliente.nomeFantasia || cliente.razaoSocial
            }))
          },
          {
            name: 'idUsuario',
            label: 'Usuario do registro',
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
            disabled: Boolean(usuarioSomenteVendedor),
            options: vendedores.map((vendedor) => ({
              valor: String(vendedor.idVendedor),
              label: vendedor.nome
            }))
          },
          {
            name: 'idEtapaPedido',
            label: 'Etapa',
            multiple: true,
            tituloSelecao: 'Selecionar etapas',
            options: etapasPedido.map((etapa) => ({
              valor: String(etapa.idEtapaPedido),
              label: etapa.descricao
            }))
          },
          {
            name: 'periodosDatasPedido',
            label: 'Datas',
            type: 'date-filters-modal',
            tituloSelecao: 'Filtros de datas do pedido',
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
                titulo: 'Data de entrega',
                nomeInicio: 'dataEntregaInicio',
                nomeFim: 'dataEntregaFim',
                labelInicio: 'Inicio da entrega',
                labelFim: 'Fim da entrega'
              }
            ]
          }
        ]}
        aoFechar={() => definirModalFiltrosAberto(false)}
        aoAplicar={(proximosFiltros) => {
          definirFiltros(proximosFiltros);
          definirModalFiltrosAberto(false);
        }}
        aoLimpar={() => definirFiltros(criarFiltrosIniciaisPedidos(usuarioLogado))}
      />

      <ModalPedido
        aberto={modalAberto}
        pedido={pedidoSelecionado}
        clientes={clientes}
        contatos={contatos}
        usuarios={usuarios}
        vendedores={vendedores}
        ramosAtividade={ramosAtividade}
        metodosPagamento={metodosPagamento}
        prazosPagamento={prazosPagamento}
        tiposPedido={tiposPedido}
        motivosDevolucao={motivosDevolucao}
        etapasPedido={etapasPedido}
        produtos={produtos}
        camposPedido={camposPedido}
        empresa={empresa}
        usuarioLogado={usuarioLogado}
        modo={modoModal}
        idVendedorBloqueado={usuarioSomenteVendedor ? usuarioLogado.idVendedor : null}
        somenteConsultaPrazos={usuarioSomenteConsultaConfiguracao}
        aoIncluirCliente={incluirClientePeloPedido}
        aoFechar={fecharModal}
        aoSalvar={salvarPedido}
        aoSalvarPrazoPagamento={salvarPrazoPagamento}
        aoInativarPrazoPagamento={inativarPrazoPagamento}
      />

      <ModalManualPedidos
        aberto={modalManualAberto}
        aoFechar={() => definirModalManualAberto(false)}
        pedidos={pedidos}
        etapasPedido={etapasPedido}
        prazosPagamento={prazosPagamento}
        filtros={filtros}
        usuarioLogado={usuarioLogado}
      />
      <ModalColunasGridPedidos
        aberto={modalColunasGridAberto}
        empresa={empresa}
        aoFechar={() => definirModalColunasGridAberto(false)}
        aoSalvar={salvarColunasGridPedidos}
      />

      {pedidoExclusaoPendente ? (
        <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={cancelarExclusaoPedido}>
          <div
            className="modalConfirmacaoAgenda"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="tituloConfirmacaoExclusaoPedido"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <div className="cabecalhoConfirmacaoModal">
              <h4 id="tituloConfirmacaoExclusaoPedido">Excluir pedido</h4>
            </div>

            <div className="corpoConfirmacaoModal">
              <p>Tem certeza que deseja excluir este pedido?</p>
            </div>

            <div className="acoesConfirmacaoModal">
              <Botao variante="secundario" type="button" onClick={cancelarExclusaoPedido}>
                Nao
              </Botao>
              <Botao variante="perigo" type="button" onClick={confirmarExclusaoPedido}>
                Sim
              </Botao>
            </div>
          </div>
        </div>
      ) : null}

      {alteracaoEtapaPendente ? (
        <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={() => {
          definirAlteracaoEtapaPendente(null);
          definirMotivoDevolucaoEtapaRapida('');
        }}>
          <div
            className="modalConfirmacaoAgenda modalEtapaRapidaOrcamento"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloMotivoDevolucaoEtapaRapida"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <div className="cabecalhoConfirmacaoModal">
              <h4 id="tituloMotivoDevolucaoEtapaRapida">Motivo da devolucao</h4>
            </div>

            <div className="corpoConfirmacaoModal corpoModalEtapaRapidaOrcamento">
              <p>
                A etapa <strong>{alteracaoEtapaPendente.nomeEtapa}</strong> exige um motivo da devolucao.
              </p>
              <div className="campoFormulario campoFormularioIntegral">
                <label htmlFor="motivoDevolucaoEtapaRapida">Selecione o motivo</label>
                <select
                  id="motivoDevolucaoEtapaRapida"
                  className="entradaFormulario"
                  value={motivoDevolucaoEtapaRapida}
                  onChange={(evento) => definirMotivoDevolucaoEtapaRapida(evento.target.value)}
                >
                  <option value="">Selecione</option>
                  {motivosDevolucao.map((motivo) => (
                    <option key={motivo.idMotivoDevolucao} value={motivo.idMotivoDevolucao}>
                      {String(motivo.idMotivoDevolucao).padStart(4, '0')} - {motivo.abreviacao}
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
                  definirMotivoDevolucaoEtapaRapida('');
                }}
              >
                Cancelar
              </Botao>
              <Botao
                variante="primario"
                type="button"
                onClick={async () => {
                  if (!String(motivoDevolucaoEtapaRapida || '').trim()) {
                    return;
                  }

                  const alteracao = alteracaoEtapaPendente;
                  const motivoSelecionado = motivoDevolucaoEtapaRapida;
                  definirAlteracaoEtapaPendente(null);
                  definirMotivoDevolucaoEtapaRapida('');
                  await alterarEtapaRapidamente(
                    alteracao.pedido,
                    Number(alteracao.idEtapaPedido),
                    Number(motivoSelecionado)
                  );
                }}
              >
                Confirmar
              </Botao>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CabecalhoGradePedidos({ colunas }) {
  return (
    <div className="cabecalhoLayoutGradePadrao cabecalhoGradePedidos">
      {colunas.map((coluna) => (
        <div key={coluna.id} className={coluna.classe} style={obterEstiloColunaLayout(coluna)}>
          {coluna.rotulo}
        </div>
      ))}
    </div>
  );
}

function LinhaPedido({
  pedido,
  colunas,
  etapasPedido,
  empresa,
  clientes,
  permitirExcluir,
  permitirEdicao,
  permitirAlteracaoEtapa,
  aoAlterarEtapa,
  aoConsultar,
  aoEditar,
  aoExcluir
}) {
  return (
    <div className="linhaLayoutGradePadrao linhaPedido">
      {colunas.map((coluna) => renderizarCelulaPedido({
        coluna,
        pedido,
        etapasPedido,
        empresa,
        clientes,
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

function renderizarCelulaPedido({
  coluna,
  pedido,
  etapasPedido,
  empresa,
  clientes,
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

  if (coluna.id === 'codigo' || coluna.id === 'idPedido') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        <CodigoRegistro valor={pedido.idPedido} />
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'idOrcamento') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        {pedido.idOrcamento ? <CodigoRegistro valor={pedido.idOrcamento} /> : '-'}
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'codigoOrcamentoOrigem') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        {pedido.codigoOrcamentoOrigem ? <CodigoRegistro valor={pedido.codigoOrcamentoOrigem} /> : '-'}
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'cliente') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(pedido.nomeClienteSnapshot)}</TextoGradeClamp>
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'idCliente') {
    const cliente = (Array.isArray(clientes) ? clientes : []).find(
      (item) => String(item.idCliente) === String(pedido.idCliente)
    );

    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        {pedido.idCliente
          ? <CodigoRegistro valor={formatarCodigoCliente(cliente || { idCliente: pedido.idCliente }, empresa).replace('#', '')} />
          : '-'}
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'contato') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(pedido.nomeContatoSnapshot)}</TextoGradeClamp>
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'idContato') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        {pedido.idContato ? <CodigoRegistro valor={pedido.idContato} /> : '-'}
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'usuario') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(pedido.nomeUsuarioSnapshot)}</TextoGradeClamp>
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'idUsuario') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        {pedido.idUsuario ? <CodigoRegistro valor={pedido.idUsuario} /> : '-'}
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'vendedor') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(pedido.nomeVendedorSnapshot)}</TextoGradeClamp>
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'idVendedor') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        {pedido.idVendedor ? <CodigoRegistro valor={pedido.idVendedor} /> : '-'}
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'etapa') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        <div className="campoEtapaGridOrcamento">
          <select
            className="selectEtapaGridOrcamento"
            style={criarEstiloEtapaPedido(pedido.corEtapaPedido)}
            value={pedido.idEtapaPedido ? String(pedido.idEtapaPedido) : ''}
            onChange={(evento) => aoAlterarEtapa(evento.target.value)}
            aria-label={`Alterar etapa do pedido ${pedido.idPedido}`}
            disabled={!permitirAlteracaoEtapa}
            title={!permitirAlteracaoEtapa ? 'Pedido entregue: usuario padrao consulta apenas.' : 'Alterar etapa do pedido'}
          >
            <option value="">Sem etapa</option>
            {etapasPedido.map((etapa) => (
              <option key={etapa.idEtapaPedido} value={etapa.idEtapaPedido}>
                {etapa.descricao}
              </option>
            ))}
          </select>
        </div>
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'idEtapaPedido') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        {pedido.idEtapaPedido ? <CodigoRegistro valor={pedido.idEtapaPedido} /> : '-'}
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'comissao') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        {normalizarPreco(pedido.comissao || 0)}
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'prazoPagamento') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(pedido.nomePrazoPagamentoSnapshot)}</TextoGradeClamp>
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'idPrazoPagamento') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        {pedido.idPrazoPagamento ? <CodigoRegistro valor={pedido.idPrazoPagamento} /> : '-'}
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'metodoPagamento') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(pedido.nomeMetodoPagamentoSnapshot)}</TextoGradeClamp>
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'dataInclusao') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        {formatarDataGridPedido(pedido.dataInclusao)}
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'dataEntrega') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        {formatarDataGridPedido(pedido.dataEntrega)}
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'dataValidade') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        {formatarDataGridPedido(pedido.dataValidade)}
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'observacao') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(pedido.observacao)}</TextoGradeClamp>
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'total') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        {normalizarPreco(pedido.totalPedido)}
      </CelulaLayoutPedido>
    );
  }

  if (coluna.id === 'acoes') {
    return (
      <CelulaLayoutPedido coluna={coluna} {...propriedadesCelula}>
        <AcoesRegistro
          rotuloConsulta="Consultar pedido"
          rotuloEdicao={permitirEdicao ? 'Editar pedido' : 'Pedido entregue: usuario padrao consulta apenas.'}
          rotuloInativacao="Excluir pedido"
          iconeInativacao="limpar"
          exibirInativacao={permitirExcluir}
          desabilitarEdicao={!permitirEdicao}
          aoConsultar={aoConsultar}
          aoEditar={aoEditar}
          aoInativar={aoExcluir}
        />
      </CelulaLayoutPedido>
    );
  }

  return null;
}

function CelulaLayoutPedido({ coluna, children, ...propriedades }) {
  return (
    <div {...propriedades}>
      <span className="rotuloCelulaLayoutGradePadrao">{coluna.rotulo}</span>
      {children}
    </div>
  );
}

function enriquecerPedidos(pedidos, etapasPedido) {
  const etapasPorId = new Map(
    etapasPedido.map((etapa) => [etapa.idEtapaPedido, etapa])
  );

  return pedidos.map((pedido) => ({
    ...pedido,
    totalPedido: Array.isArray(pedido.itens)
      ? pedido.itens.reduce((total, item) => total + (Number(item.valorTotal) || 0), 0)
      : 0,
    nomeEtapaPedidoSnapshot:
      pedido.nomeEtapaPedidoSnapshot
      || etapasPorId.get(pedido.idEtapaPedido)?.descricao
      || '',
    corEtapaPedido: etapasPorId.get(pedido.idEtapaPedido)?.cor || ''
  }));
}

function obterEstiloColunaLayout(coluna) {
  return {
    order: coluna.ordem,
    gridColumn: `span ${Math.max(1, Number(coluna.span || 1))}`
  };
}

function formatarDataGridPedido(valor) {
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

function pedidoBloqueadoParaUsuarioPadrao(pedido, usuarioLogado) {
  return usuarioLogado?.tipo === 'Usuario padrao' && etapaPedidoEhEntregue(pedido?.idEtapaPedido);
}

function entrouNaEtapaEntregue(idEtapaAnterior, idEtapaAtual) {
  return !etapaPedidoEhEntregue(idEtapaAnterior) && etapaPedidoEhEntregue(idEtapaAtual);
}

function etapaPedidoEhEntregue(idEtapaPedido) {
  return Number(idEtapaPedido) === ID_ETAPA_PEDIDO_ENTREGUE;
}

function pedidoEhDevolucao(idTipoPedido) {
  return Number(idTipoPedido) === ID_TIPO_PEDIDO_DEVOLUCAO;
}

function normalizarPayloadPedido(dadosPedido) {
  return {
    idOrcamento: dadosPedido.idOrcamento ? Number(dadosPedido.idOrcamento) : null,
    idCliente: dadosPedido.idCliente ? Number(dadosPedido.idCliente) : null,
    idContato: dadosPedido.idContato ? Number(dadosPedido.idContato) : null,
    idUsuario: dadosPedido.idUsuario ? Number(dadosPedido.idUsuario) : null,
      idVendedor: dadosPedido.idVendedor ? Number(dadosPedido.idVendedor) : null,
      idPrazoPagamento: dadosPedido.idPrazoPagamento ? Number(dadosPedido.idPrazoPagamento) : null,
      idTipoPedido: dadosPedido.idTipoPedido ? Number(dadosPedido.idTipoPedido) : null,
      idEtapaPedido: dadosPedido.idEtapaPedido ? Number(dadosPedido.idEtapaPedido) : null,
      idMotivoDevolucao: dadosPedido.idMotivoDevolucao ? Number(dadosPedido.idMotivoDevolucao) : null,
    comissao: normalizarNumeroDecimal(dadosPedido.comissao),
    dataInclusao: limparTextoOpcional(dadosPedido.dataInclusao),
    dataEntrega: limparTextoOpcional(dadosPedido.dataEntrega),
    dataValidade: limparTextoOpcional(dadosPedido.dataValidade),
    observacao: limparTextoOpcional(dadosPedido.observacao),
    codigoOrcamentoOrigem: dadosPedido.codigoOrcamentoOrigem ? Number(dadosPedido.codigoOrcamentoOrigem) : null,
    nomeClienteSnapshot: limparTextoOpcional(dadosPedido.nomeClienteSnapshot),
    nomeContatoSnapshot: limparTextoOpcional(dadosPedido.nomeContatoSnapshot),
    nomeUsuarioSnapshot: limparTextoOpcional(dadosPedido.nomeUsuarioSnapshot),
      nomeVendedorSnapshot: limparTextoOpcional(dadosPedido.nomeVendedorSnapshot),
      nomeMetodoPagamentoSnapshot: limparTextoOpcional(dadosPedido.nomeMetodoPagamentoSnapshot),
      nomePrazoPagamentoSnapshot: limparTextoOpcional(dadosPedido.nomePrazoPagamentoSnapshot),
      nomeTipoPedidoSnapshot: limparTextoOpcional(dadosPedido.nomeTipoPedidoSnapshot),
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

function obterDataAtualFormatoInput() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
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

async function salvarContatosClienteCadastro(idCliente, contatos) {
  const contatosNormalizados = normalizarContatosClienteCadastro(contatos, idCliente);

  for (const contato of contatosNormalizados) {
    await incluirContato(contato);
  }
}

function normalizarPayloadClienteCadastro(dadosCliente) {
  return {
    idVendedor: Number(dadosCliente.idVendedor),
    idRamo: Number(dadosCliente.idRamo),
    razaoSocial: String(dadosCliente.razaoSocial || '').trim(),
    nomeFantasia: String(dadosCliente.nomeFantasia || '').trim(),
    tipo: String(dadosCliente.tipo || '').trim(),
    cnpj: String(dadosCliente.cnpj || '').trim(),
    inscricaoEstadual: limparTextoOpcional(dadosCliente.inscricaoEstadual),
    status: dadosCliente.status ? 1 : 0,
    email: limparTextoOpcional(dadosCliente.email),
    telefone: limparTextoOpcional(dadosCliente.telefone),
    logradouro: limparTextoOpcional(dadosCliente.logradouro),
    numero: limparTextoOpcional(dadosCliente.numero),
    complemento: limparTextoOpcional(dadosCliente.complemento),
    bairro: limparTextoOpcional(dadosCliente.bairro),
    cidade: limparTextoOpcional(dadosCliente.cidade),
    estado: limparTextoOpcional(dadosCliente.estado)?.toUpperCase(),
    cep: limparTextoOpcional(dadosCliente.cep),
    observacao: limparTextoOpcional(dadosCliente.observacao),
    imagem: limparTextoOpcional(dadosCliente.imagem)
  };
}

function normalizarContatosClienteCadastro(contatos, idCliente) {
  if (!Array.isArray(contatos)) {
    return [];
  }

  return contatos.map((contato) => ({
    idCliente,
    nome: String(contato.nome || '').trim(),
    cargo: limparTextoOpcional(contato.cargo),
    email: limparTextoOpcional(contato.email),
    telefone: limparTextoOpcional(contato.telefone),
    whatsapp: limparTextoOpcional(contato.whatsapp),
    status: contato.status ? 1 : 0,
    principal: contato.principal ? 1 : 0
  }));
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

function criarEstiloEtapaPedido(cor) {
  const corBase = normalizarCorHexadecimal(cor || '#1791e2');

  return {
    background: converterHexParaRgba(corBase, 0.22),
    color: escurecerCorHexadecimal(corBase, 0.18)
  };
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
