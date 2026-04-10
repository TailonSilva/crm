import '../../../recursos/estilos/secaoOrcamentosProdutosInicio.css';
import { SecaoResumoRelacionamentoComModalInicio } from './secaoResumoRelacionamentoComModalInicio';

export function SecaoOrcamentosProdutosInicio({ itens, titulo = 'Orcamentos em aberto por produto' }) {
  return (
    <SecaoResumoRelacionamentoComModalInicio
      titulo={titulo}
      classNamePainel="secaoOrcamentosProdutosInicio"
      composicao="Valor total e quantidade de itens por produto nos orcamentos em aberto."
      periodo="Posicao atual da carteira de orcamentos em aberto."
      itens={itens}
      colunasPainel={2}
      mensagemVazia="Nenhum orcamento em aberto registrado para produtos."
      modalTitulo={titulo}
      modalSubtitulo="Lista completa por produto nos orcamentos em aberto."
      ariaAcao="Abrir lista completa dos orcamentos por produto"
    />
  );
}
