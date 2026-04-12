import { useEffect, useMemo, useRef, useState } from 'react';
import { Botao } from '../comuns/botao';
import { MensagemErroPopup } from '../comuns/mensagemErroPopup';
import { ModalBuscaClientes } from '../comuns/modalBuscaClientes';
import { ModalBuscaContatos } from '../comuns/modalBuscaContatos';
import { ModalCliente } from './clientes-modalCliente';
import { ModalOrcamento } from './orcamentos-modalOrcamento';
import { formatarCodigoCliente } from '../../utilitarios/codigoCliente';
import { formatarNomeContato } from '../../utilitarios/formatarNomeContato';
import { normalizarValorEntradaFormulario } from '../../utilitarios/normalizarTextoFormulario';
import { obterEtapasOrcamentoParaInputManual } from '../../utilitarios/etapasOrcamento';

const estadoInicialFormulario = {
  idCliente: '',
  idContato: '',
  idOrcamento: '',
  idEtapaOrcamento: '',
  idUsuario: '',
  nomeUsuario: '',
  idTipoAtendimento: '',
  assunto: '',
  descricao: '',
  data: '',
  horaInicio: '',
  horaFim: '',
  idCanalAtendimento: '',
  idOrigemAtendimento: ''
};

const ID_ETAPA_ORCAMENTO_FECHAMENTO = 1;
const ID_ETAPA_ORCAMENTO_FECHADO_SEM_PEDIDO = 2;
const ID_TIPO_PEDIDO_VENDA = 1;

export function ModalAtendimento({
  aberto,
  atendimento,
  clientes = [],
  contatos = [],
  usuarioLogado,
  vendedores = [],
  ramosAtividade = [],
  tiposAtendimento = [],
  canaisAtendimento = [],
  origensAtendimento = [],
  modo = 'novo',
  permitirExcluir = false,
  idVendedorBloqueado = null,
  aoIncluirCliente,
  aoIncluirOrcamento,
  aoAtualizarOrcamento,
  aoAtualizarStatusOrcamento,
  aoAbrirPedido,
  dadosOrcamento,
  clientesOrcamento = [],
  contatosOrcamento = [],
  usuariosOrcamento = [],
  vendedoresOrcamento = [],
  metodosPagamento = [],
  prazosPagamento = [],
  etapasOrcamento = [],
  motivosPerda = [],
  orcamentos = [],
  produtos = [],
  camposOrcamento = [],
  camposPedido = [],
  empresa,
  somenteConsultaPrazos = false,
  etapaOrcamentoAtualizadaExternamente = null,
  classNameCamada = 'camadaModalContato camadaModalAtendimento',
  aoSalvarPrazoPagamento,
  aoInativarPrazoPagamento,
  aoFechar,
  aoSalvar,
  aoExcluir
}) {
  const [formulario, definirFormulario] = useState(estadoInicialFormulario);
  const [salvando, definirSalvando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [confirmandoExclusao, definirConfirmandoExclusao] = useState(false);
  const [confirmandoSaida, definirConfirmandoSaida] = useState(false);
  const [modalClienteAberto, definirModalClienteAberto] = useState(false);
  const [modalBuscaClienteAberto, definirModalBuscaClienteAberto] = useState(false);
  const [modalBuscaContatoAberto, definirModalBuscaContatoAberto] = useState(false);
  const referenciaCampoCliente = useRef(null);
  const referenciaCampoContato = useRef(null);
  const [contatosCriadosLocalmente, definirContatosCriadosLocalmente] = useState([]);
  const [modalOrcamentoAberto, definirModalOrcamentoAberto] = useState(false);
  const [modoModalOrcamento, definirModoModalOrcamento] = useState('novo');
  const [orcamentoSelecionado, definirOrcamentoSelecionado] = useState(null);
  const [modalMotivoPerdaAberto, definirModalMotivoPerdaAberto] = useState(false);
  const [motivoPerdaPendente, definirMotivoPerdaPendente] = useState('');
  const [confirmandoPedidoOrcamento, definirConfirmandoPedidoOrcamento] = useState(null);
  const somenteLeitura = modo === 'consulta';
  const modoInclusao = modo === 'novo';
  const modoEdicao = modo === 'edicao';
  const clientesAtivos = clientes.filter((cliente) => cliente.status !== 0);
  const contatosAtivos = contatos.filter((contato) => contato.status !== 0);
  const tiposAtendimentoAtivos = tiposAtendimento.filter((tipoAtendimento) => tipoAtendimento.status !== 0);
  const canaisAtivos = canaisAtendimento.filter((canal) => canal.status !== 0);
  const origensAtivas = origensAtendimento.filter((origem) => origem.status !== 0);
  const etapasOrcamentoAtivas = useMemo(
    () => ordenarEtapasPorOrdem(etapasOrcamento.filter((etapa) => etapa.status !== 0), 'idEtapaOrcamento'),
    [etapasOrcamento]
  );
  const etapasOrcamentoDisponiveisEscolhaManual = useMemo(
    () => obterEtapasOrcamentoParaInputManual(etapasOrcamentoAtivas, formulario.idEtapaOrcamento),
    [etapasOrcamentoAtivas, formulario.idEtapaOrcamento]
  );

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirFormulario(criarFormularioInicial(atendimento, usuarioLogado));
    definirSalvando(false);
    definirMensagemErro('');
    definirConfirmandoExclusao(false);
    definirConfirmandoSaida(false);
    definirModalClienteAberto(false);
    definirModalBuscaClienteAberto(false);
    definirModalBuscaContatoAberto(false);
    definirContatosCriadosLocalmente([]);
    definirModalOrcamentoAberto(false);
    definirModoModalOrcamento('novo');
    definirOrcamentoSelecionado(null);
    definirModalMotivoPerdaAberto(false);
    definirMotivoPerdaPendente('');
    definirConfirmandoPedidoOrcamento(null);
  }, [aberto, atendimento, usuarioLogado]);

  useEffect(() => {
    if (!etapaOrcamentoAtualizadaExternamente?.idOrcamento) {
      return;
    }

    definirFormulario((estadoAtual) => (
      String(estadoAtual.idOrcamento || '') === String(etapaOrcamentoAtualizadaExternamente.idOrcamento)
        ? {
          ...estadoAtual,
          idEtapaOrcamento: String(etapaOrcamentoAtualizadaExternamente.idEtapaOrcamento || '')
        }
        : estadoAtual
    ));
  }, [etapaOrcamentoAtualizadaExternamente]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    function tratarTecla(evento) {
      if (evento.key === 'Escape' && !salvando) {
        if (modalClienteAberto) {
          return;
        }

        if (modalOrcamentoAberto) {
          return;
        }

        if (modalMotivoPerdaAberto) {
          definirModalMotivoPerdaAberto(false);
          return;
        }

        if (confirmandoPedidoOrcamento) {
          definirConfirmandoPedidoOrcamento(null);
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

        if (confirmandoSaida) {
          definirConfirmandoSaida(false);
          return;
        }

        if (confirmandoExclusao) {
          definirConfirmandoExclusao(false);
          return;
        }

        tentarFecharModal();
      }
    }

    window.addEventListener('keydown', tratarTecla);

    return () => {
      window.removeEventListener('keydown', tratarTecla);
    };
  }, [aberto, aoFechar, confirmandoExclusao, confirmandoPedidoOrcamento, confirmandoSaida, salvando, modalBuscaClienteAberto, modalBuscaContatoAberto, modalClienteAberto, modalMotivoPerdaAberto, modalOrcamentoAberto]);

  if (!aberto) {
    return null;
  }

  const contatosDoCliente = combinarContatosDoCliente(
    contatosAtivos,
    contatosCriadosLocalmente,
    formulario.idCliente
  );
  const proximoCodigoCliente = obterProximoCodigoCliente(clientes);
  const motivosPerdaAtivos = motivosPerda.filter((motivo) => motivo.status !== 0);
  const orcamentosAbertosDoCliente = orcamentos.filter(
    (orcamento) => String(orcamento.idCliente) === String(formulario.idCliente)
  );
  const orcamentoSelecionadoFormulario = orcamentos.find(
    (orcamento) => String(orcamento.idOrcamento) === String(formulario.idOrcamento)
  );
  const contatoSelecionado = contatosDoCliente.find(
    (contato) => String(contato.idContato) === String(formulario.idContato)
  );
  const dadosOrcamentoAtendimento = montarDadosOrcamentoAPartirDoAtendimentoAtual(
    formulario,
    clientesOrcamento,
    vendedoresOrcamento,
    usuarioLogado
  );

  function alterarCampo(evento) {
    const { name, value, type, checked } = evento.target;
    const valorNormalizado = normalizarValorEntradaFormulario(evento);

    definirFormulario((estadoAtual) => {
      const proximoEstado = {
        ...estadoAtual,
        ...(name === 'idCliente' ? { idContato: '', idOrcamento: '', idEtapaOrcamento: '' } : {}),
        [name]: type === 'checkbox' ? checked : valorNormalizado
      };

      if (name === 'idOrcamento') {
        const orcamento = orcamentosAbertosDoCliente.find((item) => String(item.idOrcamento) === String(value));
        proximoEstado.idEtapaOrcamento = orcamento?.idEtapaOrcamento ? String(orcamento.idEtapaOrcamento) : '';
      }

      if (name === 'idEtapaOrcamento' && !estadoAtual.idOrcamento) {
        proximoEstado.idEtapaOrcamento = '';
      }

      return proximoEstado;
    });
  }

  function alterarStatusOrcamento(evento) {
    const proximoValor = String(evento.target.value || '');

    if (!formulario.idOrcamento) {
      return;
    }

    if (!proximoValor || String(formulario.idEtapaOrcamento || '') === proximoValor) {
      definirFormulario((estadoAtual) => ({
        ...estadoAtual,
        idEtapaOrcamento: proximoValor
      }));
      return;
    }

    if (precisaPerguntarGeracaoPedido(
      {
        ...orcamentoSelecionadoFormulario,
        idEtapaOrcamento: formulario.idEtapaOrcamento || orcamentoSelecionadoFormulario?.idEtapaOrcamento
      },
      proximoValor,
      etapasOrcamento
    )) {
      definirConfirmandoPedidoOrcamento({
        origem: 'atendimento',
        proximoIdEtapaOrcamento: proximoValor,
        orcamento: orcamentoSelecionadoFormulario
      });
      return;
    }

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      idEtapaOrcamento: proximoValor
    }));
  }

  async function submeterFormulario(evento) {
    evento.preventDefault();

    if (somenteLeitura) {
      return;
    }

    const camposObrigatorios = [
      ['idCliente', 'Selecione o cliente.'],
      ['idTipoAtendimento', 'Selecione o tipo de atendimento.'],
      ['assunto', 'Informe o assunto do atendimento.'],
      ['data', 'Informe a data do atendimento.'],
      ['horaInicio', 'Informe o horario de inicio.']
    ];

    const mensagemValidacao = camposObrigatorios.find(([campo]) => !String(formulario[campo] || '').trim());

    if (mensagemValidacao) {
      definirMensagemErro(mensagemValidacao[1]);
      return;
    }

    if (formulario.horaFim && formulario.horaFim <= formulario.horaInicio) {
      definirMensagemErro('O horario de fim deve ser maior que o horario de inicio.');
      return;
    }

    await executarSalvamentoAtendimento();
  }

  async function executarSalvamentoAtendimento(idMotivoPerdaInformado = null) {
    const etapaSelecionada = etapasOrcamento.find(
      (etapa) => String(etapa.idEtapaOrcamento || '') === String(formulario.idEtapaOrcamento || '')
    );
    const motivoJaVinculadoAoOrcamento = String(orcamentoSelecionadoFormulario?.idMotivoPerda || '').trim();
    const motivoSelecionado = String(idMotivoPerdaInformado || '').trim() || motivoJaVinculadoAoOrcamento;

    if (
      formulario.idOrcamento
      && formulario.idEtapaOrcamento
      && etapaSelecionada?.obrigarMotivoPerda
      && !motivoSelecionado
    ) {
      definirMotivoPerdaPendente('');
      definirModalMotivoPerdaAberto(true);
      return;
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      if (formulario.idOrcamento && formulario.idEtapaOrcamento && aoAtualizarStatusOrcamento) {
        await aoAtualizarStatusOrcamento({
          idOrcamento: Number(formulario.idOrcamento),
          idEtapaOrcamento: Number(formulario.idEtapaOrcamento),
          idMotivoPerda: etapaSelecionada?.obrigarMotivoPerda && motivoSelecionado
            ? Number(motivoSelecionado)
            : undefined
        });
      }

      await aoSalvar(formulario);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel salvar o atendimento.');
      definirSalvando(false);
    }
  }

  async function confirmarMotivoPerdaAoSalvar() {
    if (!String(motivoPerdaPendente || '').trim()) {
      definirMensagemErro('Selecione o motivo da perda para continuar.');
      return;
    }

    definirModalMotivoPerdaAberto(false);
    await executarSalvamentoAtendimento(motivoPerdaPendente);
  }

  function fecharAoClicarNoFundo(evento) {
    if (evento.target === evento.currentTarget && !salvando) {
      tentarFecharModal();
    }
  }

  async function excluirRegistro() {
    if (!modoEdicao || !aoExcluir) {
      return;
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      await aoExcluir(atendimento.idAtendimento);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel excluir o atendimento.');
      definirSalvando(false);
    }
  }

  function abrirConfirmacaoExclusao() {
    if (!permitirExcluir || salvando) {
      return;
    }

    definirConfirmandoExclusao(true);
  }

  function fecharConfirmacaoExclusao() {
    if (salvando) {
      return;
    }

    definirConfirmandoExclusao(false);
  }

  function tentarFecharModal() {
    if (!somenteLeitura && modoInclusao) {
      definirConfirmandoSaida(true);
      return;
    }

    aoFechar();
  }

  function fecharConfirmacaoSaida() {
    if (salvando) {
      return;
    }

    definirConfirmandoSaida(false);
  }

  function confirmarSaida() {
    definirConfirmandoSaida(false);
    aoFechar();
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

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      idCliente: String(cliente.idCliente),
      idContato: '',
      idOrcamento: '',
      idEtapaOrcamento: ''
    }));
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
    try {
      const clienteCriado = await aoIncluirCliente(dadosCliente);

      selecionarCliente(clienteCriado);
      definirModalClienteAberto(false);
    } catch (erro) {
      throw erro;
    }
  }

  function abrirModalNovoOrcamento() {
    if (somenteLeitura || salvando || !aoIncluirOrcamento) {
      return;
    }

    definirModoModalOrcamento('novo');
    definirOrcamentoSelecionado(null);
    definirModalOrcamentoAberto(true);
  }

  function abrirModalConsultaOrcamento() {
    if (!orcamentoSelecionadoFormulario) {
      return;
    }

    definirModoModalOrcamento('consulta');
    definirOrcamentoSelecionado(orcamentoSelecionadoFormulario);
    definirModalOrcamentoAberto(true);
  }

  function abrirModalEdicaoOrcamento() {
    if (somenteLeitura || !orcamentoSelecionadoFormulario) {
      return;
    }

    definirModoModalOrcamento('edicao');
    definirOrcamentoSelecionado(orcamentoSelecionadoFormulario);
    definirModalOrcamentoAberto(true);
  }

  function fecharModalNovoOrcamento() {
    definirModalOrcamentoAberto(false);
    definirModoModalOrcamento('novo');
    definirOrcamentoSelecionado(null);
  }

  async function salvarNovoOrcamento(dadosNovoOrcamento) {
    const orcamentoBase = modoModalOrcamento === 'novo' ? null : orcamentoSelecionado;
    const precisaConfirmarPedido = precisaPerguntarGeracaoPedido(
      orcamentoBase,
      dadosNovoOrcamento.idEtapaOrcamento,
      etapasOrcamento
    );

    if (precisaConfirmarPedido) {
      definirConfirmandoPedidoOrcamento({
        origem: 'orcamento',
        dadosOrcamento: dadosNovoOrcamento,
        orcamento: orcamentoBase
      });
      return;
    }

    await persistirOrcamentoSemPedido(dadosNovoOrcamento);
  }

  async function persistirOrcamentoSemPedido(dadosNovoOrcamento) {
    const orcamentoSalvo = modoModalOrcamento === 'novo'
      ? await aoIncluirOrcamento(dadosNovoOrcamento)
      : await aoAtualizarOrcamento(dadosNovoOrcamento);

    if (orcamentoSalvo?.idOrcamento) {
      definirFormulario((estadoAtual) => ({
        ...estadoAtual,
        idOrcamento: String(orcamentoSalvo.idOrcamento),
        idEtapaOrcamento: orcamentoSalvo.idEtapaOrcamento ? String(orcamentoSalvo.idEtapaOrcamento) : ''
      }));
    }

    fecharModalNovoOrcamento();
  }

  async function recusarGeracaoPedido() {
    const confirmacao = confirmandoPedidoOrcamento;
    definirConfirmandoPedidoOrcamento(null);

    if (!confirmacao) {
      return;
    }

    const etapaFechadoSemPedido = obterEtapaFechadoSemPedido(etapasOrcamento);

    if (confirmacao.origem === 'atendimento') {
      if (etapaFechadoSemPedido?.idEtapaOrcamento && aoAtualizarStatusOrcamento) {
        await aoAtualizarStatusOrcamento({
          idOrcamento: Number(confirmacao.orcamento.idOrcamento),
          idEtapaOrcamento: Number(etapaFechadoSemPedido.idEtapaOrcamento)
        });
      }

      definirFormulario((estadoAtual) => ({
        ...estadoAtual,
        idEtapaOrcamento: etapaFechadoSemPedido?.idEtapaOrcamento
          ? String(etapaFechadoSemPedido.idEtapaOrcamento)
          : estadoAtual.idEtapaOrcamento
      }));
      return;
    }

    if (confirmacao.origem === 'orcamento') {
      const dadosAjustados = {
        ...confirmacao.dadosOrcamento,
        idEtapaOrcamento: etapaFechadoSemPedido?.idEtapaOrcamento
          ? String(etapaFechadoSemPedido.idEtapaOrcamento)
          : String(confirmacao.orcamento?.idEtapaOrcamento || '')
      };

      if (confirmacao.orcamento?.idOrcamento || etapaFechadoSemPedido?.idEtapaOrcamento) {
        await persistirOrcamentoSemPedido(dadosAjustados);
      } else if (confirmacao.orcamento?.idEtapaOrcamento && aoAtualizarStatusOrcamento) {
        await aoAtualizarStatusOrcamento({
          idOrcamento: Number(confirmacao.orcamento.idOrcamento),
          idEtapaOrcamento: Number(confirmacao.orcamento.idEtapaOrcamento)
        });
      }
    }
  }

  async function confirmarGeracaoPedido() {
    const confirmacao = confirmandoPedidoOrcamento;
    definirConfirmandoPedidoOrcamento(null);

    if (!confirmacao) {
      return;
    }

    if (confirmacao.origem === 'atendimento') {
      const orcamentoAtualizado = await aoAtualizarStatusOrcamento?.({
        idOrcamento: Number(confirmacao.orcamento.idOrcamento),
        idEtapaOrcamento: Number(confirmacao.proximoIdEtapaOrcamento)
      });

      definirFormulario((estadoAtual) => ({
        ...estadoAtual,
        idEtapaOrcamento: String(confirmacao.proximoIdEtapaOrcamento || '')
      }));

      if (aoAbrirPedido) {
        const orcamentoBasePedido = enriquecerOrcamentoParaPedidoAtendimento(
          orcamentoAtualizado || {
            ...confirmacao.orcamento,
            idEtapaOrcamento: Number(confirmacao.proximoIdEtapaOrcamento)
          },
          prazosPagamento,
          produtos
        );
        aoAbrirPedido(
          montarDadosIniciaisPedidoAPartirDoOrcamento(orcamentoBasePedido),
          { idOrcamento: orcamentoBasePedido.idOrcamento, origem: 'atendimento' }
        );
      }
      return;
    }

    const orcamentoSalvo = modoModalOrcamento === 'novo'
      ? await aoIncluirOrcamento(confirmacao.dadosOrcamento)
      : await aoAtualizarOrcamento(confirmacao.dadosOrcamento);

    if (orcamentoSalvo?.idOrcamento) {
      definirFormulario((estadoAtual) => ({
        ...estadoAtual,
        idOrcamento: String(orcamentoSalvo.idOrcamento),
        idEtapaOrcamento: orcamentoSalvo.idEtapaOrcamento ? String(orcamentoSalvo.idEtapaOrcamento) : ''
      }));

      if (aoAbrirPedido) {
        const orcamentoBasePedido = enriquecerOrcamentoParaPedidoAtendimento(orcamentoSalvo, prazosPagamento, produtos);
        aoAbrirPedido(
          montarDadosIniciaisPedidoAPartirDoOrcamento(orcamentoBasePedido),
          { idOrcamento: orcamentoBasePedido.idOrcamento, origem: 'orcamento' }
        );
      }
    }

    fecharModalNovoOrcamento();
  }

  function inserirMarcadorDescricao(evento) {
    if (somenteLeitura) {
      return;
    }

    const prefixo = evento.key === 'F2'
      ? `${formulario.nomeUsuario || usuarioLogado?.nome || 'Usuario'}: `
      : evento.key === 'F3'
        ? `${contatoSelecionado?.nome || 'Contato'}: `
        : null;

    if (!prefixo) {
      return;
    }

    evento.preventDefault();

    const inicio = evento.currentTarget.selectionStart ?? formulario.descricao.length;
    const fim = evento.currentTarget.selectionEnd ?? formulario.descricao.length;
    const textoAtual = formulario.descricao || '';
    const antes = textoAtual.slice(0, inicio);
    const depois = textoAtual.slice(fim);
    const precisaQuebraAntes = antes.length > 0 && !antes.endsWith('\n');
    const precisaQuebraDepois = depois.length > 0 && !depois.startsWith('\n');
    const insercao = `${precisaQuebraAntes ? '\n' : ''}${prefixo}${precisaQuebraDepois ? '\n' : ''}`;
    const proximoTexto = `${antes}${insercao}${depois}`;
    const novaPosicao = (antes + insercao).length;

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      descricao: proximoTexto
    }));

    window.requestAnimationFrame(() => {
      evento.currentTarget.focus();
      evento.currentTarget.setSelectionRange(novaPosicao, novaPosicao);
    });
  }

  return (
    <>
    <div className={classNameCamada} role="presentation" onMouseDown={fecharAoClicarNoFundo}>
      <form
        className="modalContatoCliente modalAtendimento"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalAtendimento"
        onMouseDown={(evento) => evento.stopPropagation()}
        onSubmit={submeterFormulario}
      >
        <div className="cabecalhoModalContato">
          <h3 id="tituloModalAtendimento">
            {somenteLeitura ? 'Consultar atendimento' : modoEdicao ? 'Editar atendimento' : 'Incluir atendimento'}
          </h3>

          <div className="acoesFormularioContatoModal">
            {modoEdicao ? (
              <Botao
                variante="secundario"
                type="button"
                icone="limpar"
                somenteIcone
                title="Excluir"
                aria-label="Excluir"
                disabled={salvando || !permitirExcluir}
                onClick={abrirConfirmacaoExclusao}
              >
                Excluir
              </Botao>
            ) : null}
            {!somenteLeitura ? (
              <Botao variante="secundario" type="button" onClick={abrirModalNovoOrcamento} disabled={salvando}>
                Incluir orcamento
              </Botao>
            ) : null}
            <Botao variante="secundario" type="button" onClick={tentarFecharModal} disabled={salvando}>
              {somenteLeitura ? 'Fechar' : 'Cancelar'}
            </Botao>
            {!somenteLeitura ? (
              <Botao variante="primario" type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </Botao>
            ) : null}
          </div>
        </div>

        <div className="corpoModalContato">
          <div className="layoutModalAtendimento">
            <div className="colunaPrincipalModalAtendimento">
              <div className="linhaHorariosAtendimento">
                <CampoFormulario
                  label="Data"
                  name="data"
                  type="date"
                  value={formulario.data}
                  onChange={alterarCampo}
                  disabled={somenteLeitura}
                  required
                />
                <CampoFormulario
                  label="Horario de inicio"
                  name="horaInicio"
                  type="time"
                  value={formulario.horaInicio}
                  onChange={alterarCampo}
                  disabled={somenteLeitura}
                  required
                />
                <CampoFormulario
                  label="Horario de fim"
                  name="horaFim"
                  type="time"
                  value={formulario.horaFim}
                  onChange={alterarCampo}
                  disabled={somenteLeitura}
                />
              </div>
              <CampoFormulario
                label="Assunto"
                name="assunto"
                value={formulario.assunto}
                onChange={alterarCampo}
                disabled={somenteLeitura}
                required
              />
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
              </div>
              <div className="linhaOrcamentoAtendimento">
                <CampoSelect
                  label="Orcamento"
                  name="idOrcamento"
                  value={formulario.idOrcamento}
                  onChange={alterarCampo}
                  options={orcamentosAbertosDoCliente.map((orcamento) => ({
                    valor: String(orcamento.idOrcamento),
                    label: montarRotuloOrcamento(orcamento)
                  }))}
                  disabled={somenteLeitura || !formulario.idCliente}
                  acaoExtra={formulario.idOrcamento ? (
                    <div className="acoesCampoSelect">
                      <Botao
                        variante="secundario"
                        type="button"
                        icone="consultar"
                        className="botaoCampoAcao"
                        somenteIcone
                        title="Consultar orcamento"
                        aria-label="Consultar orcamento"
                        onClick={abrirModalConsultaOrcamento}
                      />
                      {!somenteLeitura ? (
                        <Botao
                          variante="secundario"
                          type="button"
                          icone="editar"
                          className="botaoCampoAcao"
                          somenteIcone
                          title="Editar orcamento"
                          aria-label="Editar orcamento"
                          onClick={abrirModalEdicaoOrcamento}
                        />
                      ) : null}
                    </div>
                  ) : null}
                />
                <CampoSelect
                  label="Status do orcamento"
                  name="idEtapaOrcamento"
                  value={formulario.idEtapaOrcamento}
                  onChange={alterarStatusOrcamento}
                  options={etapasOrcamentoDisponiveisEscolhaManual.map((etapa) => ({
                    valor: String(etapa.idEtapaOrcamento),
                    label: etapa.descricao
                  }))}
                  disabled={somenteLeitura || !formulario.idOrcamento}
                />
              </div>
              <div className="linhaUsuarioCanalOrigemAtendimento">
                <CampoFormulario
                  label="Usuario do registro"
                  name="nomeUsuario"
                  value={formulario.nomeUsuario}
                  disabled
                />
                <CampoSelect
                  label="Tipo de atendimento"
                  name="idTipoAtendimento"
                  value={formulario.idTipoAtendimento}
                  onChange={alterarCampo}
                  options={tiposAtendimentoAtivos.map((tipoAtendimento) => ({
                    valor: String(tipoAtendimento.idTipoAtendimento),
                    label: tipoAtendimento.descricao
                  }))}
                  disabled={somenteLeitura}
                  required
                />
                <CampoSelect
                  label="Canal"
                  name="idCanalAtendimento"
                  value={formulario.idCanalAtendimento}
                  onChange={alterarCampo}
                  options={canaisAtivos.map((canal) => ({
                    valor: String(canal.idCanalAtendimento),
                    label: canal.descricao
                  }))}
                  disabled={somenteLeitura}
                />
                <CampoSelect
                  label="Origem"
                  name="idOrigemAtendimento"
                  value={formulario.idOrigemAtendimento}
                  onChange={alterarCampo}
                  options={origensAtivas.map((origem) => ({
                    valor: String(origem.idOrigemAtendimento),
                    label: origem.descricao
                  }))}
                  disabled={somenteLeitura}
                />
              </div>
            </div>

            <div className="colunaObservacaoModalAtendimento">
              <div className="campoFormulario campoFormularioIntegral">
                <label htmlFor="descricao">Descricao inicial</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formulario.descricao}
                  onChange={alterarCampo}
                  onKeyDown={inserirMarcadorDescricao}
                  disabled={somenteLeitura}
                  rows={6}
                  className="entradaFormulario entradaFormularioTextoLongo entradaObservacaoModalAtendimento"
                />
              </div>
            </div>
          </div>
        </div>

        <MensagemErroPopup mensagem={mensagemErro} titulo="Nao foi possivel salvar o atendimento." />

        {confirmandoPedidoOrcamento ? (
          <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={recusarGeracaoPedido}>
            <div
              className="modalConfirmacaoAgenda"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tituloConfirmacaoPedidoAtendimento"
              onMouseDown={(evento) => evento.stopPropagation()}
            >
              <div className="cabecalhoConfirmacaoModal">
                <h4 id="tituloConfirmacaoPedidoAtendimento">Criar pedido</h4>
              </div>

              <div className="corpoConfirmacaoModal">
                <p>Este orcamento esta sendo fechado. Deseja gerar um pedido a partir dele?</p>
              </div>

              <div className="acoesConfirmacaoModal">
                <Botao variante="secundario" type="button" onClick={recusarGeracaoPedido} disabled={salvando}>
                  Nao
                </Botao>
                <Botao variante="primario" type="button" onClick={confirmarGeracaoPedido} disabled={salvando}>
                  Sim
                </Botao>
              </div>
            </div>
          </div>
        ) : null}

        {modalMotivoPerdaAberto ? (
          <div
            className="camadaConfirmacaoModal"
            role="presentation"
            onMouseDown={() => {
              if (!salvando) {
                definirModalMotivoPerdaAberto(false);
              }
            }}
          >
            <div
              className="modalConfirmacaoAgenda modalEtapaRapidaOrcamento"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tituloMotivoPerdaAtendimento"
              onMouseDown={(evento) => evento.stopPropagation()}
            >
              <div className="cabecalhoConfirmacaoModal">
                <h4 id="tituloMotivoPerdaAtendimento">Motivo da perda</h4>
              </div>

              <div className="corpoConfirmacaoModal corpoModalEtapaRapidaOrcamento">
                <p>Essa etapa exige um motivo da perda para atualizar o orcamento vinculado.</p>
                <div className="campoFormulario campoFormularioIntegral">
                  <label htmlFor="motivoPerdaAtendimento">Selecione o motivo</label>
                  <select
                    id="motivoPerdaAtendimento"
                    className="entradaFormulario"
                    value={motivoPerdaPendente}
                    onChange={(evento) => definirMotivoPerdaPendente(evento.target.value)}
                    disabled={salvando}
                  >
                    <option value="">Selecione</option>
                    {motivosPerdaAtivos.map((motivo) => (
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
                  onClick={() => definirModalMotivoPerdaAberto(false)}
                  disabled={salvando}
                >
                  Cancelar
                </Botao>
                <Botao
                  variante="primario"
                  type="button"
                  onClick={confirmarMotivoPerdaAoSalvar}
                  disabled={salvando}
                >
                  Confirmar
                </Botao>
              </div>
            </div>
          </div>
        ) : null}

        {confirmandoSaida ? (
          <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={fecharConfirmacaoSaida}>
            <div
              className="modalConfirmacaoAgenda"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="tituloConfirmacaoSaidaAtendimento"
              onMouseDown={(evento) => evento.stopPropagation()}
            >
              <div className="cabecalhoConfirmacaoModal">
                <h4 id="tituloConfirmacaoSaidaAtendimento">Cancelar cadastro</h4>
              </div>

              <div className="corpoConfirmacaoModal">
                <p>Se fechar agora, todas as informacoes preenchidas serao perdidas.</p>
              </div>

              <div className="acoesConfirmacaoModal">
                <Botao variante="secundario" type="button" onClick={fecharConfirmacaoSaida} disabled={salvando}>
                  Nao
                </Botao>
                <Botao variante="perigo" type="button" onClick={confirmarSaida} disabled={salvando}>
                  Sim
                </Botao>
              </div>
            </div>
          </div>
        ) : null}

        {confirmandoExclusao ? (
          <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={fecharConfirmacaoExclusao}>
            <div
              className="modalConfirmacaoAgenda"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="tituloConfirmacaoExclusaoAtendimento"
              onMouseDown={(evento) => evento.stopPropagation()}
            >
              <div className="cabecalhoConfirmacaoModal">
                <h4 id="tituloConfirmacaoExclusaoAtendimento">Excluir atendimento</h4>
              </div>

              <div className="corpoConfirmacaoModal">
                <p>Tem certeza que deseja excluir este atendimento?</p>
              </div>

              <div className="acoesConfirmacaoModal">
                <Botao
                  variante="secundario"
                  type="button"
                  onClick={fecharConfirmacaoExclusao}
                  disabled={salvando}
                >
                  Nao
                </Botao>
                <Botao
                  variante="perigo"
                  type="button"
                  onClick={excluirRegistro}
                  disabled={salvando}
                >
                  Sim
                </Botao>
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </div>

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
      placeholder="Pesquisar cliente no grid"
      ariaLabelPesquisa="Pesquisar cliente no grid"
      rotuloAcaoPrimaria="Incluir cliente"
      tituloAcaoPrimaria="Incluir cliente"
      iconeAcaoPrimaria="adicionar"
      aoAcionarPrimaria={() => {
        fecharModalBuscaCliente();
        abrirModalNovoCliente();
      }}
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

    <ModalOrcamento
      aberto={modalOrcamentoAberto}
      orcamento={modoModalOrcamento === 'novo' ? (dadosOrcamentoAtendimento || dadosOrcamento) : orcamentoSelecionado}
      clientes={clientesOrcamento}
      contatos={contatosOrcamento}
      usuarios={usuariosOrcamento}
      vendedores={vendedoresOrcamento}
      ramosAtividade={ramosAtividade}
      metodosPagamento={metodosPagamento}
      prazosPagamento={prazosPagamento}
      etapasOrcamento={etapasOrcamento}
      motivosPerda={motivosPerda}
      produtos={produtos}
      camposOrcamento={camposOrcamento}
      camposPedido={camposPedido}
      empresa={empresa}
      usuarioLogado={usuarioLogado}
      modo={modoModalOrcamento}
      idVendedorBloqueado={idVendedorBloqueado}
      somenteConsultaPrazos={somenteConsultaPrazos}
      aoIncluirCliente={aoIncluirCliente}
      aoFechar={fecharModalNovoOrcamento}
      aoSalvar={salvarNovoOrcamento}
      aoSalvarPrazoPagamento={aoSalvarPrazoPagamento}
      aoInativarPrazoPagamento={aoInativarPrazoPagamento}
    />
    </>
  );
}

function CampoFormulario({ label, name, type = 'text', className = '', ...props }) {
  return (
    <div className={`campoFormulario ${className}`.trim()}>
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="entradaFormulario" {...props} />
    </div>
  );
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

function criarFormularioInicial(atendimento, usuarioLogado) {
  const dataPadrao = obterDataAtualFormatoInput();
  const horaPadrao = obterHoraAtualFormatoInput();

  return {
    ...estadoInicialFormulario,
    ...atendimento,
    data: atendimento?.data || dataPadrao,
    horaInicio: atendimento?.horaInicio || horaPadrao,
    horaFim: atendimento?.horaFim || '',
    idCliente: normalizarValorFormulario(atendimento?.idCliente),
    idContato: normalizarValorFormulario(atendimento?.idContato),
    idOrcamento: '',
    idEtapaOrcamento: '',
    idUsuario: normalizarValorFormulario(atendimento?.idUsuario || usuarioLogado?.idUsuario),
    nomeUsuario: atendimento?.nomeUsuario || usuarioLogado?.nome || '',
    idTipoAtendimento: normalizarValorFormulario(atendimento?.idTipoAtendimento),
    idCanalAtendimento: normalizarValorFormulario(atendimento?.idCanalAtendimento),
    idOrigemAtendimento: normalizarValorFormulario(atendimento?.idOrigemAtendimento)
  };
}

function normalizarValorFormulario(valor) {
  if (valor === null || valor === undefined || valor === '' || Number(valor) <= 0) {
    return '';
  }

  return String(valor);
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

function montarRotuloCliente(cliente, empresa) {
  const codigo = formatarCodigoCliente(cliente, empresa);
  const nome = cliente.nomeFantasia || cliente.razaoSocial || 'Cliente sem nome';
  const localizacao = [cliente.cidade, cliente.estado].filter(Boolean).join('/');

  return localizacao ? `${codigo} - ${nome} - ${localizacao}` : `${codigo} - ${nome}`;
}

function montarRotuloOrcamento(orcamento) {
  const codigo = `#${String(orcamento.idOrcamento || '').padStart(4, '0')}`;
  const total = Array.isArray(orcamento?.itens)
    ? orcamento.itens.reduce((acumulado, item) => {
      const valor = Number(String(item.valorTotal ?? 0).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.'));
      return acumulado + (Number.isNaN(valor) ? 0 : valor);
    }, 0)
    : 0;
  const valorFormatado = total.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  return `${codigo} - ${valorFormatado}`;
}

function obterDataAtualFormatoInput() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function obterHoraAtualFormatoInput() {
  const agora = new Date();
  const horas = String(agora.getHours()).padStart(2, '0');
  const minutos = String(agora.getMinutes()).padStart(2, '0');

  return `${horas}:${minutos}`;
}

function montarDadosOrcamentoAPartirDoAtendimentoAtual(formulario, clientes, vendedores, usuarioLogado) {
  const vendedor = vendedores.find((item) => String(item.idVendedor) === String(usuarioLogado?.idVendedor || ''));

  return {
    idCliente: formulario?.idCliente || '',
    idContato: formulario?.idContato || '',
    idUsuario: formulario?.idUsuario || usuarioLogado?.idUsuario || '',
    nomeUsuario: formulario?.nomeUsuario || usuarioLogado?.nome || '',
    idVendedor: usuarioLogado?.idVendedor || '',
    comissao: vendedor?.comissaoPadrao ?? 0,
    observacao: formulario?.descricao || ''
  };
}

function precisaPerguntarGeracaoPedido(orcamento, idEtapaOrcamento, etapasOrcamento) {
  if (!orcamento || orcamento.idPedidoVinculado || !idEtapaOrcamento) {
    return false;
  }

  return etapaAcabouDeFechar(orcamento.idEtapaOrcamento, idEtapaOrcamento, etapasOrcamento);
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

function enriquecerOrcamentoParaPedidoAtendimento(orcamento, prazosPagamento, produtos) {
  const prazo = prazosPagamento.find((item) => String(item.idPrazoPagamento) === String(orcamento.idPrazoPagamento));

  return {
    ...orcamento,
    nomePrazoPagamento: orcamento.nomePrazoPagamento || prazo?.descricaoFormatada || prazo?.descricao || '',
    nomeMetodoPagamento: orcamento.nomeMetodoPagamento || prazo?.nomeMetodoPagamento || '',
    itens: Array.isArray(orcamento.itens) ? orcamento.itens.map((item) => {
      const produto = produtos.find((registro) => String(registro.idProduto) === String(item.idProduto));
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
    idTipoPedido: ID_TIPO_PEDIDO_VENDA,
    comissao: orcamento.comissao,
    dataInclusao: obterDataAtualFormatoInput(),
    nomeClienteSnapshot: orcamento.nomeCliente || '',
    nomeContatoSnapshot: orcamento.nomeContato || '',
    nomeUsuarioSnapshot: orcamento.nomeUsuario || '',
    nomeVendedorSnapshot: orcamento.nomeVendedor || '',
    nomeMetodoPagamentoSnapshot: orcamento.nomeMetodoPagamento || '',
    nomePrazoPagamentoSnapshot: orcamento.nomePrazoPagamento || '',
    nomeTipoPedidoSnapshot: 'Venda',
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

