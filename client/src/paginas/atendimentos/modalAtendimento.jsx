import { useEffect, useMemo, useRef, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { CampoPesquisa } from '../../componentes/comuns/campoPesquisa';
import { ModalCliente } from '../clientes/modalCliente';

const estadoInicialFormulario = {
  idCliente: '',
  idContato: '',
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

export function ModalAtendimento({
  aberto,
  atendimento,
  clientes,
  contatos,
  usuarioLogado,
  vendedores,
  ramosAtividade,
  canaisAtendimento,
  origensAtendimento,
  modo = 'novo',
  permitirExcluir = false,
  idVendedorBloqueado = null,
  aoIncluirCliente,
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
  const [pesquisaCliente, definirPesquisaCliente] = useState('');
  const [indiceClienteAtivo, definirIndiceClienteAtivo] = useState(0);
  const referenciaPesquisaCliente = useRef(null);
  const somenteLeitura = modo === 'consulta';
  const modoInclusao = !atendimento;

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
    definirPesquisaCliente('');
    definirIndiceClienteAtivo(0);
  }, [aberto, atendimento, usuarioLogado]);

  const clientesFiltradosBusca = useMemo(() => {
    const termo = String(pesquisaCliente || '').trim().toLowerCase();

    return clientes.filter((cliente) => {
      if (!termo) {
        return true;
      }

      return [
        cliente.idCliente,
        cliente.razaoSocial,
        cliente.nomeFantasia,
        cliente.cidade,
        cliente.estado,
        cliente.cnpj
      ].some((valor) => String(valor || '').toLowerCase().includes(termo));
    });
  }, [clientes, pesquisaCliente]);

  useEffect(() => {
    if (!modalBuscaClienteAberto) {
      return;
    }

    definirIndiceClienteAtivo(0);

    const timeout = window.setTimeout(() => {
      referenciaPesquisaCliente.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [modalBuscaClienteAberto]);

  useEffect(() => {
    if (!clientesFiltradosBusca.length) {
      definirIndiceClienteAtivo(0);
      return;
    }

    if (indiceClienteAtivo > clientesFiltradosBusca.length - 1) {
      definirIndiceClienteAtivo(clientesFiltradosBusca.length - 1);
    }
  }, [clientesFiltradosBusca, indiceClienteAtivo]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    function tratarTecla(evento) {
      if (evento.key === 'Escape' && !salvando) {
        if (modalClienteAberto) {
          return;
        }

        if (modalBuscaClienteAberto) {
          fecharModalBuscaCliente();
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
  }, [aberto, aoFechar, confirmandoExclusao, confirmandoSaida, salvando, modalBuscaClienteAberto, modalClienteAberto]);

  if (!aberto) {
    return null;
  }

  const modoEdicao = Boolean(atendimento?.idAtendimento);
  const contatosDoCliente = contatos.filter(
    (contato) => String(contato.idCliente) === String(formulario.idCliente)
  );
  const contatoSelecionado = contatosDoCliente.find(
    (contato) => String(contato.idContato) === String(formulario.idContato)
  );

  function alterarCampo(evento) {
    const { name, value, type, checked } = evento.target;

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      ...(name === 'idCliente' ? { idContato: '' } : {}),
      [name]: type === 'checkbox' ? checked : value
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

    definirPesquisaCliente('');
    definirIndiceClienteAtivo(0);
    definirModalBuscaClienteAberto(true);
  }

  function fecharModalBuscaCliente() {
    definirModalBuscaClienteAberto(false);
    definirPesquisaCliente('');
    definirIndiceClienteAtivo(0);
  }

  function selecionarCliente(cliente) {
    if (!cliente) {
      return;
    }

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      idCliente: String(cliente.idCliente),
      idContato: ''
    }));
    fecharModalBuscaCliente();
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

  function tratarTeclaBuscaCliente(evento) {
    if (!modalBuscaClienteAberto) {
      return;
    }

    if (evento.key === 'ArrowDown') {
      evento.preventDefault();

      if (!clientesFiltradosBusca.length) {
        return;
      }

      definirIndiceClienteAtivo((indiceAtual) => (
        indiceAtual >= clientesFiltradosBusca.length - 1 ? 0 : indiceAtual + 1
      ));
      return;
    }

    if (evento.key === 'ArrowUp') {
      evento.preventDefault();

      if (!clientesFiltradosBusca.length) {
        return;
      }

      definirIndiceClienteAtivo((indiceAtual) => (
        indiceAtual <= 0 ? clientesFiltradosBusca.length - 1 : indiceAtual - 1
      ));
      return;
    }

    if (evento.key === 'Enter') {
      if (!clientesFiltradosBusca.length) {
        return;
      }

      evento.preventDefault();
      selecionarCliente(clientesFiltradosBusca[indiceClienteAtivo]);
    }
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
    <div className="camadaModalContato" role="presentation" onMouseDown={fecharAoClicarNoFundo}>
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
                  options={clientes.map((cliente) => ({
                    valor: String(cliente.idCliente),
                    label: montarRotuloCliente(cliente)
                  }))}
                  disabled={somenteLeitura}
                  required
                  acaoExtra={!somenteLeitura ? (
                    <>
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
                      <Botao
                        variante="secundario"
                        type="button"
                        icone="adicionar"
                        somenteIcone
                        title="Incluir cliente"
                        aria-label="Incluir cliente"
                        onClick={abrirModalNovoCliente}
                      >
                        Incluir cliente
                      </Botao>
                    </>
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
                  options={canaisAtendimento.map((canal) => ({
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
                  options={origensAtendimento.map((origem) => ({
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
      idVendedorBloqueado={idVendedorBloqueado}
      aoFechar={fecharModalNovoCliente}
      aoSalvar={salvarNovoCliente}
    />

    {modalBuscaClienteAberto ? (
      <div className="camadaModalContato" role="presentation" onMouseDown={fecharModalBuscaCliente}>
        <section
          className="modalContatoCliente modalBuscaClienteAtendimento"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tituloModalBuscaClienteAtendimento"
          onMouseDown={(evento) => evento.stopPropagation()}
          onKeyDown={tratarTeclaBuscaCliente}
        >
          <div className="cabecalhoModalContato">
            <h3 id="tituloModalBuscaClienteAtendimento">Buscar cliente</h3>

            <div className="acoesFormularioContatoModal">
              <Botao variante="secundario" type="button" onClick={fecharModalBuscaCliente}>
                Fechar
              </Botao>
            </div>
          </div>

          <div className="corpoModalContato corpoModalBuscaClienteAtendimento">
            <CampoPesquisa
              valor={pesquisaCliente}
              aoAlterar={definirPesquisaCliente}
              placeholder="Pesquisar cliente no grid"
              ariaLabel="Pesquisar cliente no grid"
              ref={referenciaPesquisaCliente}
            />

            <div className="gradeContatosModal gradeBuscaClienteAtendimento">
              <table className="tabelaContatosModal tabelaBuscaClienteAtendimento">
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Razao social</th>
                    <th>Nome fantasia</th>
                    <th>Cidade</th>
                    <th>UF</th>
                    <th>CNPJ</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltradosBusca.length > 0 ? (
                    clientesFiltradosBusca.map((cliente, indice) => (
                      <tr
                        key={cliente.idCliente}
                        className={indice === indiceClienteAtivo ? 'linhaBuscaClienteAtiva' : ''}
                        onMouseEnter={() => definirIndiceClienteAtivo(indice)}
                        onDoubleClick={() => selecionarCliente(cliente)}
                        onClick={() => selecionarCliente(cliente)}
                      >
                        <td>#{String(cliente.idCliente).padStart(4, '0')}</td>
                        <td>{cliente.razaoSocial}</td>
                        <td>{cliente.nomeFantasia}</td>
                        <td>{cliente.cidade || 'Nao informada'}</td>
                        <td>{cliente.estado || '--'}</td>
                        <td>{cliente.cnpj || 'Nao informado'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="mensagemTabelaContatosModal">
                        Nenhum cliente encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    ) : null}
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

function montarRotuloCliente(cliente) {
  const codigo = `#${String(cliente.idCliente || '').padStart(4, '0')}`;
  const nome = cliente.nomeFantasia || cliente.razaoSocial || 'Cliente sem nome';
  const localizacao = [cliente.cidade, cliente.estado].filter(Boolean).join('/');

  return localizacao ? `${codigo} - ${nome} - ${localizacao}` : `${codigo} - ${nome}`;
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
