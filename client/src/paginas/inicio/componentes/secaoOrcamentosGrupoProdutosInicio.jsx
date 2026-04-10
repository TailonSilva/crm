import '../../../recursos/estilos/secaoOrcamentosGrupoProdutosInicio.css';
import { SecaoResumoRelacionamentoComModalInicio } from './secaoResumoRelacionamentoComModalInicio';

export function SecaoOrcamentosGrupoProdutosInicio({ itens, titulo = 'Orcamentos em aberto por grupo de produtos' }) {
  return (
    <SecaoResumoRelacionamentoComModalInicio
      titulo={titulo}
      classNamePainel="secaoOrcamentosGrupoProdutosInicio"
      composicao="Valor total e quantidade de itens por grupo nos orcamentos em aberto."
      periodo="Posicao atual da carteira de orcamentos em aberto."
      itens={itens}
      colunasPainel={2}
      mensagemVazia="Nenhum orcamento em aberto registrado para grupos de produtos."
      modalTitulo={titulo}
      modalSubtitulo="Lista completa por grupo de produto nos orcamentos em aberto."
      ariaAcao="Abrir lista completa dos orcamentos por grupo de produtos"
    />
  );
}
