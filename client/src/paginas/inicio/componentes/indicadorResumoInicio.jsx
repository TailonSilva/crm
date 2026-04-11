import { Icone } from '../../../componentes/comuns/icone';
import '../../../recursos/estilos/indicadorResumoInicio.css';

export function IndicadorResumoInicio({
  ariaLabel,
  icone,
  titulo,
  valor,
  valorComplemento,
  carregando,
  descricao,
  ajuda = null
}) {
  const valorTexto = carregando ? '...' : String(valor || '');
  const valorComplementoTexto = carregando ? '' : String(valorComplemento || '').trim();
  const valorMonetarioCompacto = !carregando && valorTexto.startsWith('R$') && valorTexto.length >= 10;
  const composicao = ajuda?.composicao || ajuda?.conceito || '';
  const periodo = ajuda?.periodo || ajuda?.calculo || '';

  return (
    <section className="inicioIndicadorResumo" aria-label={ariaLabel} tabIndex={0}>
      <div className="inicioIndicadorResumoCabecalho">
        <div className="inicioIndicadorResumoConteudo">
          <span className="inicioIndicadorResumoRotulo">{titulo}</span>
          <div className="inicioIndicadorResumoValorLinha">
            <strong className={`inicioIndicadorResumoValor ${valorMonetarioCompacto ? 'inicioIndicadorResumoValorCompacto' : ''}`.trim()}>
              {valorTexto}
            </strong>
            {valorComplementoTexto ? (
              <span className="inicioIndicadorResumoValorComplemento">{valorComplementoTexto}</span>
            ) : null}
          </div>
        </div>
        <div className="inicioIndicadorResumoAcoes">
          <span className="inicioIndicadorResumoIcone" aria-hidden="true">
            <Icone nome={icone} />
          </span>
          {ajuda ? (
            <span className="inicioIndicadorResumoAjuda">
              <button
                type="button"
                className="inicioIndicadorResumoBotaoAjuda"
                aria-label={`Informacoes sobre ${titulo}`}
              >
                <Icone nome="informacao" />
              </button>
              <span className="inicioIndicadorResumoTooltip" role="tooltip">
                <strong>{ajuda.titulo || titulo}</strong>
                {composicao ? <span>{`Composicao: ${composicao}`}</span> : null}
                {periodo ? <span>{`Periodo: ${periodo}`}</span> : null}
              </span>
            </span>
          ) : null}
        </div>
      </div>

      {descricao ? <p className="inicioIndicadorResumoDescricao">{descricao}</p> : null}
    </section>
  );
}
