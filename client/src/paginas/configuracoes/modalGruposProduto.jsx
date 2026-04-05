import { useEffect, useMemo, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { BotaoAcaoGrade } from '../../componentes/comuns/botaoAcaoGrade';
import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';
import { GradePadrao } from '../../componentes/comuns/gradePadrao';
import { ModalFiltros } from '../../componentes/comuns/modalFiltros';
import { normalizarValorEntradaFormulario } from '../../utilitarios/normalizarTextoFormulario';
import { registroEstaAtivo } from '../../utilitarios/statusRegistro';
import {
  atualizarGrupoProdutoTamanho,
  excluirGrupoProdutoTamanho,
  incluirGrupoProdutoTamanho,
  listarGruposProdutoTamanhosConfiguracao,
  listarTamanhosConfiguracao
} from '../../servicos/configuracoes';

export function ModalGruposProduto({
  aberto,
  registros,
  somenteConsulta = false,
  fecharAoSalvar = false,
  aoFechar,
  aoSalvar,
  aoInativar,
  aoSelecionarGrupo
}) {
  const [modalFormularioAberto, definirModalFormularioAberto] = useState(false);
  const [registroSelecionado, definirRegistroSelecionado] = useState(null);
  const [formulario, definirFormulario] = useState(criarFormularioGrupo());
  const [salvando, definirSalvando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [tamanhos, definirTamanhos] = useState([]);
  const [relacoesGrupoTamanho, definirRelacoesGrupoTamanho] = useState([]);
  const [carregandoAuxiliares, definirCarregandoAuxiliares] = useState(false);
  const [modalTamanhosAberto, definirModalTamanhosAberto] = useState(false);
  const [modalFiltrosAberto, definirModalFiltrosAberto] = useState(false);
  const [filtros, definirFiltros] = useState(criarFiltrosIniciaisGruposProduto());

  const tamanhosPorId = useMemo(
    () => new Map(tamanhos.map((tamanho) => [Number(tamanho.idTamanho), tamanho])),
    [tamanhos]
  );
  const registrosFiltrados = useMemo(() => registros.filter((registro) => {
    if (!filtros.status) {
      return true;
    }

    return filtros.status === '1' ? registroEstaAtivo(registro.status) : !registroEstaAtivo(registro.status);
  }), [registros, filtros.status]);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirModalFormularioAberto(false);
    definirRegistroSelecionado(null);
    definirFormulario(criarFormularioGrupo());
    definirSalvando(false);
    definirMensagemErro('');
    definirModalTamanhosAberto(false);
    definirModalFiltrosAberto(false);
    definirFiltros(criarFiltrosIniciaisGruposProduto());
    carregarAuxiliares();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    function tratarTecla(evento) {
      if (evento.key === 'Escape' && modalTamanhosAberto) {
        definirModalTamanhosAberto(false);
        return;
      }

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
  }, [aberto, aoFechar, modalFormularioAberto, modalTamanhosAberto, salvando]);

  if (!aberto) {
    return null;
  }

  async function carregarAuxiliares() {
    definirCarregandoAuxiliares(true);

    try {
      const [tamanhosCarregados, relacoesCarregadas] = await Promise.all([
        listarTamanhosConfiguracao({ incluirInativos: true }),
        listarGruposProdutoTamanhosConfiguracao({ incluirInativos: true })
      ]);

      definirTamanhos(tamanhosCarregados);
      definirRelacoesGrupoTamanho(relacoesCarregadas);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel carregar os tamanhos do grupo.');
    } finally {
      definirCarregandoAuxiliares(false);
    }
  }

  function abrirNovo() {
    definirRegistroSelecionado(null);
    definirFormulario(criarFormularioGrupo(null, tamanhos, relacoesGrupoTamanho));
    definirMensagemErro('');
    definirModalFormularioAberto(true);
  }

  function abrirEdicao(registro) {
    definirRegistroSelecionado(registro);
    definirFormulario(criarFormularioGrupo(registro, tamanhos, relacoesGrupoTamanho));
    definirMensagemErro('');
    definirModalFormularioAberto(true);
  }

  function fecharFormulario() {
    definirModalFormularioAberto(false);
    definirRegistroSelecionado(null);
    definirFormulario(criarFormularioGrupo());
    definirMensagemErro('');
    definirSalvando(false);
    definirModalTamanhosAberto(false);
  }

  function alterarCampo(evento) {
    const { name, value, type, checked } = evento.target;
    const valorNormalizado = normalizarValorEntradaFormulario(evento);

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      [name]: type === 'checkbox' ? checked : valorNormalizado
    }));
  }

  function alternarTamanho(idTamanho, ativo) {
    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      tamanhos: estadoAtual.tamanhos.map((tamanho) => {
        if (Number(tamanho.idTamanho) !== Number(idTamanho)) {
          return tamanho;
        }

        return {
          ...tamanho,
          ativo,
          ordem: ativo
            ? (tamanho.ordem || String(obterProximaOrdemTamanho(estadoAtual.tamanhos)))
            : ''
        };
      })
    }));
  }

  function alterarOrdemTamanho(idTamanho, ordem) {
    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      tamanhos: estadoAtual.tamanhos.map((tamanho) => (
        Number(tamanho.idTamanho) === Number(idTamanho)
          ? { ...tamanho, ordem }
          : tamanho
      ))
    }));
  }

  async function submeterFormulario(evento) {
    evento.preventDefault();

    if (!String(formulario.descricao || '').trim()) {
      definirMensagemErro('Informe a descricao.');
      return;
    }

    const tamanhosSelecionados = formulario.tamanhos.filter((tamanho) => tamanho.ativo);
    const ordensInvalidas = tamanhosSelecionados.some((tamanho) => !Number.isFinite(Number(tamanho.ordem)) || Number(tamanho.ordem) < 1);

    if (ordensInvalidas) {
      definirMensagemErro('Informe uma ordem valida para todos os tamanhos selecionados.');
      return;
    }

    const ordens = tamanhosSelecionados.map((tamanho) => Number(tamanho.ordem));
    if (new Set(ordens).size !== ordens.length) {
      definirMensagemErro('As ordens dos tamanhos selecionados nao podem se repetir.');
      return;
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      const grupoSalvo = await aoSalvar({
        idGrupo: registroSelecionado?.idGrupo,
        descricao: formulario.descricao,
        status: formulario.status
      });

      const idGrupo = Number(grupoSalvo?.idGrupo || registroSelecionado?.idGrupo);

      if (!idGrupo) {
        throw new Error('Nao foi possivel identificar o grupo salvo.');
      }

      await persistirTamanhosGrupo(idGrupo, formulario.tamanhos, relacoesGrupoTamanho);
      await carregarAuxiliares();

      if (typeof aoSelecionarGrupo === 'function') {
        await aoSelecionarGrupo({
          ...grupoSalvo,
          idGrupo,
          descricao: formulario.descricao,
          status: formulario.status ? 1 : 0
        });
      }

      if (fecharAoSalvar) {
        aoFechar();
        return;
      }

      fecharFormulario();
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel salvar o grupo de produto.');
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

  function fecharModalTamanhosNoFundo(evento) {
    if (evento.target === evento.currentTarget && !salvando) {
      definirModalTamanhosAberto(false);
    }
  }

  function obterResumoTamanhos(registro) {
    const itens = relacoesGrupoTamanho
      .filter((relacao) => Number(relacao.idGrupo) === Number(registro.idGrupo))
      .sort((relacaoA, relacaoB) => Number(relacaoA.ordem || 0) - Number(relacaoB.ordem || 0))
      .map((relacao) => tamanhosPorId.get(Number(relacao.idTamanho))?.descricao)
      .filter(Boolean);

    return itens.length > 0 ? itens.join(', ') : 'Nao usa Tamanhos';
  }

  return (
    <div className="camadaModal" role="presentation" onMouseDown={fecharAoClicarNoFundo}>
      <section
        className="modalCliente"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalGruposProduto"
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className="cabecalhoModalCliente">
          <h2 id="tituloModalGruposProduto">Grupos de Produto</h2>

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
            <Botao variante="secundario" type="button" icone="fechar" somenteIcone title="Fechar" aria-label="Fechar" onClick={aoFechar}>
              Fechar
            </Botao>
            {!somenteConsulta ? (
              <Botao
                variante="primario"
                type="button"
                icone="adicionar"
                somenteIcone
                title="Incluir grupo"
                aria-label="Incluir grupo"
                onClick={abrirNovo}
                disabled={carregandoAuxiliares}
              >
                Incluir grupo
              </Botao>
            ) : null}
          </div>
        </header>

        <div className="corpoModalCliente corpoModalUsuarios corpoModalUsuariosConfiguracao">
          <section className="painelContatosModalCliente painelContatosConfiguracao">
            <GradePadrao
              className="gradeContatosModal"
              classNameTabela="tabelaContatosModal tabelaCadastrosConfiguracao tabelaGruposProdutoConfiguracao"
              classNameMensagem="mensagemTabelaContatosModal"
              cabecalho={(
                <tr>
                  <th>Codigo</th>
                  <th>Descricao</th>
                  <th>Tamanhos</th>
                  <th>Status</th>
                  <th className="cabecalhoAcoesContato">Acoes</th>
                </tr>
              )}
              temItens={registrosFiltrados.length > 0}
              mensagemVazia="Nenhum grupo encontrado para o filtro atual."
            >
              {registrosFiltrados.map((registro) => (
                <tr key={registro.idGrupo}>
                  <td><CodigoRegistro valor={registro.idGrupo} /></td>
                  <td>{registro.descricao}</td>
                  <td>{obterResumoTamanhos(registro)}</td>
                  <td>
                    <span className={`etiquetaStatus ${registro.status ? 'ativo' : 'inativo'}`}>
                      {registro.status ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="celulaAcoesUsuarios">
                    <div className="acoesContatoModal">
                      {!somenteConsulta ? (
                        <BotaoAcaoGrade
                          icone="editar"
                          titulo="Editar grupos de produto"
                          onClick={() => abrirEdicao(registro)}
                          disabled={carregandoAuxiliares}
                        />
                      ) : null}
                      {!somenteConsulta ? (
                        <BotaoAcaoGrade icone="inativar" titulo="Inativar grupos de produto" onClick={() => aoInativar(registro)} />
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
          titulo="Filtros de grupos de produto"
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
          aoLimpar={() => definirFiltros(criarFiltrosIniciaisGruposProduto())}
        />

        {modalFormularioAberto ? (
          <div className="camadaModalContato" role="presentation" onMouseDown={fecharFormularioNoFundo}>
            <form
              className="modalContatoCliente modalGrupoProdutoTamanho"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tituloFormularioGrupoProduto"
              onMouseDown={(evento) => evento.stopPropagation()}
              onSubmit={submeterFormulario}
            >
              <div className="cabecalhoModalContato">
                <h3 id="tituloFormularioGrupoProduto">
                  {registroSelecionado ? 'Editar grupo de produto' : 'Incluir grupo de produto'}
                </h3>
                <div className="acoesFormularioContatoModal">
                  <Botao variante="secundario" type="button" onClick={fecharFormulario} disabled={salvando}>
                    Cancelar
                  </Botao>
                  <Botao variante="primario" type="submit" disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </Botao>
                </div>
              </div>

              <div className="corpoModalContato corpoModalGrupoProdutoTamanho">
                <div className="gradeCamposModalCliente gradeCamposGrupoProdutoTamanho">
                  <div className="campoFormulario campoFormulario-descricaoGrupoProduto">
                    <label htmlFor="descricaoGrupoProduto">Descricao</label>
                    <input
                      id="descricaoGrupoProduto"
                      name="descricao"
                      type="text"
                      className="entradaFormulario"
                      value={formulario.descricao}
                      onChange={alterarCampo}
                      disabled={somenteConsulta}
                      required
                    />
                  </div>
                  <div className="campoFormulario campoAcaoTamanhosGrupoProduto campoAcaoTamanhosGrupoProdutoSemTitulo">
                    <Botao
                      variante="secundario"
                      type="button"
                      onClick={() => definirModalTamanhosAberto(true)}
                      disabled={somenteConsulta || tamanhos.length === 0}
                    >
                      Tamanhos
                    </Botao>
                  </div>
                  <label className="campoCheckboxFormulario campoCheckbox-statusGrupoProduto" htmlFor="statusGrupoProduto">
                    <input
                      id="statusGrupoProduto"
                      type="checkbox"
                      name="status"
                      checked={Boolean(formulario.status)}
                      onChange={alterarCampo}
                      disabled={somenteConsulta}
                    />
                    <span>Registro ativo</span>
                  </label>
                </div>
              </div>

              {mensagemErro ? <p className="mensagemErroFormulario">{mensagemErro}</p> : null}

              {modalTamanhosAberto ? (
                <div className="camadaModalContato" role="presentation" onMouseDown={fecharModalTamanhosNoFundo}>
                  <section
                    className="modalContatoCliente modalSelecaoTamanhosGrupoProduto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="tituloSelecaoTamanhosGrupoProduto"
                    onMouseDown={(evento) => evento.stopPropagation()}
                  >
                    <div className="cabecalhoModalContato">
                      <h3 id="tituloSelecaoTamanhosGrupoProduto">Tamanhos do grupo</h3>
                      <div className="acoesFormularioContatoModal">
                        <Botao variante="primario" type="button" onClick={() => definirModalTamanhosAberto(false)}>
                          Concluir
                        </Botao>
                      </div>
                    </div>

                    <div className="corpoModalContato corpoModalSelecaoTamanhosGrupoProduto">
                      <p className="mensagemSemTamanhosGrupoProduto">Selecione os tamanhos e defina a ordem de exibicao.</p>

                      {tamanhos.length > 0 ? (
                        <div className="listaTamanhosGrupoProduto">
                          {tamanhos.map((tamanho) => {
                            const itemFormulario = formulario.tamanhos.find((item) => Number(item.idTamanho) === Number(tamanho.idTamanho));
                            const ativo = Boolean(itemFormulario?.ativo);

                            return (
                              <div key={tamanho.idTamanho} className="linhaTamanhoGrupoProduto linhaTamanhoGrupoProdutoHorizontal">
                                <label className="checkboxTamanhoGrupoProduto" htmlFor={`tamanhoGrupo${tamanho.idTamanho}`}>
                                  <input
                                    id={`tamanhoGrupo${tamanho.idTamanho}`}
                                    type="checkbox"
                                    checked={ativo}
                                    onChange={(evento) => alternarTamanho(tamanho.idTamanho, evento.target.checked)}
                                    disabled={somenteConsulta || (tamanho.status === 0 && !ativo)}
                                  />
                                  <span>{tamanho.descricao}</span>
                                </label>
                                <div className="campoOrdemTamanhoGrupoProduto">
                                  <label htmlFor={`ordemTamanhoGrupo${tamanho.idTamanho}`}>Ordem</label>
                                  <input
                                    id={`ordemTamanhoGrupo${tamanho.idTamanho}`}
                                    type="number"
                                    min="1"
                                    className="entradaFormulario"
                                    value={itemFormulario?.ordem || ''}
                                    onChange={(evento) => alterarOrdemTamanho(tamanho.idTamanho, evento.target.value)}
                                    disabled={!ativo || somenteConsulta}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mensagemSemTamanhosGrupoProduto">Cadastre tamanhos nas Configuracoes para vincula-los ao grupo.</p>
                      )}
                    </div>
                  </section>
                </div>
              ) : null}
            </form>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function criarFormularioGrupo(registro = null, tamanhos = [], relacoesGrupoTamanho = []) {
  const relacoesDoGrupo = relacoesGrupoTamanho.filter((relacao) => Number(relacao.idGrupo) === Number(registro?.idGrupo));
  const relacoesPorTamanho = new Map(
    relacoesDoGrupo.map((relacao) => [Number(relacao.idTamanho), relacao])
  );

  return {
    descricao: String(registro?.descricao || ''),
    status: registro ? Boolean(registro.status) : true,
    tamanhos: tamanhos.map((tamanho) => {
      const relacao = relacoesPorTamanho.get(Number(tamanho.idTamanho));
      return {
        idTamanho: Number(tamanho.idTamanho),
        ativo: Boolean(relacao),
        ordem: relacao?.ordem ? String(relacao.ordem) : ''
      };
    })
  };
}

function obterProximaOrdemTamanho(tamanhos) {
  const maiorOrdem = tamanhos.reduce((maior, tamanho) => {
    if (!tamanho.ativo) {
      return maior;
    }

    const ordem = Number(tamanho.ordem);
    return Number.isFinite(ordem) && ordem > maior ? ordem : maior;
  }, 0);

  return maiorOrdem + 1;
}

async function persistirTamanhosGrupo(idGrupo, tamanhosFormulario, relacoesGrupoTamanho) {
  const relacoesAtuais = relacoesGrupoTamanho.filter((relacao) => Number(relacao.idGrupo) === Number(idGrupo));
  const relacoesPorTamanho = new Map(
    relacoesAtuais.map((relacao) => [Number(relacao.idTamanho), relacao])
  );
  const tamanhosSelecionados = tamanhosFormulario.filter((tamanho) => tamanho.ativo);
  const tamanhosSelecionadosIds = new Set(tamanhosSelecionados.map((tamanho) => Number(tamanho.idTamanho)));

  for (const relacao of relacoesAtuais) {
    if (!tamanhosSelecionadosIds.has(Number(relacao.idTamanho))) {
      await excluirGrupoProdutoTamanho(relacao.idGrupoProdutoTamanho);
    }
  }

  for (const tamanho of tamanhosSelecionados) {
    const relacaoExistente = relacoesPorTamanho.get(Number(tamanho.idTamanho));
    const payload = {
      idGrupo: Number(idGrupo),
      idTamanho: Number(tamanho.idTamanho),
      ordem: Number(tamanho.ordem)
    };

    if (!relacaoExistente) {
      await incluirGrupoProdutoTamanho(payload);
      continue;
    }

    if (Number(relacaoExistente.ordem) !== Number(payload.ordem)) {
      await atualizarGrupoProdutoTamanho(relacaoExistente.idGrupoProdutoTamanho, payload);
    }
  }
}

function criarFiltrosIniciaisGruposProduto() {
  return {
    status: '1'
  };
}
