import { SecaoResumoRelacionamentoComModalInicio } from './secaoResumoRelacionamentoComModalInicio';

export function SecaoOrcamentosMarcaInicio({ itens, titulo = 'Orcamentos em aberto por marca' }) {
  return (
    <SecaoResumoRelacionamentoComModalInicio
      titulo={titulo}
      composicao="Valor total e quantidade de itens por marca nos orcamentos em aberto."
      periodo="Posicao atual da carteira de orcamentos em aberto."
      itens={itens}
      colunasPainel={2}
      mensagemVazia="Nenhum orcamento em aberto registrado para marcas."
      modalTitulo={titulo}
      modalSubtitulo="Lista completa por marca nos orcamentos em aberto."
      ariaAcao="Abrir lista completa dos orcamentos por marca"
    />
  );
}
