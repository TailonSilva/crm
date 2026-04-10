import '../../../recursos/estilos/secaoGraficosDuplosInicio.css';
import { IconeAjudaSessaoInicio } from './iconeAjudaSessaoInicio';
import { TooltipExplicacaoInicio } from './tooltipExplicacaoInicio';

export function SecaoGraficosDuplosInicio({
  titulo,
  subtitulo,
  classNamePainel = '',
  itens = [],
  mensagemVazia = 'Nenhum dado disponivel.',
  tituloValor = 'Valor',
  tituloQuantidade = 'Quantidade',
  obterChave,
  obterRotulo,
  obterValorTexto,
  obterValorPercentual,
  obterQuantidadeTexto,
  obterQuantidadePercentual,
  obterCorValor,
  obterCorQuantidade,
  obterAjuda,
  varianteValor = '',
  ajudaSecao = null,
  acoesCabecalho = null,
  colunasPainel = 4,
  modoExibicao = 'duplo'
}) {
  const classesPainel = ['paginaInicioPainel', `paginaInicioPainelSpan${colunasPainel}`, classNamePainel]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classesPainel}>
      <div className="paginaInicioPainelCabecalho">
        <div>
          <h3>{titulo}</h3>
          {subtitulo ? <p>{subtitulo}</p> : null}
        </div>
        <div className="paginaInicioPainelCabecalhoAcoes">
          {acoesCabecalho}
          <IconeAjudaSessaoInicio
            titulo={titulo}
            ajuda={ajudaSecao || { composicao: subtitulo }}
          />
        </div>
      </div>

      {Array.isArray(itens) && itens.length > 0 ? (
        modoExibicao === 'lista' ? (
          <div className="paginaInicioGraficoListaSimples">
            <div className="paginaInicioGraficoListaSimplesCabecalho">
              <span />
              <strong>{`${tituloValor} | ${tituloQuantidade}`}</strong>
            </div>

            <div className="paginaInicioGraficoBarraLista">
              {itens.map((item, indice) => (
                <article
                  key={`${obterChave?.(item) ?? indice}-lista`}
                  className="paginaInicioGraficoBarraItem"
                  tabIndex={0}
                >
                  <div className="paginaInicioGraficoBarraCabecalho paginaInicioGraficoBarraCabecalhoLista">
                    <span>{obterRotulo?.(item) || '-'}</span>
                    <strong>{`${obterValorTexto?.(item) || '-'} | ${obterQuantidadeTexto?.(item) || '-'}`}</strong>
                  </div>
                  <div className={`paginaInicioGraficoBarraTrilha ${varianteValor ? `paginaInicioGraficoBarraTrilha${varianteValor}` : ''}`.trim()}>
                    <span
                      style={{
                        width: `${obterValorPercentual?.(item) || 0}%`,
                        ...(obterCorValor?.(item) ? { background: obterCorValor(item) } : {})
                      }}
                    />
                  </div>
                  <TooltipExplicacaoInicio titulo={obterRotulo?.(item) || titulo} ajuda={obterAjuda?.(item)} />
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="paginaInicioSessaoGraficos">
            <article className="paginaInicioGraficoBloco">
              <div className="paginaInicioGraficoBlocoCabecalho">
                <h4>{tituloValor}</h4>
              </div>

              <div className="paginaInicioGraficoBarraLista">
                {itens.map((item, indice) => (
                  <article
                    key={`${obterChave?.(item) ?? indice}-valor`}
                    className="paginaInicioGraficoBarraItem"
                    tabIndex={0}
                  >
                    <div className="paginaInicioGraficoBarraCabecalho">
                      <span>{obterRotulo?.(item) || '-'}</span>
                      <strong>{obterValorTexto?.(item) || '-'}</strong>
                    </div>
                    <div className={`paginaInicioGraficoBarraTrilha ${varianteValor ? `paginaInicioGraficoBarraTrilha${varianteValor}` : ''}`.trim()}>
                      <span
                        style={{
                          width: `${obterValorPercentual?.(item) || 0}%`,
                          ...(obterCorValor?.(item) ? { background: obterCorValor(item) } : {})
                        }}
                      />
                    </div>
                    <TooltipExplicacaoInicio titulo={obterRotulo?.(item) || titulo} ajuda={obterAjuda?.(item)} />
                  </article>
                ))}
              </div>
            </article>

            <article className="paginaInicioGraficoBloco">
              <div className="paginaInicioGraficoBlocoCabecalho">
                <h4>{tituloQuantidade}</h4>
              </div>

              <div className="paginaInicioGraficoBarraLista">
                {itens.map((item, indice) => (
                  <article
                    key={`${obterChave?.(item) ?? indice}-quantidade`}
                    className="paginaInicioGraficoBarraItem"
                    tabIndex={0}
                  >
                    <div className="paginaInicioGraficoBarraCabecalho">
                      <span>{obterRotulo?.(item) || '-'}</span>
                      <strong>{obterQuantidadeTexto?.(item) || '-'}</strong>
                    </div>
                    <div className="paginaInicioGraficoBarraTrilha">
                      <span
                        style={{
                          width: `${obterQuantidadePercentual?.(item) || 0}%`,
                          ...(obterCorQuantidade?.(item) ? { background: obterCorQuantidade(item) } : {})
                        }}
                      />
                    </div>
                    <TooltipExplicacaoInicio titulo={obterRotulo?.(item) || titulo} ajuda={obterAjuda?.(item)} />
                  </article>
                ))}
              </div>
            </article>
          </div>
        )
      ) : (
        <p className="paginaInicioPainelMensagem">{mensagemVazia}</p>
      )}
    </section>
  );
}
