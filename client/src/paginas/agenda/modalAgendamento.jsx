import { useEffect, useMemo, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { CampoSelecaoMultiplaModal } from '../../componentes/comuns/campoSelecaoMultiplaModal';
import { formatarNomeContato } from '../../utilitarios/formatarNomeContato';
import { normalizarValorEntradaFormulario } from '../../utilitarios/normalizarTextoFormulario';
import { registroEstaAtivo } from '../../utilitarios/statusRegistro';

const estadoInicialFormulario = {
  idAgendamento: '',
  data: '',
  assunto: '',
  idTipoAgenda: '',
  horaInicio: '',
  horaFim: '',
  idCliente: '',
  idContato: '',
  idLocal: '',
  idsRecursos: [],
  idsUsuarios: [],
  idUsuario: '',
  idStatusVisita: ''
};

export function ModalAgendamento({
  aberto,
  dadosIniciais,
  locais,
  recursos,
  clientes,
  contatos,
  usuarios,
  tiposAgenda,
  statusVisita,
  usuarioLogado,
  permitirExcluir = true,
  aoFechar,
  aoSalvar,
  aoExcluir
}) {
  const [formulario, definirFormulario] = useState(estadoInicialFormulario);
  const [salvando, definirSalvando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [confirmandoExclusao, definirConfirmandoExclusao] = useState(false);
  const locaisAtivos = locais.filter((local) => registroEstaAtivo(local.status));
  const recursosAtivos = recursos.filter((recurso) => registroEstaAtivo(recurso.status));
  const clientesAtivos = clientes.filter((cliente) => registroEstaAtivo(cliente.status));
  const contatosAtivos = contatos.filter((contato) => registroEstaAtivo(contato.status));
  const usuariosAtivos = usuarios.filter((usuario) => registroEstaAtivo(usuario.ativo));
  const tiposAgendaAtivos = tiposAgenda.filter((tipoAgenda) => registroEstaAtivo(tipoAgenda.status));
  const statusAtivos = useMemo(
    () => statusVisita.filter((status) => registroEstaAtivo(status.status)),
    [statusVisita]
  );

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirFormulario(criarFormularioInicial(dadosIniciais, usuarioLogado, statusAtivos));
    definirSalvando(false);
    definirMensagemErro('');
    definirConfirmandoExclusao(false);
  }, [aberto, dadosIniciais, statusAtivos, usuarioLogado]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    function tratarTecla(evento) {
      if (evento.key === 'Escape' && !salvando) {
        if (confirmandoExclusao) {
          definirConfirmandoExclusao(false);
          return;
        }

        aoFechar();
      }
    }

    window.addEventListener('keydown', tratarTecla);

    return () => {
      window.removeEventListener('keydown', tratarTecla);
    };
  }, [aberto, aoFechar, confirmandoExclusao, salvando]);

  if (!aberto) {
    return null;
  }

  const modoEdicao = Boolean(formulario.idAgendamento);
  const contatosDoCliente = contatosAtivos.filter(
    (contato) => String(contato.idCliente) === String(formulario.idCliente)
  );
  const recursosSelecionados = recursosAtivos.filter((recurso) => (
    formulario.idsRecursos.includes(String(recurso.idRecurso))
  ));
  const usuariosSelecionados = usuariosAtivos.filter((usuario) => (
    formulario.idsUsuarios.includes(String(usuario.idUsuario))
  ));
  const tipoAgendaSelecionado = tiposAgendaAtivos.find(
    (tipoAgenda) => String(tipoAgenda.idTipoAgenda) === String(formulario.idTipoAgenda)
  );
  const clienteObrigatorio = Boolean(tipoAgendaSelecionado?.obrigarCliente);
  const localObrigatorio = Boolean(tipoAgendaSelecionado?.obrigarLocal);
  const recursoObrigatorio = Boolean(tipoAgendaSelecionado?.obrigarRecurso);

  function alterarCampo(evento) {
    const { name, value } = evento.target;
    const valorNormalizado = normalizarValorEntradaFormulario(evento);

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      ...(name === 'idCliente' ? { idContato: '' } : {}),
      [name]: valorNormalizado
    }));
  }

  async function submeterFormulario(evento) {
    evento.preventDefault();

    const camposObrigatorios = [
      ['data', 'Informe o dia.'],
      ['assunto', 'Informe o assunto.'],
      ['horaInicio', 'Informe o horario de inicio.'],
      ['horaFim', 'Informe o horario de fim.'],
      ['idsUsuarios', 'Selecione ao menos um usuario.'],
      ['idTipoAgenda', 'Selecione o tipo.'],
      ['idStatusVisita', 'Selecione o status da visita.']
    ];

    if (clienteObrigatorio) {
      camposObrigatorios.push(['idCliente', 'Selecione o cliente.']);
      camposObrigatorios.push(['idContato', 'Selecione o contato do cliente.']);
    }

    if (formulario.idCliente && !clienteObrigatorio) {
      camposObrigatorios.push(['idContato', 'Selecione o contato do cliente.']);
    }

    if (localObrigatorio) {
      camposObrigatorios.push(['idLocal', 'Selecione o local.']);
    }

    if (recursoObrigatorio) {
      camposObrigatorios.push(['idsRecursos', 'Selecione ao menos um recurso.']);
    }

    const mensagemValidacao = camposObrigatorios.find(([campo]) => {
      if (campo === 'idsRecursos' || campo === 'idsUsuarios') {
        return !Array.isArray(formulario[campo]) || formulario[campo].length === 0;
      }

      return !String(formulario[campo] || '').trim();
    });

    if (mensagemValidacao) {
      definirMensagemErro(mensagemValidacao[1]);
      return;
    }

    if (formulario.horaFim <= formulario.horaInicio) {
      definirMensagemErro('O horario de fim deve ser maior que o horario de inicio.');
      return;
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      await aoSalvar(formulario);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel salvar o agendamento.');
      definirSalvando(false);
    }
  }

  function fecharAoClicarNoFundo(evento) {
    if (evento.target === evento.currentTarget && !salvando) {
      aoFechar();
    }
  }

  async function excluirRegistro() {
    if (!modoEdicao || !aoExcluir) {
      return;
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      await aoExcluir(formulario.idAgendamento);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel excluir o agendamento.');
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

  return (
    <div className="camadaModalContato" role="presentation" onMouseDown={fecharAoClicarNoFundo}>
      <form
        className="modalContatoCliente modalAgendamento"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalAgendamento"
        onMouseDown={(evento) => evento.stopPropagation()}
        onSubmit={submeterFormulario}
      >
        <div className="cabecalhoModalContato">
          <h3 id="tituloModalAgendamento">{modoEdicao ? 'Editar agendamento' : 'Incluir agendamento'}</h3>

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
            <Botao
              variante="secundario"
              type="button"
              icone="fechar"
              somenteIcone
              title="Fechar"
              aria-label="Fechar"
              onClick={aoFechar}
              disabled={salvando}
            >
              Fechar
            </Botao>
            <Botao
              variante="primario"
              type="submit"
              icone="confirmar"
              somenteIcone
              title={salvando ? 'Salvando' : 'Salvar'}
              aria-label={salvando ? 'Salvando' : 'Salvar'}
              disabled={salvando}
            >
              Salvar
            </Botao>
          </div>
        </div>

        <div className="corpoModalContato">
          <div className="gradeCamposModalCliente gradeCamposModalAgendamento">
            <CampoFormulario className="campoAgendamentoAssunto" label="Assunto" name="assunto" value={formulario.assunto} onChange={alterarCampo} required />
            <CampoFormulario label="Dia" name="data" type="date" value={formulario.data} onChange={alterarCampo} required />
            <CampoSelect
              label="Tipo"
              name="idTipoAgenda"
              value={formulario.idTipoAgenda}
              onChange={alterarCampo}
              options={tiposAgendaAtivos.map((tipoAgenda) => ({
                valor: String(tipoAgenda.idTipoAgenda),
                label: tipoAgenda.descricao
              }))}
              required
            />
            <CampoSelect
              label="Local"
              name="idLocal"
              value={formulario.idLocal}
              onChange={alterarCampo}
              options={locaisAtivos.map((local) => ({
                valor: String(local.idLocal),
                label: local.descricao
              }))}
              required={localObrigatorio}
            />
            <CampoFormulario label="Horario de inicio" name="horaInicio" type="time" value={formulario.horaInicio} onChange={alterarCampo} required />
            <CampoFormulario label="Horario de fim" name="horaFim" type="time" value={formulario.horaFim} onChange={alterarCampo} required />
            <CampoSelect
              className="campoAgendamentoMetade"
              label="Cliente"
              name="idCliente"
              value={formulario.idCliente}
              onChange={alterarCampo}
              options={clientesAtivos.map((cliente) => ({
                valor: String(cliente.idCliente),
                label: cliente.nomeFantasia || cliente.razaoSocial
              }))}
              required={clienteObrigatorio}
            />
            <CampoSelect
              className="campoAgendamentoMetade"
              label="Contato do cliente"
              name="idContato"
              value={formulario.idContato}
              onChange={alterarCampo}
              options={contatosDoCliente.map((contato) => ({
                valor: String(contato.idContato),
                label: formatarNomeContato(contato)
              }))}
              disabled={!formulario.idCliente}
              required={clienteObrigatorio}
            />
            <CampoSelecaoMultiplaModal
              className="campoAgendamentoTerco"
              label="Recursos"
              titulo="Selecionar recursos"
              itens={recursosAtivos.map((recurso) => ({
                valor: String(recurso.idRecurso),
                label: recurso.descricao
              }))}
              valoresSelecionados={formulario.idsRecursos}
              placeholder="Selecionar recursos"
              aoAlterar={(valores) => definirFormulario((estadoAtual) => ({
                ...estadoAtual,
                idsRecursos: valores
              }))}
            />
            <CampoSelecaoMultiplaModal
              className="campoAgendamentoMetade"
              label="Usuarios"
              titulo="Selecionar usuarios"
              itens={usuariosAtivos.map((usuario) => ({
                valor: String(usuario.idUsuario),
                label: usuario.nome
              }))}
              valoresSelecionados={formulario.idsUsuarios}
              placeholder="Selecionar usuarios"
              aoAlterar={(valores) => definirFormulario((estadoAtual) => ({
                ...estadoAtual,
                idsUsuarios: valores
              }))}
            />
            <CampoSelect
              className="campoAgendamentoTerco"
              label="Status"
              name="idStatusVisita"
              value={formulario.idStatusVisita}
              onChange={alterarCampo}
              options={statusAtivos.map((status) => ({
                valor: String(status.idStatusVisita),
                label: status.descricao
              }))}
              required
            />
          </div>
        </div>

        {mensagemErro ? <p className="mensagemErroFormulario">{mensagemErro}</p> : null}

        {confirmandoExclusao ? (
          <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={fecharConfirmacaoExclusao}>
            <div
              className="modalConfirmacaoAgenda"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="tituloConfirmacaoExclusaoAgenda"
              onMouseDown={(evento) => evento.stopPropagation()}
            >
              <div className="cabecalhoConfirmacaoModal">
                <h4 id="tituloConfirmacaoExclusaoAgenda">Excluir agendamento</h4>
              </div>

              <div className="corpoConfirmacaoModal">
                <p>Tem certeza que deseja excluir este agendamento?</p>
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

function CampoSelect({ label, name, options, className = '', ...props }) {
  return (
    <div className={`campoFormulario ${className}`.trim()}>
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} className="entradaFormulario" {...props}>
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.valor} value={option.valor}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function criarFormularioInicial(dadosIniciais, usuarioLogado, statusAtivos) {
  const idStatusVisita = normalizarValorFormularioAgendamento(dadosIniciais?.idStatusVisita)
    || obterStatusVisitaPadrao(statusAtivos);

  return {
    ...estadoInicialFormulario,
    ...dadosIniciais,
    idTipoAgenda: normalizarValorFormularioAgendamento(dadosIniciais?.idTipoAgenda),
    idCliente: normalizarValorFormularioAgendamento(dadosIniciais?.idCliente),
    idContato: normalizarValorFormularioAgendamento(dadosIniciais?.idContato),
    idLocal: normalizarValorFormularioAgendamento(dadosIniciais?.idLocal),
    idStatusVisita,
    idsRecursos: Array.isArray(dadosIniciais?.idsRecursos)
      ? dadosIniciais.idsRecursos.map((idRecurso) => String(idRecurso))
      : [],
    idsUsuarios: Array.isArray(dadosIniciais?.idsUsuarios)
      ? dadosIniciais.idsUsuarios.map((idUsuario) => String(idUsuario))
      : usuarioLogado?.idUsuario
        ? [String(usuarioLogado.idUsuario)]
        : [],
    idUsuario: String(dadosIniciais?.idUsuario || usuarioLogado?.idUsuario || '')
  };
}

function obterStatusVisitaPadrao(statusAtivos) {
  if (!Array.isArray(statusAtivos) || statusAtivos.length === 0) {
    return '';
  }

  const statusOrdenados = [...statusAtivos].sort((primeiro, segundo) => {
    const ordemPrimeira = obterOrdemStatus(primeiro);
    const ordemSegunda = obterOrdemStatus(segundo);

    if (ordemPrimeira !== ordemSegunda) {
      return ordemPrimeira - ordemSegunda;
    }

    return Number(primeiro?.idStatusVisita || 0) - Number(segundo?.idStatusVisita || 0);
  });

  return String(statusOrdenados[0]?.idStatusVisita || '');
}

function obterOrdemStatus(status) {
  const ordem = Number(status?.ordem);

  if (Number.isFinite(ordem) && ordem > 0) {
    return ordem;
  }

  const idStatus = Number(status?.idStatusVisita);
  if (Number.isFinite(idStatus) && idStatus > 0) {
    return idStatus;
  }

  return Number.MAX_SAFE_INTEGER;
}

function normalizarValorFormularioAgendamento(valor) {
  if (valor === null || valor === undefined || valor === '' || Number(valor) <= 0) {
    return '';
  }

  return String(valor);
}
