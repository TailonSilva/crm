import { useState } from 'react';
import { Botao } from '../../../componentes/comuns/botao';
import '../../../recursos/estilos/secaoRankingInicio.css';
import { IconeAjudaSessaoInicio } from './iconeAjudaSessaoInicio';
import { ModalResumoRelacionamentoInicio } from './modalResumoRelacionamentoInicio';
import { TooltipExplicacaoInicio } from './tooltipExplicacaoInicio';

export function SecaoRankingInicio({ titulo, descricao, itens }) {
  const [modalAberto, definirModalAberto] = useState(false);
  const itensExibidos = Array.isArray(itens) ? itens.slice(0, 5) : [];
  const exibirAcaoCompleta = Array.isArray(itens) && itens.length > 5;

  return (
    <>
      <section className="paginaInicioPainel paginaInicioPainelSpan2">
        <div className="paginaInicioPainelCabecalho">
          <div>
            <h3>{titulo}</h3>
            {descricao ? <p>{descricao}</p> : null}
          </div>
          <div className="paginaInicioPainelCabecalhoAcoes">
            {exibirAcaoCompleta ? (
              <Botao
                variante="secundario"
                icone="lista"
                somenteIcone
                className="paginaInicioAcaoSessao"
                aria-label={`Abrir lista completa de ${titulo.toLowerCase()}`}
                onClick={() => definirModalAberto(true)}
              />
            ) : null}
            <IconeAjudaSessaoInicio
              titulo={titulo}
              ajuda={{
                composicao: 'Ranking por valor liquido dos pedidos.',
                periodo: 'Mes corrente pela data de entrada do pedido.'
              }}
            />
          </div>
        </div>

        <div className="paginaInicioGraficoListaSimples">
          <div className="paginaInicioGraficoListaSimplesCabecalho">
            <span />
            <strong>Valor | Volume</strong>
          </div>

          <div className="paginaInicioGraficoBarraLista">
            {itensExibidos.length > 0 ? itensExibidos.map((item, indice) => (
              <article key={`${item.rotulo}-${indice}`} className="paginaInicioGraficoBarraItem" tabIndex={0}>
                <div className="paginaInicioGraficoBarraCabecalho paginaInicioGraficoBarraCabecalhoLista">
                  <span>{`${indice + 1}. ${item.rotulo}`}</span>
                  <strong>{`${item.valor} | ${item.descricao}`}</strong>
                </div>
                <div className="paginaInicioGraficoBarraTrilha">
                  <span style={{ width: `${item.percentual}%` }} />
                </div>
                <TooltipExplicacaoInicio titulo={item.rotulo} ajuda={item.ajuda} />
              </article>
            )) : (
              <p className="paginaInicioPainelMensagem">Sem movimentacao suficiente para ranking.</p>
            )}
          </div>
        </div>
      </section>

      <ModalResumoRelacionamentoInicio
        aberto={modalAberto}
        titulo={titulo}
        subtitulo="Lista completa do ranking no mes corrente."
        itens={itens}
        obterRotulo={(item) => item.rotulo}
        obterValorTexto={(item) => item.valor}
        obterValorPercentual={(item) => item.percentual}
        obterQuantidadeTexto={(item) => item.descricao}
        aoFechar={() => definirModalAberto(false)}
      />
    </>
  );
}
