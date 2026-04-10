import { SecaoResumoRelacionamentoComModalInicio } from './secaoResumoRelacionamentoComModalInicio';

export function SecaoFunilOrcamentosInicio({ itens, titulo = 'Funil de orcamentos' }) {
  return (
    <SecaoResumoRelacionamentoComModalInicio
      titulo={titulo}
      colunasPainel={2}
      composicao="Valor total e quantidade de itens por etapa do funil."
      periodo="Posicao atual dos orcamentos em aberto nas etapas consideradas."
      itens={itens}
      mensagemVazia="Nenhuma etapa marcada para considerar no funil ou nenhum orcamento em aberto nessas etapas."
      modalTitulo={titulo}
      modalSubtitulo="Lista completa das etapas consideradas no funil de orcamentos."
      ariaAcao="Abrir lista completa do funil de orcamentos"
      obterChave={(item) => item.idEtapaOrcamento}
      obterQuantidadeTexto={(item) => `${item.quantidadeItens} itens`}
      obterQuantidadePercentual={(item) => item.percentualProdutos}
      obterCorValor={(item) => item.cor || ''}
      obterCorQuantidade={(item) => item.cor || ''}
    />
  );
}
