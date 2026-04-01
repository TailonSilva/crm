import { useEffect, useMemo, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { CampoImagemPadrao } from '../../componentes/comuns/campoImagemPadrao';
import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';
import {
  converterPrecoParaNumero,
  desformatarPreco,
  normalizarPreco,
  normalizarPrecoDigitado
} from '../../utilitarios/normalizarPreco';

const abasModalPedido = [
  { id: 'dadosGerais', label: 'Dados gerais' },
  { id: 'itens', label: 'Itens' },
  { id: 'campos', label: 'Campos do pedido' }
];

const estadoInicialFormulario = {
  idOrcamento: '',
  idCliente: '',
  idContato: '',
  idUsuario: '',
  idVendedor: '',
  idPrazoPagamento: '',
  dataInclusao: '',
  dataEntrega: '',
  nomeClienteSnapshot: '',
  nomeContatoSnapshot: '',
  nomeUsuarioSnapshot: '',
  nomeVendedorSnapshot: '',
  nomeMetodoPagamentoSnapshot: '',
  nomePrazoPagamentoSnapshot: '',
  idEtapaPedido: '',
  nomeEtapaPedidoSnapshot: '',
  comissao: '0,00',
  observacao: '',
  itens: [],
  camposExtras: [],
  codigoOrcamentoOrigem: ''
};

const estadoInicialItem = {
  idProduto: '',
  descricaoProdutoSnapshot: '',
  referenciaProdutoSnapshot: '',
  unidadeProdutoSnapshot: '',
  quantidade: '1',
  valorUnitario: '',
  valorTotal: '',
  imagem: '',
  observacao: ''
};

function normalizarEtapasPedido(etapasPedido) {
  if (!Array.isArray(etapasPedido)) {
    return [];
  }

  return etapasPedido
    .map((etapa) => ({
      ...etapa,
      idEtapaPedido: etapa.idEtapaPedido ?? etapa.idEtapa
    }))
    .sort((etapaA, etapaB) => {
      const ordemA = obterValorOrdemEtapa(etapaA?.ordem, etapaA?.idEtapaPedido);
      const ordemB = obterValorOrdemEtapa(etapaB?.ordem, etapaB?.idEtapaPedido);

      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }

      return Number(etapaA?.idEtapaPedido || 0) - Number(etapaB?.idEtapaPedido || 0);
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

export function ModalPedido({
  aberto,
  pedido,
  dadosIniciais,
  clientes,
  contatos,
  usuarios,
  vendedores,
  prazosPagamento,
  etapasPedido,
  produtos,
  camposPedido,
  empresa,
  usuarioLogado,
  modo = 'consulta',
  aoFechar,
  aoSalvar
}) {
  const [formulario, definirFormulario] = useState(estadoInicialFormulario);
  const [abaAtiva, definirAbaAtiva] = useState(abasModalPedido[0].id);
  const [salvando, definirSalvando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [confirmandoSaida, definirConfirmandoSaida] = useState(false);
  const [indiceItemEdicao, definirIndiceItemEdicao] = useState(null);
  const [itemFormulario, definirItemFormulario] = useState(estadoInicialItem);
  const [modalItemAberto, definirModalItemAberto] = useState(false);
  const [mensagemErroItem, definirMensagemErroItem] = useState('');
  const somenteLeitura = modo === 'consulta';
  const modoInclusao = !pedido;
  const registroBase = pedido || dadosIniciais || null;
  const clientesAtivos = clientes.filter((cliente) => cliente.status !== 0);
  const contatosAtivos = contatos.filter((contato) => contato.status !== 0);
  const usuariosAtivos = usuarios.filter((usuario) => usuario.ativo !== 0);
  const vendedoresAtivos = vendedores.filter((vendedor) => vendedor.status !== 0);
  const prazosAtivos = prazosPagamento.filter((prazo) => prazo.status !== 0);
  const produtosAtivos = produtos.filter((produto) => produto.status !== 0);
  const etapasPedidoNormalizadas = useMemo(
    () => normalizarEtapasPedido(etapasPedido).filter((etapa) => etapa.status !== 0),
    [etapasPedido]
  );
  const chaveRegistroBase = pedido?.idPedido || dadosIniciais?.idOrcamento || 'novo';
  const chaveEmpresa = empresa?.diasEntregaPedido ?? '';
  const quantidadeCamposPedido = Array.isArray(camposPedido) ? camposPedido.length : 0;
  const totalPedido = useMemo(
    () => formulario.itens.reduce((total, item) => total + (converterPrecoParaNumero(item.valorTotal) || 0), 0),
    [formulario.itens]
  );
  const contatosDoCliente = useMemo(
    () => contatosAtivos.filter((contato) => String(contato.idCliente) === String(formulario.idCliente)),
    [contatosAtivos, formulario.idCliente]
  );

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirFormulario(criarFormularioInicialPedido(registroBase, usuarioLogado, camposPedido, empresa, { novo: !pedido }));
    definirAbaAtiva(abasModalPedido[0].id);
    definirSalvando(false);
    definirMensagemErro('');
    definirConfirmandoSaida(false);
    definirIndiceItemEdicao(null);
    definirItemFormulario(estadoInicialItem);
    definirModalItemAberto(false);
    definirMensagemErroItem('');
  }, [aberto, chaveRegistroBase, usuarioLogado?.idUsuario, quantidadeCamposPedido, chaveEmpresa]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    function tratarTecla(evento) {
      if (evento.key !== 'Escape' || salvando) {
        return;
      }

      if (modalItemAberto) {
        fecharModalItem();
        return;
      }

      if (confirmandoSaida) {
        definirConfirmandoSaida(false);
        return;
      }

      tentarFecharModal();
    }

    window.addEventListener('keydown', tratarTecla);

    return () => {
      window.removeEventListener('keydown', tratarTecla);
    };
  }, [aberto, confirmandoSaida, modalItemAberto, salvando]);

  if (!aberto) {
    return null;
  }

  function alterarCampo(evento) {
    const { name, value } = evento.target;

    definirFormulario((estadoAtual) => {
      const proximoEstado = {
        ...estadoAtual,
        ...(name === 'idCliente' ? { idContato: '' } : {}),
        [name]: name === 'comissao' ? normalizarPrecoDigitado(value) : value,
        ...(name === 'idEtapaPedido'
          ? {
            nomeEtapaPedidoSnapshot: etapasPedidoNormalizadas.find((etapa) => String(etapa.idEtapaPedido) === String(value))?.descricao || ''
          }
          : {})
      };

      if (name === 'idCliente') {
        const cliente = clientesAtivos.find((item) => String(item.idCliente) === String(value));
        if (cliente) {
          proximoEstado.nomeClienteSnapshot = cliente.nomeFantasia || cliente.razaoSocial || '';
          proximoEstado.idVendedor = cliente.idVendedor ? String(cliente.idVendedor) : '';
          const vendedor = vendedoresAtivos.find((item) => String(item.idVendedor) === String(cliente.idVendedor));
          proximoEstado.nomeVendedorSnapshot = vendedor?.nome || '';
          proximoEstado.comissao = vendedor ? formatarPercentualInput(vendedor.comissaoPadrao) : '0,00';
        }
      }

      if (name === 'idContato') {
        const contato = contatos.find((item) => String(item.idContato) === String(value));
        proximoEstado.nomeContatoSnapshot = contato?.nome || '';
      }

      if (name === 'idVendedor') {
        const vendedor = vendedoresAtivos.find((item) => String(item.idVendedor) === String(value));
        proximoEstado.nomeVendedorSnapshot = vendedor?.nome || '';
        proximoEstado.comissao = vendedor ? formatarPercentualInput(vendedor.comissaoPadrao) : '0,00';
      }

      if (name === 'idPrazoPagamento') {
        const prazo = prazosAtivos.find((item) => String(item.idPrazoPagamento) === String(value));
        proximoEstado.nomePrazoPagamentoSnapshot = prazo?.descricaoFormatada || '';
        proximoEstado.nomeMetodoPagamentoSnapshot = prazo?.nomeMetodoPagamento || '';
      }

      if (name === 'dataInclusao') {
        proximoEstado.dataEntrega = somarDiasNaData(
          value,
          Number(empresa?.diasEntregaPedido ?? 7)
        );
      }

      return proximoEstado;
    });
  }

  function alterarCampoExtra(indice, valor) {
    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      camposExtras: estadoAtual.camposExtras.map((campo, indiceCampo) => (
        indiceCampo === indice ? { ...campo, valor } : campo
      ))
    }));
  }

  function submeterFormulario(evento) {
    evento.preventDefault();
    salvarFormulario();
  }

  async function salvarFormulario() {
    if (somenteLeitura) {
      return;
    }

    if (!String(formulario.idCliente || '').trim()) {
      definirMensagemErro('Selecione o cliente do pedido.');
      return;
    }

    if (!String(formulario.idUsuario || '').trim()) {
      definirMensagemErro('Selecione o usuario do registro.');
      return;
    }

    if (!String(formulario.idVendedor || '').trim()) {
      definirMensagemErro('Selecione o vendedor.');
      return;
    }

    if (formulario.itens.length === 0) {
      definirMensagemErro('Inclua ao menos um item no pedido.');
      return;
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      await aoSalvar(formulario);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel salvar o pedido.');
      definirSalvando(false);
    }
  }

  function abrirEdicaoItem(item, indice) {
    definirIndiceItemEdicao(indice);
    definirItemFormulario({
      idProduto: String(item.idProduto || ''),
      descricaoProdutoSnapshot: item.descricaoProdutoSnapshot || '',
      referenciaProdutoSnapshot: item.referenciaProdutoSnapshot || '',
      unidadeProdutoSnapshot: item.unidadeProdutoSnapshot || '',
      quantidade: String(item.quantidade || '1'),
      valorUnitario: item.valorUnitario ? desformatarPreco(item.valorUnitario) : '',
      valorTotal: item.valorTotal ? desformatarPreco(item.valorTotal) : '',
      imagem: item.imagem || '',
      observacao: item.observacao || ''
    });
    definirMensagemErroItem('');
    definirModalItemAberto(true);
  }

  function fecharModalItem() {
    definirIndiceItemEdicao(null);
    definirItemFormulario(estadoInicialItem);
    definirModalItemAberto(false);
    definirMensagemErroItem('');
  }

  function alterarItemCampo(evento) {
    const { name, value } = evento.target;

    definirItemFormulario((estadoAtual) => {
      const proximoEstado = {
        ...estadoAtual,
        [name]: ['valorUnitario', 'valorTotal'].includes(name)
          ? normalizarPrecoDigitado(value)
          : value
      };

      if (name === 'idProduto') {
        const produto = produtosAtivos.find((item) => String(item.idProduto) === String(value));
        if (produto) {
          const precoPadrao = formatarPrecoInput(produto.preco);
          proximoEstado.descricaoProdutoSnapshot = produto.descricao || '';
          proximoEstado.referenciaProdutoSnapshot = produto.referencia || '';
          proximoEstado.unidadeProdutoSnapshot = produto.nomeUnidadeMedida || produto.siglaUnidadeMedida || '';
          proximoEstado.valorUnitario = precoPadrao;
          proximoEstado.valorTotal = calcularTotalItem(proximoEstado.quantidade, precoPadrao);
          proximoEstado.imagem = produto.imagem || estadoAtual.imagem || '';
        }
      }

      if (name === 'quantidade' || name === 'valorUnitario') {
        proximoEstado.valorTotal = calcularTotalItem(
          name === 'quantidade' ? value : proximoEstado.quantidade,
          name === 'valorUnitario' ? proximoEstado.valorUnitario : proximoEstado.valorUnitario
        );
      }

      return proximoEstado;
    });
  }

  function salvarItem(evento) {
    evento?.preventDefault?.();
    evento?.stopPropagation?.();

    const quantidade = Number(String(itemFormulario.quantidade || '').replace(',', '.'));
    const valorUnitario = converterPrecoParaNumero(itemFormulario.valorUnitario);

    if (!quantidade || !valorUnitario) {
      definirMensagemErroItem('Informe quantidade e valor unitario validos.');
      return;
    }

    const itemAtualizado = {
      ...formulario.itens[indiceItemEdicao],
      idProduto: itemFormulario.idProduto ? Number(itemFormulario.idProduto) : null,
      quantidade: String(quantidade),
      valorUnitario: normalizarPreco(valorUnitario),
      valorTotal: normalizarPreco(quantidade * valorUnitario),
      imagem: itemFormulario.imagem || '',
      observacao: itemFormulario.observacao || '',
      descricaoProdutoSnapshot: itemFormulario.descricaoProdutoSnapshot || formulario.itens[indiceItemEdicao]?.descricaoProdutoSnapshot || '',
      referenciaProdutoSnapshot: itemFormulario.referenciaProdutoSnapshot || formulario.itens[indiceItemEdicao]?.referenciaProdutoSnapshot || '',
      unidadeProdutoSnapshot: itemFormulario.unidadeProdutoSnapshot || formulario.itens[indiceItemEdicao]?.unidadeProdutoSnapshot || ''
    };

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      itens: indiceItemEdicao === null
        ? [...estadoAtual.itens, itemAtualizado]
        : estadoAtual.itens.map((item, indice) => (indice === indiceItemEdicao ? itemAtualizado : item))
    }));

    fecharModalItem();
  }

  function fecharAoClicarNoFundo(evento) {
    if (evento.target === evento.currentTarget && !salvando) {
      tentarFecharModal();
    }
  }

  function tentarFecharModal() {
    if (!somenteLeitura && modoInclusao) {
      definirConfirmandoSaida(true);
      return;
    }

    aoFechar();
  }

  function confirmarSaida() {
    definirConfirmandoSaida(false);
    aoFechar();
  }

  return (
    <div className="camadaModal" role="presentation" onMouseDown={fecharAoClicarNoFundo}>
      <form
        className="modalCliente modalClienteComAbas modalOrcamento modalPedido"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalPedido"
        onMouseDown={(evento) => evento.stopPropagation()}
        onSubmit={submeterFormulario}
      >
        <header className="cabecalhoModalCliente">
          <div className="cabecalhoModalOrcamento">
            <div>
              <h2 id="tituloModalPedido">
                {somenteLeitura ? 'Consultar pedido' : pedido ? 'Editar pedido' : 'Incluir pedido'}
              </h2>
            </div>
            {pedido?.idPedido ? <CodigoRegistro valor={pedido.idPedido} /> : null}
          </div>

          <div className="acoesCabecalhoModalCliente">
            <Botao variante="secundario" type="button" onClick={tentarFecharModal} disabled={salvando}>
              {somenteLeitura ? 'Fechar' : 'Cancelar'}
            </Botao>
            {!somenteLeitura ? (
              <Botao variante="primario" type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </Botao>
            ) : null}
          </div>
        </header>

        <div className="abasModalCliente" role="tablist" aria-label="Secoes do pedido">
          {abasModalPedido.map((aba) => (
            <button
              key={aba.id}
              type="button"
              role="tab"
              className={`abaModalCliente ${abaAtiva === aba.id ? 'ativa' : ''}`}
              aria-selected={abaAtiva === aba.id}
              onClick={() => definirAbaAtiva(aba.id)}
            >
              {aba.label}
            </button>
          ))}
        </div>

        <div className="corpoModalCliente corpoModalOrcamentoAbas">
          {abaAtiva === 'dadosGerais' ? (
            <section className="layoutModalOrcamentoAba">
              <div className="linhaOrcamentoDatas">
                <CampoFormulario label="Data de inclusao" name="dataInclusao" type="date" value={formulario.dataInclusao} onChange={alterarCampo} disabled={somenteLeitura} />
                <CampoFormulario label="Data de entrega" name="dataEntrega" type="date" value={formulario.dataEntrega} onChange={alterarCampo} disabled={somenteLeitura} />
                {modoInclusao ? (
                  <CampoSelect
                    label="Usuario do registro"
                    name="idUsuario"
                    value={formulario.idUsuario}
                    onChange={alterarCampo}
                    options={usuariosAtivos.map((usuario) => ({
                      valor: String(usuario.idUsuario),
                      label: usuario.nome
                    }))}
                    disabled={somenteLeitura}
                  />
                ) : (
                  <CampoFormulario label="Usuario do registro" name="nomeUsuarioSnapshot" value={formulario.nomeUsuarioSnapshot} disabled />
                )}
              </div>

              <div className="linhaClienteContatoAtendimento">
                {modoInclusao ? (
                  <>
                    <CampoSelect
                      label="Cliente"
                      name="idCliente"
                      value={formulario.idCliente}
                      onChange={alterarCampo}
                      options={clientesAtivos.map((cliente) => ({
                        valor: String(cliente.idCliente),
                        label: cliente.nomeFantasia || cliente.razaoSocial
                      }))}
                      disabled={somenteLeitura}
                    />
                    <CampoSelect
                      label="Contato"
                      name="idContato"
                      value={formulario.idContato}
                      onChange={alterarCampo}
                      options={contatosDoCliente.map((contato) => ({
                        valor: String(contato.idContato),
                        label: contato.nome
                      }))}
                      disabled={somenteLeitura || !formulario.idCliente}
                    />
                  </>
                ) : (
                  <>
                    <CampoFormulario label="Cliente" name="nomeClienteSnapshot" value={formulario.nomeClienteSnapshot} disabled />
                    <CampoFormulario label="Contato" name="nomeContatoSnapshot" value={formulario.nomeContatoSnapshot} disabled />
                  </>
                )}
              </div>

              <div className="linhaOrcamentoComercial">
                {modoInclusao ? (
                  <>
                    <CampoSelect
                      label="Vendedor"
                      name="idVendedor"
                      value={formulario.idVendedor}
                      onChange={alterarCampo}
                      options={vendedoresAtivos.map((vendedor) => ({
                        valor: String(vendedor.idVendedor),
                        label: vendedor.nome
                      }))}
                      disabled={somenteLeitura}
                    />
                    <CampoSelect
                      label="Prazo de pagamento"
                      name="idPrazoPagamento"
                      value={formulario.idPrazoPagamento}
                      onChange={alterarCampo}
                      options={prazosAtivos.map((prazo) => ({
                        valor: String(prazo.idPrazoPagamento),
                        label: prazo.descricaoFormatada || prazo.descricao || 'Prazo'
                      }))}
                      disabled={somenteLeitura}
                    />
                  </>
                ) : (
                  <>
                    <CampoFormulario label="Vendedor" name="nomeVendedorSnapshot" value={formulario.nomeVendedorSnapshot} disabled />
                    <CampoFormulario label="Prazo de pagamento" name="nomePrazoPagamentoSnapshot" value={formulario.nomePrazoPagamentoSnapshot} disabled />
                  </>
                )}
                <CampoFormulario label="Comissao (%)" name="comissao" value={formulario.comissao} onChange={alterarCampo} disabled={somenteLeitura} />
              </div>

              <div className="linhaOrcamentoFechamento">
                {formulario.codigoOrcamentoOrigem ? (
                  <CampoFormulario
                    label="Orcamento vinculado"
                    name="orcamentoOrigemPedido"
                    value={`#${String(formulario.codigoOrcamentoOrigem).padStart(4, '0')}`}
                    disabled
                  />
                ) : (
                  <div />
                )}
                <CampoSelect
                  label="Etapa do pedido"
                  name="idEtapaPedido"
                  value={formulario.idEtapaPedido}
                  onChange={alterarCampo}
                  options={etapasPedidoNormalizadas.map((etapa) => ({
                    valor: String(etapa.idEtapaPedido),
                    label: etapa.descricao
                  }))}
                  disabled={somenteLeitura}
                />
                <CampoFormulario label="Total" name="totalPedido" value={normalizarPreco(totalPedido)} disabled />
              </div>
            </section>
          ) : null}

          {abaAtiva === 'itens' ? (
            <section className="layoutModalOrcamentoAba layoutModalOrcamentoAbaItens">
              <section className="painelItensOrcamento">
                <div className="cabecalhoItensOrcamento">
                  <h3>Itens do pedido</h3>
                  {!somenteLeitura ? (
                    <Botao variante="secundario" type="button" onClick={() => {
                      definirIndiceItemEdicao(null);
                      definirItemFormulario(estadoInicialItem);
                      definirMensagemErroItem('');
                      definirModalItemAberto(true);
                    }}>
                      Adicionar item
                    </Botao>
                  ) : null}
                </div>

                <div className="gradeContatosModal gradeItensOrcamentoRolavel">
                  <table className="tabelaContatosModal tabelaItensOrcamento">
                    <thead>
                      <tr>
                        <th>Foto</th>
                        <th>Produto</th>
                        <th>Quantidade</th>
                        <th>Valor unitario</th>
                        <th>Total</th>
                        <th>Observacao</th>
                        <th className="cabecalhoAcoesContato">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formulario.itens.length > 0 ? formulario.itens.map((item, indice) => {
                        const imagemItem = item.imagem || '';

                        return (
                          <tr key={`${item.idItemPedido || indice}-${indice}`}>
                            <td>
                              {imagemItem ? (
                                <img src={imagemItem} alt={item.descricaoProdutoSnapshot || 'Item do pedido'} className="miniaturaItemOrcamento" />
                              ) : (
                                <div className="miniaturaItemOrcamentoPlaceholder">
                                  {obterIniciaisItemPedido(item)}
                                </div>
                              )}
                            </td>
                            <td>{item.descricaoProdutoSnapshot || 'Produto nao informado'}</td>
                            <td>{item.quantidade}</td>
                            <td>{normalizarPreco(item.valorUnitario)}</td>
                            <td>{normalizarPreco(item.valorTotal)}</td>
                            <td>{item.observacao || 'Sem observacao'}</td>
                            <td className="celulaAcoesUsuarios">
                              <div className="acoesContatoModal">
                                <Botao
                                  variante="secundario"
                                  type="button"
                                  icone={somenteLeitura ? 'consultar' : 'editar'}
                                  somenteIcone
                                  title={somenteLeitura ? 'Consultar item' : 'Editar item'}
                                  aria-label={somenteLeitura ? 'Consultar item' : 'Editar item'}
                                  onClick={() => abrirEdicaoItem(item, indice)}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={7} className="mensagemTabelaContatosModal">
                            Nenhum item informado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
              <div className="resumoTotalItensOrcamento resumoTotalItensOrcamentoRodape">
                <span className="rotuloResumoTotalItensOrcamento">Total dos itens</span>
                <strong className="valorResumoTotalItensOrcamento">{normalizarPreco(totalPedido)}</strong>
              </div>
            </section>
          ) : null}

          {abaAtiva === 'campos' ? (
            <section className="layoutModalOrcamentoAba layoutModalOrcamentoCampos">
              <div className="campoFormulario campoFormularioIntegral">
                <label htmlFor="observacaoPedido">Observacao do pedido</label>
                <textarea
                  id="observacaoPedido"
                  name="observacao"
                  className="entradaFormulario entradaFormularioTextoCurto"
                  rows={2}
                  value={formulario.observacao}
                  onChange={alterarCampo}
                  disabled={somenteLeitura}
                />
              </div>

              {formulario.camposExtras.length > 0 ? (
                <section className="painelCamposExtrasOrcamento">
                  <div className="listaCamposExtrasOrcamento">
                    {formulario.camposExtras.map((campo, indice) => (
                      <div key={`${campo.idCampoPedido || indice}-${indice}`} className="campoFormulario campoFormularioIntegral">
                        <label htmlFor={`campoPedido${campo.idCampoPedido || indice}`}>{campo.tituloSnapshot || campo.titulo || `Campo ${indice + 1}`}</label>
                        <textarea
                          id={`campoPedido${campo.idCampoPedido || indice}`}
                          className="entradaFormulario entradaFormularioTextoCurto"
                          rows={2}
                          value={campo.valor || ''}
                          onChange={(evento) => alterarCampoExtra(indice, evento.target.value)}
                          disabled={somenteLeitura}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </section>
          ) : null}
        </div>

        {mensagemErro ? <p className="mensagemErroFormulario">{mensagemErro}</p> : null}

        {confirmandoSaida ? (
          <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={() => definirConfirmandoSaida(false)}>
            <div
              className="modalConfirmacaoAgenda"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="tituloConfirmacaoSaidaPedido"
              onMouseDown={(evento) => evento.stopPropagation()}
            >
              <div className="cabecalhoConfirmacaoModal">
                <h4 id="tituloConfirmacaoSaidaPedido">Cancelar cadastro</h4>
              </div>
              <div className="corpoConfirmacaoModal">
                <p>Se fechar agora, todas as informacoes preenchidas serao perdidas.</p>
              </div>
              <div className="acoesConfirmacaoModal">
                <Botao variante="secundario" type="button" onClick={() => definirConfirmandoSaida(false)}>Nao</Botao>
                <Botao variante="perigo" type="button" onClick={confirmarSaida}>Sim</Botao>
              </div>
            </div>
          </div>
        ) : null}

        {modalItemAberto ? (
          <div className="camadaModalContato" role="presentation" onMouseDown={fecharModalItem}>
            <div
              className="modalContatoCliente modalItemOrcamento"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tituloModalItemPedido"
              onMouseDown={(evento) => evento.stopPropagation()}
            >
              <div className="cabecalhoModalContato">
                <h3 id="tituloModalItemPedido">{somenteLeitura ? 'Consultar item do pedido' : 'Editar item do pedido'}</h3>

                <div className="acoesFormularioContatoModal">
                  <Botao variante="secundario" type="button" onClick={fecharModalItem}>
                    {somenteLeitura ? 'Fechar' : 'Cancelar'}
                  </Botao>
                  {!somenteLeitura ? (
                    <Botao variante="primario" type="button" onClick={salvarItem}>
                      Salvar
                    </Botao>
                  ) : null}
                </div>
              </div>

              <div className="corpoModalContato">
                <div className="layoutModalOrcamento">
                  <CampoImagemPadrao
                    valor={itemFormulario.imagem}
                    alt={itemFormulario.descricaoProdutoSnapshot || 'Item do pedido'}
                    iniciais={obterIniciaisItemPedido(itemFormulario)}
                    disabled={somenteLeitura}
                    onChange={(imagem) => definirItemFormulario((estadoAtual) => ({
                      ...estadoAtual,
                      imagem: imagem || ''
                    }))}
                  />

                  <div className="colunaPrincipalModalOrcamento">
                    {somenteLeitura ? (
                      <CampoFormulario label="Produto" name="descricaoProdutoSnapshot" value={itemFormulario.descricaoProdutoSnapshot} disabled />
                    ) : (
                      <CampoSelect
                        label="Produto"
                        name="idProduto"
                        value={itemFormulario.idProduto}
                        onChange={alterarItemCampo}
                        options={produtosAtivos.map((produto) => ({
                          valor: String(produto.idProduto),
                          label: produto.descricao || produto.referencia || `Produto ${produto.idProduto}`
                        }))}
                        disabled={somenteLeitura}
                      />
                    )}
                    <div className="linhaUsuarioCanalOrigemAtendimento">
                      <CampoFormulario label="Quantidade" name="quantidade" value={itemFormulario.quantidade} onChange={alterarItemCampo} disabled={somenteLeitura} />
                      <CampoFormulario label="Valor unitario" name="valorUnitario" value={itemFormulario.valorUnitario} onChange={alterarItemCampo} disabled={somenteLeitura} />
                      <CampoFormulario label="Valor total" name="valorTotal" value={itemFormulario.valorTotal} onChange={alterarItemCampo} disabled />
                    </div>
                    <div className="campoFormulario campoFormularioIntegral">
                      <label htmlFor="observacaoItemPedido">Observacao do item</label>
                      <textarea
                        id="observacaoItemPedido"
                        name="observacao"
                        className="entradaFormulario entradaFormularioTextoLongo"
                        rows={4}
                        value={itemFormulario.observacao}
                        onChange={alterarItemCampo}
                        disabled={somenteLeitura}
                      />
                    </div>
                  </div>
                </div>
                {mensagemErroItem ? <p className="mensagemErroFormulario">{mensagemErroItem}</p> : null}
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}

function CampoFormulario({ label, name, type = 'text', ...props }) {
  return (
    <div className="campoFormulario">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="entradaFormulario" {...props} />
    </div>
  );
}

function CampoSelect({ label, name, options, ...props }) {
  return (
    <div className="campoFormulario">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} className="entradaFormulario" {...props}>
        <option value="">Selecione</option>
        {options.map((option, indice) => (
          <option key={`${option.valor ?? option.label ?? 'opcao'}-${indice}`} value={option.valor ?? ''}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function criarFormularioInicialPedido(pedido, usuarioLogado, camposPedido, empresa, { novo = !pedido } = {}) {
  if (!pedido || novo) {
    return {
      ...estadoInicialFormulario,
      idOrcamento: pedido?.idOrcamento ? String(pedido.idOrcamento) : '',
      idCliente: pedido?.idCliente ? String(pedido.idCliente) : '',
      idContato: pedido?.idContato ? String(pedido.idContato) : '',
      idUsuario: String(pedido?.idUsuario || usuarioLogado?.idUsuario || ''),
      idVendedor: pedido?.idVendedor ? String(pedido.idVendedor) : '',
      idPrazoPagamento: pedido?.idPrazoPagamento ? String(pedido.idPrazoPagamento) : '',
      dataInclusao: pedido?.dataInclusao || obterDataAtualFormatoInput(),
      dataEntrega: pedido?.dataEntrega || somarDiasNaData(
        pedido?.dataInclusao || obterDataAtualFormatoInput(),
        Number(empresa?.diasEntregaPedido ?? 7)
      ),
      nomeClienteSnapshot: pedido?.nomeClienteSnapshot || '',
      nomeContatoSnapshot: pedido?.nomeContatoSnapshot || '',
      nomeUsuarioSnapshot: pedido?.nomeUsuarioSnapshot || usuarioLogado?.nome || '',
      nomeVendedorSnapshot: pedido?.nomeVendedorSnapshot || '',
      nomeMetodoPagamentoSnapshot: pedido?.nomeMetodoPagamentoSnapshot || '',
      nomePrazoPagamentoSnapshot: pedido?.nomePrazoPagamentoSnapshot || '',
      idEtapaPedido: pedido?.idEtapaPedido ? String(pedido.idEtapaPedido) : '',
      nomeEtapaPedidoSnapshot: pedido?.nomeEtapaPedidoSnapshot || '',
      comissao: formatarPercentualInput(pedido?.comissao),
      observacao: pedido?.observacao || '',
      codigoOrcamentoOrigem: pedido?.codigoOrcamentoOrigem || '',
      itens: Array.isArray(pedido?.itens) ? pedido.itens.map((item) => ({
        idItemPedido: item.idItemPedido,
        idProduto: item.idProduto,
        descricaoProdutoSnapshot: item.descricaoProdutoSnapshot || '',
        referenciaProdutoSnapshot: item.referenciaProdutoSnapshot || '',
        unidadeProdutoSnapshot: item.unidadeProdutoSnapshot || '',
        quantidade: String(item.quantidade || ''),
        valorUnitario: item.valorUnitario ? normalizarPreco(item.valorUnitario) : '',
        valorTotal: item.valorTotal ? normalizarPreco(item.valorTotal) : '',
        imagem: item.imagem || '',
        observacao: item.observacao || ''
      })) : [],
      camposExtras: Array.isArray(pedido?.camposExtras) && pedido.camposExtras.length > 0
        ? pedido.camposExtras.map((campo) => ({
          idCampoPedido: campo.idCampoPedido || null,
          tituloSnapshot: campo.tituloSnapshot || campo.titulo || '',
          valor: campo.valor || ''
        }))
        : Array.isArray(camposPedido)
          ? camposPedido
            .filter((campo) => campo.status !== 0)
            .map((campo) => ({
              idCampoPedido: campo.idCampoPedido,
              tituloSnapshot: campo.titulo,
              valor: campo.descricaoPadrao || ''
            }))
          : []
    };
  }

  return {
    ...estadoInicialFormulario,
    idOrcamento: pedido.idOrcamento ? String(pedido.idOrcamento) : '',
    idCliente: pedido.idCliente ? String(pedido.idCliente) : '',
    idContato: pedido.idContato ? String(pedido.idContato) : '',
    idUsuario: pedido.idUsuario ? String(pedido.idUsuario) : '',
    idVendedor: pedido.idVendedor ? String(pedido.idVendedor) : '',
    idPrazoPagamento: pedido.idPrazoPagamento ? String(pedido.idPrazoPagamento) : '',
    dataInclusao: pedido.dataInclusao || '',
    dataEntrega: pedido.dataEntrega || pedido.dataValidade || '',
    nomeClienteSnapshot: pedido.nomeClienteSnapshot || '',
    nomeContatoSnapshot: pedido.nomeContatoSnapshot || '',
    nomeUsuarioSnapshot: pedido.nomeUsuarioSnapshot || '',
    nomeVendedorSnapshot: pedido.nomeVendedorSnapshot || '',
    nomeMetodoPagamentoSnapshot: pedido.nomeMetodoPagamentoSnapshot || '',
    nomePrazoPagamentoSnapshot: pedido.nomePrazoPagamentoSnapshot || '',
    idEtapaPedido: pedido.idEtapaPedido ? String(pedido.idEtapaPedido) : '',
    nomeEtapaPedidoSnapshot: pedido.nomeEtapaPedidoSnapshot || '',
    comissao: formatarPercentualInput(pedido.comissao),
    observacao: pedido.observacao || '',
    codigoOrcamentoOrigem: pedido.codigoOrcamentoOrigem || '',
    itens: Array.isArray(pedido.itens) ? pedido.itens.map((item) => ({
      idItemPedido: item.idItemPedido,
      idProduto: item.idProduto,
      descricaoProdutoSnapshot: item.descricaoProdutoSnapshot || '',
      referenciaProdutoSnapshot: item.referenciaProdutoSnapshot || '',
      unidadeProdutoSnapshot: item.unidadeProdutoSnapshot || '',
      quantidade: String(item.quantidade || ''),
      valorUnitario: item.valorUnitario ? normalizarPreco(item.valorUnitario) : '',
      valorTotal: item.valorTotal ? normalizarPreco(item.valorTotal) : '',
      imagem: item.imagem || '',
      observacao: item.observacao || ''
    })) : [],
    camposExtras: Array.isArray(pedido.camposExtras) ? pedido.camposExtras.map((campo) => ({
      idCampoPedido: campo.idCampoPedido || null,
      tituloSnapshot: campo.tituloSnapshot || '',
      valor: campo.valor || ''
    })) : []
  };
}

function formatarPercentualInput(valor) {
  const numero = Number(valor ?? 0);
  if (Number.isNaN(numero)) {
    return '0,00';
  }

  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function obterDataAtualFormatoInput() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function somarDiasNaData(dataBase, dias) {
  if (!dataBase) {
    return '';
  }

  const [ano, mes, dia] = String(dataBase).split('-').map(Number);
  const diasNormalizados = Number.isFinite(Number(dias)) ? Number(dias) : 0;
  const data = new Date(ano, (mes || 1) - 1, dia || 1);

  if (Number.isNaN(data.getTime())) {
    return dataBase;
  }

  data.setDate(data.getDate() + diasNormalizados);

  const proximoAno = data.getFullYear();
  const proximoMes = String(data.getMonth() + 1).padStart(2, '0');
  const proximoDia = String(data.getDate()).padStart(2, '0');

  return `${proximoAno}-${proximoMes}-${proximoDia}`;
}

function calcularTotalItem(quantidade, valorUnitario) {
  const numeroQuantidade = Number(String(quantidade ?? '').replace(',', '.'));
  const numeroValorUnitario = converterPrecoParaNumero(valorUnitario);

  if (!numeroQuantidade || numeroValorUnitario === null) {
    return '';
  }

  return desformatarPreco(numeroQuantidade * numeroValorUnitario);
}

function formatarPrecoInput(valor) {
  const numero = converterPrecoParaNumero(valor);
  return numero === null ? '' : desformatarPreco(numero);
}

function obterIniciaisItemPedido(item) {
  const descricao = item?.descricaoProdutoSnapshot || 'Item';
  const partes = String(descricao).trim().split(/\s+/).filter(Boolean);
  const iniciais = partes.slice(0, 2).map((parte) => parte[0]).join('');
  return (iniciais || 'IT').toUpperCase();
}
