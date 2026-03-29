import { Botao } from './botao';

export function PopupAvisos({ avisos, aoFechar }) {
  if (!Array.isArray(avisos) || avisos.length === 0) {
    return null;
  }

  return (
    <div className="pilhaPopupAvisos" aria-live="polite" aria-atomic="false">
      {avisos.map((aviso) => (
        <div key={aviso.id} className="cartaoPopupAviso" role="status">
          <div className="cabecalhoPopupAviso">
            <div className="tituloPopupAviso">
              <span className="seloPopupAviso">
                {aviso.icone || 'Agenda'}
              </span>
              <div>
                <strong>{aviso.titulo}</strong>
                {aviso.subtitulo ? <small>{aviso.subtitulo}</small> : null}
              </div>
            </div>

            <Botao
              variante="secundario"
              icone="fechar"
              somenteIcone
              title="Fechar aviso"
              aria-label="Fechar aviso"
              onClick={() => aoFechar(aviso.id)}
            >
              Fechar aviso
            </Botao>
          </div>

          <div className="conteudoPopupAviso">
            {aviso.mensagem ? <p>{aviso.mensagem}</p> : null}
            {aviso.detalhe ? <span>{aviso.detalhe}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
