import { SecaoResumoRelacionamentoComModalInicio } from './secaoResumoRelacionamentoComModalInicio';

export function SecaoMotivosPerdaInicio({ itens, titulo = 'Motivos de perda do mes' }) {
  return (
    <SecaoResumoRelacionamentoComModalInicio
      titulo={titulo}
      colunasPainel={2}
      composicao="Quantidade e valor total dos orcamentos recusados por motivo."
      periodo="Mes corrente pelos orcamentos recusados no periodo."
      itens={itens}
      varianteValor="Devolucao"
      mensagemVazia="Nenhum orcamento recusado no mes atual com motivo de perda."
      modalTitulo={titulo}
      modalSubtitulo="Lista completa de motivos de perda dos orcamentos recusados no mes corrente."
      ariaAcao="Abrir lista completa dos motivos de perda do mes"
      obterChave={(item) => item.id}
      obterQuantidadeTexto={(item) => `${item.quantidadeOrcamentos} orc.`}
      obterQuantidadePercentual={(item) => item.percentualQuantidade}
    />
  );
}
