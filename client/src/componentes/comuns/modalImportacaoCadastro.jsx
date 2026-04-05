import { useEffect, useMemo, useRef, useState } from 'react';
import { Botao } from './botao';
import { GradePadrao } from './gradePadrao';
import { baixarModeloImportacao, lerArquivoImportacao, obterConfiguracaoImportacaoCadastro } from '../../utilitarios/importacaoCadastros';
import { ModalGruposProduto } from '../../paginas/configuracoes/modalGruposProduto';
import { ModalMarcas } from '../../paginas/configuracoes/modalMarcas';
import { ModalUnidadesMedida } from '../../paginas/configuracoes/modalUnidadesMedida';
import '../../recursos/estilos/modalImportacaoCadastro.css';

export function ModalImportacaoCadastro({
  aberto,
  tipo,
  carregando = false,
  resultado = null,
  referenciasRelacionais = {},
  cadastrosRelacionais = {},
  onFechar,
  onImportar
}) {
  const configuracao = useMemo(() => obterConfiguracaoImportacaoCadastro(tipo), [tipo]);
  const campoArquivo = useRef(null);
  const [arquivoSelecionado, definirArquivoSelecionado] = useState(null);
  const [carregandoArquivo, definirCarregandoArquivo] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [correcoesPendencias, definirCorrecoesPendencias] = useState({});
  const [cadastroRelacionalAberto, definirCadastroRelacionalAberto] = useState(null);
  const bloqueado = carregando || carregandoArquivo;
  const pendenciasRelacionais = useMemo(() => montarPendenciasRelacionais(resultado, referenciasRelacionais), [resultado, referenciasRelacionais]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    function tratarTecla(evento) {
      if (evento.key === 'Escape') {
        fecharModal();
      }
    }

    window.addEventListener('keydown', tratarTecla);

    return () => {
      window.removeEventListener('keydown', tratarTecla);
    };
  }, [aberto, bloqueado]);

  useEffect(() => {
    definirCorrecoesPendencias((estadoAtual) => combinarCorrecoesPendencias(estadoAtual, pendenciasRelacionais));
  }, [pendenciasRelacionais]);

  if (!aberto || !configuracao) {
    return null;
  }

  async function processarImportacao() {
    try {
      definirMensagemErro('');
      definirCarregandoArquivo(true);
      const linhas = await lerArquivoImportacao(tipo, arquivoSelecionado);
      await onImportar?.(linhas);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel processar a planilha.');
    } finally {
      definirCarregandoArquivo(false);
    }
  }

  async function processarDownloadModelo() {
    try {
      definirMensagemErro('');
      definirCarregandoArquivo(true);
      await baixarModeloImportacao(tipo);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel gerar o modelo de importacao.');
    } finally {
      definirCarregandoArquivo(false);
    }
  }

  function selecionarArquivo(evento) {
    definirArquivoSelecionado(evento.target.files?.[0] || null);
    definirMensagemErro('');
  }

  function alterarCorrecaoPendencia(chave, valor) {
    definirCorrecoesPendencias((estadoAtual) => ({
      ...estadoAtual,
      [chave]: valor
    }));
  }

  function abrirCadastroRelacional(pendencia) {
    const configuracaoCadastro = cadastrosRelacionais?.[pendencia.campo];

    if (!configuracaoCadastro || configuracaoCadastro.somenteConsulta) {
      return;
    }

    definirCadastroRelacionalAberto({
      campo: pendencia.campo,
      chavePendencia: pendencia.chave
    });
  }

  function fecharCadastroRelacional() {
    definirCadastroRelacionalAberto(null);
  }

  async function selecionarCadastroRelacional(campo, registroSelecionado) {
    if (!registroSelecionado) {
      return;
    }

    const valorSelecionado = obterValorCadastroRelacional(campo, registroSelecionado);

    if (valorSelecionado) {
      alterarCorrecaoPendencia(cadastroRelacionalAberto?.chavePendencia, valorSelecionado);
    }

    fecharCadastroRelacional();
  }

  async function reprocessarPendenciasRelacionais() {
    const linhasCorrigidas = [];
    const chavesPendentesObrigatorias = pendenciasRelacionais
      .filter((pendencia) => pendencia.obrigatorio)
      .filter((pendencia) => !correcoesPendencias[pendencia.chave]);

    if (chavesPendentesObrigatorias.length > 0) {
      definirMensagemErro('Selecione uma opcao existente para todas as pendencias obrigatorias antes de reprocessar.');
      return;
    }

    const rejeitadosComPendencia = Array.isArray(resultado?.rejeitados)
      ? resultado.rejeitados.filter((item) => Array.isArray(item.pendenciasReferencias) && item.pendenciasReferencias.length > 0)
      : [];

    rejeitadosComPendencia.forEach((item) => {
      const dadosLinha = { ...(item.dados || {}) };

      item.pendenciasReferencias.forEach((pendencia) => {
        const chavePendencia = criarChavePendencia(item.linha, pendencia.campo);
        const valorSelecionado = correcoesPendencias[chavePendencia] || '';

        if (valorSelecionado === VALOR_LIMPAR_REFERENCIA) {
          dadosLinha[pendencia.campo] = '';
          return;
        }

        if (valorSelecionado) {
          dadosLinha[pendencia.campo] = valorSelecionado;
        }
      });

      linhasCorrigidas.push(dadosLinha);
    });

    if (linhasCorrigidas.length === 0) {
      definirMensagemErro('Nao ha pendencias de relacionamento disponiveis para reprocessar.');
      return;
    }

    try {
      definirMensagemErro('');
      await onImportar?.(linhasCorrigidas);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel reprocessar as pendencias de relacionamento.');
    }
  }

  function fecharModal() {
    if (bloqueado) {
      return;
    }

    definirMensagemErro('');
    definirArquivoSelecionado(null);
    if (campoArquivo.current) {
      campoArquivo.current.value = '';
    }
    onFechar?.();
  }

  return (
    <div className="camadaModalContato" role="presentation" onMouseDown={fecharModal}>
      <div
        className="modalContatoCliente modalImportacaoCadastro"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`tituloImportacao${configuracao.tipo}`}
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <div className="cabecalhoModalContato modalImportacaoCadastroCabecalho">
          <div>
            <h3 id={`tituloImportacao${configuracao.tipo}`}>{configuracao.titulo}</h3>
            <p>Baixe o modelo, preencha a aba principal e importe a planilha para validar e incluir os registros em lote.</p>
          </div>

          <div className="acoesFormularioContatoModal">
            <Botao variante="secundario" type="button" onClick={fecharModal} disabled={carregando}>
              Fechar
            </Botao>
          </div>
        </div>

        <div className="corpoModalContato modalImportacaoCadastroCorpo">
          <section className="modalImportacaoCadastroBloco">
            <div className="modalImportacaoCadastroAcoes">
              <Botao variante="secundario" type="button" icone="importar" onClick={processarDownloadModelo} disabled={bloqueado}>
                {carregandoArquivo ? 'Preparando...' : 'Baixar modelo'}
              </Botao>
              <input
                ref={campoArquivo}
                className="modalImportacaoCadastroCampoArquivo"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={selecionarArquivo}
              />
              <Botao variante="secundario" type="button" icone="upload" onClick={() => campoArquivo.current?.click()} disabled={bloqueado}>
                Selecionar planilha
              </Botao>
              <Botao variante="primario" type="button" icone="confirmar" onClick={processarImportacao} disabled={bloqueado || !arquivoSelecionado}>
                {carregando ? 'Importando...' : 'Importar'}
              </Botao>
            </div>

            <div className="modalImportacaoCadastroResumoArquivo">
              <strong>Arquivo selecionado:</strong>
              <span>{arquivoSelecionado?.name || 'Nenhum arquivo selecionado'}</span>
            </div>

            <ul className="modalImportacaoCadastroListaOrientacoes">
              <li>O arquivo de exemplo ja traz a aba de instrucoes com obrigatoriedades, tipo de dado e limite de caracteres.</li>
              <li>Linhas rejeitadas aparecem abaixo com o motivo exato para correção.</li>
              <li>O importador ignora linhas totalmente vazias da aba principal.</li>
              <li>Quando uma chave de outra tabela nao for encontrada, voce pode escolher um registro existente no grid de pendencias e reprocessar apenas essas linhas.</li>
            </ul>

            {mensagemErro ? <p className="mensagemErroFormulario">{mensagemErro}</p> : null}
          </section>

          {resultado ? (
            <section className="modalImportacaoCadastroBloco">
              <div className="modalImportacaoCadastroIndicadores">
                <article className="modalImportacaoCadastroIndicador">
                  <strong>{resultado.totalRecebido || 0}</strong>
                  <span>Linhas lidas</span>
                </article>
                <article className="modalImportacaoCadastroIndicador sucesso">
                  <strong>{resultado.importados || 0}</strong>
                  <span>Importadas</span>
                </article>
                <article className="modalImportacaoCadastroIndicador erro">
                  <strong>{resultado.rejeitados?.length || 0}</strong>
                  <span>Rejeitadas</span>
                </article>
              </div>

              {resultado.rejeitados?.length ? (
                <GradePadrao
                  className="gradeContatosModal modalImportacaoCadastroGrade"
                  classNameTabela="tabelaContatosModal modalImportacaoCadastroTabela"
                  colGroup={(
                    <colgroup>
                      <col className="modalImportacaoCadastroColLinha" />
                      <col className="modalImportacaoCadastroColIdentificacao" />
                      <col className="modalImportacaoCadastroColMotivos" />
                    </colgroup>
                  )}
                  cabecalho={(
                    <tr>
                      <th>Linha</th>
                      <th>Identificacao</th>
                      <th>Motivos</th>
                    </tr>
                  )}
                  temItens={resultado.rejeitados.length > 0}
                >
                  {resultado.rejeitados.map((item) => (
                    <tr key={`${item.linha}-${item.identificador}`}>
                      <td>{item.linha}</td>
                      <td>{item.identificador || '-'}</td>
                      <td>{Array.isArray(item.motivos) ? item.motivos.join(' | ') : item.motivo || '-'}</td>
                    </tr>
                  ))}
                </GradePadrao>
              ) : (
                <p className="modalImportacaoCadastroSucesso">Nenhuma linha rejeitada nesta importacao.</p>
              )}
            </section>
          ) : null}

          {pendenciasRelacionais.length ? (
            <section className="modalImportacaoCadastroBloco">
              <div className="modalImportacaoCadastroPendenciasCabecalho">
                <div>
                  <h4>Pendencias de relacionamentos</h4>
                  <p>Escolha um registro existente para cada chave pendente e reprocese somente as linhas rejeitadas por esse motivo.</p>
                </div>

                <Botao variante="primario" type="button" icone="confirmar" onClick={reprocessarPendenciasRelacionais} disabled={bloqueado}>
                  Reprocessar pendencias
                </Botao>
              </div>

              <GradePadrao
                className="gradeContatosModal modalImportacaoCadastroGrade modalImportacaoCadastroGradePendencias"
                classNameTabela="tabelaContatosModal modalImportacaoCadastroTabela modalImportacaoCadastroTabelaPendencias"
                colGroup={(
                  <colgroup>
                    <col className="modalImportacaoCadastroColLinha" />
                    <col className="modalImportacaoCadastroColIdentificacao" />
                    <col className="modalImportacaoCadastroColCampo" />
                    <col className="modalImportacaoCadastroColInformado" />
                    <col className="modalImportacaoCadastroColEscolha" />
                  </colgroup>
                )}
                cabecalho={(
                  <tr>
                    <th>Linha</th>
                    <th>Identificacao</th>
                    <th>Campo</th>
                    <th>Informado</th>
                    <th>Escolher existente</th>
                  </tr>
                )}
                temItens={pendenciasRelacionais.length > 0}
              >
                {pendenciasRelacionais.map((pendencia) => {
                  const valorSelecionado = correcoesPendencias[pendencia.chave] || '';

                  return (
                    <tr key={pendencia.chave}>
                      <td>{pendencia.linha}</td>
                      <td>{pendencia.identificador || '-'}</td>
                      <td>{pendencia.rotulo}</td>
                      <td>{pendencia.valorInformado || '-'}</td>
                      <td>
                        <div className="campoSelectComAcao temAcao">
                          <select
                            className="entradaFormulario modalImportacaoCadastroSelect"
                            value={valorSelecionado}
                            onChange={(evento) => alterarCorrecaoPendencia(pendencia.chave, evento.target.value)}
                            disabled={bloqueado}
                          >
                            <option value="">{pendencia.obrigatorio ? 'Selecione uma opcao' : 'Selecione ou remova o vinculo'}</option>
                            {!pendencia.obrigatorio ? <option value={VALOR_LIMPAR_REFERENCIA}>Nao vincular</option> : null}
                            {pendencia.opcoes.map((opcao) => (
                              <option key={`${pendencia.chave}-${opcao.valor}`} value={opcao.valor}>
                                {opcao.label}
                              </option>
                            ))}
                          </select>
                          {cadastrosRelacionais?.[pendencia.campo] && !cadastrosRelacionais?.[pendencia.campo]?.somenteConsulta ? (
                            <Botao
                              variante="secundario"
                              type="button"
                              icone="pesquisa"
                              className="botaoCampoAcao"
                              onClick={() => abrirCadastroRelacional(pendencia)}
                              somenteIcone
                              title={cadastrosRelacionais?.[pendencia.campo]?.tituloBotao || `Abrir cadastro de ${pendencia.rotulo}`}
                              aria-label={cadastrosRelacionais?.[pendencia.campo]?.tituloBotao || `Abrir cadastro de ${pendencia.rotulo}`}
                              disabled={bloqueado}
                            >
                              Abrir cadastro
                            </Botao>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </GradePadrao>
            </section>
          ) : null}
        </div>

        {renderizarCadastroRelacional({
          cadastroRelacionalAberto,
          cadastrosRelacionais,
          aoFechar: fecharCadastroRelacional,
          aoSelecionar: selecionarCadastroRelacional
        })}
      </div>
    </div>
  );
}

const VALOR_LIMPAR_REFERENCIA = '__LIMPAR_REFERENCIA__';

function montarPendenciasRelacionais(resultado, referenciasRelacionais) {
  if (!Array.isArray(resultado?.rejeitados)) {
    return [];
  }

  return resultado.rejeitados.flatMap((item) => {
    const pendencias = Array.isArray(item.pendenciasReferencias) ? item.pendenciasReferencias : [];

    return pendencias.map((pendencia) => {
      const configuracao = referenciasRelacionais?.[pendencia.campo] || {};
      return {
        chave: criarChavePendencia(item.linha, pendencia.campo),
        linha: item.linha,
        identificador: item.identificador,
        campo: pendencia.campo,
        rotulo: pendencia.rotulo,
        valorInformado: pendencia.valorInformado,
        obrigatorio: Boolean(pendencia.obrigatorio),
        opcoes: Array.isArray(configuracao.opcoes) ? configuracao.opcoes : []
      };
    });
  });
}

function criarEstadoInicialPendencias(pendenciasRelacionais) {
  return pendenciasRelacionais.reduce((acumulador, pendencia) => {
    acumulador[pendencia.chave] = '';
    return acumulador;
  }, {});
}

function combinarCorrecoesPendencias(correcoesAtuais, pendenciasRelacionais) {
  return pendenciasRelacionais.reduce((acumulador, pendencia) => {
    acumulador[pendencia.chave] = correcoesAtuais?.[pendencia.chave] || '';
    return acumulador;
  }, {});
}

function obterValorCadastroRelacional(campo, registroSelecionado) {
  if (campo === 'grupoProduto' || campo === 'marca' || campo === 'unidadeMedida') {
    return String(registroSelecionado?.descricao || '').trim();
  }

  return '';
}

function renderizarCadastroRelacional({ cadastroRelacionalAberto, cadastrosRelacionais, aoFechar, aoSelecionar }) {
  const configuracaoCadastro = cadastroRelacionalAberto
    ? cadastrosRelacionais?.[cadastroRelacionalAberto.campo]
    : null;

  if (!cadastroRelacionalAberto || !configuracaoCadastro) {
    return null;
  }

  if (cadastroRelacionalAberto.campo === 'grupoProduto') {
    return (
      <ModalGruposProduto
        aberto
        registros={configuracaoCadastro.registros || []}
        somenteConsulta={Boolean(configuracaoCadastro.somenteConsulta)}
        fecharAoSalvar
        aoFechar={aoFechar}
        aoSalvar={configuracaoCadastro.aoSalvar}
        aoInativar={configuracaoCadastro.aoInativar}
        aoSelecionarGrupo={(registroSelecionado) => aoSelecionar('grupoProduto', registroSelecionado)}
      />
    );
  }

  if (cadastroRelacionalAberto.campo === 'marca') {
    return (
      <ModalMarcas
        aberto
        registros={configuracaoCadastro.registros || []}
        somenteConsulta={Boolean(configuracaoCadastro.somenteConsulta)}
        fecharAoSalvar
        aoFechar={aoFechar}
        aoSalvar={configuracaoCadastro.aoSalvar}
        aoInativar={configuracaoCadastro.aoInativar}
        aoSelecionarMarca={(registroSelecionado) => aoSelecionar('marca', registroSelecionado)}
      />
    );
  }

  if (cadastroRelacionalAberto.campo === 'unidadeMedida') {
    return (
      <ModalUnidadesMedida
        aberto
        registros={configuracaoCadastro.registros || []}
        somenteConsulta={Boolean(configuracaoCadastro.somenteConsulta)}
        fecharAoSalvar
        aoFechar={aoFechar}
        aoSalvar={configuracaoCadastro.aoSalvar}
        aoInativar={configuracaoCadastro.aoInativar}
        aoSelecionarUnidade={(registroSelecionado) => aoSelecionar('unidadeMedida', registroSelecionado)}
      />
    );
  }

  return null;
}

function criarChavePendencia(linha, campo) {
  return `${linha}-${campo}`;
}
