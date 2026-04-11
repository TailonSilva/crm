import { useEffect, useMemo, useRef, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';
import { GradePadrao } from '../../componentes/comuns/gradePadrao';
import { ModalBuscaClientes } from '../../componentes/comuns/modalBuscaClientes';
import { ModalBuscaContatos } from '../../componentes/comuns/modalBuscaContatos';
import { MensagemErroPopup } from '../../componentes/comuns/mensagemErroPopup';
import { ModalItemProduto } from '../../componentes/comuns/modalItemProduto';
import { ModalCadastroConfiguracao } from '../configuracoes/modalCadastroConfiguracao';
import { ModalPrazosPagamento } from '../configuracoes/modalPrazosPagamento';
import { ModalCliente } from '../clientes/modalCliente';
import {
  atualizarMotivoDevolucao,
  incluirMotivoDevolucao,
  listarMotivosDevolucaoConfiguracao
} from '../../servicos/configuracoes';
import { formatarNomeContato } from '../../utilitarios/formatarNomeContato';
import { useFormularioItemProduto } from '../../utilitarios/useFormularioItemProduto';
import {
  converterPrecoParaNumero,
  desformatarPreco,
  normalizarPreco,
  normalizarPrecoDigitado
} from '../../utilitarios/normalizarPreco';
import { normalizarValorEntradaFormulario } from '../../utilitarios/normalizarTextoFormulario';

const abasModalPedido = [
  { id: 'dadosGerais', label: 'Dados gerais' },
  { id: 'itens', label: 'Itens' },
  { id: 'outros', label: 'Outros' },
  { id: 'campos', label: 'Campos do pedido' }
];

const ID_ETAPA_PEDIDO_ENTREGUE = 5;
const ID_TIPO_PEDIDO_VENDA = 1;
const ID_TIPO_PEDIDO_DEVOLUCAO = 2;

const estadoInicialFormulario = {
  idOrcamento: '',
  idCliente: '',
  idContato: '',
  idUsuario: '',
  idVendedor: '',
  idPrazoPagamento: '',
  idTipoPedido: '',
  idMotivoDevolucao: '',
  dataInclusao: '',
  dataEntrega: '',
  nomeClienteSnapshot: '',
  nomeContatoSnapshot: '',
  nomeUsuarioSnapshot: '',
  nomeVendedorSnapshot: '',
  nomeMetodoPagamentoSnapshot: '',
  nomePrazoPagamentoSnapshot: '',
  nomeTipoPedidoSnapshot: '',
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
  ramosAtividade = [],
  metodosPagamento = [],
  prazosPagamento,
  tiposPedido = [],
  motivosDevolucao = [],
  etapasPedido,
  produtos,
  camposPedido,
  empresa,
  usuarioLogado,
  modo = 'consulta',
  idVendedorBloqueado = null,
  somenteConsultaPrazos = false,
  camadaSecundaria = false,
  aoIncluirCliente,
  aoFechar,
  aoSalvar,
  aoSalvarPrazoPagamento,
  aoInativarPrazoPagamento
}) {
  const [formulario, definirFormulario] = useState(estadoInicialFormulario);
  const [abaAtiva, definirAbaAtiva] = useState(abasModalPedido[0].id);
  const [salvando, definirSalvando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [confirmandoSaida, definirConfirmandoSaida] = useState(false);
  const [modalBuscaClienteAberto, definirModalBuscaClienteAberto] = useState(false);
  const [modalClienteAberto, definirModalClienteAberto] = useState(false);
  const [modalBuscaContatoAberto, definirModalBuscaContatoAberto] = useState(false);
  const referenciaCampoCliente = useRef(null);
  const referenciaCampoContato = useRef(null);
  const [contatosCriadosLocalmente, definirContatosCriadosLocalmente] = useState([]);
  const [modalPrazosPagamentoAberto, definirModalPrazosPagamentoAberto] = useState(false);
  const [modalMotivoDevolucaoAberto, definirModalMotivoDevolucaoAberto] = useState(false);
  const [modalCadastroMotivoDevolucaoAberto, definirModalCadastroMotivoDevolucaoAberto] = useState(false);
  const [motivoDevolucaoPendente, definirMotivoDevolucaoPendente] = useState('');
  const [motivosDevolucaoLocais, definirMotivosDevolucaoLocais] = useState(motivosDevolucao);
  const somenteLeitura = modo === 'consulta';
  const modoInclusao = !pedido;
  const registroBase = pedido || dadosIniciais || null;
  const pedidoOriginadoDeOrcamento = Boolean(!pedido && (dadosIniciais?.idOrcamento || registroBase?.idOrcamento));
  const clientesAtivos = clientes.filter((cliente) => cliente.status !== 0);
  const contatosAtivos = contatos.filter((contato) => contato.status !== 0);
  const usuariosAtivos = usuarios.filter((usuario) => usuario.ativo !== 0);
  const vendedoresAtivos = vendedores.filter((vendedor) => vendedor.status !== 0);
  const prazosAtivos = prazosPagamento.filter((prazo) => prazo.status !== 0);
  const tiposPedidoAtivos = tiposPedido.filter((tipoPedido) => tipoPedido.status !== 0);
  const motivosDevolucaoAtivos = motivosDevolucaoLocais.filter((motivo) => motivo.status !== 0);
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
  const valorComissaoPedido = useMemo(() => {
    const percentualComissao = converterPrecoParaNumero(formulario.comissao) || 0;
    return Number(((totalPedido * percentualComissao) / 100).toFixed(2));
  }, [formulario.comissao, totalPedido]);
  const contatosDoCliente = useMemo(
    () => combinarContatosDoCliente(contatosAtivos, contatosCriadosLocalmente, formulario.idCliente),
    [contatosAtivos, contatosCriadosLocalmente, formulario.idCliente]
  );
  const proximoCodigoCliente = useMemo(
    () => obterProximoCodigoCliente(clientes),
    [clientes]
  );
  const {
    modalItemAberto,
    modalBuscaProdutoAberto,
    itemFormulario,
    mensagemErroItem,
    definirImagemItem,
    redefinirItemModal,
    abrirNovoItem,
    abrirEdicaoItem,
    fecharModalItem,
    abrirModalBuscaProduto,
    fecharModalBuscaProduto,
    selecionarProdutoBusca,
    alterarItemCampo,
    salvarItem
  } = useFormularioItemProduto({
    estadoInicialItem,
    produtos: produtosAtivos,
    obterItens: () => formulario.itens,
    definirItens: (atualizarItens) => definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      itens: typeof atualizarItens === 'function'
        ? atualizarItens(estadoAtual.itens)
        : atualizarItens
    })),
    formatarPrecoInput,
    calcularTotalItem: (quantidade, valorUnitario) => calcularTotalItemPorTipo(quantidade, valorUnitario, formulario.idTipoPedido),
    normalizarPrecoDigitado,
    converterPrecoParaNumero,
    normalizarPreco,
    normalizarQuantidade: (valor) => Number(String(valor ?? '').replace(',', '.')),
    normalizarValorUnitario: (valor) => aplicarSinalTipoPedidoNoPreco(valor, formulario.idTipoPedido),
    normalizarItemAoSalvar: (item) => normalizarItemPedidoPorTipo(item, formulario.idTipoPedido)
  });

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirFormulario(criarFormularioInicialPedido(registroBase, usuarioLogado, camposPedido, empresa, { novo: !pedido }));
    definirAbaAtiva(abasModalPedido[0].id);
    definirSalvando(false);
    definirMensagemErro('');
    definirConfirmandoSaida(false);
    definirModalBuscaClienteAberto(false);
    definirModalBuscaContatoAberto(false);
    definirContatosCriadosLocalmente([]);
    definirModalPrazosPagamentoAberto(false);
    definirModalMotivoDevolucaoAberto(false);
    definirModalCadastroMotivoDevolucaoAberto(false);
    definirMotivosDevolucaoLocais(motivosDevolucao);
    definirMotivoDevolucaoPendente('');
    redefinirItemModal();
  }, [aberto, chaveRegistroBase, usuarioLogado?.idUsuario, quantidadeCamposPedido, chaveEmpresa]);

  useEffect(() => {
    definirMotivosDevolucaoLocais(motivosDevolucao);
  }, [motivosDevolucao]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    function tratarTecla(evento) {
      if (evento.key !== 'Escape' || salvando) {
        return;
      }

      if (modalItemAberto) {
        if (modalBuscaProdutoAberto) {
          fecharModalBuscaProduto();
          return;
        }

        fecharModalItem();
        return;
      }

      if (modalBuscaClienteAberto) {
        fecharModalBuscaCliente();
        return;
      }

      if (modalClienteAberto) {
        fecharModalNovoCliente();
        return;
      }

      if (modalBuscaContatoAberto) {
        fecharModalBuscaContato();
        return;
      }

      if (modalPrazosPagamentoAberto) {
        fecharModalPrazosPagamento();
        return;
      }

      if (modalMotivoDevolucaoAberto) {
        fecharModalMotivoDevolucao();
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
  }, [aberto, confirmandoSaida, modalBuscaClienteAberto, modalBuscaContatoAberto, modalBuscaProdutoAberto, modalClienteAberto, modalItemAberto, modalMotivoDevolucaoAberto, modalPrazosPagamentoAberto, salvando]);

  if (!aberto) {
    return null;
  }

  function alterarCampo(evento) {
    const { name, value } = evento.target;
    const valorNormalizado = normalizarValorEntradaFormulario(evento);

    definirFormulario((estadoAtual) => {
      const mudouParaEntregue = name === 'idEtapaPedido'
        && !etapaPedidoEhEntregue(estadoAtual.idEtapaPedido)
        && etapaPedidoEhEntregue(value);
      const proximoEstado = {
        ...estadoAtual,
        ...(name === 'idCliente' ? { idContato: '' } : {}),
        [name]: name === 'comissao' ? normalizarPrecoDigitado(value) : valorNormalizado,
        ...(name === 'idEtapaPedido'
          ? {
            nomeEtapaPedidoSnapshot: etapasPedidoNormalizadas.find((etapa) => String(etapa.idEtapaPedido) === String(value))?.descricao || '',
            ...(mudouParaEntregue ? { dataEntrega: obterDataAtualFormatoInput() } : {})
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

      if (name === 'idTipoPedido') {
        const tipoPedido = tiposPedidoAtivos.find((item) => String(item.idTipoPedido) === String(value));
        proximoEstado.nomeTipoPedidoSnapshot = tipoPedido?.descricao || '';
        proximoEstado.itens = estadoAtual.itens.map((item) => normalizarItemPedidoPorTipo(item, value));
        if (tipoPedidoEhDevolucao(value)) {
          proximoEstado.idEtapaPedido = String(ID_ETAPA_PEDIDO_ENTREGUE);
          proximoEstado.nomeEtapaPedidoSnapshot = etapasPedidoNormalizadas.find((etapa) => Number(etapa.idEtapaPedido) === ID_ETAPA_PEDIDO_ENTREGUE)?.descricao || '';
        } else {
          proximoEstado.idMotivoDevolucao = '';
        }
      }

      if (name === 'dataInclusao') {
        proximoEstado.dataEntrega = somarDiasNaData(
          value,
          Number(empresa?.diasEntregaPedido ?? 7)
        );
      }

      return proximoEstado;
    });

    if (name === 'idTipoPedido') {
      definirItemFormulario((estadoAtual) => {
        const valorUnitario = aplicarSinalTipoPedidoNoPreco(estadoAtual.valorUnitario, value);

        return {
          ...estadoAtual,
          valorUnitario,
          valorTotal: calcularTotalItemPorTipo(estadoAtual.quantidade, valorUnitario, value)
        };
      });
    }
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

  async function salvarFormulario(formularioParaSalvar = formulario) {
    if (somenteLeitura) {
      return;
    }

    if (!String(formularioParaSalvar.idCliente || '').trim()) {
      definirMensagemErro('Selecione o cliente do pedido.');
      return;
    }

    if (!String(formularioParaSalvar.idUsuario || '').trim()) {
      definirMensagemErro('Selecione o usuario do registro.');
      return;
    }

    if (!String(formularioParaSalvar.idVendedor || '').trim()) {
      definirMensagemErro('Selecione o vendedor.');
      return;
    }

    if (!String(formularioParaSalvar.idTipoPedido || '').trim()) {
      definirMensagemErro('Selecione o tipo de pedido.');
      return;
    }

    if (!String(formularioParaSalvar.idPrazoPagamento || '').trim()) {
      definirMensagemErro('Selecione o prazo de pagamento.');
      return;
    }

    if (formularioParaSalvar.itens.length === 0) {
      definirMensagemErro('Inclua ao menos um item no pedido.');
      return;
    }

    if (
      tipoPedidoEhDevolucao(formularioParaSalvar.idTipoPedido)
      && etapaPedidoEhEntregue(formularioParaSalvar.idEtapaPedido)
      && !String(formularioParaSalvar.idMotivoDevolucao || '').trim()
    ) {
      definirMotivoDevolucaoPendente('');
      definirModalMotivoDevolucaoAberto(true);
      return;
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      await aoSalvar(formularioParaSalvar);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel salvar o pedido.');
      definirSalvando(false);
    }
  }

  function fecharAoClicarNoFundo(evento) {
    if (evento.target === evento.currentTarget && !salvando) {
      tentarFecharModal();
    }
  }

  function tentarFecharModal() {
    if (pedidoOriginadoDeOrcamento) {
      aoFechar();
      return;
    }

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

  function abrirModalBuscaCliente() {
    if (somenteLeitura || salvando || !modoInclusao) {
      return;
    }

    definirModalBuscaClienteAberto(true);
  }

  function abrirModalNovoCliente() {
    if (somenteLeitura || salvando || !modoInclusao || !aoIncluirCliente) {
      return;
    }

    definirModalClienteAberto(true);
  }

  function fecharModalNovoCliente() {
    definirModalClienteAberto(false);
  }

  function fecharModalBuscaCliente() {
    definirModalBuscaClienteAberto(false);
  }

  function abrirModalBuscaContato() {
    if (somenteLeitura || salvando || !modoInclusao || !formulario.idCliente) {
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
        nomeClienteSnapshot: cliente.nomeFantasia || cliente.razaoSocial || '',
        nomeContatoSnapshot: '',
        idVendedor: cliente.idVendedor ? String(cliente.idVendedor) : '',
        nomeVendedorSnapshot: vendedor?.nome || '',
        comissao: vendedor ? formatarPercentualInput(vendedor.comissaoPadrao) : '0,00'
      };
    });

    fecharModalBuscaCliente();
    agendarFocoCampo(referenciaCampoCliente);
  }

  function selecionarContato(contato) {
    if (!contato) {
      return;
    }

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      idContato: String(contato.idContato),
      nomeContatoSnapshot: contato.nome || ''
    }));

    fecharModalBuscaContato();
    agendarFocoCampo(referenciaCampoContato);
  }

  function registrarContatoCriado(contato) {
    if (!contato?.idContato) {
      return;
    }

    definirContatosCriadosLocalmente((estadoAtual) => combinarContatosUnicos(estadoAtual, [contato]));
  }

  function abrirModalPrazosPagamento() {
    if (somenteLeitura || salvando || !aoSalvarPrazoPagamento) {
      return;
    }

    definirModalPrazosPagamentoAberto(true);
  }

  function fecharModalPrazosPagamento() {
    definirModalPrazosPagamentoAberto(false);
  }

  async function salvarNovoCliente(dadosCliente) {
    const clienteCriado = await aoIncluirCliente(dadosCliente);

    selecionarCliente(clienteCriado);
    definirModalClienteAberto(false);
  }

  function abrirModalMotivoDevolucao() {
    definirMensagemErro('');
    definirMotivoDevolucaoPendente(String(formulario.idMotivoDevolucao || ''));
    definirModalMotivoDevolucaoAberto(true);
  }

  function fecharModalMotivoDevolucao() {
    if (salvando) {
      return;
    }

    definirModalMotivoDevolucaoAberto(false);
  }

  async function confirmarMotivoDevolucao() {
    if (!String(motivoDevolucaoPendente || '').trim()) {
      definirMensagemErro('Selecione o motivo da devolucao.');
      return;
    }

    const proximoFormulario = {
      ...formulario,
      idMotivoDevolucao: String(motivoDevolucaoPendente)
    };

    definirFormulario(proximoFormulario);
    definirModalMotivoDevolucaoAberto(false);
    await salvarFormulario(proximoFormulario);
  }

  async function salvarMotivoDevolucaoRapido(payload) {
    const registroSalvo = payload.idMotivoDevolucao
      ? await atualizarMotivoDevolucao(payload.idMotivoDevolucao, payload)
      : await incluirMotivoDevolucao(payload);

    const motivosAtualizados = await listarMotivosDevolucaoConfiguracao({ incluirInativos: true });
    definirMotivosDevolucaoLocais(motivosAtualizados);
    if (registroSalvo?.idMotivoDevolucao) {
      definirMotivoDevolucaoPendente(String(registroSalvo.idMotivoDevolucao));
    }
    return registroSalvo;
  }

  function selecionarPrazoPagamento(prazo) {
    if (!prazo?.idPrazoPagamento) {
      return;
    }

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      idPrazoPagamento: String(prazo.idPrazoPagamento),
      nomePrazoPagamentoSnapshot: prazo.descricaoFormatada || prazo.descricao || '',
      nomeMetodoPagamentoSnapshot: prazo.nomeMetodoPagamento || ''
    }));
  }

  return (
    <div className={`camadaModal ${camadaSecundaria ? 'camadaModalSecundaria' : ''}`} role="presentation" onMouseDown={fecharAoClicarNoFundo}>
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
                      referenciaCampo={referenciaCampoCliente}
                      value={formulario.idCliente}
                      onChange={alterarCampo}
                      options={clientesAtivos.map((cliente) => ({
                        valor: String(cliente.idCliente),
                        label: cliente.nomeFantasia || cliente.razaoSocial
                      }))}
                      disabled={somenteLeitura}
                      acaoExtra={!somenteLeitura ? (
                        <Botao
                          variante="secundario"
                          type="button"
                          icone="pesquisa"
                          className="botaoCampoAcao"
                          somenteIcone
                          title="Buscar cliente"
                          aria-label="Buscar cliente"
                          onClick={abrirModalBuscaCliente}
                        >
                          Buscar cliente
                        </Botao>
                      ) : null}
                    />
                    <CampoSelect
                      label="Contato"
                      name="idContato"
                      referenciaCampo={referenciaCampoContato}
                      value={formulario.idContato}
                      onChange={alterarCampo}
                      options={contatosDoCliente.map((contato) => ({
                        valor: String(contato.idContato),
                        label: formatarNomeContato(contato)
                      }))}
                      disabled={somenteLeitura || !formulario.idCliente}
                      acaoExtra={!somenteLeitura && formulario.idCliente ? (
                        <Botao
                          variante="secundario"
                          type="button"
                          icone="pesquisa"
                          className="botaoCampoAcao"
                          somenteIcone
                          title="Buscar contato"
                          aria-label="Buscar contato"
                          onClick={abrirModalBuscaContato}
                        >
                          Buscar contato
                        </Botao>
                      ) : null}
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
                      acaoExtra={!somenteLeitura && aoSalvarPrazoPagamento ? (
                        <Botao
                          variante="secundario"
                          type="button"
                          icone="pesquisa"
                          className="botaoCampoAcao"
                          somenteIcone
                          title="Abrir prazos de pagamento"
                          aria-label="Abrir prazos de pagamento"
                          onClick={abrirModalPrazosPagamento}
                        />
                      ) : null}
                    />
                    <CampoSelect
                      label="Tipo de pedido"
                      name="idTipoPedido"
                      value={formulario.idTipoPedido}
                      onChange={alterarCampo}
                      options={tiposPedidoAtivos.map((tipoPedido) => ({
                        valor: String(tipoPedido.idTipoPedido),
                        label: tipoPedido.descricao
                      }))}
                      disabled={somenteLeitura}
                    />
                  </>
                ) : (
                  <>
                    <CampoFormulario label="Vendedor" name="nomeVendedorSnapshot" value={formulario.nomeVendedorSnapshot} disabled />
                    <CampoFormulario label="Prazo de pagamento" name="nomePrazoPagamentoSnapshot" value={formulario.nomePrazoPagamentoSnapshot} disabled />
                    <CampoFormulario label="Tipo de pedido" name="nomeTipoPedidoSnapshot" value={formulario.nomeTipoPedidoSnapshot} disabled />
                  </>
                )}
              </div>

              <div className="linhaOrcamentoFechamento">
                <CampoSelect
                  label="Etapa do pedido"
                  name="idEtapaPedido"
                  value={formulario.idEtapaPedido}
                  onChange={alterarCampo}
                  options={etapasPedidoNormalizadas.map((etapa) => ({
                    valor: String(etapa.idEtapaPedido),
                    label: etapa.descricao
                  }))}
                  disabled={somenteLeitura || tipoPedidoEhDevolucao(formulario.idTipoPedido)}
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
                      abrirNovoItem();
                    }}>
                      Adicionar item
                    </Botao>
                  ) : null}
                </div>

                <GradePadrao
                  className="gradeContatosModal gradeItensOrcamentoRolavel"
                  classNameTabela="tabelaContatosModal tabelaItensOrcamento"
                  classNameMensagem="mensagemTabelaContatosModal"
                  cabecalho={(
                    <tr>
                      <th>Foto</th>
                      <th>Codigo</th>
                      <th>Produto</th>
                      <th>Quantidade</th>
                      <th>Valor unitario</th>
                      <th>Total</th>
                      <th>Observacao</th>
                      <th className="cabecalhoAcoesContato">Acoes</th>
                    </tr>
                  )}
                  temItens={formulario.itens.length > 0}
                  mensagemVazia="Nenhum item informado."
                >
                  {formulario.itens.map((item, indice) => {
                    const imagemItem = item.imagem || '';
                    const apresentacaoProduto = montarApresentacaoProdutoPedido(item, empresa);

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
                        <td><CodigoRegistro valor={item.idProduto || 0} /></td>
                        <td>
                          <div className="produtoGradeItemPedido">
                            <strong>{apresentacaoProduto.principal}</strong>
                            {apresentacaoProduto.secundario ? (
                              <span>{apresentacaoProduto.secundario}</span>
                            ) : null}
                          </div>
                        </td>
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
                  })}
                </GradePadrao>
              </section>
              <div className="resumoTotalItensOrcamento resumoTotalItensOrcamentoRodape">
                <span className="rotuloResumoTotalItensOrcamento">Total dos itens</span>
                <strong className="valorResumoTotalItensOrcamento">{normalizarPreco(totalPedido)}</strong>
              </div>
            </section>
          ) : null}

          {abaAtiva === 'outros' ? (
            <section className="layoutModalOrcamentoAba">
              <div className="linhaOrcamentoComercial">
                <CampoFormulario
                  label="Orcamento vinculado"
                  name="orcamentoOrigemPedido"
                  value={formulario.codigoOrcamentoOrigem
                    ? `#${String(formulario.codigoOrcamentoOrigem).padStart(4, '0')}`
                    : ''}
                  placeholder="Sem orcamento vinculado"
                  disabled
                />
                <CampoFormulario
                  label="Comissao (%)"
                  name="comissao"
                  value={formulario.comissao}
                  onChange={alterarCampo}
                  disabled={somenteLeitura}
                />
                <CampoFormulario
                  label="Valor da comissao"
                  name="valorComissaoPedido"
                  value={normalizarPreco(valorComissaoPedido)}
                  disabled
                />
              </div>

              <div className="linhaOrcamentoFechamento">
                <CampoFormularioComAcao
                  label="Motivo do cancelamento"
                  name="motivoDevolucaoPedido"
                  value={obterRotuloMotivoDevolucao(motivosDevolucaoAtivos, formulario.idMotivoDevolucao)}
                  placeholder="Sem motivo informado"
                  disabled
                  acaoExtra={!somenteLeitura && tipoPedidoEhDevolucao(formulario.idTipoPedido) && etapaPedidoEhEntregue(formulario.idEtapaPedido) ? (
                    <Botao
                      variante="secundario"
                      type="button"
                      icone="pesquisa"
                      className="botaoCampoAcao"
                      somenteIcone
                      title="Selecionar motivo da devolucao"
                      aria-label="Selecionar motivo da devolucao"
                      onClick={abrirModalMotivoDevolucao}
                    />
                  ) : null}
                />
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

        <MensagemErroPopup mensagem={mensagemErro} titulo="Nao foi possivel salvar o pedido." />
      </form>

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

      <ModalItemProduto
          aberto={modalItemAberto}
          titulo={somenteLeitura ? 'Consultar item do pedido' : 'Editar item do pedido'}
          somenteLeitura={somenteLeitura}
          itemFormulario={itemFormulario}
          produtos={produtosAtivos}
          mensagemErro={mensagemErroItem}
          modalBuscaProdutoAberto={modalBuscaProdutoAberto}
          onFechar={fecharModalItem}
          onSalvar={salvarItem}
          onAlterarCampo={alterarItemCampo}
          onAlterarImagem={definirImagemItem}
          onAbrirBuscaProduto={abrirModalBuscaProduto}
          onFecharBuscaProduto={fecharModalBuscaProduto}
          onSelecionarProduto={selecionarProdutoBusca}
          obterIniciais={obterIniciaisItemPedido}
      />

      <ModalCliente
          aberto={modalClienteAberto}
          cliente={null}
          empresa={empresa}
          codigoSugerido={proximoCodigoCliente}
          contatos={[]}
          vendedores={vendedores}
          ramosAtividade={ramosAtividade}
          modo="novo"
          classNameCamada="camadaModal camadaModalSecundaria"
          idVendedorBloqueado={idVendedorBloqueado}
          aoFechar={fecharModalNovoCliente}
          aoSalvar={salvarNovoCliente}
      />

      <ModalBuscaClientes
          aberto={modalBuscaClienteAberto}
          empresa={empresa}
          clientes={clientesAtivos}
          rotuloAcaoPrimaria={aoIncluirCliente ? 'Incluir cliente' : ''}
          tituloAcaoPrimaria={aoIncluirCliente ? 'Incluir cliente' : ''}
          iconeAcaoPrimaria="adicionar"
          aoAcionarPrimaria={aoIncluirCliente
            ? () => {
              fecharModalBuscaCliente();
              abrirModalNovoCliente();
            }
            : null}
          aoSelecionar={selecionarCliente}
          aoFechar={fecharModalBuscaCliente}
      />

      <ModalBuscaContatos
          aberto={modalBuscaContatoAberto}
          idCliente={formulario.idCliente}
          contatos={contatosDoCliente}
          aoCriarContato={registrarContatoCriado}
          aoSelecionar={selecionarContato}
          aoFechar={fecharModalBuscaContato}
      />

      <ModalPrazosPagamento
          aberto={modalPrazosPagamentoAberto}
          prazosPagamento={prazosPagamento}
          metodosPagamento={metodosPagamento}
          somenteConsulta={somenteConsultaPrazos}
          fecharAoSalvar
          aoFechar={fecharModalPrazosPagamento}
          aoSalvar={aoSalvarPrazoPagamento}
          aoInativar={aoInativarPrazoPagamento}
          aoSelecionarPrazo={async (prazo) => {
            selecionarPrazoPagamento(prazo);
          }}
      />

      {modalMotivoDevolucaoAberto ? (
          <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={fecharModalMotivoDevolucao}>
            <div
              className="modalConfirmacaoAgenda modalEtapaRapidaOrcamento"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="tituloMotivoDevolucaoPedido"
              onMouseDown={(evento) => evento.stopPropagation()}
            >
              <div className="cabecalhoConfirmacaoModal">
                <h4 id="tituloMotivoDevolucaoPedido">Motivo da devolucao</h4>
              </div>
              <div className="corpoConfirmacaoModal">
                <p>Selecione o motivo da devolucao para concluir o pedido.</p>
                <CampoSelect
                  label="Motivo"
                  name="motivoDevolucaoPendente"
                  value={motivoDevolucaoPendente}
                  onChange={(evento) => definirMotivoDevolucaoPendente(evento.target.value)}
                  disabled={salvando}
                  options={motivosDevolucaoAtivos.map((motivo) => ({
                    valor: String(motivo.idMotivoDevolucao),
                    label: `${String(motivo.idMotivoDevolucao).padStart(4, '0')} - ${motivo.abreviacao}`
                  }))}
                  acaoExtra={!somenteLeitura ? (
                    <Botao
                      variante="secundario"
                      type="button"
                      icone="pesquisa"
                      className="botaoCampoAcao"
                      somenteIcone
                      title="Abrir motivos da devolucao"
                      aria-label="Abrir motivos da devolucao"
                      onClick={() => definirModalCadastroMotivoDevolucaoAberto(true)}
                    />
                  ) : null}
                />
              </div>
              <div className="acoesConfirmacaoModal">
                <Botao variante="secundario" type="button" onClick={fecharModalMotivoDevolucao} disabled={salvando}>
                  Cancelar
                </Botao>
                <Botao variante="primario" type="button" onClick={confirmarMotivoDevolucao} disabled={salvando}>
                  Confirmar
                </Botao>
              </div>
            </div>
          </div>
        ) : null}

      <ModalCadastroConfiguracao
          aberto={modalCadastroMotivoDevolucaoAberto}
          titulo="Motivos da devolucao"
          rotuloIncluir="Incluir motivo"
          registros={motivosDevolucaoLocais}
          chavePrimaria="idMotivoDevolucao"
          camadaSecundaria
          classeFormulario="gradeFormularioMotivosDevolucao"
          somenteConsulta={somenteLeitura}
          colunas={[
            { key: 'idMotivoDevolucao', label: 'Codigo' },
            { key: 'abreviacao', label: 'Abreviacao' },
            { key: 'descricao', label: 'Descricao' }
          ]}
          camposFormulario={[
            { name: 'idMotivoDevolucao', label: 'Codigo', type: 'number', disabled: true },
            { name: 'abreviacao', label: 'Abreviacao', required: true },
            { name: 'descricao', label: 'Descricao', required: true },
            { name: 'status', label: 'Registro ativo', type: 'checkbox', defaultValue: true }
          ]}
          aoFechar={() => definirModalCadastroMotivoDevolucaoAberto(false)}
          aoSalvar={salvarMotivoDevolucaoRapido}
          aoInativar={async () => null}
      />
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

function montarApresentacaoProdutoPedido(item, empresa) {
  const destaque = normalizarDestaqueItemOrcamentoPdf(empresa?.destaqueItemOrcamentoPdf);
  const referencia = String(item?.referenciaProdutoSnapshot || '').trim();
  const descricao = String(item?.descricaoProdutoSnapshot || '').trim() || 'Produto nao informado';

  if (destaque === 'referencia' && referencia) {
    return {
      principal: referencia,
      secundario: descricao
    };
  }

  return {
    principal: descricao,
    secundario: referencia || ''
  };
}

function normalizarDestaqueItemOrcamentoPdf(valor) {
  return String(valor || '').trim() === 'referencia' ? 'referencia' : 'descricao';
}

function CampoFormularioComAcao({ label, name, acaoExtra = null, ...props }) {
  return (
    <div className="campoFormulario">
      <label htmlFor={name}>{label}</label>
      <div className={`campoSelectComAcao ${acaoExtra ? 'temAcao' : ''}`.trim()}>
        <input id={name} name={name} type="text" className="entradaFormulario" {...props} />
        {acaoExtra ? <div className="acoesCampoSelect">{acaoExtra}</div> : null}
      </div>
    </div>
  );
}

function CampoSelect({ label, name, options, acaoExtra = null, referenciaCampo = null, ...props }) {
  return (
    <div className="campoFormulario">
      <label htmlFor={name}>{label}</label>
      <div className={`campoSelectComAcao ${acaoExtra ? 'temAcao' : ''}`.trim()}>
        <select id={name} name={name} className="entradaFormulario" ref={referenciaCampo} {...props}>
          <option value="">Selecione</option>
          {options.map((option, indice) => (
            <option key={`${option.valor ?? option.label ?? 'opcao'}-${indice}`} value={option.valor ?? ''}>
              {option.label}
            </option>
          ))}
        </select>
        {acaoExtra ? <div className="acoesCampoSelect">{acaoExtra}</div> : null}
      </div>
    </div>
  );
}

function criarFormularioInicialPedido(pedido, usuarioLogado, camposPedido, empresa, { novo = !pedido } = {}) {
  const pedidoOriginadoDeOrcamento = Boolean(pedido?.idOrcamento);
  const idTipoPedidoInicial = pedido?.idTipoPedido
    ? String(pedido.idTipoPedido)
    : pedidoOriginadoDeOrcamento
      ? String(ID_TIPO_PEDIDO_VENDA)
      : '';
  const nomeTipoPedidoInicial = pedido?.nomeTipoPedidoSnapshot || (pedidoOriginadoDeOrcamento ? 'Venda' : '');

  if (!pedido || novo) {
    return {
      ...estadoInicialFormulario,
      idOrcamento: pedido?.idOrcamento ? String(pedido.idOrcamento) : '',
      idCliente: pedido?.idCliente ? String(pedido.idCliente) : '',
      idContato: pedido?.idContato ? String(pedido.idContato) : '',
      idUsuario: String(pedido?.idUsuario || usuarioLogado?.idUsuario || ''),
      idVendedor: pedido?.idVendedor ? String(pedido.idVendedor) : '',
      idPrazoPagamento: pedido?.idPrazoPagamento ? String(pedido.idPrazoPagamento) : '',
      idTipoPedido: idTipoPedidoInicial,
      idMotivoDevolucao: pedido?.idMotivoDevolucao ? String(pedido.idMotivoDevolucao) : '',
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
      nomeTipoPedidoSnapshot: nomeTipoPedidoInicial,
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
    idTipoPedido: idTipoPedidoInicial,
    idMotivoDevolucao: pedido.idMotivoDevolucao ? String(pedido.idMotivoDevolucao) : '',
    dataInclusao: pedido.dataInclusao || '',
    dataEntrega: pedido.dataEntrega || pedido.dataValidade || '',
    nomeClienteSnapshot: pedido.nomeClienteSnapshot || '',
    nomeContatoSnapshot: pedido.nomeContatoSnapshot || '',
    nomeUsuarioSnapshot: pedido.nomeUsuarioSnapshot || '',
    nomeVendedorSnapshot: pedido.nomeVendedorSnapshot || '',
    nomeMetodoPagamentoSnapshot: pedido.nomeMetodoPagamentoSnapshot || '',
    nomePrazoPagamentoSnapshot: pedido.nomePrazoPagamentoSnapshot || '',
    nomeTipoPedidoSnapshot: nomeTipoPedidoInicial,
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

function etapaPedidoEhEntregue(idEtapaPedido) {
  return Number(idEtapaPedido) === ID_ETAPA_PEDIDO_ENTREGUE;
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

function tipoPedidoEhDevolucao(idTipoPedido) {
  return Number(idTipoPedido) === ID_TIPO_PEDIDO_DEVOLUCAO;
}

function agendarFocoCampo(referenciaCampo) {
  window.setTimeout(() => {
    referenciaCampo?.current?.focus?.({ preventScroll: true });
  }, 0);
}

function obterRotuloMotivoDevolucao(motivosDevolucao, idMotivoDevolucao) {
  const motivoSelecionado = motivosDevolucao.find(
    (motivo) => String(motivo.idMotivoDevolucao) === String(idMotivoDevolucao || '')
  );

  if (!motivoSelecionado) {
    return '';
  }

  return `${String(motivoSelecionado.idMotivoDevolucao).padStart(4, '0')} - ${motivoSelecionado.abreviacao}`;
}

function aplicarSinalTipoPedidoNaQuantidade(valor, idTipoPedido) {
  const numero = Number(String(valor ?? '').replace(',', '.'));

  if (!Number.isFinite(numero) || numero === 0) {
    return String(valor ?? '').trim();
  }

  const numeroNormalizado = tipoPedidoEhDevolucao(idTipoPedido)
    ? -Math.abs(numero)
    : Math.abs(numero);

  return String(numeroNormalizado);
}

function aplicarSinalTipoPedidoNoPreco(valor, idTipoPedido) {
  const numero = converterPrecoParaNumero(valor);

  if (numero === null) {
    return String(valor ?? '').trim();
  }

  const numeroNormalizado = tipoPedidoEhDevolucao(idTipoPedido)
    ? -Math.abs(numero)
    : Math.abs(numero);

  return desformatarPreco(numeroNormalizado);
}

function normalizarItemPedidoPorTipo(item, idTipoPedido) {
  const valorUnitario = aplicarSinalTipoPedidoNoPreco(item?.valorUnitario, idTipoPedido);
  const quantidade = aplicarSinalTipoPedidoNaQuantidade(item?.quantidade, idTipoPedido);

  return {
    ...item,
    quantidade,
    valorUnitario,
    valorTotal: calcularTotalItemPorTipo(quantidade, valorUnitario, idTipoPedido)
  };
}

function calcularTotalItemPorTipo(quantidade, valorUnitario, idTipoPedido) {
  const numeroQuantidade = Number(String(quantidade ?? '').replace(',', '.'));
  const numeroValorUnitario = converterPrecoParaNumero(valorUnitario);

  if (!numeroQuantidade || numeroValorUnitario === null) {
    return '';
  }

  const valorBase = Math.abs(numeroQuantidade) * Math.abs(numeroValorUnitario);
  const total = tipoPedidoEhDevolucao(idTipoPedido) ? -valorBase : valorBase;

  return desformatarPreco(total);
}

function obterIniciaisItemPedido(item) {
  const descricao = item?.descricaoProdutoSnapshot || 'Item';
  const partes = String(descricao).trim().split(/\s+/).filter(Boolean);
  const iniciais = partes.slice(0, 2).map((parte) => parte[0]).join('');
  return (iniciais || 'IT').toUpperCase();
}

function combinarContatosDoCliente(contatosBase, contatosLocais, idCliente) {
  return combinarContatosUnicos(
    (Array.isArray(contatosBase) ? contatosBase : []).filter(
      (contato) => String(contato.idCliente) === String(idCliente)
    ),
    (Array.isArray(contatosLocais) ? contatosLocais : []).filter(
      (contato) => String(contato.idCliente) === String(idCliente)
    )
  );
}

function obterProximoCodigoCliente(clientes) {
  if (!Array.isArray(clientes) || clientes.length === 0) {
    return 1;
  }

  const maiorCodigo = clientes.reduce((maior, cliente) => {
    const codigoAtual = Number(cliente?.idCliente);
    return Number.isFinite(codigoAtual) && codigoAtual > maior ? codigoAtual : maior;
  }, 0);

  return maiorCodigo + 1;
}

function combinarContatosUnicos(contatosBase, contatosExtras) {
  const mapa = new Map();

  [...(Array.isArray(contatosBase) ? contatosBase : []), ...(Array.isArray(contatosExtras) ? contatosExtras : [])]
    .forEach((contato) => {
      if (!contato?.idContato) {
        return;
      }

      mapa.set(String(contato.idContato), contato);
    });

  return Array.from(mapa.values());
}
