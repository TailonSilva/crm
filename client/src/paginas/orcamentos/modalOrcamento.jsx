import { useEffect, useMemo, useRef, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';
import { GradePadrao } from '../../componentes/comuns/gradePadrao';
import { ModalBuscaClientes } from '../../componentes/comuns/modalBuscaClientes';
import { ModalBuscaContatos } from '../../componentes/comuns/modalBuscaContatos';
import { ModalItemProduto } from '../../componentes/comuns/modalItemProduto';
import { PopupAvisos } from '../../componentes/comuns/popupAvisos';
import { MensagemErroPopup } from '../../componentes/comuns/mensagemErroPopup';
import { ModalPrazosPagamento } from '../configuracoes/modalPrazosPagamento';
import { ModalCliente } from '../clientes/modalCliente';
import { formatarNomeContato } from '../../utilitarios/formatarNomeContato';
import { useFormularioItemProduto } from '../../utilitarios/useFormularioItemProduto';
import {
  converterPrecoParaNumero,
  desformatarPreco,
  normalizarPreco,
  normalizarPrecoDigitado
} from '../../utilitarios/normalizarPreco';
import { normalizarValorEntradaFormulario } from '../../utilitarios/normalizarTextoFormulario';
import { desktopTemExportacaoPdf } from '../../servicos/desktop';
import { exportarOrcamentoPdf } from './utilitarios/exportarOrcamentoPdf';
import { formatarCodigoCliente } from '../../utilitarios/codigoCliente';
import { obterEtapasOrcamentoParaInputManual } from '../../utilitarios/etapasOrcamento';

const abasModalOrcamento = [
  { id: 'dadosGerais', label: 'Dados gerais' },
  { id: 'itens', label: 'Itens' },
  { id: 'campos', label: 'Campos do orcamento' }
];

const ID_ETAPA_ORCAMENTO_FECHAMENTO = 1;
const IDS_ETAPAS_ORCAMENTO_FECHADAS = new Set([1, 2, 3, 4]);

const estadoInicialFormulario = {
  dataInclusao: '',
  dataValidade: '',
  dataFechamento: '',
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
  descricaoProdutoSnapshot: '',
  referenciaProdutoSnapshot: '',
  unidadeProdutoSnapshot: '',
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
  ramosAtividade = [],
  metodosPagamento = [],
  prazosPagamento,
  etapasOrcamento,
  motivosPerda,
  produtos,
  camposOrcamento,
  camposPedido = [],
  empresa,
  usuarioLogado,
  modo = 'novo',
  idVendedorBloqueado = null,
  somenteConsultaPrazos = false,
  aoIncluirCliente,
  aoFechar,
  aoSalvar,
  aoSalvarPrazoPagamento,
  aoInativarPrazoPagamento
}) {
  const [formulario, definirFormulario] = useState(estadoInicialFormulario);
  const [abaAtiva, definirAbaAtiva] = useState(abasModalOrcamento[0].id);
  const [salvando, definirSalvando] = useState(false);
  const [gerandoPdf, definirGerandoPdf] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [avisosPopup, definirAvisosPopup] = useState([]);
  const [confirmandoSaida, definirConfirmandoSaida] = useState(false);
  const [confirmandoFechamento, definirConfirmandoFechamento] = useState(false);
  const [idEtapaAnteriorFechamento, definirIdEtapaAnteriorFechamento] = useState('');
  const [idEtapaPendenteFechamento, definirIdEtapaPendenteFechamento] = useState('');
  const [modalMotivoPerdaAberto, definirModalMotivoPerdaAberto] = useState(false);
  const [modalBuscaClienteAberto, definirModalBuscaClienteAberto] = useState(false);
  const [modalClienteAberto, definirModalClienteAberto] = useState(false);
  const [modalBuscaContatoAberto, definirModalBuscaContatoAberto] = useState(false);
  const referenciaCampoCliente = useRef(null);
  const referenciaCampoContato = useRef(null);
  const [contatosCriadosLocalmente, definirContatosCriadosLocalmente] = useState([]);
  const [modalPrazosPagamentoAberto, definirModalPrazosPagamentoAberto] = useState(false);
  const somenteLeitura = modo === 'consulta';
  const modoInclusao = modo === 'novo';
  const modoEdicao = modo === 'edicao';
  const clientesAtivos = clientes.filter((cliente) => cliente.status !== 0);
  const contatosAtivos = contatos.filter((contato) => contato.status !== 0);
  const usuariosAtivos = usuarios.filter((usuario) => usuario.ativo !== 0);
  const vendedoresAtivos = vendedores.filter((vendedor) => vendedor.status !== 0);
  const prazosAtivos = prazosPagamento.filter((prazo) => prazo.status !== 0);
  const etapasAtivas = useMemo(
    () => ordenarEtapasPorOrdem(etapasOrcamento.filter((etapa) => etapa.status !== 0), 'idEtapaOrcamento'),
    [etapasOrcamento]
  );
  const etapasDisponiveisEscolhaManual = useMemo(
    () => obterEtapasOrcamentoParaInputManual(etapasAtivas, formulario.idEtapaOrcamento),
    [etapasAtivas, formulario.idEtapaOrcamento]
  );
  const motivosAtivos = motivosPerda.filter((motivo) => motivo.status !== 0);
  const produtosAtivos = produtos.filter((produto) => produto.status !== 0);
  const exportacaoPdfDisponivel = desktopTemExportacaoPdf();
  const contatosDoCliente = useMemo(
    () => combinarContatosDoCliente(contatosAtivos, contatosCriadosLocalmente, formulario.idCliente),
    [contatosAtivos, contatosCriadosLocalmente, formulario.idCliente]
  );
  const proximoCodigoCliente = useMemo(
    () => obterProximoCodigoCliente(clientes),
    [clientes]
  );
  const etapaSelecionada = etapasAtivas.find((etapa) => String(etapa.idEtapaOrcamento) === String(formulario.idEtapaOrcamento));
  const etapaAtualEhFechada = etapaOrcamentoEhFechadoPorId(formulario.idEtapaOrcamento);
  const totalOrcamento = useMemo(
    () => formulario.itens.reduce((total, item) => total + (converterPrecoParaNumero(item.valorTotal) || 0), 0),
    [formulario.itens]
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
    salvarItem,
    removerItem
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
    calcularTotalItem,
    normalizarPrecoDigitado,
    converterPrecoParaNumero,
    normalizarPreco,
    normalizarQuantidade,
    exigirProduto: true
  });

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirFormulario(criarFormularioInicial(orcamento, usuarioLogado, camposOrcamento, empresa));
    definirAbaAtiva(abasModalOrcamento[0].id);
    definirSalvando(false);
    definirGerandoPdf(false);
    definirMensagemErro('');
    definirAvisosPopup([]);
    definirConfirmandoSaida(false);
    definirConfirmandoFechamento(false);
    definirIdEtapaAnteriorFechamento('');
    definirIdEtapaPendenteFechamento('');
    definirModalMotivoPerdaAberto(false);
    definirModalBuscaClienteAberto(false);
    definirModalBuscaContatoAberto(false);
    definirContatosCriadosLocalmente([]);
    definirModalPrazosPagamentoAberto(false);
    redefinirItemModal();
  }, [aberto, orcamento, usuarioLogado, camposOrcamento, empresa]);

  useEffect(() => {
    if (avisosPopup.length === 0) {
      return undefined;
    }

    const temporizadores = avisosPopup.map((aviso) => window.setTimeout(() => {
      definirAvisosPopup((estadoAtual) => estadoAtual.filter((item) => item.id !== aviso.id));
    }, 12000));

    return () => {
      temporizadores.forEach((temporizador) => window.clearTimeout(temporizador));
    };
  }, [avisosPopup]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    function tratarTecla(evento) {
      if (evento.key !== 'Escape' || salvando || gerandoPdf) {
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
  }, [aberto, confirmandoFechamento, confirmandoSaida, gerandoPdf, modalBuscaClienteAberto, modalBuscaContatoAberto, modalBuscaProdutoAberto, modalClienteAberto, modalItemAberto, modalPrazosPagamentoAberto, salvando]);

  if (!aberto) {
    return null;
  }

  function alterarCampo(evento) {
    const { name, value } = evento.target;
    const valorNormalizado = normalizarValorEntradaFormulario(evento);

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
      const entrouEmEtapaFechada = name === 'idEtapaOrcamento'
        && !etapaOrcamentoEhFechadoPorId(estadoAtual.idEtapaOrcamento)
        && etapaOrcamentoEhFechadoPorId(value);
      const proximoEstado = {
        ...estadoAtual,
        ...(name === 'idCliente' ? { idContato: '' } : {}),
        [name]: name === 'comissao' ? normalizarPrecoDigitado(value) : valorNormalizado,
        ...(entrouEmEtapaFechada && !estadoAtual.dataFechamento
          ? { dataFechamento: obterDataAtualFormatoInput() }
          : {})
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

  async function salvarFormulario(formularioAtual = formulario) {
    const etapaSelecionadaAtual = etapasAtivas.find(
      (etapa) => String(etapa.idEtapaOrcamento) === String(formularioAtual.idEtapaOrcamento)
    );
    const etapaAtualEhFechadaAtual = etapaOrcamentoEhFechadoPorId(formularioAtual.idEtapaOrcamento);

    if (somenteLeitura) {
      return;
    }

    if (!String(formularioAtual.idCliente || '').trim()) {
      definirMensagemErro('Selecione o cliente do orcamento.');
      return;
    }

    if (!String(formularioAtual.idVendedor || '').trim()) {
      definirMensagemErro('Selecione o vendedor.');
      return;
    }

    if (formularioAtual.itens.length === 0) {
      definirMensagemErro('Inclua ao menos um item no orcamento.');
      return;
    }

    if (etapaAtualEhFechadaAtual && !String(formularioAtual.dataFechamento || '').trim()) {
      definirMensagemErro('Informe a data de fechamento para esta etapa do orcamento.');
      return;
    }

    if (etapaSelecionadaAtual?.obrigarMotivoPerda && !String(formularioAtual.idMotivoPerda || '').trim()) {
      definirModalMotivoPerdaAberto(true);
      return;
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      await aoSalvar(formularioAtual);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel salvar o orcamento.');
      definirSalvando(false);
    }
  }

  async function gerarPdfFormularioAtual() {
    if (gerandoPdf) {
      return;
    }

    if (!String(formulario.idCliente || '').trim()) {
      adicionarAvisoPdf('erro', 'Nao foi possivel gerar o PDF.', 'Selecione o cliente antes de exportar o PDF do orcamento.');
      definirAbaAtiva('dadosGerais');
      return;
    }

    if (!Array.isArray(formulario.itens) || formulario.itens.length === 0) {
      adicionarAvisoPdf('erro', 'Nao foi possivel gerar o PDF.', 'Inclua ao menos um item antes de exportar o PDF do orcamento.');
      definirAbaAtiva('itens');
      return;
    }

    definirGerandoPdf(true);

    try {
      const resultado = await exportarOrcamentoPdf({
        formulario,
        orcamento,
        clientes,
        contatos,
        usuarios,
        vendedores,
        prazosPagamento,
        etapasOrcamento,
        produtos,
        empresa,
        camposPedido
      });

      if (resultado.cancelado) {
        return;
      }

      if (!resultado.sucesso) {
        adicionarAvisoPdf('erro', 'Nao foi possivel gerar o PDF.', resultado.mensagem || 'Nao foi possivel exportar o PDF do orcamento.');
        return;
      }

      adicionarAvisoPdf('sucesso', 'PDF gerado com sucesso.', '');
    } catch (erro) {
      adicionarAvisoPdf('erro', 'Nao foi possivel gerar o PDF.', erro.message || 'Nao foi possivel exportar o PDF do orcamento.');
    } finally {
      definirGerandoPdf(false);
    }
  }

  function adicionarAvisoPdf(tipo, titulo, mensagem) {
    const id = `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

  function tentarFecharModal() {
    if (!somenteLeitura && modoInclusao) {
      definirConfirmandoSaida(true);
      return;
    }

    aoFechar();
  }

  function confirmarFechamento() {
    const proximoFormulario = {
      ...formulario,
      idEtapaOrcamento: idEtapaPendenteFechamento,
      dataFechamento: formulario.dataFechamento || obterDataAtualFormatoInput(),
      solicitarPedidoAoSalvar: true
    };

    definirFormulario(proximoFormulario);
    definirConfirmandoFechamento(false);
    definirIdEtapaAnteriorFechamento('');
    definirIdEtapaPendenteFechamento('');

    salvarFormulario(proximoFormulario);
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

  function abrirModalBuscaCliente() {
    if (somenteLeitura || salvando) {
      return;
    }

    definirModalBuscaClienteAberto(true);
  }

  function abrirModalNovoCliente() {
    if (somenteLeitura || salvando || !aoIncluirCliente) {
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
    if (somenteLeitura || salvando || !formulario.idCliente) {
      return;
    }

    definirModalBuscaContatoAberto(true);
  }

  function fecharModalBuscaContato() {
    definirModalBuscaContatoAberto(false);
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

  function selecionarPrazoPagamento(prazo) {
    if (!prazo?.idPrazoPagamento) {
      return;
    }

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      idPrazoPagamento: String(prazo.idPrazoPagamento)
    }));
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
    agendarFocoCampo(referenciaCampoCliente);
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
    agendarFocoCampo(referenciaCampoContato);
  }

  function registrarContatoCriado(contato) {
    if (!contato?.idContato) {
      return;
    }

    definirContatosCriadosLocalmente((estadoAtual) => combinarContatosUnicos(estadoAtual, [contato]));
  }

  async function salvarNovoCliente(dadosCliente) {
    const clienteCriado = await aoIncluirCliente(dadosCliente);

    selecionarCliente(clienteCriado);
    definirModalClienteAberto(false);
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
                {somenteLeitura ? 'Consultar orcamento' : modoEdicao ? 'Editar orcamento' : 'Incluir orcamento'}
              </h2>
            </div>
            {orcamento?.idOrcamento ? <CodigoRegistro valor={orcamento.idOrcamento} /> : null}
          </div>

          <div className="acoesCabecalhoModalCliente">
            <Botao
              variante="secundario"
              type="button"
              onClick={gerarPdfFormularioAtual}
              disabled={salvando || gerandoPdf}
              title={exportacaoPdfDisponivel ? 'Gerar PDF do orcamento' : 'Abrir impressao para salvar como PDF no navegador'}
            >
              {gerandoPdf ? 'Gerando PDF...' : 'Gerar PDF'}
            </Botao>
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
                  label={etapaAtualEhFechada ? 'Data de fechamento' : 'Data de validade'}
                  name={etapaAtualEhFechada ? 'dataFechamento' : 'dataValidade'}
                  type="date"
                  value={etapaAtualEhFechada ? formulario.dataFechamento : formulario.dataValidade}
                  onChange={alterarCampo}
                  disabled={somenteLeitura}
                  required={etapaAtualEhFechada}
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
                  referenciaCampo={referenciaCampoCliente}
                  value={formulario.idCliente}
                  onChange={alterarCampo}
                  options={clientesAtivos.map((cliente) => ({
                    valor: String(cliente.idCliente),
                    label: montarRotuloCliente(cliente, empresa)
                  }))}
                  disabled={somenteLeitura}
                  required
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
                    />
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
                  options={etapasDisponiveisEscolhaManual.map((etapa) => ({
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
                    const apresentacaoProduto = montarApresentacaoProdutoOrcamento(item, empresa);

                    return (
                      <tr key={`${item.idItemOrcamento || indice}-${indice}`}>
                        <td>
                          {imagemItem ? (
                            <img src={imagemItem} alt={item.descricaoProdutoSnapshot || 'Item do orcamento'} className="miniaturaItemOrcamento" />
                          ) : (
                            <div className="miniaturaItemOrcamentoPlaceholder">
                              {obterIniciaisItemOrcamento(item)}
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
                  })}
                </GradePadrao>

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

        <MensagemErroPopup mensagem={mensagemErro} titulo="Nao foi possivel salvar o orcamento." />
      </form>

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
          clientes={clientes}
          placeholder="Pesquisar clientes"
          ariaLabelPesquisa="Pesquisar clientes"
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
          placeholder="Pesquisar contatos do cliente"
          ariaLabelPesquisa="Pesquisar contatos do cliente"
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

      <PopupAvisos
          avisos={avisosPopup}
          aoFechar={(idAviso) => {
            definirAvisosPopup((estadoAtual) => estadoAtual.filter((aviso) => aviso.id !== idAviso));
          }}
      />

      <ModalItemProduto
          aberto={modalItemAberto}
          titulo={somenteLeitura ? 'Consultar item do orcamento' : 'Editar item do orcamento'}
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
          obterIniciais={obterIniciaisItemOrcamento}
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
    </div>
  );
}

function etapaOrcamentoEhFechamento(etapa) {
  return Number(etapa?.idEtapaOrcamento) === ID_ETAPA_ORCAMENTO_FECHAMENTO;
}

function etapaOrcamentoEhFechadoPorId(idEtapaOrcamento) {
  return IDS_ETAPAS_ORCAMENTO_FECHADAS.has(Number(idEtapaOrcamento));
}

function CampoFormulario({ label, name, type = 'text', ...props }) {
  return (
    <div className="campoFormulario">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="entradaFormulario" {...props} />
    </div>
  );
}

function montarApresentacaoProdutoOrcamento(item, empresa) {
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

function CampoSelect({ label, name, options, className = '', acaoExtra = null, referenciaCampo = null, ...props }) {
  return (
    <div className={`campoFormulario ${className}`.trim()}>
      <label htmlFor={name}>{label}</label>
      <div className={`campoSelectComAcao ${acaoExtra ? 'temAcao' : ''}`.trim()}>
        <select id={name} name={name} className="entradaFormulario" ref={referenciaCampo} {...props}>
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

function agendarFocoCampo(referenciaCampo) {
  window.setTimeout(() => {
    referenciaCampo?.current?.focus?.({ preventScroll: true });
  }, 0);
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
      dataFechamento: '',
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
    dataFechamento: orcamento.dataFechamento || '',
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
      idItemOrcamento: item.idItemOrcamento,
      idProduto: item.idProduto,
      descricaoProdutoSnapshot: item.descricaoProdutoSnapshot || item.nomeProduto || '',
      referenciaProdutoSnapshot: item.referenciaProdutoSnapshot || '',
      unidadeProdutoSnapshot: item.unidadeProdutoSnapshot || '',
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

function montarRotuloCliente(cliente, empresa) {
  const codigo = formatarCodigoCliente(cliente, empresa);
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

function obterIniciaisItemOrcamento(item) {
  const descricao = item?.descricaoProdutoSnapshot || item?.descricao || 'Item';
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
