import '../../../recursos/estilos/secaoVendasUfInicio.css';
import { SecaoResumoRelacionamentoComModalInicio } from './secaoResumoRelacionamentoComModalInicio';

export function SecaoVendasUfInicio({ itens, titulo = 'Vendas do mes por UF' }) {
  return (
    <SecaoResumoRelacionamentoComModalInicio
      titulo={titulo}
      classNamePainel="secaoVendasUfInicio"
      composicao="Valor liquido e quantidade de itens por UF."
      periodo="Mes corrente pela data de entrada do pedido."
      itens={itens}
      colunasPainel={2}
      mensagemVazia="Nenhuma venda registrada no mes atual por UF."
      modalTitulo={titulo}
      modalSubtitulo="Lista completa das vendas por UF no mes corrente."
      ariaAcao="Abrir lista completa das vendas por UF no mes"
    />
  );
}
