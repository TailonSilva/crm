import '../../recursos/estilos/secaoAtendimentosTipoInicio.css';
import { SecaoResumoRelacionamentoComModalInicio } from './inicio-secaoResumoRelacionamentoComModalInicio';

// Esta secao reaproveita o componente-base de graficos compactos para manter o padrao visual da home.
export function SecaoAtendimentosTipoInicio({ itens, titulo = 'Atendimentos do mes por tipo' }) {
  return (
    <div className="secaoAtendimentosTipoInicioEscopo">
      <SecaoResumoRelacionamentoComModalInicio
        titulo={titulo}
        itens={itens}
        composicao="Quantidade de atendimentos e de clientes atendidos por tipo de atendimento."
        periodo="Mes corrente pela data do atendimento."
        mensagemVazia="Nenhum atendimento registrado no mes atual por tipo."
        modalTitulo={titulo}
        modalSubtitulo="Lista completa de atendimentos por tipo no mes corrente."
        colunasPainel={2}
        obterValorTexto={(item) => `${item.quantidadeAtendimentos} atend.`}
        obterValorPercentual={(item) => item.percentualAtendimentos}
        obterQuantidadeTexto={(item) => `${item.quantidadeClientes} clientes`}
        obterQuantidadePercentual={(item) => item.percentualClientes}
        ariaAcao="Abrir lista completa de atendimentos por tipo no mes"
      />
    </div>
  );
}
