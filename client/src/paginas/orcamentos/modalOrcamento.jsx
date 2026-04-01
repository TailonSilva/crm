import { useEffect, useMemo, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { CampoImagemPadrao } from '../../componentes/comuns/campoImagemPadrao';
import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';
import { ModalBuscaClientes } from '../../componentes/comuns/modalBuscaClientes';
import { ModalBuscaContatos } from '../../componentes/comuns/modalBuscaContatos';
import { ModalBuscaTabela } from '../../componentes/comuns/modalBuscaTabela';
import {
  converterPrecoParaNumero,
  desformatarPreco,
  normalizarPreco,
  normalizarPrecoDigitado
} from '../../utilitarios/normalizarPreco';

const abasModalOrcamento = [
  { id: 'dadosGerais', label: 'Dados gerais' },
  { id: 'itens', label: 'Itens' },
  { id: 'campos', label: 'Campos do orcamento' }
];

const ID_ETAPA_ORCAMENTO_FECHAMENTO = 1;

const estadoInicialFormulario = {
  dataInclusao: '',
  dataValidade: '',
  idCliente: '',
  idContato: '',
  idUsuario: '',
  nomeUsuario: '',
  idVendedor: '',
  comissao: '0,00',
  idPrazoPagamento: '',
  idEtapaOrcamento: '',
  idMotivoPerda: '',
  idPedidoVinculado: '',
  solicitarPedidoAoSalvar: false,
  observacao: '',
  itens: [],
  camposExtras: []
};

const estadoInicialItem = {
  idProduto: '',
  quantidade: '1',
  valorUnitario: '',
  valorTotal: '',
  imagem: '',
  observacao: ''
};

export function ModalOrcamento({
  aberto,
  orcamento,
  clientes,
  contatos,
  usuarios,
  vendedores,
  prazosPagamento,
  etapasOrcamento,
  motivosPerda,
  produtos,
  camposOrcamento,
  empresa,
  usuarioLogado,
  modo = 'novo',
  aoFechar,
  aoSalvar
}) {
  const [formulario, definirFormulario] = useState(estadoInicialFormulario);
  const [abaAtiva, definirAbaAtiva] = useState(abasModalOrcamento[0].id);
  const [salvando, definirSalvando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [confirmandoSaida, definirConfirmandoSaida] = useState(false);
  const [confirmandoFechamento, definirConfirmandoFechamento] = useState(false);
  const [idEtapaAnteriorFechamento, definirIdEtapaAnteriorFechamento] = useState('');
  const [idEtapaPendenteFechamento, definirIdEtapaPendenteFechamento] = useState('');
  const [modalMotivoPerdaAberto, definirModalMotivoPerdaAberto] = useState(false);
  const [modalBuscaClienteAberto, definirModalBuscaClienteAberto] = useState(false);
  const [modalBuscaContatoAberto, definirModalBuscaContatoAberto] = useState(false);
  const [modalBuscaProdutoAberto, definirModalBuscaProdutoAberto] = useState(false);
  const [modalItemAberto, definirModalItemAberto] = useState(false);
  const [indiceItemEdicao, definirIndiceItemEdicao] = useState(null);
  const [itemFormulario, definirItemFormulario] = useState(estadoInicialItem);
  const [mensagemErroItem, definirMensagemErroItem] = useState('');
  const somenteLeitura = modo === 'consulta';
  const modoInclusao = !orcamento;
  const clientesAtivos = clientes.filter((cliente) => cliente.status !== 0);
  const contatosAtivos = contatos.filter((contato) => contato.status !== 0);
  const usuariosAtivos = usuarios.filter((usuario) => usuario.ativo !== 0);
  const vendedoresAtivos = vendedores.filter((vendedor) => vendedor.status !== 0);
  const prazosAtivos = prazosPagamento.filter((prazo) => prazo.status !== 0);
  const etapasAtivas = useMemo(
    () => ordenarEtapasPorOrdem(etapasOrcamento.filter((etapa) => etapa.status !== 0), 'idEtapaOrcamento'),
    [etapasOrcamento]
  );
  const motivosAtivos = motivosPerda.filter((motivo) => motivo.status !== 0);
  const produtosAtivos = produtos.filter((produto) => produto.status !== 0);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirFormulario(criarFormularioInicial(orcamento, usuarioLogado, camposOrcamento, empresa));
    definirAbaAtiva(abasModalOrcamento[0].id);
    definirSalvando(false);
    definirMensagemErro('');
    definirConfirmandoSaida(false);
    definirConfirmandoFechamento(false);
    definirIdEtapaAnteriorFechamento('');
    definirIdEtapaPendenteFechamento('');
    definirModalMotivoPerdaAberto(false);
    definirModalBuscaClienteAberto(false);
    definirModalBuscaContatoAberto(false);
    definirModalBuscaProdutoAberto(false);
    definirModalItemAberto(false);
    definirIndiceItemEdicao(null);
    definirItemFormulario(estadoInicialItem);
    definirMensagemErroItem('');
  }, [aberto, orcamento, usuarioLogado, camposOrcamento, empresa]);

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

      if (modalBuscaClienteAberto) {
        fecharModalBuscaCliente();
        return;
      }

      if (modalBuscaContatoAberto) {
        fecharModalBuscaContato();
        return;
      }

      if (modalMotivoPerdaAberto) {
        definirModalMotivoPerdaAberto(false);
        return;
      }

      if (confirmandoFechamento) {
        cancelarConfirmacaoFechamento();
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
  }, [aberto, confirmandoFechamento, confirmandoSaida, modalBuscaClienteAberto, modalBuscaContatoAberto, modalItemAberto, salvando]);

  const contatosDoCliente = contatosAtivos.filter((contato) => String(contato.idCliente) === String(formulario.idCliente));
  const etapaSelecionada = etapasAtivas.find((etapa) => String(etapa.idEtapaOrcamento) === String(formulario.idEtapaOrcamento));
  const produtoSelecionadoItem = produtosAtivos.find((produto) => String(produto.idProduto) === String(itemFormulario.idProduto));
  const totalOrcamento = useMemo(
    () => formulario.itens.reduce((total, item) => total + (converterPrecoParaNumero(item.valorTotal) || 0), 0),
    [formulario.itens]
  );

  if (!aberto) {
    return null;
  }

  function alterarCampo(evento) {
    const { name, value } = evento.target;

    if (name === 'idEtapaOrcamento') {
      const etapaAtual = etapasAtivas.find((item) => String(item.idEtapaOrcamento) === String(formulario.idEtapaOrcamento || ''));
      const proximaEtapa = etapasAtivas.find((item) => String(item.idEtapaOrcamento) === String(value || ''));

      if (
        !somenteLeitura
        && !formulario.idPedidoVinculado
        && !etapaOrcamentoEhFechamento(etapaAtual)
        && etapaOrcamentoEhFechamento(proximaEtapa)
      ) {
        definirIdEtapaAnteriorFechamento(String(formulario.idEtapaOrcamento || ''));
        definirIdEtapaPendenteFechamento(String(value || ''));
        definirConfirmandoFechamento(true);
        return;
      }
    }

    definirFormulario((estadoAtual) => {
      const proximoEstado = {
        ...estadoAtual,
        ...(name === 'idCliente' ? { idContato: '' } : {}),
        [name]: name === 'comissao' ? normalizarPrecoDigitado(value) : value
      };

      if (name === 'idCliente') {
        const cliente = clientesAtivos.find((item) => String(item.idCliente) === String(value));

        if (cliente) {
          proximoEstado.idVendedor = cliente.idVendedor ? String(cliente.idVendedor) : '';
          const vendedor = vendedoresAtivos.find((item) => String(item.idVendedor) === String(cliente.idVendedor));
          proximoEstado.comissao = vendedor ? formatarPercentualInput(vendedor.comissaoPadrao) : '0,00';
        } else {
          proximoEstado.idVendedor = '';
          proximoEstado.comissao = '0,00';
        }
      }

      if (name === 'idVendedor') {
        const vendedor = vendedoresAtivos.find((item) => String(item.idVendedor) === String(value));
        proximoEstado.comissao = vendedor ? formatarPercentualInput(vendedor.comissaoPadrao) : '0,00';
      }

      if (name === 'idEtapaOrcamento') {
        const etapa = etapasAtivas.find((item) => String(item.idEtapaOrcamento) === String(value));
        proximoEstado.solicitarPedidoAoSalvar = false;

        if (!etapa?.obrigarMotivoPerda) {
          proximoEstado.idMotivoPerda = '';
        }
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

  async function submeterFormulario(evento) {
    evento.preventDefault();

    await salvarFormulario();
  }

  async function salvarFormulario() {

    if (somenteLeitura) {
      return;
    }

    if (!String(formulario.idCliente || '').trim()) {
      definirMensagemErro('Selecione o cliente do orcamento.');
      return;
    }

    if (!String(formulario.idVendedor || '').trim()) {
      definirMensagemErro('Selecione o vendedor.');
      return;
    }

    if (formulario.itens.length === 0) {
      definirMensagemErro('Inclua ao menos um item no orcamento.');
      return;
    }

    if (etapaSelecionada?.obrigarMotivoPerda && !String(formulario.idMotivoPerda || '').trim()) {
      definirModalMotivoPerdaAberto(true);
      return;
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      await aoSalvar(formulario);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel salvar o orcamento.');
      definirSalvando(false);
    }
  }

  function tentarFecharModal() {
    if (!somenteLeitura && modoInclusao) {
      definirConfirmandoSaida(true);
      return;
    }

    aoFechar();
  }

  function confirmarFechamento() {
    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      idEtapaOrcamento: idEtapaPendenteFechamento,
      solicitarPedidoAoSalvar: true
    }));
    definirConfirmandoFechamento(false);
    definirIdEtapaAnteriorFechamento('');
    definirIdEtapaPendenteFechamento('');
  }

  function cancelarConfirmacaoFechamento() {
    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      idEtapaOrcamento: idEtapaAnteriorFechamento,
      solicitarPedidoAoSalvar: false
    }));
    definirConfirmandoFechamento(false);
    definirIdEtapaAnteriorFechamento('');
    definirIdEtapaPendenteFechamento('');
  }

  function confirmarSaida() {
    definirConfirmandoSaida(false);
    aoFechar();
  }

  function fecharAoClicarNoFundo(evento) {
    if (evento.target === evento.currentTarget && !salvando) {
      tentarFecharModal();
    }
  }

  function abrirNovoItem() {
    definirIndiceItemEdicao(null);
    definirItemFormulario(estadoInicialItem);
    definirMensagemErroItem('');
    definirModalItemAberto(true);
  }

  function abrirEdicaoItem(item, indice) {
    definirIndiceItemEdicao(indice);
    definirItemFormulario({
      idProduto: String(item.idProduto || ''),
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
    definirModalBuscaProdutoAberto(false);
    definirModalItemAberto(false);
    definirIndiceItemEdicao(null);
    definirItemFormulario(estadoInicialItem);
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
          proximoEstado.valorUnitario = precoPadrao;
          proximoEstado.valorTotal = calcularTotalItem(proximoEstado.quantidade, precoPadrao);
        }
      }

      if (name === 'quantidade' || name === 'valorUnitario') {
        proximoEstado.valorTotal = calcularTotalItem(
          name === 'quantidade' ? value : proximoEstado.quantidade,
          name === 'valorUnitario' ? proximoEstado[name] : proximoEstado.valorUnitario
        );
      }

      return proximoEstado;
    });
  }

  function salvarItem(evento) {
    evento?.preventDefault?.();
    evento?.stopPropagation?.();

    if (!itemFormulario.idProduto) {
      definirMensagemErroItem('Selecione o produto do item.');
      return;
    }

    const quantidade = normalizarQuantidade(itemFormulario.quantidade);
    const valorUnitario = converterPrecoParaNumero(itemFormulario.valorUnitario);

    if (!quantidade || !valorUnitario) {
      definirMensagemErroItem('Informe quantidade e valor unitario validos.');
      return;
    }

    const produto = produtosAtivos.find((item) => String(item.idProduto) === String(itemFormulario.idProduto));
    const itemNormalizado = {
      idProduto: Number(itemFormulario.idProduto),
      quantidade: String(quantidade),
      valorUnitario: normalizarPreco(valorUnitario),
      valorTotal: normalizarPreco((quantidade * valorUnitario)),
      imagem: itemFormulario.imagem || '',
      observacao: itemFormulario.observacao
    };

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      itens: indiceItemEdicao === null
        ? [...estadoAtual.itens, itemNormalizado]
        : estadoAtual.itens.map((item, indice) => (indice === indiceItemEdicao ? itemNormalizado : item))
    }));

    fecharModalItem();
  }

  function abrirModalBuscaCliente() {
    if (somenteLeitura || salvando) {
      return;
    }

    definirModalBuscaClienteAberto(true);
  }

  function fecharModalBuscaCliente() {
    definirModalBuscaClienteAberto(false);
  }

  function abrirModalBuscaContato() {
    if (somenteLeitura || salvando || !formulario.idCliente) {
      return;
    }

    definirModalBuscaContatoAberto(true);
  }

  function fecharModalBuscaContato() {
    definirModalBuscaContatoAberto(false);
  }

  function selecionarCliente(cliente) {
    if (!cliente) {
      return;
    }

    definirFormulario((estadoAtual) => {
      const vendedor = vendedoresAtivos.find((item) => String(item.idVendedor) === String(cliente.idVendedor));

      return {
        ...estadoAtual,
        idCliente: String(cliente.idCliente),
        idContato: '',
        idVendedor: cliente.idVendedor ? String(cliente.idVendedor) : '',
        comissao: vendedor ? formatarPercentualInput(vendedor.comissaoPadrao) : '0,00'
      };
    });

    fecharModalBuscaCliente();
  }

  function selecionarContato(contato) {
    if (!contato) {
      return;
    }

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      idContato: String(contato.idContato)
    }));

    fecharModalBuscaContato();
  }

  function abrirModalBuscaProduto() {
    if (somenteLeitura) {
      return;
    }

    definirModalBuscaProdutoAberto(true);
  }

  function fecharModalBuscaProduto() {
    definirModalBuscaProdutoAberto(false);
  }

  function selecionarProdutoBusca(produto) {
    if (!produto) {
      return;
    }

    const precoPadrao = formatarPrecoInput(produto.preco);

    definirItemFormulario((estadoAtual) => ({
      ...estadoAtual,
      idProduto: String(produto.idProduto),
      valorUnitario: precoPadrao,
      valorTotal: calcularTotalItem(estadoAtual.quantidade, precoPadrao)
    }));

    fecharModalBuscaProduto();
  }

  function removerItem(indice) {
    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      itens: estadoAtual.itens.filter((_, indiceAtual) => indiceAtual !== indice)
    }));
  }

  return (
    <div className="camadaModal camadaModalSecundaria" role="presentation" onMouseDown={fecharAoClicarNoFundo}>
      <form
        className="modalCliente modalClienteComAbas modalOrcamento"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalOrcamento"
        onMouseDown={(evento) => evento.stopPropagation()}
        onSubmit={submeterFormulario}
      >
        <header className="cabecalhoModalCliente">
          <div className="cabecalhoModalOrcamento">
            <div>
              <h2 id="tituloModalOrcamento">
                {somenteLeitura ? 'Consultar orcamento' : orcamento ? 'Editar orcamento' : 'Incluir orcamento'}
              </h2>
            </div>
            {orcamento?.idOrcamento ? <CodigoRegistro valor={orcamento.idOrcamento} /> : null}
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

        <div className="abasModalCliente" role="tablist" aria-label="Secoes do orcamento">
          {abasModalOrcamento.map((aba) => (
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
                <CampoFormulario
                  label="Data de inclusao"
                  name="dataInclusao"
                  type="date"
                  value={formulario.dataInclusao}
                  onChange={alterarCampo}
                  disabled={somenteLeitura}
                  required
                />
                <CampoFormulario
                  label="Data de validade"
                  name="dataValidade"
                  type="date"
                  value={formulario.dataValidade}
                  onChange={alterarCampo}
                  disabled={somenteLeitura}
                />
                <CampoFormulario
                  label="Usuario do registro"
                  name="nomeUsuario"
                  value={formulario.nomeUsuario}
                  disabled
                />
              </div>

              <div className="linhaClienteContatoAtendimento">
                <CampoSelect
                  label="Cliente"
                  name="idCliente"
                  value={formulario.idCliente}
                  onChange={alterarCampo}
                  options={clientesAtivos.map((cliente) => ({
                    valor: String(cliente.idCliente),
                    label: montarRotuloCliente(cliente)
                  }))}
                  disabled={somenteLeitura}
                  required
                  acaoExtra={!somenteLeitura ? (
                    <Botao
                      variante="secundario"
                      type="button"
                      icone="pesquisa"
                      somenteIcone
                      title="Buscar cliente"
                      aria-label="Buscar cliente"
                      onClick={abrirModalBuscaCliente}
                    />
                  ) : null}
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
                  acaoExtra={!somenteLeitura && formulario.idCliente ? (
                    <Botao
                      variante="secundario"
                      type="button"
                      icone="pesquisa"
                      somenteIcone
                      title="Buscar contato"
                      aria-label="Buscar contato"
                      onClick={abrirModalBuscaContato}
                    />
                  ) : null}
                />
              </div>

              <div className="linhaOrcamentoComercial">
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
                  required
                />
                <CampoSelect
                  label="Prazo de pagamento"
                  name="idPrazoPagamento"
                  value={formulario.idPrazoPagamento}
                  onChange={alterarCampo}
                  options={prazosAtivos.map((prazo) => ({
                    valor: String(prazo.idPrazoPagamento),
                    label: prazo.descricaoFormatada
                  }))}
                  disabled={somenteLeitura}
                />
                <CampoFormulario
                  label="Comissao (%)"
                  name="comissao"
                  value={formulario.comissao}
                  onChange={alterarCampo}
                  disabled={somenteLeitura}
                />
              </div>

              <div className="linhaOrcamentoFechamento">
                <CampoSelect
                  label="Etapa do orcamento"
                  name="idEtapaOrcamento"
                  value={formulario.idEtapaOrcamento}
                  onChange={alterarCampo}
                  options={etapasAtivas.map((etapa) => ({
                    valor: String(etapa.idEtapaOrcamento),
                    label: etapa.descricao
                  }))}
                  disabled={somenteLeitura || Boolean(formulario.idPedidoVinculado)}
                />
                <CampoFormulario
                  label="Total"
                  name="totalOrcamento"
                  value={normalizarPreco(totalOrcamento)}
                  disabled
                />
              </div>

              {formulario.idMotivoPerda ? (
                <div className="campoFormulario">
                  <label htmlFor="motivoPerdaOrcamento">Motivo da perda</label>
                  <input
                    id="motivoPerdaOrcamento"
                    className="entradaFormulario"
                    value={motivosPerda.find((motivo) => String(motivo.idMotivo) === String(formulario.idMotivoPerda))?.descricao || ''}
                    disabled
                  />
                </div>
              ) : null}

              {formulario.idPedidoVinculado ? (
                <div className="campoFormulario">
                  <label htmlFor="pedidoVinculadoOrcamento">Pedido vinculado</label>
                  <input
                    id="pedidoVinculadoOrcamento"
                    className="entradaFormulario"
                    value={`#${String(formulario.idPedidoVinculado).padStart(4, '0')}`}
                    disabled
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          {abaAtiva === 'itens' ? (
            <section className="layoutModalOrcamentoAba layoutModalOrcamentoAbaItens">
              <section className="painelItensOrcamento">
                <div className="cabecalhoItensOrcamento">
                  <h3>Itens do orcamento</h3>
                  {!somenteLeitura ? (
                    <Botao variante="secundario" type="button" onClick={abrirNovoItem}>
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
                        const produto = produtos.find((registro) => String(registro.idProduto) === String(item.idProduto));
                        const imagemItem = item.imagem || produto?.imagem || '';

                        return (
                          <tr key={`${item.idProduto}-${indice}`}>
                            <td>
                              {imagemItem ? (
                                <img src={imagemItem} alt={produto?.descricao || 'Item do orcamento'} className="miniaturaItemOrcamento" />
                              ) : (
                                <div className="miniaturaItemOrcamentoPlaceholder">
                                  {obterIniciaisItemOrcamento(produto)}
                                </div>
                              )}
                            </td>
                            <td>{produto?.descricao || 'Produto nao informado'}</td>
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
                                {!somenteLeitura ? (
                                  <Botao
                                    variante="secundario"
                                    type="button"
                                    icone="limpar"
                                    somenteIcone
                                    title="Remover item"
                                    aria-label="Remover item"
                                    onClick={() => removerItem(indice)}
                                  />
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={7} className="mensagemTabelaContatosModal">
                            Nenhum item incluido.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </section>
              <div className="resumoTotalItensOrcamento resumoTotalItensOrcamentoRodape">
                <span className="rotuloResumoTotalItensOrcamento">Total dos itens</span>
                <strong className="valorResumoTotalItensOrcamento">{normalizarPreco(totalOrcamento)}</strong>
              </div>
            </section>
          ) : null}

          {abaAtiva === 'campos' ? (
            <section className="layoutModalOrcamentoAba layoutModalOrcamentoCampos">
              <div className="campoFormulario campoFormularioIntegral">
                <label htmlFor="observacaoOrcamento">Observacao do orcamento</label>
                <textarea
                  id="observacaoOrcamento"
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
                      <div key={campo.idCampoOrcamento} className="campoFormulario campoFormularioIntegral">
                        <label htmlFor={`campoOrcamento${campo.idCampoOrcamento}`}>{campo.titulo}</label>
                        <textarea
                          id={`campoOrcamento${campo.idCampoOrcamento}`}
                          className="entradaFormulario entradaFormularioTextoCurto"
                          rows={2}
                          value={campo.valor}
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
              aria-labelledby="tituloConfirmacaoSaidaOrcamento"
              onMouseDown={(evento) => evento.stopPropagation()}
            >
              <div className="cabecalhoConfirmacaoModal">
                <h4 id="tituloConfirmacaoSaidaOrcamento">Cancelar cadastro</h4>
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

        <ModalBuscaClientes
          aberto={modalBuscaClienteAberto}
          clientes={clientes}
          placeholder="Pesquisar clientes"
          ariaLabelPesquisa="Pesquisar clientes"
          aoSelecionar={selecionarCliente}
          aoFechar={fecharModalBuscaCliente}
        />

        <ModalBuscaContatos
          aberto={modalBuscaContatoAberto}
          contatos={contatosDoCliente}
          placeholder="Pesquisar contatos do cliente"
          ariaLabelPesquisa="Pesquisar contatos do cliente"
          aoSelecionar={selecionarContato}
          aoFechar={fecharModalBuscaContato}
        />

        {modalItemAberto ? (
          <div className="camadaModalContato" role="presentation" onMouseDown={fecharModalItem}>
            <div
              className="modalContatoCliente modalItemOrcamento"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tituloModalItemOrcamento"
              onMouseDown={(evento) => evento.stopPropagation()}
            >
              <div className="cabecalhoModalContato">
                <h3 id="tituloModalItemOrcamento">
                  {somenteLeitura ? 'Consultar item' : indiceItemEdicao === null ? 'Incluir item' : 'Editar item'}
                </h3>
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
                <div className="layoutModalItemOrcamento">
                  <CampoImagemPadrao
                    valor={itemFormulario.imagem || produtoSelecionadoItem?.imagem || ''}
                    alt={`Imagem de ${produtoSelecionadoItem?.descricao || 'item do orcamento'}`}
                    iniciais={obterIniciaisItemOrcamento(produtoSelecionadoItem)}
                    disabled={somenteLeitura}
                    rotuloBotao="Foto do item"
                    onChange={(imagem) => definirItemFormulario((estadoAtual) => ({
                      ...estadoAtual,
                      imagem: imagem || ''
                    }))}
                  />

                  <div className="gradeCamposModalCliente">
                    <CampoSelect
                      label="Produto"
                      name="idProduto"
                      value={itemFormulario.idProduto}
                      onChange={alterarItemCampo}
                      options={produtosAtivos.map((produto) => ({
                        valor: String(produto.idProduto),
                        label: produto.descricao
                      }))}
                      disabled={somenteLeitura}
                      required
                      acaoExtra={!somenteLeitura ? (
                        <Botao
                          variante="secundario"
                          type="button"
                          icone="pesquisa"
                          somenteIcone
                          title="Buscar produto"
                          aria-label="Buscar produto"
                          onClick={abrirModalBuscaProduto}
                        />
                      ) : null}
                    />
                    <CampoFormulario
                      label="Quantidade"
                      name="quantidade"
                      value={itemFormulario.quantidade}
                      onChange={alterarItemCampo}
                      disabled={somenteLeitura}
                      inputMode="decimal"
                      required
                    />
                    <CampoFormulario
                      label="Valor unitario"
                      name="valorUnitario"
                      value={itemFormulario.valorUnitario}
                      onChange={alterarItemCampo}
                      disabled={somenteLeitura}
                      inputMode="decimal"
                      required
                    />
                    <CampoFormulario
                      label="Valor total"
                      name="valorTotal"
                      value={itemFormulario.valorTotal}
                      onChange={alterarItemCampo}
                      disabled
                    />
                    <div className="campoFormulario campoFormularioIntegral">
                      <label htmlFor="observacaoItemOrcamento">Observacao do item</label>
                      <textarea
                        id="observacaoItemOrcamento"
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
              </div>

              {mensagemErroItem ? <p className="mensagemErroFormulario">{mensagemErroItem}</p> : null}
            </div>
          </div>
        ) : null}

        <ModalBuscaTabela
          aberto={modalBuscaProdutoAberto}
          titulo="Buscar produto"
          placeholder="Pesquisar produtos"
          ariaLabelPesquisa="Pesquisar produtos"
          colunas={[
            {
              key: 'codigo',
              label: 'Codigo',
              render: (produto) => `#${String(produto.idProduto).padStart(4, '0')}`
            },
            { key: 'referencia', label: 'Referencia', render: (produto) => produto.referencia || '-' },
            { key: 'descricao', label: 'Descricao', render: (produto) => produto.descricao || '-' },
            { key: 'preco', label: 'Preco', render: (produto) => normalizarPreco(produto.preco || 0) }
          ]}
          registros={produtos}
          obterTextoBusca={(produto) => [
            produto.idProduto,
            produto.referencia,
            produto.descricao,
            produto.preco
          ].join(' ')}
          obterChaveRegistro={(produto) => produto.idProduto}
          aoSelecionar={selecionarProdutoBusca}
          aoFechar={fecharModalBuscaProduto}
        />

        {modalMotivoPerdaAberto ? (
          <div className="camadaModalContato" role="presentation" onMouseDown={() => definirModalMotivoPerdaAberto(false)}>
            <div
              className="modalContatoCliente"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tituloModalMotivoPerdaOrcamento"
              onMouseDown={(evento) => evento.stopPropagation()}
            >
              <div className="cabecalhoModalContato">
                <h3 id="tituloModalMotivoPerdaOrcamento">Motivo da perda</h3>
                <div className="acoesFormularioContatoModal">
                  <Botao variante="secundario" type="button" onClick={() => definirModalMotivoPerdaAberto(false)}>
                    Cancelar
                  </Botao>
                  <Botao
                    variante="primario"
                    type="button"
                    onClick={async () => {
                      if (!String(formulario.idMotivoPerda || '').trim()) {
                        definirMensagemErro('Selecione o motivo da perda para esta etapa do orcamento.');
                        return;
                      }

                      definirModalMotivoPerdaAberto(false);
                      await salvarFormulario();
                    }}
                  >
                    Confirmar
                  </Botao>
                </div>
              </div>

              <div className="corpoModalContato">
                <CampoSelect
                  label="Selecione o motivo"
                  name="idMotivoPerda"
                  value={formulario.idMotivoPerda}
                  onChange={alterarCampo}
                  options={motivosAtivos.map((motivo) => ({
                    valor: String(motivo.idMotivo),
                    label: motivo.descricao
                  }))}
                  disabled={false}
                  required
                />
              </div>
            </div>
          </div>
        ) : null}

        {confirmandoFechamento ? (
          <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={cancelarConfirmacaoFechamento}>
            <div
              className="modalConfirmacaoAgenda"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tituloConfirmacaoFechamentoOrcamento"
              onMouseDown={(evento) => evento.stopPropagation()}
            >
              <div className="cabecalhoConfirmacaoModal">
                <h4 id="tituloConfirmacaoFechamentoOrcamento">Fechar orcamento</h4>
              </div>

              <div className="corpoConfirmacaoModal">
                <p>Ao salvar com a etapa de fechamento, sera necessario gerar um pedido. Deseja manter esta etapa?</p>
              </div>

              <div className="acoesConfirmacaoModal">
                <Botao variante="secundario" type="button" onClick={cancelarConfirmacaoFechamento}>
                  Nao
                </Botao>
                <Botao variante="primario" type="button" onClick={confirmarFechamento}>
                  Sim
                </Botao>
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}

function etapaOrcamentoEhFechamento(etapa) {
  return Number(etapa?.idEtapaOrcamento) === ID_ETAPA_ORCAMENTO_FECHAMENTO;
}

function CampoFormulario({ label, name, type = 'text', ...props }) {
  return (
    <div className="campoFormulario">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="entradaFormulario" {...props} />
    </div>
  );
}

function CampoSelect({ label, name, options, className = '', acaoExtra = null, ...props }) {
  return (
    <div className={`campoFormulario ${className}`.trim()}>
      <label htmlFor={name}>{label}</label>
      <div className={`campoSelectComAcao ${acaoExtra ? 'temAcao' : ''}`.trim()}>
        <select id={name} name={name} className="entradaFormulario" {...props}>
          <option value="">Selecione</option>
          {options.map((option) => (
            <option key={option.valor} value={option.valor}>
              {option.label}
            </option>
          ))}
        </select>
        {acaoExtra}
      </div>
    </div>
  );
}

function criarFormularioInicial(orcamento, usuarioLogado, camposOrcamento, empresa) {
  const camposExtrasRegistro = Array.isArray(orcamento?.camposExtras) ? orcamento.camposExtras : [];
  const camposRegistroPorId = new Map(
    camposExtrasRegistro.map((campo) => [String(campo.idCampoOrcamento), campo.valor || ''])
  );
  const configuracoesAtivas = camposOrcamento.filter((campo) => campo.status !== 0);
  const camposMesclados = [
    ...configuracoesAtivas,
    ...camposExtrasRegistro
      .filter((campo) => !configuracoesAtivas.some((configuracao) => String(configuracao.idCampoOrcamento) === String(campo.idCampoOrcamento)))
      .map((campo) => ({
        idCampoOrcamento: campo.idCampoOrcamento,
        titulo: campo.titulo || `Campo ${campo.idCampoOrcamento}`,
        descricaoPadrao: ''
      }))
  ];

  if (!orcamento) {
    return {
      ...estadoInicialFormulario,
      dataInclusao: obterDataAtualFormatoInput(),
      dataValidade: somarDiasNaData(
        obterDataAtualFormatoInput(),
        Number(empresa?.diasValidadeOrcamento ?? 7)
      ),
      solicitarPedidoAoSalvar: false,
      idUsuario: String(usuarioLogado?.idUsuario || ''),
      nomeUsuario: usuarioLogado?.nome || '',
    comissao: '0,00',
    camposExtras: camposMesclados.map((campo) => ({
      idCampoOrcamento: campo.idCampoOrcamento,
      titulo: campo.titulo,
      valor: campo.descricaoPadrao || ''
      }))
    };
  }

  return {
    ...estadoInicialFormulario,
    dataInclusao: orcamento.dataInclusao || obterDataAtualFormatoInput(),
    dataValidade: orcamento.dataValidade || '',
    idCliente: normalizarValorFormulario(orcamento.idCliente),
    idContato: normalizarValorFormulario(orcamento.idContato),
    idUsuario: normalizarValorFormulario(orcamento.idUsuario || usuarioLogado?.idUsuario),
    nomeUsuario: orcamento.nomeUsuario || usuarioLogado?.nome || '',
    idVendedor: normalizarValorFormulario(orcamento.idVendedor),
    comissao: formatarPercentualInput(orcamento.comissao),
    idPrazoPagamento: normalizarValorFormulario(orcamento.idPrazoPagamento),
    idEtapaOrcamento: normalizarValorFormulario(orcamento.idEtapaOrcamento),
    idMotivoPerda: normalizarValorFormulario(orcamento.idMotivoPerda),
    idPedidoVinculado: normalizarValorFormulario(orcamento.idPedidoVinculado),
    solicitarPedidoAoSalvar: false,
    observacao: orcamento.observacao || '',
    itens: Array.isArray(orcamento.itens) ? orcamento.itens.map((item) => ({
      idProduto: item.idProduto,
      quantidade: String(item.quantidade || ''),
      valorUnitario: item.valorUnitario ? normalizarPreco(item.valorUnitario) : '',
      valorTotal: item.valorTotal ? normalizarPreco(item.valorTotal) : '',
      imagem: item.imagem || '',
      observacao: item.observacao || ''
    })) : [],
    camposExtras: camposMesclados.map((campo) => ({
      idCampoOrcamento: campo.idCampoOrcamento,
      titulo: campo.titulo,
      valor: camposRegistroPorId.has(String(campo.idCampoOrcamento))
        ? camposRegistroPorId.get(String(campo.idCampoOrcamento))
        : (campo.descricaoPadrao || '')
    }))
  };
}

function montarRotuloCliente(cliente) {
  const codigo = `#${String(cliente.idCliente || '').padStart(4, '0')}`;
  const nome = cliente.nomeFantasia || cliente.razaoSocial || 'Cliente sem nome';
  const localizacao = [cliente.cidade, cliente.estado].filter(Boolean).join('/');

  return localizacao ? `${codigo} - ${nome} - ${localizacao}` : `${codigo} - ${nome}`;
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

function normalizarValorFormulario(valor) {
  if (valor === null || valor === undefined || valor === '' || Number(valor) <= 0) {
    return '';
  }

  return String(valor);
}

function formatarPrecoInput(valor) {
  const numero = converterPrecoParaNumero(valor);
  return numero === null ? '' : desformatarPreco(numero);
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

function normalizarQuantidade(valor) {
  const numero = Number(String(valor ?? '').replace(',', '.'));
  return Number.isNaN(numero) ? 0 : numero;
}

function calcularTotalItem(quantidade, valorUnitario) {
  const numeroQuantidade = normalizarQuantidade(quantidade);
  const numeroValorUnitario = converterPrecoParaNumero(valorUnitario);

  if (!numeroQuantidade || numeroValorUnitario === null) {
    return '';
  }

  return desformatarPreco(numeroQuantidade * numeroValorUnitario);
}

function obterIniciaisItemOrcamento(produto) {
  const descricao = produto?.descricao || 'Item';
  const partes = String(descricao).trim().split(/\s+/).filter(Boolean);
  const iniciais = partes.slice(0, 2).map((parte) => parte[0]).join('');
  return (iniciais || 'IT').toUpperCase();
}
