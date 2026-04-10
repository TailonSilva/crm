import { SecaoResumoRelacionamentoComModalInicio } from './secaoResumoRelacionamentoComModalInicio';

export function SecaoVendasMarcaInicio({ itens, titulo = 'Vendas do mes por marca' }) {
  return (
    <SecaoResumoRelacionamentoComModalInicio
      titulo={titulo}
      itens={itens}
      colunasPainel={2}
      composicao="Valor liquido e quantidade de itens por marca."
      periodo="Mes corrente pela data de entrada do pedido."
      mensagemVazia="Nenhuma venda registrada no mes atual para marcas."
      modalTitulo={titulo}
      modalSubtitulo="Lista completa por marca no mes corrente."
      ariaAcao="Abrir lista completa das vendas por marca no mes"
    />
  );
}
