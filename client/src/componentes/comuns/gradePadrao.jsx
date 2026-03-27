export function GradePadrao({
  cabecalho,
  children,
  carregando = false,
  mensagemErro = '',
  temItens = false,
  mensagemCarregando = 'Carregando registros...',
  mensagemVazia = 'Nenhum registro encontrado.'
}) {
  return (
    <section className="gradePadrao">
      <div className="corpoGradePadrao">
        <table className="tabelaGradePadrao">
          <thead className="cabecaTabelaGradePadrao">
            {cabecalho}
          </thead>

          <tbody className="corpoTabelaGradePadrao">
            {carregando ? (
              <tr>
                <td className="mensagemGradePadrao" colSpan={99}>{mensagemCarregando}</td>
              </tr>
            ) : null}

            {!carregando && mensagemErro ? (
              <tr>
                <td className="mensagemGradePadrao mensagemGradePadraoErro" colSpan={99}>
                  {mensagemErro}
                </td>
              </tr>
            ) : null}

            {!carregando && !mensagemErro && !temItens ? (
              <tr>
                <td className="mensagemGradePadrao" colSpan={99}>{mensagemVazia}</td>
              </tr>
            ) : null}

            {!carregando && !mensagemErro && temItens ? children : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
