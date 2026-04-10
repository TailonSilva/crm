import '../../../recursos/estilos/tooltipExplicacaoInicio.css';

export function TooltipExplicacaoInicio({ titulo, ajuda }) {
  if (!ajuda) {
    return null;
  }

  const composicao = normalizarTextoTooltip(ajuda.composicao || ajuda.conceito);
  const periodo = normalizarTextoTooltip(ajuda.periodo || ajuda.calculo);

  return (
    <span className="paginaInicioTooltipExplicacao" role="tooltip">
      <strong>{ajuda.titulo || titulo}</strong>
      {composicao ? <span>{`Composicao: ${composicao}`}</span> : null}
      {periodo ? <span>{`Periodo: ${periodo}`}</span> : null}
    </span>
  );
}

function normalizarTextoTooltip(valor) {
  const texto = String(valor || '').trim();
  if (!texto) {
    return '';
  }

  const primeiroTrecho = texto.split('.').map((parte) => parte.trim()).find(Boolean) || texto;
  if (primeiroTrecho.length <= 120) {
    return primeiroTrecho;
  }

  return `${primeiroTrecho.slice(0, 117)}...`;
}
