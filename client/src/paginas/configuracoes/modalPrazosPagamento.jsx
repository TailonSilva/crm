import { useEffect, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { BotaoAcaoGrade } from '../../componentes/comuns/botaoAcaoGrade';
import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';
import { GradePadrao } from '../../componentes/comuns/gradePadrao';
import { ModalFiltros } from '../../componentes/comuns/modalFiltros';
import { normalizarValorEntradaFormulario } from '../../utilitarios/normalizarTextoFormulario';
import { registroEstaAtivo } from '../../utilitarios/statusRegistro';

const estadoInicialFormulario = {
  descricao: '',
  idMetodoPagamento: '',
  prazo1: '',
  prazo2: '',
  prazo3: '',
  prazo4: '',
  prazo5: '',
  prazo6: '',
  status: true
};

const chavesPrazos = ['prazo1', 'prazo2', 'prazo3', 'prazo4', 'prazo5', 'prazo6'];

export function ModalPrazosPagamento({
  aberto,
  prazosPagamento,
  metodosPagamento,
  somenteConsulta = false,
  fecharAoSalvar = false,
  aoFechar,
  aoSalvar,
  aoInativar,
  aoSelecionarPrazo
}) {
  const [modalFormularioAberto, definirModalFormularioAberto] = useState(false);
  const [modoFormulario, definirModoFormulario] = useState('novo');
  const [prazoSelecionado, definirPrazoSelecionado] = useState(null);
  const [formulario, definirFormulario] = useState(estadoInicialFormulario);
  const [salvando, definirSalvando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [modalFiltrosAberto, definirModalFiltrosAberto] = useState(false);
  const [filtros, definirFiltros] = useState(criarFiltrosIniciaisPrazos());
  const prazosFiltrados = prazosPagamento.filter((prazo) => {
    if (!filtros.status) {
      return true;
    }

    return filtros.status === '1' ? registroEstaAtivo(prazo.status) : !registroEstaAtivo(prazo.status);
  });

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirModalFormularioAberto(false);
    definirModoFormulario('novo');
    definirPrazoSelecionado(null);
    definirFormulario(estadoInicialFormulario);
    definirSalvando(false);
    definirMensagemErro('');
    definirModalFiltrosAberto(false);
    definirFiltros(criarFiltrosIniciaisPrazos());
  }, [aberto]);

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
    definirPrazoSelecionado(null);
    definirFormulario(estadoInicialFormulario);
    definirModoFormulario('novo');
    definirMensagemErro('');
    definirModalFormularioAberto(true);
  }

  function abrirEdicao(prazo) {
    definirPrazoSelecionado(prazo);
    definirFormulario(criarFormularioPrazo(prazo));
    definirModoFormulario('edicao');
    definirMensagemErro('');
    definirModalFormularioAberto(true);
  }

  function abrirConsulta(prazo) {
    definirPrazoSelecionado(prazo);
    definirFormulario(criarFormularioPrazo(prazo));
    definirModoFormulario('consulta');
    definirMensagemErro('');
    definirModalFormularioAberto(true);
  }

  function fecharFormulario() {
    definirModalFormularioAberto(false);
    definirPrazoSelecionado(null);
    definirModoFormulario('novo');
    definirFormulario(estadoInicialFormulario);
    definirMensagemErro('');
    definirSalvando(false);
  }

  function alterarCampo(evento) {
    const { name, value, type, checked } = evento.target;
    const valorNormalizado = normalizarValorEntradaFormulario(evento);

    definirFormulario((estadoAtual) => {
      const proximoFormulario = {
        ...estadoAtual,
        [name]: type === 'checkbox' ? checked : valorNormalizado
      };

      return {
        ...proximoFormulario,
        descricao: montarDescricaoPrazo(proximoFormulario, metodosPagamento)
      };
    });
  }

  async function submeterFormulario(evento) {
    evento.preventDefault();

    if (modoFormulario === 'consulta') {
      return;
    }

    if (!formulario.idMetodoPagamento) {
      definirMensagemErro('Selecione o metodo de pagamento.');
      return;
    }

    const prazosNumericos = obterPrazosNumericos(formulario);

    if (prazosNumericos.some((prazo) => prazo <= 0)) {
      definirMensagemErro('Os prazos devem ser numeros inteiros positivos.');
      return;
    }

    for (let indice = 1; indice < prazosNumericos.length; indice += 1) {
      if (prazosNumericos[indice] <= prazosNumericos[indice - 1]) {
        definirMensagemErro('Os prazos devem estar em ordem crescente.');
        return;
      }
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      const registroSalvo = await aoSalvar({
        idPrazoPagamento: prazoSelecionado?.idPrazoPagamento,
        ...formulario
      });

      if (typeof aoSelecionarPrazo === 'function') {
        await aoSelecionarPrazo({
          ...registroSalvo,
          idPrazoPagamento: Number(registroSalvo?.idPrazoPagamento || prazoSelecionado?.idPrazoPagamento),
          idMetodoPagamento: Number(registroSalvo?.idMetodoPagamento || formulario.idMetodoPagamento),
          descricao: registroSalvo?.descricao || formulario.descricao,
          prazo1: registroSalvo?.prazo1 ?? formulario.prazo1,
          prazo2: registroSalvo?.prazo2 ?? formulario.prazo2,
          prazo3: registroSalvo?.prazo3 ?? formulario.prazo3,
          prazo4: registroSalvo?.prazo4 ?? formulario.prazo4,
          prazo5: registroSalvo?.prazo5 ?? formulario.prazo5,
          prazo6: registroSalvo?.prazo6 ?? formulario.prazo6,
          status: registroSalvo?.status ?? (formulario.status ? 1 : 0)
        });
      }

      if (fecharAoSalvar) {
        aoFechar();
        return;
      }

      fecharFormulario();
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel salvar o prazo de pagamento.');
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

  return (
    <div className="camadaModal" role="presentation" onMouseDown={fecharAoClicarNoFundo}>
      <section
        className="modalCliente"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalPrazosPagamento"
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className="cabecalhoModalCliente">
          <h2 id="tituloModalPrazosPagamento">Prazos de pagamento</h2>

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
                title="Incluir prazo"
                aria-label="Incluir prazo"
                onClick={abrirNovo}
              >
                Incluir prazo
              </Botao>
            ) : null}
          </div>
        </header>

        <div className="corpoModalCliente corpoModalUsuarios corpoModalUsuariosConfiguracao">
          <section className="painelContatosModalCliente painelContatosConfiguracao">
            <GradePadrao
              className="gradeContatosModal"
              classNameTabela="tabelaContatosModal tabelaCadastrosConfiguracao tabelaPrazosPagamento"
              classNameMensagem="mensagemTabelaContatosModal"
              cabecalho={(
                <tr>
                  <th>Codigo</th>
                  <th>Descricao</th>
                  <th>Metodo</th>
                  <th>Prazos</th>
                  <th>Status</th>
                  <th className="cabecalhoAcoesContato">Acoes</th>
                </tr>
              )}
              temItens={prazosFiltrados.length > 0}
              mensagemVazia="Nenhum prazo de pagamento encontrado para o filtro atual."
            >
              {prazosFiltrados.map((prazo) => (
                <tr key={prazo.idPrazoPagamento}>
                  <td>
                    <CodigoRegistro valor={prazo.idPrazoPagamento} />
                  </td>
                  <td>{prazo.descricao || 'Nao informado'}</td>
                  <td>{prazo.nomeMetodoPagamento || 'Nao informado'}</td>
                  <td>{montarResumoPrazos(prazo) || 'Nao informado'}</td>
                  <td>
                    <span className={`etiquetaStatus ${prazo.status ? 'ativo' : 'inativo'}`}>
                      {prazo.status ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="celulaAcoesUsuarios">
                    <div className="acoesContatoModal">
                      <BotaoAcaoGrade icone="consultar" titulo="Consultar prazo de pagamento" onClick={() => abrirConsulta(prazo)} />
                      {!somenteConsulta ? (
                        <BotaoAcaoGrade icone="editar" titulo="Editar prazo de pagamento" onClick={() => abrirEdicao(prazo)} />
                      ) : null}
                      {!somenteConsulta ? (
                        <BotaoAcaoGrade icone="inativar" titulo="Inativar prazo de pagamento" onClick={() => aoInativar(prazo)} />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </GradePadrao>
          </section>
        </div>

        <ModalFiltros
          aberto={modalFiltrosAberto}
          titulo="Filtros de prazos de pagamento"
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
          aoLimpar={() => definirFiltros(criarFiltrosIniciaisPrazos())}
        />

        {modalFormularioAberto ? (
          <div className="camadaModalContato" role="presentation" onMouseDown={fecharFormularioNoFundo}>
            <form
              className="modalContatoCliente"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tituloFormularioPrazoPagamento"
              onMouseDown={(evento) => evento.stopPropagation()}
              onSubmit={submeterFormulario}
            >
              <div className="cabecalhoModalContato">
                <h3 id="tituloFormularioPrazoPagamento">
                  {modoFormulario === 'consulta'
                    ? 'Consultar prazo de pagamento'
                    : modoFormulario === 'edicao'
                      ? 'Editar prazo de pagamento'
                      : 'Incluir prazo de pagamento'}
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
                <div className="gradeCamposModalCliente">
                  <CampoFormulario
                    label="Descricao"
                    name="descricao"
                    value={formulario.descricao}
                    readOnly
                    disabled
                  />
                  <CampoSelect
                    label="Metodo"
                    name="idMetodoPagamento"
                    value={formulario.idMetodoPagamento}
                    onChange={alterarCampo}
                    disabled={modoFormulario === 'consulta'}
                    required
                    options={metodosPagamento.map((metodo) => ({
                      valor: String(metodo.idMetodoPagamento),
                      label: metodo.descricao
                    }))}
                  />
                  <div className="campoFormulario campoFormularioIntegral">
                    <label>Dias</label>
                    <div className="linhaPrazosPagamento">
                      {chavesPrazos.map((chave, indice) => (
                        <input
                          key={chave}
                          id={chave}
                          name={chave}
                          type="number"
                          min="1"
                          step="1"
                          className="entradaFormulario"
                          placeholder={`${indice + 1}o`}
                          value={formulario[chave]}
                          onChange={alterarCampo}
                          disabled={modoFormulario === 'consulta'}
                        />
                      ))}
                    </div>
                  </div>
                  <label className="campoCheckboxFormulario" htmlFor="statusPrazoPagamento">
                    <input
                      id="statusPrazoPagamento"
                      type="checkbox"
                      name="status"
                      checked={Boolean(formulario.status)}
                      onChange={alterarCampo}
                      disabled={modoFormulario === 'consulta'}
                    />
                    <span>Registro ativo</span>
                  </label>
                </div>
              </div>

              {mensagemErro ? <p className="mensagemErroFormulario">{mensagemErro}</p> : null}
            </form>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function criarFiltrosIniciaisPrazos() {
  return {
    status: '1'
  };
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
        {options.map((option) => (
          <option key={option.valor} value={option.valor}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function criarFormularioPrazo(prazo) {
  if (!prazo) {
    return estadoInicialFormulario;
  }

  return {
    descricao: prazo.descricao || montarDescricaoPrazo(prazo, []),
    idMetodoPagamento: String(prazo.idMetodoPagamento || ''),
    prazo1: String(prazo.prazo1 || ''),
    prazo2: String(prazo.prazo2 || ''),
    prazo3: String(prazo.prazo3 || ''),
    prazo4: String(prazo.prazo4 || ''),
    prazo5: String(prazo.prazo5 || ''),
    prazo6: String(prazo.prazo6 || ''),
    status: Boolean(prazo.status)
  };
}

function obterPrazosNumericos(formulario) {
  return chavesPrazos
    .map((chave) => String(formulario[chave] || '').trim())
    .filter(Boolean)
    .map((valor) => Number(valor));
}

function montarResumoPrazos(prazo) {
  const prazos = chavesPrazos
    .map((chave) => prazo[chave])
    .filter((valor) => valor !== null && valor !== undefined && valor !== '');

  return prazos.length > 0 ? `${prazos.join(' / ')} dias` : '';
}

function obterDescricaoAutomatica(formulario) {
  const prazos = obterPrazosNumericos(formulario);
  return prazos.length > 0 ? `${prazos.join('/')} dias` : '';
}

function montarDescricaoPrazo(formulario, metodosPagamento) {
  const metodoSelecionado = metodosPagamento.find(
    (metodo) => String(metodo.idMetodoPagamento) === String(formulario.idMetodoPagamento || '')
  );
  const resumoPrazos = obterDescricaoAutomatica(formulario);

  if (metodoSelecionado && resumoPrazos) {
    return `${metodoSelecionado.descricao} - ${resumoPrazos}`;
  }

  if (metodoSelecionado) {
    return metodoSelecionado.descricao;
  }

  return resumoPrazos;
}
