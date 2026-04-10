import { SecaoGraficosDuplosInicio } from './secaoGraficosDuplosInicio';

export function SecaoResumoRelacionamentoInicio({
  titulo,
  composicao,
  periodo,
  itens,
  mensagemVazia,
  acoesCabecalho = null
}) {
  return (
    <SecaoGraficosDuplosInicio
      titulo={titulo}
      subtitulo=""
      colunasPainel={1}
      modoExibicao="lista"
      ajudaSecao={{
        composicao,
        periodo
      }}
      acoesCabecalho={acoesCabecalho}
      itens={itens}
      mensagemVazia={mensagemVazia}
      tituloValor="Valor"
      tituloQuantidade="Quantidade"
      obterChave={(item) => item.id}
      obterRotulo={(item) => item.descricao}
      obterValorTexto={(item) => item.valor}
      obterValorPercentual={(item) => item.percentualValor}
      obterQuantidadeTexto={(item) => `${item.quantidadeItens} itens`}
      obterQuantidadePercentual={(item) => item.percentualQuantidade}
      obterAjuda={(item) => item.ajuda}
    />
  );
}
