import { useEffect, useMemo, useState } from 'react';
import '../../recursos/estilos/paginaInicio.css';
import { CorpoPagina } from '../../componentes/layout/corpoPagina';
import { listarAgendamentos } from '../../servicos/agenda';
import { listarAtendimentosGrid } from '../../servicos/atendimentos';
import { listarClientes, listarVendedores } from '../../servicos/clientes';
import {
  listarEtapasOrcamentoConfiguracao,
  listarEtapasPedidoConfiguracao
} from '../../servicos/configuracoes';
import { listarEmpresas } from '../../servicos/empresa';
import { listarOrcamentos } from '../../servicos/orcamentos';
import { listarPedidos } from '../../servicos/pedidos';
import { normalizarPreco } from '../../utilitarios/normalizarPreco';
import { CabecalhoInicio } from './componentes/cabecalhoInicio';
import { IndicadorResumoInicio } from './componentes/indicadorResumoInicio';
import { criarResumoFunilVendas } from './utilitarios/criarResumoFunilVendas';

const IDS_ETAPAS_ORCAMENTO_FECHADAS = new Set([1, 2, 3, 4]);
const ID_ETAPA_PEDIDO_ENTREGUE = 5;

export function PaginaInicio({ usuarioLogado }) {
  const [carregando, definirCarregando] = useState(true);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [painelBruto, definirPainelBruto] = useState(null);

  useEffect(() => {
    carregarPainel();
  }, [usuarioLogado?.idUsuario, usuarioLogado?.idVendedor, usuarioLogado?.tipo]);

  const painel = useMemo(
    () => montarPainel(painelBruto, usuarioLogado),
    [painelBruto, usuarioLogado]
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
        listarEtapasOrcamentoConfiguracao(),
        listarEtapasPedidoConfiguracao(),
        listarEmpresas()
      ]);

      const [
        clientesResultado,
        vendedoresResultado,
        atendimentosResultado,
        agendamentosResultado,
        orcamentosResultado,
        pedidosResultado,
        etapasOrcamentoResultado,
        etapasPedidoResultado,
        empresasResultado
      ] = resultados;

      const clientes = clientesResultado.status === 'fulfilled' ? clientesResultado.value : [];
      const vendedores = vendedoresResultado.status === 'fulfilled' ? vendedoresResultado.value : [];
      const atendimentos = atendimentosResultado.status === 'fulfilled' ? atendimentosResultado.value : [];
      const agendamentos = agendamentosResultado.status === 'fulfilled' ? agendamentosResultado.value : [];
      const orcamentos = orcamentosResultado.status === 'fulfilled' ? orcamentosResultado.value : [];
      const pedidos = pedidosResultado.status === 'fulfilled' ? pedidosResultado.value : [];
      const etapasOrcamento = etapasOrcamentoResultado.status === 'fulfilled' ? etapasOrcamentoResultado.value : [];
      const etapasPedido = etapasPedidoResultado.status === 'fulfilled' ? etapasPedidoResultado.value : [];
      const empresas = empresasResultado.status === 'fulfilled' ? empresasResultado.value : [];

      definirPainelBruto({
        clientes,
        vendedores,
        atendimentos,
        agendamentos,
        orcamentos,
        pedidos,
        etapasOrcamento,
        etapasPedido,
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
      <CabecalhoInicio descricao={painel.descricao} resumo={painel.resumo} />

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
              {painel.indicadores.map((indicador) => (
                <IndicadorResumoInicio
                  key={indicador.titulo}
                  ariaLabel={indicador.titulo}
                  carregando={carregando}
                  {...indicador}
                />
              ))}
            </div>

            {usuarioLogado?.tipo !== 'Usuario padrao' ? (
              <section className="paginaInicioPainelHeroi">
                <div className="paginaInicioPainelHeroiCabecalho">
                  <div>
                    <span className="paginaInicioPainelTag">{painel.tag}</span>
                    <h2>{painel.titulo}</h2>
                    <p>{painel.subtitulo}</p>
                  </div>
                </div>

                <div className="paginaInicioHeroiMetricas">
                  {painel.metricas.map((item) => (
                    <article key={item.rotulo} tabIndex={0}>
                      <span>{item.rotulo}</span>
                      <strong>{carregando ? '...' : item.valor}</strong>
                      <TooltipExplicacao titulo={item.rotulo} ajuda={item.ajuda} />
                    </article>
                  ))}
                </div>

                <div className="paginaInicioHeroiFaixas">
                  {painel.faixas.map((item) => (
                    <article key={item.rotulo} className="paginaInicioHeroiFaixa" tabIndex={0}>
                      <span>{item.rotulo}</span>
                      <strong>{carregando ? '...' : item.valor}</strong>
                      <TooltipExplicacao titulo={item.rotulo} ajuda={item.ajuda} />
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="paginaInicioSecoes">
              {usuarioLogado?.tipo === 'Usuario padrao' ? (
                <section className="paginaInicioPainelHeroi paginaInicioPainelHeroiCarteira">
                  <div className="paginaInicioPainelHeroiCabecalho">
                    <div>
                      <span className="paginaInicioPainelTag">{painel.tag}</span>
                      <h2>{painel.titulo}</h2>
                      <p>{painel.subtitulo}</p>
                    </div>
                  </div>

                  <div className="paginaInicioHeroiMetricas">
                    {painel.metricas.map((item) => (
                      <article key={item.rotulo} tabIndex={0}>
                        <span>{item.rotulo}</span>
                        <strong>{carregando ? '...' : item.valor}</strong>
                        <TooltipExplicacao titulo={item.rotulo} ajuda={item.ajuda} />
                      </article>
                    ))}
                  </div>

                  <div className="paginaInicioHeroiFaixas">
                    {painel.faixas.map((item) => (
                      <article key={item.rotulo} className="paginaInicioHeroiFaixa" tabIndex={0}>
                        <span>{item.rotulo}</span>
                        <strong>{carregando ? '...' : item.valor}</strong>
                        <TooltipExplicacao titulo={item.rotulo} ajuda={item.ajuda} />
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="paginaInicioPainel paginaInicioPainelAmplo">
                <div className="paginaInicioPainelCabecalho">
                  <div>
                    <h3>Funil de orcamentos</h3>
                    <p>Quantidade de produtos e valor total por etapa do funil, respeitando ordem e etapas consideradas.</p>
                  </div>
                </div>

                <div className="paginaInicioGraficoFunilEtapas">
                  {painel.funil.length > 0 ? painel.funil.map((etapa) => (
                    <article key={etapa.idEtapaOrcamento} className="paginaInicioGraficoFunilItem" tabIndex={0}>
                      <div className="paginaInicioGraficoFunilCabecalho">
                        <span className="paginaInicioFluxoConversaoRotulo">{etapa.descricao}</span>
                        <strong>{etapa.quantidadeOrcamentos}</strong>
                      </div>
                        <div className="paginaInicioGraficoFunilLinha">
                          <div className="paginaInicioGraficoFunilLegenda">
                            <span>Qtd. dos itens</span>
                            <strong>{etapa.quantidadeItens}</strong>
                          </div>
                          <div className="paginaInicioFluxoConversaoBarra">
                            <span style={{ width: `${etapa.percentualProdutos}%`, background: etapa.cor || undefined }} />
                          </div>
                        </div>
                      <div className="paginaInicioGraficoFunilLinha">
                        <div className="paginaInicioGraficoFunilLegenda">
                          <span>Valor total</span>
                          <strong>{etapa.valor}</strong>
                        </div>
                        <div className="paginaInicioFluxoConversaoBarra paginaInicioFluxoConversaoBarraValor">
                          <span style={{ width: `${etapa.percentualValor}%`, background: etapa.cor || undefined }} />
                        </div>
                      </div>
                      <TooltipExplicacao titulo={etapa.descricao} ajuda={etapa.ajuda} />
                    </article>
                  )) : (
                    <p className="paginaInicioPainelMensagem">Nenhuma etapa marcada para considerar no funil ou nenhum orcamento em aberto nessas etapas.</p>
                  )}
                </div>
              </section>

              <section className="paginaInicioPainel">
                <div className="paginaInicioPainelCabecalho">
                  <div>
                    <h3>Acoes imediatas</h3>
                    <p>Itens que pedem acompanhamento rapido.</p>
                  </div>
                </div>

                <div className="paginaInicioSaudeLista">
                  {painel.alertas.map((item) => (
                    <article key={item.rotulo} className="paginaInicioSaudeItem" tabIndex={0}>
                      <div className="paginaInicioSaudeTopo">
                        <span>{item.rotulo}</span>
                        <strong>{item.valor}</strong>
                      </div>
                      <div className="paginaInicioSaudeBarra">
                        <span style={{ width: `${item.percentual}%` }} />
                      </div>
                      <small>{item.descricao}</small>
                      <TooltipExplicacao titulo={item.rotulo} ajuda={item.ajuda} />
                    </article>
                  ))}
                </div>
              </section>

              <section className="paginaInicioPainel">
                <div className="paginaInicioPainelCabecalho">
                  <div>
                    <h3>{painel.tituloRanking}</h3>
                    <p>{painel.descricaoRanking}</p>
                  </div>
                </div>

                <div className="paginaInicioRankingLista">
                  {painel.ranking.length > 0 ? painel.ranking.map((item, indice) => (
                    <article key={`${item.rotulo}-${indice}`} className="paginaInicioRankingItem" tabIndex={0}>
                      <div className="paginaInicioRankingRotulo">
                        <span>{indice + 1}</span>
                        <div>
                          <strong>{item.rotulo}</strong>
                          <small>{item.descricao}</small>
                        </div>
                      </div>
                      <div className="paginaInicioRankingBarra">
                        <span style={{ width: `${item.percentual}%` }} />
                      </div>
                      <strong className="paginaInicioRankingValor">{item.valor}</strong>
                      <TooltipExplicacao titulo={item.rotulo} ajuda={item.ajuda} />
                    </article>
                  )) : (
                    <p className="paginaInicioPainelMensagem">Sem movimentacao suficiente para ranking.</p>
                  )}
                </div>
              </section>

              <section className="paginaInicioPainel">
                <div className="paginaInicioPainelCabecalho">
                  <div>
                    <h3>Agenda proxima</h3>
                    <p>Compromissos dos proximos 7 dias.</p>
                  </div>
                </div>

                <div className="paginaInicioAgendaLista">
                  {painel.agenda.length > 0 ? painel.agenda.map((item) => (
                    <article key={item.id} className="paginaInicioAgendaItem" tabIndex={0}>
                      <strong>{item.assunto}</strong>
                      <span>{item.dataHora}</span>
                      <small>{item.detalhe}</small>
                      <TooltipExplicacao titulo={item.assunto} ajuda={item.ajuda} />
                    </article>
                  )) : (
                    <p className="paginaInicioPainelMensagem">Nenhum compromisso proximo no periodo.</p>
                  )}
                </div>
              </section>

            </div>
          </div>
        )}
      </CorpoPagina>
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
  const pedidosEntregaMes = pedidos.filter((item) => dataNoPeriodo(item.dataEntrega, inicioMes, fimMes));
  const atendimentosMes = atendimentos.filter((item) => dataNoPeriodo(item.data, inicioMes, fimMes));
  const valorAberto = somarTotais(orcamentosAbertos);
  const faturamentoMes = somarTotais(pedidosEntregaMes);
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

  return {
    ...base,
    resumo: usuarioLogado?.tipo === 'Usuario padrao'
      ? `${clientesVisiveis.length} clientes na sua carteira`
      : `${clientesVisiveis.length} clientes no acompanhamento`,
    indicadores: [
      {
        icone: 'orcamento',
        titulo: 'Orcamentos em aberto',
        valor: String(orcamentosAbertos.length),
        descricao: 'Negociacoes ainda ativas no funil.',
        destaque: normalizarPreco(valorAberto),
        ajuda: {
          conceito: 'Quantidade de orcamentos que ainda nao chegaram nas etapas finais.',
          calculo: 'Conta os orcamentos visiveis fora das etapas Fechado, Fechado sem pedido e Pedido excluido.',
          observacao: `O destaque mostra ${normalizarPreco(valorAberto)} somados nesses orcamentos.`
        }
      },
      {
        icone: 'pedido',
        titulo: 'Pedidos no mes',
        valor: String(pedidosMes.length),
        descricao: 'Pedidos gerados no mes atual.',
        destaque: normalizarPreco(faturamentoMes),
        ajuda: {
          conceito: 'Quantidade de pedidos incluidos no mes atual.',
          calculo: 'Conta pedidos visiveis com data de inclusao dentro do mes atual.',
          observacao: `O destaque mostra ${normalizarPreco(faturamentoMes)} em valor somado desses pedidos.`
        }
      },
      {
        icone: 'atendimentos',
        titulo: 'Atendimentos no mes',
        valor: String(atendimentosMes.length),
        descricao: 'Registros de atendimento do mes atual.',
        destaque: `${agenda.length} compromissos proximos`,
        ajuda: {
          conceito: 'Atendimentos registrados no mes atual.',
          calculo: 'Conta atendimentos visiveis cuja data pertence ao mes atual.',
          observacao: `O destaque mostra ${agenda.length} compromissos da agenda agendados para os proximos 7 dias.`
        }
      },
      {
        icone: 'selo',
        titulo: 'Conversao do mes',
        valor: `${taxaConversaoMes.toFixed(1)}%`,
        descricao: 'Orcamentos do mes que viraram pedido.',
        destaque: `${convertidosMes} convertidos`,
        ajuda: {
          conceito: 'Percentual de orcamentos do mes que geraram pedido vinculado.',
          calculo: `${convertidosMes} convertidos dividido por ${orcamentosMes.length || 0} orcamentos incluidos no mes atual.`,
          observacao: 'Quanto maior, melhor o aproveitamento das negociacoes abertas no mes atual.'
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
    alertas: montarAlertas(orcamentosVencidos, orcamentosVencendo, pedidosEntregaProxima, clientesSemAtendimento),
    tituloRanking: usuarioLogado?.tipo === 'Usuario padrao' ? 'Clientes em destaque' : 'Vendedores em destaque',
    descricaoRanking: usuarioLogado?.tipo === 'Usuario padrao'
      ? 'Quem mais comprou no mes dentro da sua carteira.'
      : 'Quem mais movimentou pedidos no mes atual.',
    ranking: usuarioLogado?.tipo === 'Usuario padrao'
      ? montarRankingClientes(pedidosMes, clientesPorId)
      : montarRankingVendedores(pedidosMes, vendedoresPorId),
    agenda
  };
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
      { icone: 'orcamento', titulo: 'Orcamentos em aberto', valor: '0', descricao: '', destaque: '' },
      { icone: 'pedido', titulo: 'Pedidos no mes', valor: '0', descricao: '', destaque: '' },
      { icone: 'atendimentos', titulo: 'Atendimentos no mes', valor: '0', descricao: '', destaque: '' },
      { icone: 'selo', titulo: 'Conversao do mes', valor: '0%', descricao: '', destaque: '' }
    ],
    metricas: [],
    faixas: [],
    exibirFunil: true,
    funil: [],
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

  return (orcamentos || []).filter((item) => (
    idsClientes.has(String(item.idCliente))
    || String(item.idUsuario) === String(usuarioLogado.idUsuario)
  ));
}

function filtrarPedidosVisiveis(pedidos, idsClientes, usuarioLogado) {
  if (usuarioLogado?.tipo !== 'Usuario padrao' || !usuarioLogado?.idVendedor) {
    return Array.isArray(pedidos) ? pedidos : [];
  }

  return (pedidos || []).filter((item) => (
    idsClientes.has(String(item.idCliente))
    || String(item.idUsuario) === String(usuarioLogado.idUsuario)
    || String(item.idVendedor) === String(usuarioLogado.idVendedor)
  ));
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
  const maiorQuantidadeItens = Math.max(...(funil || []).map((item) => Number(item.quantidadeItens) || 0), 0);
  const maiorValor = Math.max(...(funil || []).map((item) => Number(item.valorTotal) || 0), 0);
  return (funil || []).map((item) => ({
    idEtapaOrcamento: item.idEtapaOrcamento,
    descricao: item.descricao,
    quantidadeOrcamentos: `${item.quantidadeOrcamentos} orc.`,
    quantidadeItens: Number(item.quantidadeItens || 0),
    valor: normalizarPreco(item.valorTotal),
    cor: item.cor,
    percentualProdutos: maiorQuantidadeItens > 0
      ? Math.max(8, Math.round((Number(item.quantidadeItens || 0) / maiorQuantidadeItens) * 100))
      : 0,
    percentualValor: maiorValor > 0
      ? Math.max(8, Math.round((Number(item.valorTotal || 0) / maiorValor) * 100))
      : 0,
    ajuda: {
      conceito: `Resumo da etapa ${item.descricao} dentro do funil do orçamento.`,
      calculo: `${item.quantidadeOrcamentos} orcamentos, soma de ${Number(item.quantidadeItens || 0)} nas quantidades dos itens e ${normalizarPreco(item.valorTotal)} em valor total nessa etapa.`,
      observacao: 'As barras comparam a etapa com a maior soma de quantidades dos itens e com o maior valor total entre as etapas do funil.'
    }
  }));
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
    descricao: `${item.quantidade} pedidos no mes atual`,
    valor: normalizarPreco(item.total),
    percentual: maior > 0 ? Math.max(12, Math.round((item.total / maior) * 100)) : 0,
    ajuda: {
      conceito: 'Posicao no ranking de vendas do mes atual.',
      calculo: `${item.quantidade} pedidos do mes atual somando ${normalizarPreco(item.total)}.`,
      observacao: 'A barra compara esse resultado com o maior volume do ranking no mes atual.'
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

function totalRegistro(registro) {
  return Array.isArray(registro?.itens)
    ? registro.itens.reduce((total, item) => total + (Number(item?.valorTotal) || 0), 0)
    : 0;
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

function TooltipExplicacao({ titulo, ajuda }) {
  if (!ajuda) {
    return null;
  }

  return (
    <span className="paginaInicioTooltipExplicacao" role="tooltip">
      <strong>{ajuda.titulo || titulo}</strong>
      {ajuda.conceito ? <span>{`Conceito: ${ajuda.conceito}`}</span> : null}
      {ajuda.calculo ? <span>{`Calculo: ${ajuda.calculo}`}</span> : null}
      {ajuda.observacao ? <span>{`Leitura: ${ajuda.observacao}`}</span> : null}
    </span>
  );
}
