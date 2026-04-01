import { useEffect, useMemo, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { ModalBuscaClientes } from '../../componentes/comuns/modalBuscaClientes';
import { ModalBuscaContatos } from '../../componentes/comuns/modalBuscaContatos';
import { ModalCliente } from '../clientes/modalCliente';
import { ModalOrcamento } from '../orcamentos/modalOrcamento';

const estadoInicialFormulario = {
  idCliente: '',
  idContato: '',
  idOrcamento: '',
  idEtapaOrcamento: '',
  idUsuario: '',
  nomeUsuario: '',
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

export function ModalAtendimento({
  aberto,
  atendimento,
  clientes = [],
  contatos = [],
  usuarioLogado,
  vendedores = [],
  ramosAtividade = [],
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
  prazosPagamento = [],
  etapasOrcamento = [],
  motivosPerda = [],
  orcamentos = [],
  produtos = [],
  camposOrcamento = [],
  empresa,
  etapaOrcamentoAtualizadaExternamente = null,
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
  const [modalOrcamentoAberto, definirModalOrcamentoAberto] = useState(false);
  const [modoModalOrcamento, definirModoModalOrcamento] = useState('novo');
  const [orcamentoSelecionado, definirOrcamentoSelecionado] = useState(null);
  const [confirmandoPedidoOrcamento, definirConfirmandoPedidoOrcamento] = useState(null);
  const somenteLeitura = modo === 'consulta';
  const modoInclusao = !atendimento;
  const clientesAtivos = clientes.filter((cliente) => cliente.status !== 0);
  const contatosAtivos = contatos.filter((contato) => contato.status !== 0);
  const canaisAtivos = canaisAtendimento.filter((canal) => canal.status !== 0);
  const origensAtivas = origensAtendimento.filter((origem) => origem.status !== 0);
  const etapasOrcamentoAtivas = useMemo(
    () => ordenarEtapasPorOrdem(etapasOrcamento.filter((etapa) => etapa.status !== 0), 'idEtapaOrcamento'),
    [etapasOrcamento]
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
    definirModalOrcamentoAberto(false);
    definirModoModalOrcamento('novo');
    definirOrcamentoSelecionado(null);
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
  }, [aberto, aoFechar, confirmandoExclusao, confirmandoPedidoOrcamento, confirmandoSaida, salvando, modalBuscaClienteAberto, modalBuscaContatoAberto, modalClienteAberto, modalOrcamentoAberto]);

  if (!aberto) {
    return null;
  }

  const modoEdicao = Boolean(atendimento?.idAtendimento);
  const contatosDoCliente = contatosAtivos.filter(
    (contato) => String(contato.idCliente) === String(formulario.idCliente)
  );
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

    definirFormulario((estadoAtual) => {
      const proximoEstado = {
        ...estadoAtual,
        ...(name === 'idCliente' ? { idContato: '', idOrcamento: '', idEtapaOrcamento: '' } : {}),
        [name]: type === 'checkbox' ? checked : value
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
      ['assunto', 'Informe o assunto do atendimento.'],
      ['data', 'Informe a data do atendimento.'],
      ['horaInicio', 'Informe o horario de inicio.']
    ];

    const mensagemValidacao = camposObrigatorios.find(([campo]) => !String(formulario[campo] || '').trim());

    if (mensagemValidacao) {
      definirMensagemErro(mensagemValidacao[1]);
      return;
    }

    if (modoEdicao && formulario.horaFim && formulario.horaFim <= formulario.horaInicio) {
      definirMensagemErro('O horario de fim deve ser maior que o horario de inicio.');
      return;
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      if (formulario.idOrcamento && formulario.idEtapaOrcamento && aoAtualizarStatusOrcamento) {
        await aoAtualizarStatusOrcamento({
          idOrcamento: Number(formulario.idOrcamento),
          idEtapaOrcamento: Number(formulario.idEtapaOrcamento)
        });
      }
      await aoSalvar(formulario);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel salvar o atendimento.');
      definirSalvando(false);
    }
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
    <div className="camadaModalContato camadaModalAtendimento" role="presentation" onMouseDown={fecharAoClicarNoFundo}>
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
            {somenteLeitura ? 'Consultar atendimento' : atendimento ? 'Editar atendimento' : 'Incluir atendimento'}
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
                  disabled={somenteLeitura || !modoEdicao}
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
                    >
                      Buscar cliente
                    </Botao>
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
                    <>
                      <Botao
                        variante="secundario"
                        type="button"
                        icone="consultar"
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
                          somenteIcone
                          title="Editar orcamento"
                          aria-label="Editar orcamento"
                          onClick={abrirModalEdicaoOrcamento}
                        />
                      ) : null}
                    </>
                  ) : null}
                />
                <CampoSelect
                  label="Status do orcamento"
                  name="idEtapaOrcamento"
                  value={formulario.idEtapaOrcamento}
                  onChange={alterarStatusOrcamento}
                  options={etapasOrcamentoAtivas.map((etapa) => ({
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

        {mensagemErro ? <p className="mensagemErroFormulario">{mensagemErro}</p> : null}

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
      codigoSugerido={null}
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
      contatos={contatosDoCliente}
      placeholder="Pesquisar contatos do cliente"
      ariaLabelPesquisa="Pesquisar contatos do cliente"
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
      prazosPagamento={prazosPagamento}
      etapasOrcamento={etapasOrcamento}
      motivosPerda={motivosPerda}
      produtos={produtos}
      camposOrcamento={camposOrcamento}
      empresa={empresa}
      usuarioLogado={usuarioLogado}
      modo={modoModalOrcamento}
      aoFechar={fecharModalNovoOrcamento}
      aoSalvar={salvarNovoOrcamento}
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

function montarRotuloCliente(cliente) {
  const codigo = `#${String(cliente.idCliente || '').padStart(4, '0')}`;
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
  const cliente = clientes.find((item) => String(item.idCliente) === String(formulario?.idCliente || ''));
  const vendedor = vendedores.find((item) => String(item.idVendedor) === String(cliente?.idVendedor || ''));

  return {
    idCliente: formulario?.idCliente || '',
    idContato: formulario?.idContato || '',
    idUsuario: formulario?.idUsuario || usuarioLogado?.idUsuario || '',
    nomeUsuario: formulario?.nomeUsuario || usuarioLogado?.nome || '',
    idVendedor: cliente?.idVendedor || '',
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
