import { SecaoResumoRelacionamentoComModalInicio } from './secaoResumoRelacionamentoComModalInicio';

export function SecaoDevolucoesInicio({ itens, titulo = 'Devolucoes do mes' }) {
  return (
    <SecaoResumoRelacionamentoComModalInicio
      titulo={titulo}
      colunasPainel={2}
      composicao="Quantidade de devolucoes e valor total por motivo (valor exibido em positivo)."
      periodo="Mes corrente pela data de entrada do pedido de devolucao."
      itens={itens}
      mensagemVazia="Nenhuma devolucao registrada no mes atual."
      modalTitulo={titulo}
      modalSubtitulo="Lista completa de devolucoes por motivo no mes corrente."
      ariaAcao="Abrir lista completa das devolucoes do mes"
      obterChave={(item) => item.idMotivoDevolucao}
      obterQuantidadeTexto={(item) => `${item.quantidade} dev.`}
      obterQuantidadePercentual={(item) => item.percentualQuantidade}
      varianteValor="Devolucao"
    />
  );
}
