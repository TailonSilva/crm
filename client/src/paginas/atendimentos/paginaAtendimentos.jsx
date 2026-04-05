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
import {
  atualizarAtendimento,
  excluirAtendimento,
  incluirAtendimento,
  listarAtendimentosGrid,
  listarCanaisAtendimento,
  listarOrigensAtendimento
} from '../../servicos/atendimentos';
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
  listarCamposOrcamentoConfiguracao,
  listarEtapasPedidoConfiguracao,
  listarEtapasOrcamentoConfiguracao,
  listarMetodosPagamentoConfiguracao,
  listarMotivosPerdaConfiguracao,
  listarPrazosPagamentoConfiguracao
} from '../../servicos/configuracoes';
import { listarEmpresas } from '../../servicos/empresa';
import {
  atualizarOrcamento,
  incluirOrcamento,
  listarOrcamentos
} from '../../servicos/orcamentos';
import { incluirPedido } from '../../servicos/pedidos';
import { listarProdutos } from '../../servicos/produtos';
import { listarUsuarios } from '../../servicos/usuarios';
import {
  normalizarFiltrosPorPadrao,
  normalizarListaFiltroPersistido,
  useFiltrosPersistidos
} from '../../utilitarios/useFiltrosPersistidos';
import { ModalPedido } from '../pedidos/modalPedido';
import { ModalAtendimento } from './modalAtendimento';
import { ModalManualAtendimento } from './modalManualAtendimento';
import {
  normalizarColunasGridAtendimentos,
  TOTAL_COLUNAS_GRID_ATENDIMENTOS
} from '../../utilitarios/colunasGridAtendimentos';
import { obterValorGrid } from '../../utilitarios/valorPadraoGrid';

function criarFiltrosIniciaisAtendimentos(usuarioLogado) {
  return {
    idCliente: '',
    idUsuario: usuarioLogado?.idUsuario ? [String(usuarioLogado.idUsuario)] : [],
    idVendedorCliente: [],
    idCanalAtendimento: [],
    idOrigemAtendimento: [],
    dataInicio: '',
    dataFim: '',
    horaInicioFiltro: '',
    horaFimFiltro: ''
  };
}

function criarFiltrosLimposAtendimentos() {
  return {
    idCliente: '',
    idUsuario: [],
    idVendedorCliente: [],
    idCanalAtendimento: [],
    idOrigemAtendimento: [],
    dataInicio: '',
    dataFim: '',
    horaInicioFiltro: '',
    horaFimFiltro: ''
  };
}

const ID_ETAPA_ORCAMENTO_FECHAMENTO = 1;
const ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO = 2;
const ID_ETAPA_ORCAMENTO_PEDIDO_EXCLUIDO = 3;

export function PaginaAtendimentos({ usuarioLogado }) {
  const [pesquisa, definirPesquisa] = useState('');
  const [atendimentos, definirAtendimentos] = useState([]);
  const [clientes, definirClientes] = useState([]);
  const [contatos, definirContatos] = useState([]);
  const [usuarios, definirUsuarios] = useState([]);
  const [vendedores, definirVendedores] = useState([]);
  const [orcamentos, definirOrcamentos] = useState([]);
  const [metodosPagamento, definirMetodosPagamento] = useState([]);
  const [ramosAtividade, definirRamosAtividade] = useState([]);
  const [canaisAtendimento, definirCanaisAtendimento] = useState([]);
  const [origensAtendimento, definirOrigensAtendimento] = useState([]);
  const [prazosPagamento, definirPrazosPagamento] = useState([]);
  const [etapasOrcamento, definirEtapasOrcamento] = useState([]);
  const [etapasPedido, definirEtapasPedido] = useState([]);
  const [motivosPerda, definirMotivosPerda] = useState([]);
  const [produtos, definirProdutos] = useState([]);
  const [camposOrcamento, definirCamposOrcamento] = useState([]);
  const [camposPedido, definirCamposPedido] = useState([]);
  const [empresa, definirEmpresa] = useState(null);
  const [carregando, definirCarregando] = useState(true);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [modalAberto, definirModalAberto] = useState(false);
  const [modalManualAberto, definirModalManualAberto] = useState(false);
  const [modalFiltrosAberto, definirModalFiltrosAberto] = useState(false);
  const [modalBuscaClienteFiltrosAberto, definirModalBuscaClienteFiltrosAberto] = useState(false);
  const [filtrosEmEdicao, definirFiltrosEmEdicao] = useState(null);
  const [modalPedidoAberto, definirModalPedidoAberto] = useState(false);
  const [atendimentoSelecionado, definirAtendimentoSelecionado] = useState(null);
  const [dadosIniciaisPedido, definirDadosIniciaisPedido] = useState(null);
  const [orcamentoPedidoEmCriacao, definirOrcamentoPedidoEmCriacao] = useState(null);
  const [etapaOrcamentoAtualizadaExternamente, definirEtapaOrcamentoAtualizadaExternamente] = useState(null);
  const [modoModal, definirModoModal] = useState('novo');
  const usuarioSomenteVendedor = usuarioLogado?.tipo === 'Usuario padrao' && usuarioLogado?.idVendedor;
  const usuarioSomenteConsultaConfiguracao = usuarioLogado?.tipo === 'Usuario padrao';
  const filtrosIniciais = useMemo(
    () => criarFiltrosIniciaisAtendimentos(usuarioLogado),
    [usuarioLogado?.idUsuario]
  );
  const [filtros, definirFiltros] = useFiltrosPersistidos({
    chave: 'paginaAtendimentos',
    usuario: usuarioLogado,
    filtrosPadrao: filtrosIniciais,
    normalizarFiltros: normalizarFiltrosAtendimentos
  });

  useEffect(() => {
    carregarContexto();
  }, [usuarioSomenteVendedor, usuarioLogado?.idVendedor]);

  useEffect(() => {
    carregarGradeAtendimentos();
  }, [usuarioSomenteVendedor, usuarioLogado?.idVendedor, usuarioLogado?.idUsuario, pesquisa, JSON.stringify(filtros)]);

  useEffect(() => {
    function tratarEmpresaAtualizada() {
      carregarContexto();
      carregarGradeAtendimentos();
    }

    window.addEventListener('empresa-atualizada', tratarEmpresaAtualizada);

    return () => {
      window.removeEventListener('empresa-atualizada', tratarEmpresaAtualizada);
    };
  }, [usuarioSomenteVendedor, usuarioLogado?.idVendedor, usuarioLogado?.idUsuario, pesquisa, JSON.stringify(filtros)]);

  useEffect(() => {
    function tratarAtalhosAtendimentos(evento) {
      if (evento.key === 'F1') {
        evento.preventDefault();

        if (!modalAberto && !modalManualAberto && !modalFiltrosAberto && !modalPedidoAberto) {
          definirModalManualAberto(true);
        }
      }
    }

    window.addEventListener('keydown', tratarAtalhosAtendimentos);

    return () => {
      window.removeEventListener('keydown', tratarAtalhosAtendimentos);
    };
  }, [modalAberto, modalManualAberto, modalFiltrosAberto, modalPedidoAberto]);

  async function carregarContexto() {
    definirCarregando(true);
    definirMensagemErro('');

    try {
      const [
        clientesCarregados,
        contatosCarregados,
        usuariosCarregados,
        vendedoresCarregados,
        orcamentosCarregados,
        ramosCarregados,
        canaisCarregados,
        origensCarregadas,
        metodosCarregados,
        prazosCarregados,
        etapasOrcamentoCarregadas,
        etapasPedidoCarregadas,
        motivosPerdaCarregados,
        produtosCarregados,
        camposOrcamentoCarregados,
        camposPedidoCarregados,
        empresasCarregadas
      ] = await Promise.all([
        listarClientes(),
        listarContatos(),
        listarUsuarios(),
        listarVendedores(),
        listarOrcamentos(),
        listarRamosAtividade(),
        listarCanaisAtendimento(),
        listarOrigensAtendimento(),
        listarMetodosPagamentoConfiguracao(),
        listarPrazosPagamentoConfiguracao(),
        listarEtapasOrcamentoConfiguracao(),
        listarEtapasPedidoConfiguracao(),
        listarMotivosPerdaConfiguracao(),
        listarProdutos(),
        listarCamposOrcamentoConfiguracao(),
        listarCamposPedidoConfiguracao(),
        listarEmpresas()
      ]);

      const clientesCarteira = usuarioSomenteVendedor
        ? clientesCarregados.filter((cliente) => cliente.idVendedor === usuarioLogado.idVendedor)
        : clientesCarregados;
      const idsClientesCarteira = new Set(clientesCarteira.map((cliente) => cliente.idCliente));
      const contatosCarteira = contatosCarregados.filter((contato) => idsClientesCarteira.has(contato.idCliente));
      definirClientes(clientesCarteira);
      definirContatos(contatosCarteira);
      definirUsuarios(usuariosCarregados);
      definirVendedores(vendedoresCarregados);
      definirOrcamentos(
        enriquecerOrcamentosAtendimento(
          orcamentosCarregados,
          clientesCarregados,
          contatosCarregados,
          usuariosCarregados,
          vendedoresCarregados,
          enriquecerPrazosPagamento(prazosCarregados, metodosCarregados),
          etapasOrcamentoCarregadas,
          produtosCarregados
        ).filter((orcamento) => orcamentoEstaAberto(orcamento))
      );
      definirMetodosPagamento(metodosCarregados);
      definirRamosAtividade(ramosCarregados);
      definirCanaisAtendimento(canaisCarregados);
      definirOrigensAtendimento(origensCarregadas);
      definirPrazosPagamento(enriquecerPrazosPagamento(prazosCarregados, metodosCarregados));
      definirEtapasOrcamento(etapasOrcamentoCarregadas);
      definirEtapasPedido(etapasPedidoCarregadas.map((etapa) => ({
        ...etapa,
        idEtapaPedido: etapa.idEtapaPedido ?? etapa.idEtapa
      })));
      definirMotivosPerda(motivosPerdaCarregados);
      definirProdutos(produtosCarregados.filter((produto) => produto.status !== 0));
      definirCamposOrcamento(camposOrcamentoCarregados);
      definirCamposPedido(camposPedidoCarregados);
      definirEmpresa(empresasCarregadas[0] || null);
    } catch (_erro) {
      definirMensagemErro('Nao foi possivel carregar os atendimentos.');
    } finally {
      definirCarregando(false);
    }
  }

  async function carregarGradeAtendimentos() {
    definirCarregando(true);
    definirMensagemErro('');

    try {
      const atendimentosCarregados = await listarAtendimentosGrid({
        pesquisa,
        filtros: {
          ...filtros,
          ...(usuarioSomenteVendedor
            ? {
              escopoIdVendedor: usuarioLogado?.idVendedor,
              escopoIdUsuario: usuarioLogado?.idUsuario
            }
            : {})
        }
      });

      definirAtendimentos(atendimentosCarregados);
    } catch (_erro) {
      definirMensagemErro('Nao foi possivel carregar os atendimentos.');
    } finally {
      definirCarregando(false);
    }
  }

  async function recarregarPagina() {
    await Promise.all([carregarContexto(), carregarGradeAtendimentos()]);
  }

  async function salvarAtendimento(dadosAtendimento) {
    const estaEditando = modoModal === 'edicao' && Boolean(atendimentoSelecionado?.idAtendimento);

    const payload = normalizarPayloadAtendimento({
      ...dadosAtendimento,
      horaFim: estaEditando
        ? dadosAtendimento.horaFim
        : obterHoraAtualFormatoInput(),
      idUsuario: estaEditando ? atendimentoSelecionado.idUsuario : usuarioLogado.idUsuario
    });

    if (estaEditando) {
      await atualizarAtendimento(atendimentoSelecionado.idAtendimento, payload);
    } else {
      await incluirAtendimento(payload);
    }

    await recarregarPagina();
    fecharModal();
  }

  async function incluirClientePeloAtendimento(dadosCliente) {
    const payload = normalizarPayloadClienteAtendimento({
      ...dadosCliente,
      idVendedor: usuarioSomenteVendedor ? String(usuarioLogado.idVendedor) : dadosCliente.idVendedor
    });

    const clienteSalvo = await incluirCliente(payload);
    await salvarContatosClienteAtendimento(clienteSalvo.idCliente, dadosCliente.contatos || []);
    await recarregarPagina();

    const clientesAtualizados = await listarClientes();
    const clienteCompleto = clientesAtualizados.find((cliente) => cliente.idCliente === clienteSalvo.idCliente);

    return clienteCompleto || clienteSalvo;
  }

  async function incluirOrcamentoPeloAtendimento(dadosOrcamento) {
    const orcamentoSalvo = await incluirOrcamento(normalizarPayloadOrcamento(dadosOrcamento, usuarioLogado));
    await recarregarPagina();
    return orcamentoSalvo;
  }

  async function atualizarOrcamentoPeloAtendimento(dadosOrcamento) {
    const payload = normalizarPayloadOrcamento(dadosOrcamento, usuarioLogado);

    if (!dadosOrcamento?.idOrcamento) {
      return null;
    }

    const orcamentoSalvo = await atualizarOrcamento(dadosOrcamento.idOrcamento, payload);
    await recarregarPagina();
    return orcamentoSalvo;
  }

  async function salvarPrazoPagamentoPeloAtendimento(dadosPrazo) {
    const payload = normalizarPayloadPrazoPagamento(dadosPrazo);
    const registroSalvo = dadosPrazo?.idPrazoPagamento
      ? await atualizarPrazoPagamento(dadosPrazo.idPrazoPagamento, payload)
      : await incluirPrazoPagamento(payload);

    await recarregarPagina();
    return enriquecerPrazoPagamento(registroSalvo, metodosPagamento);
  }

  async function inativarPrazoPagamentoPeloAtendimento(prazo) {
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

  async function atualizarStatusOrcamentoPeloAtendimento({ idOrcamento, idEtapaOrcamento }) {
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

    await recarregarPagina();
    return orcamentoSalvo;
  }

  function abrirPedidoPeloAtendimento(dadosPedido, contexto = null) {
    definirOrcamentoPedidoEmCriacao(contexto);
    definirDadosIniciaisPedido(dadosPedido);
    definirModalPedidoAberto(true);
  }

  async function fecharModalPedido() {
    if (orcamentoPedidoEmCriacao?.idOrcamento) {
      const etapaFechadoSemPedido = obterEtapaFechadoSemPedido(etapasOrcamento);

      if (etapaFechadoSemPedido?.idEtapaOrcamento) {
        await atualizarStatusOrcamentoPeloAtendimento({
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

  async function salvarPedidoPeloAtendimento(dadosPedido) {
    await incluirPedido(normalizarPayloadPedido(dadosPedido));
    await recarregarPagina();
    definirModalPedidoAberto(false);
    definirDadosIniciaisPedido(null);
    definirOrcamentoPedidoEmCriacao(null);
    definirEtapaOrcamentoAtualizadaExternamente(null);
  }

  function abrirNovoAtendimento() {
    definirAtendimentoSelecionado(null);
    definirModoModal('novo');
    definirModalAberto(true);
  }

  function abrirEdicaoAtendimento(atendimento) {
    definirAtendimentoSelecionado(atendimento);
    definirModoModal('edicao');
    definirModalAberto(true);
  }

  function abrirConsultaAtendimento(atendimento) {
    definirAtendimentoSelecionado(atendimento);
    definirModoModal('consulta');
    definirModalAberto(true);
  }

  async function excluirAtendimentoPelaGrade(atendimento) {
    const confirmado = window.confirm(`Deseja realmente excluir o atendimento "${atendimento.assunto}"?`);

    if (!confirmado) {
      return;
    }

    await excluirRegistroAtendimento(atendimento.idAtendimento);
  }

  function fecharModal() {
    definirModalAberto(false);
    definirAtendimentoSelecionado(null);
    definirModoModal('novo');
  }

  async function excluirRegistroAtendimento(idAtendimento) {
    await excluirAtendimento(idAtendimento);
    await recarregarPagina();
    fecharModal();
  }

  function abrirModalFiltrosAtendimentos() {
    definirFiltrosEmEdicao({
      ...filtros,
      idUsuario: Array.isArray(filtros.idUsuario) ? [...filtros.idUsuario] : [],
      idVendedorCliente: Array.isArray(filtros.idVendedorCliente) ? [...filtros.idVendedorCliente] : [],
      idCanalAtendimento: Array.isArray(filtros.idCanalAtendimento) ? [...filtros.idCanalAtendimento] : [],
      idOrigemAtendimento: Array.isArray(filtros.idOrigemAtendimento) ? [...filtros.idOrigemAtendimento] : []
    });
    definirModalFiltrosAberto(true);
  }

  function fecharModalFiltrosAtendimentos() {
    definirModalFiltrosAberto(false);
    definirFiltrosEmEdicao(null);
  }

  const colunasVisiveisAtendimentos = useMemo(
    () => normalizarColunasGridAtendimentos(empresa?.colunasGridAtendimentos),
    [empresa?.colunasGridAtendimentos]
  );
  const filtrosAtivos = JSON.stringify(filtros) !== JSON.stringify(filtrosIniciais);

  return (
    <>
      <header className="cabecalhoPagina">
        <div>
          <h1>Atendimentos</h1>
          <p>Registre e acompanhe os atendimentos comerciais e operacionais do CRM.</p>
        </div>

        <div className="acoesCabecalhoPagina">
          <CampoPesquisa
            valor={pesquisa}
            aoAlterar={definirPesquisa}
            placeholder="Pesquisar atendimentos"
            ariaLabel="Pesquisar atendimentos"
          />
          <Botao
            variante={filtrosAtivos ? 'primario' : 'secundario'}
            icone="filtro"
            somenteIcone
            title="Filtrar"
            aria-label="Filtrar"
            onClick={abrirModalFiltrosAtendimentos}
          />
          <Botao
            variante="primario"
            icone="adicionar"
            somenteIcone
            title="Novo atendimento"
            aria-label="Novo atendimento"
            onClick={abrirNovoAtendimento}
          />
        </div>
      </header>

      <CorpoPagina>
        <GradePadrao
          modo="layout"
          className="gradePadraoPresetAtendimentos"
          classNameTabela="layoutGradePadraoPresetAtendimentos"
          totalColunasLayout={TOTAL_COLUNAS_GRID_ATENDIMENTOS}
          cabecalho={<CabecalhoGradeAtendimentos colunas={colunasVisiveisAtendimentos} />}
          carregando={carregando}
          mensagemErro={mensagemErro}
          temItens={atendimentos.length > 0}
          mensagemCarregando="Carregando atendimentos..."
          mensagemVazia="Nenhum atendimento encontrado."
        >
          {atendimentos.map((atendimento) => (
            <LinhaAtendimento
              key={atendimento.idAtendimento}
              atendimento={atendimento}
              colunas={colunasVisiveisAtendimentos}
              permitirExcluir={usuarioLogado?.tipo === 'Administrador'}
              aoConsultar={() => abrirConsultaAtendimento(atendimento)}
              aoEditar={() => abrirEdicaoAtendimento(atendimento)}
              aoExcluir={() => excluirAtendimentoPelaGrade(atendimento)}
            />
          ))}
        </GradePadrao>
      </CorpoPagina>

      <ModalFiltros
        aberto={modalFiltrosAberto}
        titulo="Filtros de atendimentos"
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
            name: 'idCanalAtendimento',
            label: 'Canal',
            multiple: true,
            placeholder: 'Todos os canais',
            options: canaisAtendimento.map((canal) => ({
              valor: String(canal.idCanalAtendimento),
              label: canal.descricao
            }))
          },
          {
            name: 'idOrigemAtendimento',
            label: 'Origem',
            multiple: true,
            placeholder: 'Todas as origens',
            options: origensAtendimento.map((origem) => ({
              valor: String(origem.idOrigemAtendimento),
              label: origem.descricao
            }))
          },
          {
            name: 'periodosDatasAtendimento',
            label: 'Datas',
            type: 'date-filters-modal',
            tituloSelecao: 'Filtros de datas do atendimento',
            placeholder: 'Selecionar datas',
            periodos: [
              {
                titulo: 'Data do atendimento',
                nomeInicio: 'dataInicio',
                nomeFim: 'dataFim',
                labelInicio: 'Inicio da data',
                labelFim: 'Fim da data'
              },
              {
                titulo: 'Horario do atendimento',
                nomeInicio: 'horaInicioFiltro',
                nomeFim: 'horaFimFiltro',
                labelInicio: 'Hora inicial',
                labelFim: 'Hora final',
                tipoInicio: 'time',
                tipoFim: 'time'
              }
            ]
          },
        ]}
        aoFechar={fecharModalFiltrosAtendimentos}
        aoAplicar={(proximosFiltros) => {
          definirFiltros(proximosFiltros);
          fecharModalFiltrosAtendimentos();
        }}
        aoLimpar={() => definirFiltrosEmEdicao(criarFiltrosLimposAtendimentos())}
      />
      <ModalBuscaClientes
        aberto={modalBuscaClienteFiltrosAberto}
        empresa={empresa}
        clientes={clientes}
        placeholder="Pesquisar cliente no filtro"
        ariaLabelPesquisa="Pesquisar cliente no filtro"
        aoSelecionar={(cliente) => {
          definirFiltrosEmEdicao((estadoAtual) => ({
            ...(estadoAtual || criarFiltrosIniciaisAtendimentos(usuarioLogado)),
            idCliente: String(cliente.idCliente || '')
          }));
          definirModalBuscaClienteFiltrosAberto(false);
        }}
        aoFechar={() => definirModalBuscaClienteFiltrosAberto(false)}
      />

      <ModalManualAtendimento
        aberto={modalManualAberto}
        aoFechar={() => definirModalManualAberto(false)}
        atendimentos={atendimentos}
        canaisAtendimento={canaisAtendimento}
        origensAtendimento={origensAtendimento}
        orcamentos={orcamentos}
        filtros={filtros}
        usuarioLogado={usuarioLogado}
      />

      <ModalAtendimento
        aberto={modalAberto}
        atendimento={atendimentoSelecionado}
        clientes={clientes}
        contatos={contatos}
        usuarioLogado={usuarioLogado}
        vendedores={vendedores}
        ramosAtividade={ramosAtividade}
        canaisAtendimento={canaisAtendimento}
        origensAtendimento={origensAtendimento}
        modo={modoModal}
        permitirExcluir={usuarioLogado?.tipo === 'Administrador'}
        idVendedorBloqueado={usuarioSomenteVendedor ? usuarioLogado.idVendedor : null}
        aoIncluirCliente={incluirClientePeloAtendimento}
        aoIncluirOrcamento={incluirOrcamentoPeloAtendimento}
        aoAtualizarOrcamento={atualizarOrcamentoPeloAtendimento}
        dadosOrcamento={montarDadosIniciaisOrcamentoPeloAtendimento(atendimentoSelecionado, clientes, vendedores, usuarioLogado)}
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
        aoAtualizarStatusOrcamento={atualizarStatusOrcamentoPeloAtendimento}
        aoAbrirPedido={abrirPedidoPeloAtendimento}
        aoSalvarPrazoPagamento={salvarPrazoPagamentoPeloAtendimento}
        aoInativarPrazoPagamento={inativarPrazoPagamentoPeloAtendimento}
        aoFechar={fecharModal}
        aoSalvar={salvarAtendimento}
        aoExcluir={excluirRegistroAtendimento}
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
        aoSalvar={salvarPedidoPeloAtendimento}
        aoSalvarPrazoPagamento={salvarPrazoPagamentoPeloAtendimento}
        aoInativarPrazoPagamento={inativarPrazoPagamentoPeloAtendimento}
      />
    </>
  );
}

function CabecalhoGradeAtendimentos({ colunas }) {
  return (
    <div className="cabecalhoLayoutGradePadrao cabecalhoGradeAtendimentos">
      {colunas.map((coluna) => (
        <div
          key={coluna.id}
          className={coluna.classe}
          style={obterEstiloColunaLayout(coluna)}
        >
          {coluna.rotulo}
        </div>
      ))}
    </div>
  );
}

function LinhaAtendimento({ atendimento, colunas, permitirExcluir, aoConsultar, aoEditar, aoExcluir }) {
  return (
    <div className="linhaLayoutGradePadrao linhaAtendimento">
      {colunas.map((coluna) => renderizarCelulaAtendimento({
        coluna,
        atendimento,
        permitirExcluir,
        aoConsultar,
        aoEditar,
        aoExcluir
      }))}
    </div>
  );
}

function renderizarCelulaAtendimento({ coluna, atendimento, permitirExcluir, aoConsultar, aoEditar, aoExcluir }) {
  const propriedadesCelula = {
    key: coluna.id,
    className: `celulaLayoutGradePadrao ${coluna.classe}`.trim(),
    style: obterEstiloColunaLayout(coluna)
  };

  if (coluna.id === 'data') {
    return (
      <CelulaLayoutAtendimento coluna={coluna} {...propriedadesCelula}>
        {formatarData(atendimento.data)}
      </CelulaLayoutAtendimento>
    );
  }

  if (coluna.id === 'codigo') {
    return (
      <CelulaLayoutAtendimento coluna={coluna} {...propriedadesCelula}>
        <CodigoRegistro valor={atendimento.idAtendimento || 0} />
      </CelulaLayoutAtendimento>
    );
  }

  if (coluna.id === 'agendamento') {
    return (
      <CelulaLayoutAtendimento coluna={coluna} {...propriedadesCelula}>
        {atendimento.idAgendamento ? <CodigoRegistro valor={atendimento.idAgendamento} /> : '-'}
      </CelulaLayoutAtendimento>
    );
  }

  if (coluna.id === 'horaInicio') {
    return (
      <CelulaLayoutAtendimento coluna={coluna} {...propriedadesCelula}>
        {formatarHoraAtendimento(atendimento.horaInicio)}
      </CelulaLayoutAtendimento>
    );
  }

  if (coluna.id === 'horaFim') {
    return (
      <CelulaLayoutAtendimento coluna={coluna} {...propriedadesCelula}>
        {formatarHoraAtendimento(atendimento.horaFim)}
      </CelulaLayoutAtendimento>
    );
  }

  if (coluna.id === 'cliente') {
    return (
      <CelulaLayoutAtendimento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(atendimento.nomeCliente)}</TextoGradeClamp>
      </CelulaLayoutAtendimento>
    );
  }

  if (coluna.id === 'contato') {
    return (
      <CelulaLayoutAtendimento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(atendimento.nomeContato)}</TextoGradeClamp>
      </CelulaLayoutAtendimento>
    );
  }

  if (coluna.id === 'assunto') {
    return (
      <CelulaLayoutAtendimento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(atendimento.assunto)}</TextoGradeClamp>
      </CelulaLayoutAtendimento>
    );
  }

  if (coluna.id === 'descricao') {
    return (
      <CelulaLayoutAtendimento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(atendimento.descricao)}</TextoGradeClamp>
      </CelulaLayoutAtendimento>
    );
  }

  if (coluna.id === 'canal') {
    return (
      <CelulaLayoutAtendimento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(atendimento.nomeCanalAtendimento)}</TextoGradeClamp>
      </CelulaLayoutAtendimento>
    );
  }

  if (coluna.id === 'origem') {
    return (
      <CelulaLayoutAtendimento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(atendimento.nomeOrigemAtendimento)}</TextoGradeClamp>
      </CelulaLayoutAtendimento>
    );
  }

  if (coluna.id === 'usuario') {
    return (
      <CelulaLayoutAtendimento coluna={coluna} {...propriedadesCelula}>
        <TextoGradeClamp>{obterValorGrid(atendimento.nomeUsuario)}</TextoGradeClamp>
      </CelulaLayoutAtendimento>
    );
  }

  if (coluna.id === 'acoes') {
    return (
      <CelulaLayoutAtendimento coluna={coluna} {...propriedadesCelula}>
        <AcoesRegistro
          rotuloConsulta="Consultar atendimento"
          rotuloEdicao="Editar atendimento"
          rotuloInativacao="Excluir atendimento"
          iconeInativacao="limpar"
          exibirInativacao={permitirExcluir}
          aoConsultar={aoConsultar}
          aoEditar={aoEditar}
          aoInativar={aoExcluir}
        />
      </CelulaLayoutAtendimento>
    );
  }

  return null;
}

function CelulaLayoutAtendimento({ coluna, children, ...propriedades }) {
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

function normalizarFiltrosAtendimentos(filtros, filtrosPadrao) {
  const filtrosNormalizados = normalizarFiltrosPorPadrao(filtros, filtrosPadrao);

  return {
    ...filtrosNormalizados,
    idUsuario: normalizarListaFiltroPersistido(filtrosNormalizados.idUsuario),
    idVendedorCliente: normalizarListaFiltroPersistido(filtrosNormalizados.idVendedorCliente),
    idCanalAtendimento: normalizarListaFiltroPersistido(filtrosNormalizados.idCanalAtendimento),
    idOrigemAtendimento: normalizarListaFiltroPersistido(filtrosNormalizados.idOrigemAtendimento),
    ...normalizarIntervaloAtendimento(filtrosNormalizados, filtrosPadrao, 'dataInicio', 'dataFim', normalizarDataFiltroAtendimento),
    ...normalizarIntervaloAtendimento(filtrosNormalizados, filtrosPadrao, 'horaInicioFiltro', 'horaFimFiltro', normalizarHoraFiltroAtendimento)
  };
}

function enriquecerAtendimentos(
  atendimentos,
  clientes,
  contatos,
  usuarios,
  vendedores,
  canaisAtendimento,
  origensAtendimento
) {
  const clientesPorId = new Map(
    clientes.map((cliente) => [
      cliente.idCliente,
      {
        nome: cliente.nomeFantasia || cliente.razaoSocial,
        idVendedor: cliente.idVendedor
      }
    ])
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
  const canaisPorId = new Map(
    canaisAtendimento.map((canal) => [canal.idCanalAtendimento, canal.descricao])
  );
  const origensPorId = new Map(
    origensAtendimento.map((origem) => [origem.idOrigemAtendimento, origem.descricao])
  );

  return atendimentos.map((atendimento) => ({
    ...atendimento,
    nomeCliente: obterValorGrid(clientesPorId.get(atendimento.idCliente)?.nome),
    idVendedorCliente: clientesPorId.get(atendimento.idCliente)?.idVendedor || null,
    nomeContato: obterValorGrid(contatosPorId.get(atendimento.idContato)),
    nomeUsuario: obterValorGrid(usuariosPorId.get(atendimento.idUsuario)),
    nomeVendedorCliente: obterValorGrid(vendedoresPorId.get(clientesPorId.get(atendimento.idCliente)?.idVendedor)),
    nomeCanalAtendimento: obterValorGrid(canaisPorId.get(atendimento.idCanalAtendimento)),
    nomeOrigemAtendimento: obterValorGrid(origensPorId.get(atendimento.idOrigemAtendimento))
  }));
}

function normalizarPayloadAtendimento(dadosAtendimento) {
  return {
    idCliente: Number(dadosAtendimento.idCliente),
    idContato: dadosAtendimento.idContato ? Number(dadosAtendimento.idContato) : null,
    idUsuario: Number(dadosAtendimento.idUsuario),
    assunto: String(dadosAtendimento.assunto || '').trim(),
    descricao: limparTextoOpcional(dadosAtendimento.descricao),
    data: dadosAtendimento.data,
    horaInicio: dadosAtendimento.horaInicio,
    horaFim: dadosAtendimento.horaFim,
    idCanalAtendimento: dadosAtendimento.idCanalAtendimento ? Number(dadosAtendimento.idCanalAtendimento) : null,
    idOrigemAtendimento: dadosAtendimento.idOrigemAtendimento ? Number(dadosAtendimento.idOrigemAtendimento) : null
  };
}

function limparTextoOpcional(valor) {
  const texto = String(valor || '').trim();
  return texto || null;
}

async function salvarContatosClienteAtendimento(idCliente, contatos) {
  const contatosNormalizados = normalizarContatosClienteAtendimento(contatos, idCliente);

  for (const contato of contatosNormalizados) {
    await incluirContato(contato);
  }
}

function normalizarPayloadClienteAtendimento(dadosCliente) {
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

function normalizarContatosClienteAtendimento(contatos, idCliente) {
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

function formatarData(data) {
  if (!data) {
    return '-';
  }

  const [ano, mes, dia] = String(data).split('T')[0].split('-');

  if (!ano || !mes || !dia) {
    return '-';
  }

  return `${dia}/${mes}/${ano}`;
}

function normalizarIntervaloAtendimento(filtros, filtrosPadrao, chaveInicio, chaveFim, normalizador) {
  const valorInicio = normalizador(filtros?.[chaveInicio]) || normalizador(filtrosPadrao?.[chaveInicio]);
  const valorFim = normalizador(filtros?.[chaveFim]) || normalizador(filtrosPadrao?.[chaveFim]);

  if (valorInicio && valorFim && valorInicio > valorFim) {
    return {
      [chaveInicio]: valorFim,
      [chaveFim]: valorInicio
    };
  }

  return {
    [chaveInicio]: valorInicio,
    [chaveFim]: valorFim
  };
}

function validarPeriodoAtendimento(valor, inicio, fim, normalizador) {
  const valorNormalizado = normalizador(valor);

  if (!inicio && !fim) {
    return true;
  }

  if (!valorNormalizado) {
    return false;
  }

  if (inicio && valorNormalizado < inicio) {
    return false;
  }

  if (fim && valorNormalizado > fim) {
    return false;
  }

  return true;
}

function normalizarDataFiltroAtendimento(valor) {
  const texto = String(valor || '').trim();

  if (!texto) {
    return '';
  }

  return texto.slice(0, 10);
}

function normalizarHoraFiltroAtendimento(valor) {
  const texto = String(valor || '').trim();

  if (!texto) {
    return '';
  }

  return texto.slice(0, 5);
}

function formatarHoraAtendimento(hora) {
  const texto = String(hora || '').trim();
  return texto || '-';
}

function obterHoraAtualFormatoInput() {
  const agora = new Date();
  const horas = String(agora.getHours()).padStart(2, '0');
  const minutos = String(agora.getMinutes()).padStart(2, '0');

  return `${horas}:${minutos}`;
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

function enriquecerOrcamentosAtendimento(orcamentos, clientes, contatos, usuarios, vendedores, prazosPagamento, etapasOrcamento, produtos) {
  const clientesPorId = new Map(clientes.map((cliente) => [cliente.idCliente, cliente]));
  const contatosPorId = new Map(contatos.map((contato) => [contato.idContato, contato.nome]));
  const usuariosPorId = new Map(usuarios.map((usuario) => [usuario.idUsuario, usuario.nome]));
  const vendedoresPorId = new Map(vendedores.map((vendedor) => [vendedor.idVendedor, vendedor.nome]));
  const prazosPorId = new Map(prazosPagamento.map((prazo) => [prazo.idPrazoPagamento, prazo]));
  const etapasPorId = new Map(etapasOrcamento.map((etapa) => [etapa.idEtapaOrcamento, etapa]));
  const produtosPorId = new Map(produtos.map((produto) => [produto.idProduto, produto]));

  return orcamentos.map((orcamento) => {
    const cliente = clientesPorId.get(orcamento.idCliente);

    return {
      ...orcamento,
      nomeCliente: obterValorGrid(cliente?.nomeFantasia || cliente?.razaoSocial),
      nomeContato: obterValorGrid(contatosPorId.get(orcamento.idContato)),
      nomeUsuario: obterValorGrid(usuariosPorId.get(orcamento.idUsuario)),
      nomeVendedor: obterValorGrid(vendedoresPorId.get(orcamento.idVendedor)),
      nomePrazoPagamento: obterValorGrid(prazosPorId.get(orcamento.idPrazoPagamento)?.descricaoFormatada),
      nomeEtapaOrcamento: obterValorGrid(etapasPorId.get(orcamento.idEtapaOrcamento)?.descricao),
      itens: Array.isArray(orcamento.itens) ? orcamento.itens.map((item) => ({
        ...item,
        nomeProduto: obterValorGrid(produtosPorId.get(item.idProduto)?.descricao || item.nomeProduto)
      })) : []
    };
  });
}

function orcamentoEstaAberto(orcamento) {
  const idEtapa = Number(orcamento?.idEtapaOrcamento);

  return ![
    ID_ETAPA_ORCAMENTO_FECHAMENTO,
    ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO,
    ID_ETAPA_ORCAMENTO_PEDIDO_EXCLUIDO
  ].includes(idEtapa);
}

function etapaAcabouDeFechar(idEtapaAnterior, idEtapaAtual, etapasOrcamento) {
  const etapaAnterior = etapasOrcamento.find((etapa) => String(etapa.idEtapaOrcamento) === String(idEtapaAnterior || ''));
  const etapaAtual = etapasOrcamento.find((etapa) => String(etapa.idEtapaOrcamento) === String(idEtapaAtual || ''));

  return !etapaOrcamentoEhFechamento(etapaAnterior) && etapaOrcamentoEhFechamento(etapaAtual);
}

function etapaOrcamentoEhFechamento(etapa) {
  return Number(etapa?.idEtapaOrcamento) === ID_ETAPA_ORCAMENTO_FECHAMENTO;
}

function obterEtapaFechadoSemPedido(etapasOrcamento) {
  return etapasOrcamento.find((etapa) => Number(etapa?.idEtapaOrcamento) === ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO) || null;
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
    observacao: limparTextoOpcional(dadosOrcamento.observacao),
    itens: Array.isArray(dadosOrcamento.itens) ? dadosOrcamento.itens.map((item) => ({
      idProduto: Number(item.idProduto),
      quantidade: normalizarNumeroDecimal(item.quantidade),
      valorUnitario: normalizarNumeroDecimal(item.valorUnitario),
      valorTotal: normalizarNumeroDecimal(item.valorTotal),
      imagem: limparTextoOpcional(item.imagem),
      observacao: limparTextoOpcional(item.observacao)
    })) : [],
    camposExtras: Array.isArray(dadosOrcamento.camposExtras) ? dadosOrcamento.camposExtras.map((campo) => ({
      idCampoOrcamento: Number(campo.idCampoOrcamento),
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

function enriquecerOrcamentoParaPedido(orcamento, contexto) {
  const cliente = contexto.clientes.find((item) => String(item.idCliente) === String(orcamento.idCliente));
  const contato = contexto.contatos.find((item) => String(item.idContato) === String(orcamento.idContato));
  const usuario = contexto.usuarios.find((item) => String(item.idUsuario) === String(orcamento.idUsuario));
  const vendedor = contexto.vendedores.find((item) => String(item.idVendedor) === String(orcamento.idVendedor));
  const prazo = contexto.prazosPagamento.find((item) => String(item.idPrazoPagamento) === String(orcamento.idPrazoPagamento));

  return {
    ...orcamento,
    nomeCliente: orcamento.nomeCliente || cliente?.nomeFantasia || cliente?.razaoSocial || '',
    nomeContato: orcamento.nomeContato || contato?.nome || '',
    nomeUsuario: orcamento.nomeUsuario || usuario?.nome || '',
    nomeVendedor: orcamento.nomeVendedor || vendedor?.nome || '',
    nomePrazoPagamento: orcamento.nomePrazoPagamento || prazo?.descricaoFormatada || prazo?.descricao || '',
    nomeMetodoPagamento: orcamento.nomeMetodoPagamento || prazo?.nomeMetodoPagamento || '',
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
