import '../../../recursos/estilos/secaoResumoRelacionamentoComModalInicio.css';
import { useState } from 'react';
import { Botao } from '../../../componentes/comuns/botao';
import { ModalResumoRelacionamentoInicio } from './modalResumoRelacionamentoInicio';
import { SecaoGraficosDuplosInicio } from './secaoGraficosDuplosInicio';

export function SecaoResumoRelacionamentoComModalInicio({
  titulo,
  composicao,
  periodo,
  classNamePainel = '',
  itens = [],
  mensagemVazia,
  modalTitulo,
  modalSubtitulo = 'Lista completa do mes corrente.',
  colunasPainel = 2,
  varianteValor = '',
  obterChave = (item) => item.id,
  obterRotulo = (item) => item.descricao,
  obterValorTexto = (item) => item.valor,
  obterValorPercentual = (item) => item.percentualValor,
  obterQuantidadeTexto = (item) => `${item.quantidadeItens} itens`,
  obterQuantidadePercentual = (item) => item.percentualQuantidade,
  obterAjuda = (item) => item.ajuda,
  obterCorValor,
  obterCorQuantidade,
  ariaAcao = 'Abrir lista completa'
}) {
  const [modalAberto, definirModalAberto] = useState(false);
  const itensExibidos = Array.isArray(itens) ? itens.slice(0, 5) : [];

  return (
    <>
      <SecaoGraficosDuplosInicio
        titulo={titulo}
        subtitulo=""
        classNamePainel={classNamePainel}
        colunasPainel={colunasPainel}
        modoExibicao="lista"
        ajudaSecao={{
          composicao,
          periodo
        }}
        itens={itensExibidos}
        mensagemVazia={mensagemVazia}
        tituloValor="Valor"
        tituloQuantidade="Quantidade"
        obterChave={obterChave}
        obterRotulo={obterRotulo}
        obterValorTexto={obterValorTexto}
        obterValorPercentual={obterValorPercentual}
        obterQuantidadeTexto={obterQuantidadeTexto}
        obterQuantidadePercentual={obterQuantidadePercentual}
        obterAjuda={obterAjuda}
        obterCorValor={obterCorValor}
        obterCorQuantidade={obterCorQuantidade}
        varianteValor={varianteValor}
        acoesCabecalho={(
          <Botao
            variante="secundario"
            icone="lista"
            somenteIcone
            className="paginaInicioAcaoSessao"
            aria-label={ariaAcao}
            onClick={() => definirModalAberto(true)}
          />
        )}
      />

      <ModalResumoRelacionamentoInicio
        aberto={modalAberto}
        titulo={modalTitulo || titulo}
        subtitulo={modalSubtitulo}
        itens={itens}
        obterRotulo={obterRotulo}
        obterValorTexto={obterValorTexto}
        obterValorPercentual={obterValorPercentual}
        obterQuantidadeTexto={obterQuantidadeTexto}
        obterCorValor={obterCorValor}
        varianteValor={varianteValor}
        aoFechar={() => definirModalAberto(false)}
      />
    </>
  );
}
