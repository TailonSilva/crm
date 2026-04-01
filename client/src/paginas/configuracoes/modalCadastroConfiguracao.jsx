import { useEffect, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { BotaoAcaoGrade } from '../../componentes/comuns/botaoAcaoGrade';
import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';
import { ModalFiltros } from '../../componentes/comuns/modalFiltros';

export function ModalCadastroConfiguracao({
  aberto,
  titulo,
  rotuloIncluir,
  registros,
  chavePrimaria,
  classeModal = '',
  classeTabela = '',
  classeFormulario = '',
  classeModalFormulario = '',
  agruparCheckboxes = false,
  classeGrupoCheckboxes = '',
  statusField = 'status',
  exibirConsulta = true,
  somenteConsulta = false,
  colunas,
  camposFormulario,
  aoFechar,
  aoSalvar,
  aoSalvarConcluido,
  aoInativar,
  podeEditarRegistro = () => true,
  podeInativarRegistro = () => true
}) {
  const [modalFormularioAberto, definirModalFormularioAberto] = useState(false);
  const [modoFormulario, definirModoFormulario] = useState('novo');
  const [registroSelecionado, definirRegistroSelecionado] = useState(null);
  const [formulario, definirFormulario] = useState({});
  const [salvando, definirSalvando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [modalFiltrosAberto, definirModalFiltrosAberto] = useState(false);
  const [filtros, definirFiltros] = useState(criarFiltrosIniciaisConfiguracao());

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirModalFormularioAberto(false);
    definirModoFormulario('novo');
    definirRegistroSelecionado(null);
    definirFormulario(criarFormularioVazio(camposFormulario));
    definirSalvando(false);
    definirMensagemErro('');
    definirModalFiltrosAberto(false);
    definirFiltros(criarFiltrosIniciaisConfiguracao());
  }, [aberto, camposFormulario]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    function tratarTecla(evento) {
      if (evento.key === 'Escape' && modalFormularioAberto) {
        fecharFormulario();
        return;
      }

      if (evento.key === 'Escape' && !salvando) {
        aoFechar();
      }
    }

    window.addEventListener('keydown', tratarTecla);

    return () => {
      window.removeEventListener('keydown', tratarTecla);
    };
  }, [aberto, aoFechar, modalFormularioAberto, salvando]);

  if (!aberto) {
    return null;
  }

  function abrirNovo() {
    definirRegistroSelecionado(null);
    definirFormulario(criarFormularioVazio(camposFormulario));
    definirModoFormulario('novo');
    definirMensagemErro('');
    definirModalFormularioAberto(true);
  }

  function abrirEdicao(registro) {
    definirRegistroSelecionado(registro);
    definirFormulario(criarFormularioRegistro(registro, camposFormulario));
    definirModoFormulario('edicao');
    definirMensagemErro('');
    definirModalFormularioAberto(true);
  }

  function abrirConsulta(registro) {
    definirRegistroSelecionado(registro);
    definirFormulario(criarFormularioRegistro(registro, camposFormulario));
    definirModoFormulario('consulta');
    definirMensagemErro('');
    definirModalFormularioAberto(true);
  }

  function fecharFormulario() {
    definirModalFormularioAberto(false);
    definirRegistroSelecionado(null);
    definirModoFormulario('novo');
    definirFormulario(criarFormularioVazio(camposFormulario));
    definirMensagemErro('');
    definirSalvando(false);
  }

  function alterarCampo(evento) {
    const { name, value, type, checked } = evento.target;

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function submeterFormulario(evento) {
    evento.preventDefault();

    if (modoFormulario === 'consulta') {
      return;
    }

    const mensagemValidacao = camposFormulario.find((campo) => (
      campo.required && String(formulario[campo.name] ?? '').trim() === ''
    ));

    if (mensagemValidacao) {
      definirMensagemErro(`Informe ${mensagemValidacao.label.toLowerCase()}.`);
      return;
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      const registroSalvo = await aoSalvar({
        [chavePrimaria]: registroSelecionado?.[chavePrimaria],
        ...formulario
      });

      if (typeof aoSalvarConcluido === 'function') {
        await aoSalvarConcluido(registroSalvo);
      }

      fecharFormulario();
    } catch (erro) {
      definirMensagemErro(erro.message || `Nao foi possivel salvar ${titulo.toLowerCase()}.`);
      definirSalvando(false);
    }
  }

  function fecharAoClicarNoFundo(evento) {
    if (evento.target === evento.currentTarget && !salvando) {
      aoFechar();
    }
  }

  function fecharFormularioNoFundo(evento) {
    if (evento.target === evento.currentTarget && !salvando) {
      fecharFormulario();
    }
  }

  function renderizarCampo(campo) {
    if (campo.type === 'select') {
      return (
        <CampoSelect
          key={campo.name}
          label={campo.label}
          name={campo.name}
          value={formulario[campo.name]}
          onChange={alterarCampo}
          options={campo.options || []}
          disabled={modoFormulario === 'consulta'}
          required={campo.required}
          placeholder={campo.placeholder}
        />
      );
    }

    if (campo.type === 'checkbox') {
      return (
        <label key={campo.name} className={`campoCheckboxFormulario campoCheckbox-${campo.name}`.trim()} htmlFor={campo.name}>
          <input
            id={campo.name}
            type="checkbox"
            name={campo.name}
            checked={Boolean(formulario[campo.name])}
            onChange={alterarCampo}
            disabled={modoFormulario === 'consulta'}
          />
          <span>{campo.label}</span>
        </label>
      );
    }

    return (
      <CampoFormulario
        key={campo.name}
        className={`campoFormulario-${campo.name}`}
        label={campo.label}
        name={campo.name}
        type={campo.type || 'text'}
        value={formulario[campo.name]}
        onChange={alterarCampo}
        disabled={modoFormulario === 'consulta'}
        required={campo.required}
        maxLength={campo.maxLength}
        min={campo.min}
        max={campo.max}
        step={campo.step}
        inputMode={campo.inputMode}
        pattern={campo.pattern}
        placeholder={campo.placeholder}
      />
    );
  }

  const camposNaoCheckbox = camposFormulario.filter((campo) => campo.type !== 'checkbox');
  const camposCheckbox = camposFormulario.filter((campo) => campo.type === 'checkbox');
  const registrosFiltrados = registros.filter((registro) => {
    if (!filtros.status) {
      return true;
    }

    return filtros.status === '1'
      ? Boolean(registro[statusField])
      : !Boolean(registro[statusField]);
  });

  return (
    <div className="camadaModal" role="presentation" onMouseDown={fecharAoClicarNoFundo}>
      <section
        className={`modalCliente ${classeModal}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`tituloModal${titulo}`}
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className="cabecalhoModalCliente">
          <h2 id={`tituloModal${titulo}`}>{titulo}</h2>

          <div className="acoesCabecalhoModalCliente">
            <Botao
              variante="secundario"
              type="button"
              icone="filtro"
              somenteIcone
              title="Filtros"
              aria-label="Filtros"
              onClick={() => definirModalFiltrosAberto(true)}
            >
              Filtro
            </Botao>
            <Botao
              variante="secundario"
              type="button"
              icone="fechar"
              somenteIcone
              title="Fechar"
              aria-label="Fechar"
              onClick={aoFechar}
            >
              Fechar
            </Botao>
            {!somenteConsulta ? (
              <Botao
                variante="primario"
                type="button"
                icone="adicionar"
                somenteIcone
                title={rotuloIncluir}
                aria-label={rotuloIncluir}
                onClick={abrirNovo}
              >
                {rotuloIncluir}
              </Botao>
            ) : null}
          </div>
        </header>

        <div className="corpoModalCliente corpoModalUsuarios corpoModalUsuariosConfiguracao">
          <section className="painelContatosModalCliente painelContatosConfiguracao">
            <div className="gradeContatosModal">
              <table className={`tabelaContatosModal tabelaCadastrosConfiguracao ${classeTabela}`.trim()}>
                <thead>
                  <tr>
                    <th>Codigo</th>
                    {colunas.map((coluna) => (
                      <th key={coluna.key}>{coluna.label}</th>
                    ))}
                    <th>Status</th>
                    <th className="cabecalhoAcoesContato">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosFiltrados.length > 0 ? (
                    registrosFiltrados.map((registro) => (
                      <tr key={registro[chavePrimaria]}>
                        <td>
                          <CodigoRegistro valor={registro[chavePrimaria]} />
                        </td>
                        {colunas.map((coluna) => (
                          <td key={coluna.key}>
                            {typeof coluna.render === 'function'
                              ? coluna.render(registro)
                              : registro[coluna.key]}
                          </td>
                        ))}
                        <td>
                          <span className={`etiquetaStatus ${registro[statusField] ? 'ativo' : 'inativo'}`}>
                            {registro[statusField] ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="celulaAcoesUsuarios">
                          <div className="acoesContatoModal">
                            {exibirConsulta || somenteConsulta ? (
                              <BotaoAcaoGrade icone="consultar" titulo={`Consultar ${titulo.toLowerCase()}`} onClick={() => abrirConsulta(registro)} />
                            ) : null}
                            {!somenteConsulta ? (
                              <BotaoAcaoGrade
                                icone="editar"
                                titulo={podeEditarRegistro(registro) ? `Editar ${titulo.toLowerCase()}` : 'Registro critico do sistema'}
                                onClick={() => abrirEdicao(registro)}
                                disabled={!podeEditarRegistro(registro)}
                              />
                            ) : null}
                            {!somenteConsulta ? (
                              <BotaoAcaoGrade
                                icone="inativar"
                                titulo={podeInativarRegistro(registro) ? `Inativar ${titulo.toLowerCase()}` : 'Registro critico do sistema'}
                                onClick={() => aoInativar(registro)}
                                disabled={!podeInativarRegistro(registro)}
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={colunas.length + 3} className="mensagemTabelaContatosModal">
                        Nenhum registro encontrado para o filtro atual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <ModalFiltros
          aberto={modalFiltrosAberto}
          titulo={`Filtros de ${titulo.toLowerCase()}`}
          filtros={filtros}
          campos={[
            {
              name: 'status',
              label: 'Ativo',
              options: [
                { valor: '1', label: 'Ativos' },
                { valor: '0', label: 'Inativos' }
              ]
            }
          ]}
          aoFechar={() => definirModalFiltrosAberto(false)}
          aoAplicar={(proximosFiltros) => {
            definirFiltros(proximosFiltros);
            definirModalFiltrosAberto(false);
          }}
          aoLimpar={() => definirFiltros(criarFiltrosIniciaisConfiguracao())}
        />

        {modalFormularioAberto ? (
          <div className="camadaModalContato" role="presentation" onMouseDown={fecharFormularioNoFundo}>
            <form
              className={`modalContatoCliente ${classeModalFormulario}`.trim()}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`tituloFormulario${titulo}`}
              onMouseDown={(evento) => evento.stopPropagation()}
              onSubmit={submeterFormulario}
            >
              <div className="cabecalhoModalContato">
                <h3 id={`tituloFormulario${titulo}`}>
                  {modoFormulario === 'consulta'
                    ? `Consultar ${titulo.toLowerCase()}`
                    : modoFormulario === 'edicao'
                      ? `Editar ${titulo.toLowerCase()}`
                      : `Incluir ${titulo.toLowerCase()}`}
                </h3>
                <div className="acoesFormularioContatoModal">
                  <Botao variante="secundario" type="button" onClick={fecharFormulario} disabled={salvando}>
                    {modoFormulario === 'consulta' ? 'Fechar' : 'Cancelar'}
                  </Botao>
                  {modoFormulario !== 'consulta' ? (
                    <Botao variante="primario" type="submit" disabled={salvando}>
                      {salvando ? 'Salvando...' : 'Salvar'}
                    </Botao>
                  ) : null}
                </div>
              </div>

              <div className="corpoModalContato">
                <div className={`gradeCamposModalCliente ${classeFormulario}`.trim()}>
                  {(agruparCheckboxes ? camposNaoCheckbox : camposFormulario).map(renderizarCampo)}
                </div>

                {agruparCheckboxes && camposCheckbox.length > 0 ? (
                  <div className={`grupoCheckboxesFormulario ${classeGrupoCheckboxes}`.trim()}>
                    {camposCheckbox.map(renderizarCampo)}
                  </div>
                ) : null}
              </div>

              {mensagemErro ? <p className="mensagemErroFormulario">{mensagemErro}</p> : null}
            </form>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function criarFiltrosIniciaisConfiguracao() {
  return {
    status: '1'
  };
}

function CampoFormulario({ label, name, type = 'text', className = '', ...props }) {
  if (type === 'textarea') {
    return (
      <div className={`campoFormulario campoFormularioIntegral ${className}`.trim()}>
        <label htmlFor={name}>{label}</label>
        <textarea
          id={name}
          name={name}
          className="entradaFormulario entradaFormularioTextoLongo"
          rows={6}
          {...props}
        />
      </div>
    );
  }

  return (
    <div className={`campoFormulario ${className}`.trim()}>
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
        {options.map((option) => (
          <option key={option.valor} value={option.valor}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function criarFormularioVazio(camposFormulario) {
  return camposFormulario.reduce((acumulador, campo) => ({
    ...acumulador,
    [campo.name]: campo.type === 'checkbox'
      ? Boolean(campo.defaultValue ?? true)
      : String(campo.defaultValue ?? '')
  }), {});
}

function criarFormularioRegistro(registro, camposFormulario) {
  return camposFormulario.reduce((acumulador, campo) => ({
    ...acumulador,
    [campo.name]: campo.type === 'checkbox'
      ? Boolean(registro[campo.name])
      : String(registro[campo.name] ?? '')
  }), {});
}
