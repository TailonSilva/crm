import { useEffect, useMemo, useState } from 'react';
import '../../recursos/estilos/paginaInicio.css';
import { CorpoPagina } from '../../componentes/layout/corpoPagina';
import { listarAgendamentos } from '../../servicos/agenda';
import { listarAtendimentosGrid } from '../../servicos/atendimentos';
import { listarClientes, listarVendedores } from '../../servicos/clientes';
import {
  listarEtapasOrcamentoConfiguracao,
  listarEtapasPedidoConfiguracao,
  listarMotivosPerdaConfiguracao,
  listarMotivosDevolucaoConfiguracao
} from '../../servicos/configuracoes';
import { listarEmpresas } from '../../servicos/empresa';
import { listarOrcamentos } from '../../servicos/orcamentos';
import { listarPedidos } from '../../servicos/pedidos';
import { listarGruposProduto, listarMarcas, listarProdutos } from '../../servicos/produtos';
import { formatarCodigoCliente } from '../../utilitarios/codigoCliente';
import { normalizarPreco } from '../../utilitarios/normalizarPreco';
import { registroEstaAtivo } from '../../utilitarios/statusRegistro';
import { normalizarConfiguracoesCardsPaginaInicial } from '../../utilitarios/cardsPaginaInicial';
import { CabecalhoInicio } from './componentes/cabecalhoInicio';
import { IndicadorConfiguravelInicio } from './componentes/indicadorConfiguravelInicio';
import { IndicadorResumoInicio } from './componentes/indicadorResumoInicio';
import { SecaoDevolucoesInicio } from './componentes/secaoDevolucoesInicio';
import { SecaoFunilOrcamentosInicio } from './componentes/secaoFunilOrcamentosInicio';
import { SecaoMotivosPerdaInicio } from './componentes/secaoMotivosPerdaInicio';
import { SecaoOrcamentosGrupoProdutosInicio } from './componentes/secaoOrcamentosGrupoProdutosInicio';
import { SecaoOrcamentosMarcaInicio } from './componentes/secaoOrcamentosMarcaInicio';
import { SecaoOrcamentosProdutosInicio } from './componentes/secaoOrcamentosProdutosInicio';
import { SecaoRankingInicio } from './componentes/secaoRankingInicio';
import { SecaoVendasGrupoProdutosInicio } from './componentes/secaoVendasGrupoProdutosInicio';
import { SecaoVendasMarcaInicio } from './componentes/secaoVendasMarcaInicio';
import { SecaoVendasClientesInicio } from './componentes/secaoVendasClientesInicio';
import { SecaoVendasProdutosInicio } from './componentes/secaoVendasProdutosInicio';
import { SecaoVendasUfInicio } from './componentes/secaoVendasUfInicio';
import { SecaoConfiguravelInicio } from './componentes/secaoConfiguravelInicio';
import { ModalManualInicio } from './modalManualInicio';
import { criarResumoFunilVendas } from './utilitarios/criarResumoFunilVendas';

const IDS_ETAPAS_ORCAMENTO_FECHADAS = new Set([1, 2, 3, 4]);
const ID_ETAPA_PEDIDO_ENTREGUE = 5;
const ID_TIPO_PEDIDO_DEVOLUCAO = 2;

export function PaginaInicio({ usuarioLogado }) {
  const [carregando, definirCarregando] = useState(true);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [painelBruto, definirPainelBruto] = useState(null);
  const [abaAtiva, definirAbaAtiva] = useState('orcamentos');
  const [modalManualAberto, definirModalManualAberto] = useState(false);

  useEffect(() => {
    carregarPainel();
  }, [usuarioLogado?.idUsuario, usuarioLogado?.idVendedor, usuarioLogado?.tipo]);

  useEffect(() => {
    function tratarEmpresaAtualizada() {
      carregarPainel();
    }

    window.addEventListener('empresa-atualizada', tratarEmpresaAtualizada);

    return () => {
      window.removeEventListener('empresa-atualizada', tratarEmpresaAtualizada);
    };
  }, [usuarioLogado?.idUsuario, usuarioLogado?.idVendedor, usuarioLogado?.tipo]);

  useEffect(() => {
    function tratarAtalhoManual(evento) {
      if (evento.key !== 'F1') {
        return;
      }

      evento.preventDefault();
      if (!modalManualAberto) {
        definirModalManualAberto(true);
      }
    }

    window.addEventListener('keydown', tratarAtalhoManual);

    return () => {
      window.removeEventListener('keydown', tratarAtalhoManual);
    };
  }, [modalManualAberto]);

  const painel = useMemo(
    () => montarPainel(painelBruto, usuarioLogado),
    [painelBruto, usuarioLogado]
  );
  const secoesOrcamentosConfiguradas = useMemo(
    () => montarSecoesOrcamentos(painel),
    [painel]
  );
  const indicadoresConfigurados = useMemo(
    () => montarIndicadoresConfigurados(painel),
    [painel]
  );
  const secoesVendasConfiguradas = useMemo(
    () => montarSecoesVendas(painel),
    [painel]
  );

  async function carregarPainel() {
    definirCarregando(true);
    definirMensagemErro('');

    try {
      const recorteUsuarioPadrao = usuarioLogado?.tipo === 'Usuario padrao' && usuarioLogado?.idVendedor
        ? {
          escopoIdVendedor: usuarioLogado.idVendedor,
          escopoIdUsuario: usuarioLogado.idUsuario
        }
        : {};
      const hoje = new Date();
      const dataInicioAgenda = dataInput(hoje);
      const dataFimAgenda = dataInput(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 7));
      const resultados = await Promise.allSettled([
        listarClientes(),
        listarVendedores(),
        listarAtendimentosGrid({
          filtros: recorteUsuarioPadrao
        }),
        listarAgendamentos({
          dataInicio: dataInicioAgenda,
          dataFim: dataFimAgenda,
          ...recorteUsuarioPadrao
        }),
        listarOrcamentos(recorteUsuarioPadrao),
        listarPedidos(recorteUsuarioPadrao),
        listarProdutos(),
        listarGruposProduto(),
        listarMarcas(),
        listarEtapasOrcamentoConfiguracao(),
        listarEtapasPedidoConfiguracao(),
        listarMotivosPerdaConfiguracao(),
        listarMotivosDevolucaoConfiguracao(),
        listarEmpresas()
      ]);

      const [
        clientesResultado,
        vendedoresResultado,
        atendimentosResultado,
        agendamentosResultado,
        orcamentosResultado,
        pedidosResultado,
        produtosResultado,
        gruposProdutoResultado,
        marcasResultado,
        etapasOrcamentoResultado,
        etapasPedidoResultado,
        motivosPerdaResultado,
        motivosDevolucaoResultado,
        empresasResultado
      ] = resultados;

      const clientes = clientesResultado.status === 'fulfilled' ? clientesResultado.value : [];
      const vendedores = vendedoresResultado.status === 'fulfilled' ? vendedoresResultado.value : [];
      const atendimentos = atendimentosResultado.status === 'fulfilled' ? atendimentosResultado.value : [];
      const agendamentos = agendamentosResultado.status === 'fulfilled' ? agendamentosResultado.value : [];
      const orcamentos = orcamentosResultado.status === 'fulfilled' ? orcamentosResultado.value : [];
      const pedidos = pedidosResultado.status === 'fulfilled' ? pedidosResultado.value : [];
      const produtos = produtosResultado.status === 'fulfilled' ? produtosResultado.value : [];
      const gruposProduto = gruposProdutoResultado.status === 'fulfilled' ? gruposProdutoResultado.value : [];
      const marcas = marcasResultado.status === 'fulfilled' ? marcasResultado.value : [];
      const etapasOrcamento = etapasOrcamentoResultado.status === 'fulfilled' ? etapasOrcamentoResultado.value : [];
      const etapasPedido = etapasPedidoResultado.status === 'fulfilled' ? etapasPedidoResultado.value : [];
      const motivosPerda = motivosPerdaResultado.status === 'fulfilled' ? motivosPerdaResultado.value : [];
      const motivosDevolucao = motivosDevolucaoResultado.status === 'fulfilled' ? motivosDevolucaoResultado.value : [];
      const empresas = empresasResultado.status === 'fulfilled' ? empresasResultado.value : [];

      definirPainelBruto({
        clientes,
        vendedores,
        atendimentos,
        agendamentos,
        orcamentos,
        pedidos,
        produtos,
        gruposProduto,
        marcas,
        etapasOrcamento,
        etapasPedido,
        motivosPerda,
        motivosDevolucao,
        empresa: empresas[0] || null
      });
    } catch (_erro) {
      definirMensagemErro('Nao foi possivel carregar a dashboard inicial.');
    } finally {
      definirCarregando(false);
    }
  }

  return (
    <>
      <CabecalhoInicio
        descricao={painel.descricao}
        resumo={painel.resumo}
        abas={[
          { id: 'orcamentos', rotulo: 'Orcamentos' },
          { id: 'vendas', rotulo: 'Vendas' }
        ]}
        abaAtiva={abaAtiva}
        aoSelecionarAba={definirAbaAtiva}
      />

      <CorpoPagina>
        {mensagemErro ? (
          <section className="paginaInicioPainel">
            <div className="paginaInicioPainelCabecalho">
              <div>
                <h3>Painel indisponivel</h3>
                <p>{mensagemErro}</p>
              </div>
            </div>
          </section>
        ) : (
          <div className="paginaInicioLayout">
            <div className="paginaInicioGradeIndicadores">
              {indicadoresConfigurados.map((indicador) => (
                <IndicadorConfiguravelInicio key={indicador.id} colunas={indicador.span}>
                  <IndicadorResumoInicio
                    ariaLabel={indicador.titulo}
                    carregando={carregando}
                    {...indicador}
                  />
                </IndicadorConfiguravelInicio>
              ))}
            </div>

            <div className="paginaInicioSecoes">
              {abaAtiva === 'orcamentos' ? (
                secoesOrcamentosConfiguradas.map((secao) => (
                  <SecaoConfiguravelInicio key={secao.id} colunas={secao.span}>
                    {secao.renderizar()}
                  </SecaoConfiguravelInicio>
                ))
              ) : (
                secoesVendasConfiguradas.map((secao) => (
                  <SecaoConfiguravelInicio key={secao.id} colunas={secao.span}>
                    {secao.renderizar()}
                  </SecaoConfiguravelInicio>
                ))
              )}

            </div>
          </div>
        )}
      </CorpoPagina>

      <ModalManualInicio
        aberto={modalManualAberto}
        aoFechar={() => definirModalManualAberto(false)}
        usuarioLogado={usuarioLogado}
      />
    </>
  );
}

function montarPainel(dados, usuarioLogado) {
  const base = criarPainelBase(usuarioLogado);

  if (!dados) {
    return base;
  }

  const clientesVisiveis = filtrarClientesVisiveis(dados.clientes, usuarioLogado);
  const idsClientes = new Set(clientesVisiveis.map((cliente) => String(cliente.idCliente)));
  const clientesPorId = new Map(clientesVisiveis.map((cliente) => [
    String(cliente.idCliente),
    cliente.nomeFantasia || cliente.razaoSocial || '-'
  ]));
  const vendedoresPorId = new Map((dados.vendedores || []).map((vendedor) => [String(vendedor.idVendedor), vendedor.nome]));
  const clientesAtivos = clientesVisiveis.filter((item) => registroEstaAtivo(item.status));
  const produtosAtivos = (dados.produtos || []).filter((item) => registroEstaAtivo(item.status));
  const orcamentos = filtrarOrcamentosVisiveis(dados.orcamentos, idsClientes, usuarioLogado);
  const pedidos = filtrarPedidosVisiveis(dados.pedidos, idsClientes, usuarioLogado);
  const atendimentos = filtrarAtendimentosVisiveis(dados.atendimentos, idsClientes, usuarioLogado);
  const agendamentos = filtrarAgendamentosVisiveis(dados.agendamentos, idsClientes, usuarioLogado);
  const inicioMes = dataInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const fimMes = dataInput(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const hoje = dataInput(new Date());
  const orcamentosAbertos = orcamentos.filter((item) => !orcamentoEhFechado(item));
  const orcamentosMes = orcamentos.filter((item) => dataNoPeriodo(item.dataInclusao, inicioMes, fimMes));
  const pedidosMes = pedidos.filter((item) => dataNoPeriodo(item.dataInclusao, inicioMes, fimMes));
  const positivacaoMes = new Set(
    pedidosMes
      .map((item) => Number(item?.idCliente))
      .filter((idCliente) => Number.isFinite(idCliente) && idCliente > 0)
  ).size;
  const idsClientesAtivos = new Set(
    clientesAtivos
      .map((cliente) => Number(cliente?.idCliente))
      .filter((idCliente) => Number.isFinite(idCliente) && idCliente > 0)
  );
  const positivacaoCarteiraMes = new Set(
    pedidosMes
      .map((item) => Number(item?.idCliente))
      .filter((idCliente) => idsClientesAtivos.has(idCliente))
  ).size;
  const percentualPositivacaoCarteiraMes = clientesAtivos.length > 0
    ? (positivacaoCarteiraMes / clientesAtivos.length) * 100
    : 0;
  const pedidosEntregaMes = pedidos.filter((item) => dataNoPeriodo(item.dataEntrega, inicioMes, fimMes));
  const devolucoesMes = pedidos.filter((item) => (
    Number(item.idTipoPedido) === ID_TIPO_PEDIDO_DEVOLUCAO
    && dataNoPeriodo(item.dataInclusao, inicioMes, fimMes)
  ));
  const atendimentosMes = atendimentos.filter((item) => dataNoPeriodo(item.data, inicioMes, fimMes));
  const valorAberto = somarTotais(orcamentosAbertos);
  const faturamentoMes = somarTotais(pedidosEntregaMes);
  const comissaoMes = somarComissoes(pedidosMes);
  const ticketMedio = pedidosEntregaMes.length ? faturamentoMes / pedidosEntregaMes.length : 0;
  const convertidosMes = orcamentosMes.filter((item) => Boolean(item.idPedidoVinculado)).length;
  const taxaConversaoMes = orcamentosMes.length ? (convertidosMes / orcamentosMes.length) * 100 : 0;
  const orcamentosVencidos = orcamentosAbertos.filter((item) => dataAnterior(item.dataValidade, hoje)).length;
  const orcamentosVencendo = orcamentosAbertos.filter((item) => dataNosProximosDias(item.dataValidade, 7)).length;
  const pedidosEntregaProxima = pedidos.filter((item) => pedidoPendente(item) && dataNosProximosDias(item.dataEntrega, 7)).length;
  const clientesSemAtendimento = contarClientesSemAtendimento(clientesVisiveis, atendimentos, 30);
  const agenda = agendamentos
    .filter((item) => criarDataHoraAgendamento(item))
    .filter((item) => dataNosProximosDias(criarDataHoraAgendamento(item), 7))
    .sort((a, b) => criarDataHoraAgendamento(a) - criarDataHoraAgendamento(b))
    .slice(0, 5)
    .map((item) => ({
      id: item.idAgendamento,
      assunto: item.assunto || 'Compromisso agendado',
      dataHora: formatarAgendamento(item),
      detalhe: clientesPorId.get(String(item.idCliente)) || 'Sem cliente vinculado',
      ajuda: {
        conceito: 'Compromisso futuro dentro do recorte visivel da agenda.',
        calculo: 'Entram apenas registros agendados entre hoje e os proximos 7 dias.',
        observacao: 'Para usuario padrao, o recorte considera o proprio usuario e sua carteira.'
      }
    }));
  const funil = montarFunil(criarResumoFunilVendas(dados.etapasOrcamento, orcamentosAbertos));
  const orcamentosRecusadosMes = orcamentos.filter((item) => (
    Number(item.idEtapaOrcamento) === 4
    && dataNoPeriodo(item.dataFechamento || item.dataInclusao, inicioMes, fimMes)
  ));
  const devolucoes = montarResumoDevolucoes(devolucoesMes, dados.motivosDevolucao);
  const motivosPerda = montarResumoMotivosPerda(orcamentosRecusadosMes, dados.motivosPerda);
  const orcamentosPorGrupo = montarResumoPorRelacionamento(
    orcamentosAbertos,
    dados.produtos,
    dados.gruposProduto,
    'idGrupo',
    'idGrupo',
    'descricao',
    'Sem grupo',
    {
      chaveRegistroId: 'idOrcamento',
      sufixoQuantidadeRegistros: 'orc.'
    }
  );
  const orcamentosPorMarca = montarResumoPorRelacionamento(
    orcamentosAbertos,
    dados.produtos,
    dados.marcas,
    'idMarca',
    'idMarca',
    'descricao',
    'Sem marca',
    {
      chaveRegistroId: 'idOrcamento',
      sufixoQuantidadeRegistros: 'orc.'
    }
  );
  const orcamentosPorProduto = montarResumoPorRelacionamento(
    orcamentosAbertos,
    dados.produtos,
    dados.produtos,
    'idProduto',
    'idProduto',
    'descricao',
    'Sem produto',
    {
      chaveRegistroId: 'idOrcamento',
      sufixoQuantidadeRegistros: 'orc.'
    }
  );
  const vendasPorGrupo = montarResumoPorRelacionamento(
    pedidosMes,
    dados.produtos,
    dados.gruposProduto,
    'idGrupo',
    'idGrupo',
    'descricao',
    'Sem grupo'
  );
  const vendasPorMarca = montarResumoPorRelacionamento(
    pedidosMes,
    dados.produtos,
    dados.marcas,
    'idMarca',
    'idMarca',
    'descricao',
    'Sem marca'
  );
  const vendasPorProduto = montarResumoPorRelacionamento(
    pedidosMes,
    dados.produtos,
    dados.produtos,
    'idProduto',
    'idProduto',
    'descricao',
    'Sem produto'
  );
  const vendasPorUf = montarResumoPorUf(pedidosMes, clientesVisiveis);
  const vendasPorCliente = montarResumoPorCliente(pedidosMes, clientesVisiveis, dados.empresa);

  return {
    ...base,
    empresa: dados.empresa || null,
    resumo: usuarioLogado?.tipo === 'Usuario padrao'
      ? `${clientesVisiveis.length} clientes na sua carteira`
      : `${clientesVisiveis.length} clientes no acompanhamento`,
    indicadores: [
      {
        id: 'orcamentosAbertos',
        icone: 'orcamento',
        titulo: 'Orcamentos em aberto',
        valor: String(orcamentosAbertos.length),
        descricao: 'Negociacoes ainda ativas no funil.',
        destaque: normalizarPreco(valorAberto),
        ajuda: {
          composicao: 'Quantidade de orcamentos em aberto e valor total desses orcamentos.',
          periodo: 'Posicao atual da carteira visivel na data de hoje.'
        }
      },
      {
        id: 'pedidosMes',
        icone: 'pedido',
        titulo: 'Pedidos no mes',
        valor: String(pedidosMes.length),
        descricao: 'Pedidos gerados no mes atual.',
        destaque: normalizarPreco(faturamentoMes),
        ajuda: {
          composicao: 'Quantidade de pedidos e valor liquido dos itens.',
          periodo: 'Mes corrente pela data de inclusao do pedido.'
        }
      },
      {
        id: 'comissaoMes',
        icone: 'pagamento',
        titulo: 'Comissao no mes',
        valor: normalizarPreco(comissaoMes),
        descricao: 'Comissao liquida dos pedidos do mes atual.',
        ajuda: {
          composicao: 'Soma da comissao de cada pedido (total liquido x % comissao).',
          periodo: 'Mes corrente pela data de inclusao do pedido.'
        }
      },
      {
        id: 'positivacaoMes',
        icone: 'clientes',
        titulo: 'Positivacao no mes',
        valor: String(positivacaoMes),
        descricao: 'Clientes unicos que geraram pedido no mes.',
        ajuda: {
          composicao: 'Quantidade de clientes diferentes com pelo menos um pedido.',
          periodo: 'Mes corrente pela data de inclusao do pedido.'
        }
      },
      {
        id: 'percentualPositivacaoCarteiraMes',
        icone: 'selo',
        titulo: '% Positivacao da carteira',
        valor: formatarPercentualTaxa(percentualPositivacaoCarteiraMes),
        descricao: 'Percentual da carteira ativa que comprou no mes.',
        ajuda: {
          composicao: `${positivacaoCarteiraMes} clientes que compraram / ${clientesAtivos.length} clientes ativos da carteira.`,
          periodo: 'Mes corrente pela data de inclusao do pedido.'
        }
      },
      {
        id: 'catalogo',
        icone: 'atendimentos',
        titulo: 'Catalogo',
        valor: String(produtosAtivos.length),
        descricao: 'Produtos ativos para comercializacao.',
        destaque: `${dados.gruposProduto?.length || 0} grupos cadastrados`,
        ajuda: {
          composicao: 'Quantidade de produtos ativos.',
          periodo: 'Base cadastral atual (sem recorte mensal).'
        }
      },
      {
        id: 'carteira',
        icone: 'selo',
        titulo: 'Carteira',
        valor: String(clientesAtivos.length),
        descricao: 'Clientes ativos em acompanhamento.',
        destaque: `${clientesVisiveis.length} visiveis`,
        ajuda: {
          composicao: 'Quantidade de clientes ativos no escopo visivel.',
          periodo: 'Base cadastral atual (sem recorte mensal).'
        }
      }
    ],
    metricas: [
      {
        rotulo: 'Valor em negociacao',
        valor: normalizarPreco(valorAberto),
        ajuda: {
          conceito: 'Volume financeiro estimado das oportunidades em aberto.',
          calculo: 'Soma dos valores totais dos itens dos orcamentos abertos.',
          observacao: 'Nao representa venda fechada; mostra potencial em negociacao.'
        }
      },
      {
        rotulo: 'Faturamento do mes',
        valor: normalizarPreco(faturamentoMes),
        ajuda: {
          conceito: 'Valor movimentado pelos pedidos com entrega prevista no mes atual.',
          calculo: 'Soma dos itens de todos os pedidos visiveis cuja data de entrega cai dentro do mes atual.',
          observacao: 'Leitura rapida da receita prevista para entrega no mes atual.'
        }
      },
      {
        rotulo: 'Ticket medio',
        valor: normalizarPreco(ticketMedio),
        ajuda: {
          conceito: 'Valor medio por pedido com entrega prevista no mes atual.',
          calculo: `${normalizarPreco(faturamentoMes)} dividido por ${pedidosEntregaMes.length || 0} pedidos com data de entrega no mes atual.`,
          observacao: 'Ajuda a entender se o resultado do mes atual vem de volume ou de valor medio.'
        }
      }
    ],
    faixas: [
      {
        rotulo: 'Clientes acompanhados',
        valor: String(clientesVisiveis.length),
        ajuda: {
          conceito: 'Base de clientes usada na dashboard.',
          calculo: usuarioLogado?.tipo === 'Usuario padrao'
            ? 'Clientes da carteira do vendedor do usuario logado.'
            : 'Todos os clientes visiveis na operacao.',
          observacao: 'Esse total define o universo de acompanhamento da home.'
        }
      },
      {
        rotulo: 'Pedidos a entregar',
        valor: String(pedidosEntregaProxima),
        ajuda: {
          conceito: 'Pedidos ainda nao entregues com entrega prevista em ate 7 dias.',
          calculo: 'Conta pedidos pendentes cuja data de entrega cai entre hoje e os proximos 7 dias.',
          observacao: 'Bom indicador para alinhamento comercial e operacional.'
        }
      },
      {
        rotulo: 'Orcamentos vencidos',
        valor: String(orcamentosVencidos),
        ajuda: {
          conceito: 'Orcamentos abertos com validade anterior a hoje.',
          calculo: 'Conta negociacoes abertas cuja data de validade ja expirou.',
          observacao: 'Normalmente pedem renovacao, retorno ou encerramento.'
        }
      },
      {
        rotulo: 'Sem atendimento recente',
        valor: String(clientesSemAtendimento),
        ajuda: {
          conceito: 'Clientes sem atendimento registrado nos ultimos 30 dias.',
          calculo: 'Compara a ultima data de atendimento de cada cliente com a data atual.',
          observacao: 'Ajuda a priorizar reativacao da carteira.'
        }
      }
    ],
    exibirFunil: dados.empresa?.exibirFunilPaginaInicial !== 0,
    funil,
    motivosPerda,
    orcamentosPorGrupo,
    orcamentosPorMarca,
    orcamentosPorProduto,
    devolucoes,
    vendasPorGrupo,
    vendasPorMarca,
    vendasPorUf,
    vendasPorCliente,
    vendasPorProduto,
    alertas: montarAlertas(orcamentosVencidos, orcamentosVencendo, pedidosEntregaProxima, clientesSemAtendimento),
    tituloRanking: usuarioLogado?.tipo === 'Usuario padrao' ? 'Clientes em destaque' : 'Vendedores em destaque',
    descricaoRanking: usuarioLogado?.tipo === 'Usuario padrao'
      ? 'Quem mais comprou no mes pela data de entrada do pedido dentro da sua carteira.'
      : 'Quem mais movimentou pedidos pela data de entrada no mes atual.',
    ranking: usuarioLogado?.tipo === 'Usuario padrao'
      ? montarRankingClientes(pedidosMes, clientesPorId)
      : montarRankingVendedores(pedidosMes, vendedoresPorId),
    agenda
  };
}

function montarSecoesOrcamentos(painel) {
  const configuracoes = Array.isArray(painel?.empresa?.graficosPaginaInicialOrcamentos)
    ? painel.empresa.graficosPaginaInicialOrcamentos
    : [];
  const definicoes = new Map([
    ['funilOrcamentos', {
      renderizar: (configuracao) => <SecaoFunilOrcamentosInicio itens={painel.funil} titulo={configuracao.rotulo} />
    }],
    ['orcamentosGrupoProdutos', {
      renderizar: (configuracao) => <SecaoOrcamentosGrupoProdutosInicio itens={painel.orcamentosPorGrupo} titulo={configuracao.rotulo} />
    }],
    ['orcamentosMarca', {
      renderizar: (configuracao) => <SecaoOrcamentosMarcaInicio itens={painel.orcamentosPorMarca} titulo={configuracao.rotulo} />
    }],
    ['orcamentosProdutos', {
      renderizar: (configuracao) => <SecaoOrcamentosProdutosInicio itens={painel.orcamentosPorProduto} titulo={configuracao.rotulo} />
    }],
    ['motivosPerda', {
      renderizar: (configuracao) => <SecaoMotivosPerdaInicio itens={painel.motivosPerda} titulo={configuracao.rotulo} />
    }]
  ]);

  return configuracoes
    .filter((item) => item?.visivel !== false)
    .sort((itemA, itemB) => Number(itemA?.ordem || 0) - Number(itemB?.ordem || 0))
    .map((item) => ({
      id: item.id,
      span: item.span,
      renderizar: () => definicoes.get(item.id)?.renderizar(item)
    }))
    .filter((item) => typeof item.renderizar === 'function');
}

function montarIndicadoresConfigurados(painel) {
  const configuracoes = Array.isArray(painel?.empresa?.cardsPaginaInicial)
    ? painel.empresa.cardsPaginaInicial
    : normalizarConfiguracoesCardsPaginaInicial();
  const indicadoresPorId = new Map(
    (painel?.indicadores || []).map((indicador) => [indicador.id, indicador])
  );

  return configuracoes
    .filter((item) => item?.visivel !== false)
    .map((item) => {
      const indicador = indicadoresPorId.get(item.id);

      if (!indicador) {
        return null;
      }

      return {
        ...indicador,
        titulo: item.rotulo || indicador.titulo,
        span: item.span || 2
      };
    })
    .filter(Boolean);
}

function montarSecoesVendas(painel) {
  const configuracoes = Array.isArray(painel?.empresa?.graficosPaginaInicialVendas)
    ? painel.empresa.graficosPaginaInicialVendas
    : [];
  const definicoes = new Map([
    ['devolucoes', {
      renderizar: (configuracao) => <SecaoDevolucoesInicio itens={painel.devolucoes} titulo={configuracao.rotulo} />
    }],
    ['vendasGrupoProdutos', {
      renderizar: (configuracao) => <SecaoVendasGrupoProdutosInicio itens={painel.vendasPorGrupo} titulo={configuracao.rotulo} />
    }],
    ['vendasMarca', {
      renderizar: (configuracao) => <SecaoVendasMarcaInicio itens={painel.vendasPorMarca} titulo={configuracao.rotulo} />
    }],
    ['vendasUf', {
      renderizar: (configuracao) => <SecaoVendasUfInicio itens={painel.vendasPorUf} titulo={configuracao.rotulo} />
    }],
    ['vendasClientes', {
      renderizar: (configuracao) => <SecaoVendasClientesInicio itens={painel.vendasPorCliente} titulo={configuracao.rotulo} />
    }],
    ['vendasProdutos', {
      renderizar: (configuracao) => <SecaoVendasProdutosInicio itens={painel.vendasPorProduto} titulo={configuracao.rotulo} />
    }],
    ['rankingVendas', {
      renderizar: (configuracao) => (
        <SecaoRankingInicio
          titulo={configuracao.rotulo}
          descricao={painel.descricaoRanking}
          itens={painel.ranking}
        />
      )
    }]
  ]);

  return configuracoes
    .filter((item) => item?.visivel !== false)
    .sort((itemA, itemB) => Number(itemA?.ordem || 0) - Number(itemB?.ordem || 0))
    .map((item) => ({
      id: item.id,
      span: item.span,
      renderizar: () => definicoes.get(item.id)?.renderizar(item)
    }))
    .filter((item) => typeof item.renderizar === 'function');
}

function criarPainelBase(usuarioLogado) {
  return {
    descricao: usuarioLogado?.tipo === 'Usuario padrao'
      ? 'Acompanhe somente sua carteira, seus orcamentos e suas vendas.'
      : 'Acompanhe o desempenho comercial de orcamentos e vendas da operacao.',
    resumo: '',
    tag: usuarioLogado?.tipo === 'Usuario padrao' ? 'Minha carteira' : 'Visao geral',
    titulo: usuarioLogado?.tipo === 'Usuario padrao'
      ? 'Painel comercial da sua carteira'
      : 'Dashboard comercial de orcamentos e vendas',
    subtitulo: usuarioLogado?.tipo === 'Usuario padrao'
      ? 'Os dados exibidos aqui consideram somente seus clientes e seus registros.'
      : 'Leitura consolidada do funil, das vendas e das proximas acoes comerciais.',
    indicadores: [
      {
        id: 'orcamentosAbertos',
        icone: 'orcamento',
        titulo: 'Orcamentos em aberto',
        valor: '0',
        descricao: '',
        ajuda: {
          composicao: 'Quantidade e valor dos orcamentos em aberto.',
          periodo: 'Carteira visivel atual na data de hoje.'
        }
      },
      {
        id: 'pedidosMes',
        icone: 'pedido',
        titulo: 'Pedidos no mes',
        valor: '0',
        descricao: '',
        ajuda: {
          composicao: 'Quantidade de pedidos e valor liquido dos itens.',
          periodo: 'Mes corrente pela data de inclusao do pedido.'
        }
      },
      {
        id: 'comissaoMes',
        icone: 'pagamento',
        titulo: 'Comissao no mes',
        valor: normalizarPreco(0),
        descricao: '',
        ajuda: {
          composicao: 'Soma da comissao de cada pedido (total liquido x % comissao).',
          periodo: 'Mes corrente pela data de inclusao do pedido.'
        }
      },
      {
        id: 'positivacaoMes',
        icone: 'clientes',
        titulo: 'Positivacao no mes',
        valor: '0',
        descricao: '',
        ajuda: {
          composicao: 'Quantidade de clientes diferentes com pelo menos um pedido.',
          periodo: 'Mes corrente pela data de inclusao do pedido.'
        }
      },
      {
        id: 'percentualPositivacaoCarteiraMes',
        icone: 'selo',
        titulo: '% Positivacao da carteira',
        valor: formatarPercentualTaxa(0),
        descricao: '',
        ajuda: {
          composicao: 'Clientes da carteira ativa que compraram / total de clientes ativos da carteira.',
          periodo: 'Mes corrente pela data de inclusao do pedido.'
        }
      },
      {
        id: 'catalogo',
        icone: 'atendimentos',
        titulo: 'Catalogo',
        valor: '0',
        descricao: '',
        ajuda: {
          composicao: 'Quantidade de produtos ativos.',
          periodo: 'Base cadastral atual.'
        }
      },
      {
        id: 'carteira',
        icone: 'selo',
        titulo: 'Carteira',
        valor: '0',
        descricao: '',
        ajuda: {
          composicao: 'Quantidade de clientes ativos no escopo da home.',
          periodo: 'Base cadastral atual.'
        }
      }
    ],
    metricas: [],
    faixas: [],
    empresa: null,
    exibirFunil: true,
    funil: [],
    motivosPerda: [],
    orcamentosPorGrupo: [],
    orcamentosPorMarca: [],
    orcamentosPorProduto: [],
    devolucoes: [],
    vendasPorGrupo: [],
    vendasPorMarca: [],
    vendasPorUf: [],
    vendasPorCliente: [],
    vendasPorProduto: [],
    alertas: [],
    tituloRanking: 'Ranking',
    descricaoRanking: '',
    ranking: [],
    agenda: []
  };
}

function filtrarClientesVisiveis(clientes, usuarioLogado) {
  if (usuarioLogado?.tipo !== 'Usuario padrao' || !usuarioLogado?.idVendedor) {
    return Array.isArray(clientes) ? clientes : [];
  }

  return (clientes || []).filter((cliente) => String(cliente.idVendedor) === String(usuarioLogado.idVendedor));
}

function filtrarOrcamentosVisiveis(orcamentos, idsClientes, usuarioLogado) {
  if (usuarioLogado?.tipo !== 'Usuario padrao' || !usuarioLogado?.idVendedor) {
    return Array.isArray(orcamentos) ? orcamentos : [];
  }

  return (orcamentos || []).filter(
    (item) => String(item.idVendedor) === String(usuarioLogado.idVendedor)
  );
}

function filtrarPedidosVisiveis(pedidos, idsClientes, usuarioLogado) {
  if (usuarioLogado?.tipo !== 'Usuario padrao' || !usuarioLogado?.idVendedor) {
    return Array.isArray(pedidos) ? pedidos : [];
  }

  return (pedidos || []).filter(
    (item) => String(item.idVendedor) === String(usuarioLogado.idVendedor)
  );
}

function filtrarAtendimentosVisiveis(atendimentos, idsClientes, usuarioLogado) {
  if (usuarioLogado?.tipo !== 'Usuario padrao' || !usuarioLogado?.idVendedor) {
    return Array.isArray(atendimentos) ? atendimentos : [];
  }

  return (atendimentos || []).filter((item) => (
    idsClientes.has(String(item.idCliente))
    || String(item.idUsuario) === String(usuarioLogado.idUsuario)
  ));
}

function filtrarAgendamentosVisiveis(agendamentos, idsClientes, usuarioLogado) {
  if (usuarioLogado?.tipo !== 'Usuario padrao') {
    return Array.isArray(agendamentos) ? agendamentos : [];
  }

  return (agendamentos || []).filter((item) => {
    if (idsClientes.has(String(item.idCliente))) {
      return true;
    }

    const idsUsuarios = Array.isArray(item.idsUsuarios) ? item.idsUsuarios.map(String) : [];
    return idsUsuarios.length > 0
      ? idsUsuarios.includes(String(usuarioLogado.idUsuario))
      : String(item.idUsuario) === String(usuarioLogado.idUsuario);
  });
}

function montarFunil(funil) {
  const totalQuantidadeItens = (funil || []).reduce((acumulado, item) => acumulado + (Number(item.quantidadeItens) || 0), 0);
  const totalValor = (funil || []).reduce((acumulado, item) => acumulado + (Number(item.valorTotal) || 0), 0);
  return (funil || []).map((item) => ({
    idEtapaOrcamento: item.idEtapaOrcamento,
    descricao: item.descricao,
    quantidadeOrcamentos: `${item.quantidadeOrcamentos} orc.`,
    quantidadeItens: Number(item.quantidadeItens || 0),
    valor: normalizarPreco(item.valorTotal),
    cor: item.cor,
    percentualProdutos: calcularPercentualParteDoTotal(Number(item.quantidadeItens || 0), totalQuantidadeItens),
    percentualValor: calcularPercentualParteDoTotal(Number(item.valorTotal || 0), totalValor),
    ajuda: {
      composicao: `${item.quantidadeOrcamentos} orcamentos, ${Number(item.quantidadeItens || 0)} itens e ${normalizarPreco(item.valorTotal)} nessa etapa.`,
      periodo: 'Posicao atual do funil de orcamentos em aberto.'
    }
  }));
}

function calcularPercentualParteDoTotal(valor, total) {
  const valorNumerico = Number(valor) || 0;
  const totalNumerico = Number(total) || 0;

  if (valorNumerico <= 0 || totalNumerico <= 0) {
    return 0;
  }

  return Math.max(8, Math.round((valorNumerico / totalNumerico) * 100));
}

function montarAlertas(vencidos, vencendo, entrega, semAtendimento) {
  const maior = Math.max(vencidos, vencendo, entrega, semAtendimento, 1);
  return [
    {
      rotulo: 'Orcamentos vencidos',
      valor: String(vencidos),
      descricao: 'Validade expirada em negociacoes abertas.',
      percentual: Math.round((vencidos / maior) * 100),
      ajuda: {
        conceito: 'Negociacoes abertas cuja validade ja terminou.',
        calculo: 'Conta orcamentos abertos com data de validade anterior a data de hoje.',
        observacao: 'Mostra risco de perda por falta de retorno.'
      }
    },
    {
      rotulo: 'Vencendo em 7 dias',
      valor: String(vencendo),
      descricao: 'Negociacoes que precisam de retorno rapido.',
      percentual: Math.round((vencendo / maior) * 100),
      ajuda: {
        conceito: 'Orcamentos abertos que vencem em ate 7 dias.',
        calculo: 'Conta validade entre a data de hoje e os proximos 7 dias.',
        observacao: 'Ajuda a priorizar follow-up antes do vencimento.'
      }
    },
    {
      rotulo: 'Pedidos com entrega proxima',
      valor: String(entrega),
      descricao: 'Pedidos previstos para os proximos 7 dias.',
      percentual: Math.round((entrega / maior) * 100),
      ajuda: {
        conceito: 'Pedidos pendentes com entrega prevista em ate 7 dias.',
        calculo: 'Conta pedidos nao entregues cuja data de entrega cai entre hoje e os proximos 7 dias.',
        observacao: 'Bom indicador para antecipar alinhamentos.'
      }
    },
    {
      rotulo: 'Clientes sem atendimento',
      valor: String(semAtendimento),
      descricao: 'Sem interacao registrada nos ultimos 30 dias.',
      percentual: Math.round((semAtendimento / maior) * 100),
      ajuda: {
        conceito: 'Clientes sem registro recente de atendimento.',
        calculo: 'Ultimo atendimento do cliente ha mais de 30 dias, contando a partir de hoje, ou inexistente.',
        observacao: 'Ajuda a identificar carteira esfriando.'
      }
    }
  ];
}

function montarResumoDevolucoes(pedidos, motivosDevolucao) {
  const motivosPorId = new Map((motivosDevolucao || []).map((motivo) => [
    String(motivo.idMotivoDevolucao),
    motivo
  ]));
  const resumoPorMotivo = new Map();

  (pedidos || []).forEach((pedido) => {
    const chaveMotivo = String(pedido.idMotivoDevolucao || 'sem-motivo');
    const motivo = motivosPorId.get(chaveMotivo);
    const atual = resumoPorMotivo.get(chaveMotivo) || {
      idMotivoDevolucao: chaveMotivo,
      descricao: motivo
        ? `${String(motivo.idMotivoDevolucao).padStart(4, '0')} - ${motivo.abreviacao}`
        : 'Sem motivo informado',
      quantidade: 0,
      valorTotal: 0
    };

    atual.quantidade += 1;
    atual.valorTotal += Math.abs(totalRegistro(pedido));
    resumoPorMotivo.set(chaveMotivo, atual);
  });

  const lista = [...resumoPorMotivo.values()].sort((a, b) => b.valorTotal - a.valorTotal);
  const totalQuantidade = lista.reduce((acumulado, item) => acumulado + item.quantidade, 0);
  const totalValor = lista.reduce((acumulado, item) => acumulado + item.valorTotal, 0);

  return lista.map((item) => ({
    ...item,
    quantidadeDevolucoes: `${item.quantidade} dev.`,
    valor: normalizarPreco(item.valorTotal),
    percentualQuantidade: totalQuantidade > 0 ? Math.round((item.quantidade / totalQuantidade) * 100) : 0,
    percentualValor: totalValor > 0 ? Math.round((item.valorTotal / totalValor) * 100) : 0,
    ajuda: {
      composicao: `${item.quantidade} devolucoes e ${normalizarPreco(item.valorTotal)} para o motivo ${item.descricao}.`,
      periodo: 'Mes corrente pela data de entrada dos pedidos de devolucao.'
    }
  }));
}

function montarResumoMotivosPerda(orcamentos, motivosPerda) {
  const motivosPorId = new Map((motivosPerda || []).map((motivo) => [
    String(motivo.idMotivo),
    motivo
  ]));
  const resumoPorMotivo = new Map();

  (orcamentos || []).forEach((orcamento) => {
    const chaveMotivo = String(orcamento.idMotivoPerda || 'sem-motivo');
    const motivo = motivosPorId.get(chaveMotivo);
    const atual = resumoPorMotivo.get(chaveMotivo) || {
      id: chaveMotivo,
      descricao: motivo?.descricao || 'Sem motivo informado',
      quantidadeItens: 0,
      valorTotal: 0,
      quantidadeOrcamentos: 0
    };

    atual.quantidadeItens += 1;
    atual.quantidadeOrcamentos += 1;
    atual.valorTotal += totalRegistro(orcamento);
    resumoPorMotivo.set(chaveMotivo, atual);
  });

  const lista = [...resumoPorMotivo.values()]
    .filter((item) => item.quantidadeOrcamentos > 0 || item.valorTotal !== 0)
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 8);
  const totalQuantidade = lista.reduce((acumulado, item) => acumulado + (Number(item.quantidadeOrcamentos) || 0), 0);
  const totalValor = lista.reduce((acumulado, item) => acumulado + Math.max(Number(item.valorTotal) || 0, 0), 0);

  return lista.map((item) => ({
    ...item,
    valor: normalizarPreco(item.valorTotal),
    percentualQuantidade: calcularPercentualParteDoTotal(Number(item.quantidadeOrcamentos || 0), totalQuantidade),
    percentualValor: calcularPercentualParteDoTotal(Number(item.valorTotal || 0), totalValor),
    ajuda: {
      composicao: `${item.quantidadeOrcamentos} orcamentos recusados e ${normalizarPreco(item.valorTotal)} no motivo ${item.descricao}.`,
      periodo: 'Mes corrente dos orcamentos recusados.'
    }
  }));
}

function montarResumoPorRelacionamento(
  registros,
  produtos,
  relacionamentos,
  chaveProduto,
  chaveRelacionamento,
  chaveDescricao,
  descricaoFallback,
  opcoes = {}
) {
  const {
    chaveRegistroId = 'idPedido',
    sufixoQuantidadeRegistros = 'ped.'
  } = opcoes;
  const produtosPorId = new Map((produtos || []).map((produto) => [
    String(produto.idProduto),
    produto
  ]));
  const relacionamentosPorId = new Map((relacionamentos || []).map((registro) => [
    String(registro[chaveRelacionamento]),
    registro
  ]));
  const resumoPorRelacionamento = new Map();

  (registros || []).forEach((registro) => {
    (registro?.itens || []).forEach((item) => {
      const produto = produtosPorId.get(String(item.idProduto || ''));
      const idRelacionamento = String(produto?.[chaveProduto] || 'sem-relacionamento');
      const relacionamento = relacionamentosPorId.get(idRelacionamento);
      const atual = resumoPorRelacionamento.get(idRelacionamento) || {
        id: idRelacionamento,
        descricao: relacionamento?.[chaveDescricao] || descricaoFallback,
        quantidadeItens: 0,
        valorTotal: 0,
        pedidos: new Set()
      };

      atual.quantidadeItens += Number(item.quantidade) || 0;
      atual.valorTotal += Number(item.valorTotal) || 0;
      atual.pedidos.add(String(registro[chaveRegistroId]));
      resumoPorRelacionamento.set(idRelacionamento, atual);
    });
  });

  const lista = [...resumoPorRelacionamento.values()]
    .map((item) => ({
      ...item,
      quantidadePedidos: `${item.pedidos.size} ${sufixoQuantidadeRegistros}`,
      pedidos: undefined
    }))
    .filter((item) => item.quantidadeItens !== 0 || item.valorTotal !== 0)
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 8);
  const totalQuantidade = lista.reduce(
    (acumulado, item) => acumulado + Math.max(Number(item.quantidadeItens) || 0, 0),
    0
  );
  const totalValor = lista.reduce(
    (acumulado, item) => acumulado + Math.max(Number(item.valorTotal) || 0, 0),
    0
  );

  return lista.map((item) => ({
    ...item,
    valor: normalizarPreco(item.valorTotal),
    percentualQuantidade: calcularPercentualParteDoTotal(Number(item.quantidadeItens || 0), totalQuantidade),
    percentualValor: calcularPercentualParteDoTotal(Number(item.valorTotal || 0), totalValor),
    ajuda: {
      composicao: `${item.quantidadePedidos}, ${item.quantidadeItens} itens e ${normalizarPreco(item.valorTotal)} para ${item.descricao}.`,
      periodo: 'Mes corrente pela data de entrada do pedido.'
    }
  }));
}

function montarResumoPorUf(pedidos, clientes) {
  const clientesPorId = new Map((clientes || []).map((cliente) => [
    String(cliente.idCliente),
    cliente
  ]));
  const resumoPorUf = new Map();

  (pedidos || []).forEach((pedido) => {
    const cliente = clientesPorId.get(String(pedido?.idCliente || ''));
    const ufNormalizada = String(cliente?.estado || '').trim().toUpperCase();
    const uf = ufNormalizada || 'Sem UF';
    const atual = resumoPorUf.get(uf) || {
      id: uf,
      descricao: uf,
      quantidadeItens: 0,
      valorTotal: 0,
      pedidos: new Set()
    };

    (pedido?.itens || []).forEach((item) => {
      atual.quantidadeItens += Number(item.quantidade) || 0;
      atual.valorTotal += Number(item.valorTotal) || 0;
    });

    atual.pedidos.add(String(pedido.idPedido || ''));
    resumoPorUf.set(uf, atual);
  });

  const lista = [...resumoPorUf.values()]
    .map((item) => ({
      ...item,
      quantidadePedidos: `${item.pedidos.size} ped.`,
      pedidos: undefined
    }))
    .filter((item) => item.quantidadeItens !== 0 || item.valorTotal !== 0)
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 8);

  const totalQuantidade = lista.reduce(
    (acumulado, item) => acumulado + Math.max(Number(item.quantidadeItens) || 0, 0),
    0
  );
  const totalValor = lista.reduce(
    (acumulado, item) => acumulado + Math.max(Number(item.valorTotal) || 0, 0),
    0
  );

  return lista.map((item) => ({
    ...item,
    valor: normalizarPreco(item.valorTotal),
    percentualQuantidade: calcularPercentualParteDoTotal(Number(item.quantidadeItens || 0), totalQuantidade),
    percentualValor: calcularPercentualParteDoTotal(Number(item.valorTotal || 0), totalValor),
    ajuda: {
      composicao: `${item.quantidadePedidos}, ${item.quantidadeItens} itens e ${normalizarPreco(item.valorTotal)} na UF ${item.descricao}.`,
      periodo: 'Mes corrente pela data de entrada do pedido.'
    }
  }));
}

function montarResumoPorCliente(pedidos, clientes, empresa) {
  const clientesPorId = new Map((clientes || []).map((cliente) => [
    String(cliente.idCliente),
    cliente
  ]));
  const resumoPorCliente = new Map();

  (pedidos || []).forEach((pedido) => {
    const idCliente = String(pedido?.idCliente || '');
    const cliente = clientesPorId.get(idCliente);
    const nomeFantasiaCliente = cliente?.nomeFantasia || cliente?.razaoSocial || 'Cliente sem nome';
    const codigoCliente = formatarCodigoCliente(cliente || { idCliente: pedido?.idCliente }, empresa);
    const descricaoCliente = `${codigoCliente} - ${nomeFantasiaCliente}`;
    const atual = resumoPorCliente.get(idCliente) || {
      id: idCliente || 'sem-cliente',
      descricao: descricaoCliente,
      quantidadeItens: 0,
      valorTotal: 0,
      pedidos: new Set()
    };

    (pedido?.itens || []).forEach((item) => {
      atual.quantidadeItens += Number(item.quantidade) || 0;
      atual.valorTotal += Number(item.valorTotal) || 0;
    });

    atual.pedidos.add(String(pedido.idPedido || ''));
    resumoPorCliente.set(idCliente, atual);
  });

  const lista = [...resumoPorCliente.values()]
    .map((item) => ({
      ...item,
      quantidadePedidos: `${item.pedidos.size} ped.`,
      pedidos: undefined
    }))
    .filter((item) => item.quantidadeItens !== 0 || item.valorTotal !== 0)
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 8);

  const totalQuantidade = lista.reduce(
    (acumulado, item) => acumulado + Math.max(Number(item.quantidadeItens) || 0, 0),
    0
  );
  const totalValor = lista.reduce(
    (acumulado, item) => acumulado + Math.max(Number(item.valorTotal) || 0, 0),
    0
  );

  return lista.map((item) => ({
    ...item,
    valor: normalizarPreco(item.valorTotal),
    percentualQuantidade: calcularPercentualParteDoTotal(Number(item.quantidadeItens || 0), totalQuantidade),
    percentualValor: calcularPercentualParteDoTotal(Number(item.valorTotal || 0), totalValor),
    ajuda: {
      composicao: `${item.quantidadePedidos}, ${item.quantidadeItens} itens e ${normalizarPreco(item.valorTotal)} para ${item.descricao}.`,
      periodo: 'Mes corrente pela data de entrada do pedido.'
    }
  }));
}

function montarRankingVendedores(pedidos, vendedoresPorId) {
  return montarRanking(
    pedidos,
    (item) => String(item.idVendedor || ''),
    (chave) => vendedoresPorId.get(chave) || 'Sem vendedor'
  );
}

function montarRankingClientes(pedidos, clientesPorId) {
  return montarRanking(
    pedidos,
    (item) => String(item.idCliente || ''),
    (chave) => clientesPorId.get(chave) || 'Cliente sem nome'
  );
}

function montarRanking(pedidos, obterChave, obterNome) {
  const mapa = new Map();

  (pedidos || []).forEach((pedido) => {
    const chave = obterChave(pedido);
    const atual = mapa.get(chave) || { nome: obterNome(chave), total: 0, quantidade: 0 };
    atual.total += totalRegistro(pedido);
    atual.quantidade += 1;
    mapa.set(chave, atual);
  });

  const lista = [...mapa.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  const maior = Math.max(...lista.map((item) => item.total), 0);

  return lista.map((item) => ({
    rotulo: item.nome,
    descricao: `${item.quantidade} pedidos`,
    valor: normalizarPreco(item.total),
    percentual: maior > 0 ? Math.max(12, Math.round((item.total / maior) * 100)) : 0,
    ajuda: {
      composicao: `${item.quantidade} pedidos somando ${normalizarPreco(item.total)}.`,
      periodo: 'Mes corrente pela data de entrada do pedido.'
    }
  }));
}

function contarClientesSemAtendimento(clientes, atendimentos, diasLimite) {
  const ultimos = new Map();

  (atendimentos || []).forEach((item) => {
    const chave = String(item.idCliente || '');
    const data = normalizarData(item.data);
    if (!data || (!chave)) {
      return;
    }
    if (!ultimos.get(chave) || data > ultimos.get(chave)) {
      ultimos.set(chave, data);
    }
  });

  return (clientes || []).filter((cliente) => {
    const ultimaData = ultimos.get(String(cliente.idCliente));
    return !ultimaData || diferencaDias(ultimaData, dataInput(new Date())) > diasLimite;
  }).length;
}

function somarTotais(registros) {
  return (registros || []).reduce((total, item) => total + totalRegistro(item), 0);
}

function somarComissoes(registros) {
  return (registros || []).reduce((total, item) => total + valorComissaoRegistro(item), 0);
}

function totalRegistro(registro) {
  return Array.isArray(registro?.itens)
    ? registro.itens.reduce((total, item) => total + (Number(item?.valorTotal) || 0), 0)
    : 0;
}

function valorComissaoRegistro(registro) {
  const comissaoPersistida = Number(registro?.valorComissao);

  if (Number.isFinite(comissaoPersistida)) {
    return comissaoPersistida;
  }

  const percentualComissao = Number(registro?.comissao) || 0;
  return Number((((totalRegistro(registro) || 0) * percentualComissao) / 100).toFixed(2));
}

function orcamentoEhFechado(orcamento) {
  return IDS_ETAPAS_ORCAMENTO_FECHADAS.has(Number(orcamento?.idEtapaOrcamento));
}

function pedidoPendente(pedido) {
  return Number(pedido?.idEtapaPedido) !== ID_ETAPA_PEDIDO_ENTREGUE;
}

function dataNoPeriodo(valor, inicio, fim) {
  const data = normalizarData(valor);
  return Boolean(data && data >= inicio && data <= fim);
}

function dataAnterior(valor, referencia) {
  const data = normalizarData(valor);
  return Boolean(data && data < referencia);
}

function dataNosProximosDias(valor, diasMaximos) {
  const data = valor instanceof Date ? valor : criarData(valor);
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    return false;
  }

  const hoje = new Date();
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const alvo = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const dias = Math.round((alvo.getTime() - base.getTime()) / 86400000);
  return dias >= 0 && dias <= diasMaximos;
}

function criarDataHoraAgendamento(agendamento) {
  if (!agendamento?.data || !agendamento?.horaInicio) {
    return null;
  }

  const data = new Date(`${normalizarData(agendamento.data)}T${String(agendamento.horaInicio).slice(0, 5)}:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}

function formatarAgendamento(agendamento) {
  const dataHora = criarDataHoraAgendamento(agendamento);
  if (!dataHora) {
    return '-';
  }

  return `${formatarData(dataHora)} ${String(agendamento.horaInicio || '').slice(0, 5)}${agendamento.horaFim ? ` - ${String(agendamento.horaFim).slice(0, 5)}` : ''}`;
}

function formatarData(valor) {
  const data = valor instanceof Date ? valor : criarData(valor);
  return data ? new Intl.DateTimeFormat('pt-BR').format(data) : '-';
}

function normalizarData(valor) {
  const texto = String(valor || '').trim();
  const correspondencia = texto.match(/^(\d{4}-\d{2}-\d{2})/);
  return correspondencia ? correspondencia[1] : '';
}

function criarData(valor) {
  const dataNormalizada = normalizarData(valor);
  if (!dataNormalizada) {
    return null;
  }

  const data = new Date(`${dataNormalizada}T00:00:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}

function diferencaDias(inicio, fim) {
  const dataInicio = criarData(inicio);
  const dataFim = criarData(fim);
  if (!dataInicio || !dataFim) {
    return 0;
  }

  return Math.round((dataFim.getTime() - dataInicio.getTime()) / 86400000);
}

function dataInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function formatarPercentualTaxa(valor) {
  const numero = Number(valor);
  const percentual = Number.isFinite(numero) ? numero : 0;
  return `${percentual.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}
