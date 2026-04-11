import { useEffect, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { MensagemErroPopup } from '../../componentes/comuns/mensagemErroPopup';

const formularioInicial = {
  corPrimariaOrcamento: '#111827',
  corSecundariaOrcamento: '#ef4444',
  corDestaqueOrcamento: '#f59e0b'
};

export function ModalLayoutOrcamento({
  aberto,
  empresa,
  somenteConsulta = false,
  aoFechar,
  aoSalvar
}) {
  const [formulario, definirFormulario] = useState(formularioInicial);
  const [salvando, definirSalvando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirFormulario(criarFormularioLayoutOrcamento(empresa));
    definirSalvando(false);
    definirMensagemErro('');
  }, [aberto, empresa]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    function tratarTecla(evento) {
      if (evento.key === 'Escape' && !salvando) {
        aoFechar();
      }
    }

    window.addEventListener('keydown', tratarTecla);

    return () => {
      window.removeEventListener('keydown', tratarTecla);
    };
  }, [aberto, aoFechar, salvando]);

  if (!aberto) {
    return null;
  }

  function alterarCampo(evento) {
    const { name, value } = evento.target;

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      [name]: value
    }));
  }

  async function submeterFormulario(evento) {
    evento.preventDefault();

    if (somenteConsulta) {
      return;
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      await aoSalvar(formulario);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel salvar o layout do orcamento.');
      definirSalvando(false);
    }
  }

  function fecharAoClicarNoFundo(evento) {
    if (evento.target === evento.currentTarget && !salvando) {
      aoFechar();
    }
  }

  return (
    <div className="camadaModal" role="presentation" onMouseDown={fecharAoClicarNoFundo}>
      <form
        className="modalCliente"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalLayoutOrcamento"
        onMouseDown={(evento) => evento.stopPropagation()}
        onSubmit={submeterFormulario}
      >
        <header className="cabecalhoModalCliente">
          <h2 id="tituloModalLayoutOrcamento">Layout Orcamento</h2>

          <div className="acoesCabecalhoModalCliente">
            <Botao variante="secundario" type="button" onClick={aoFechar} disabled={salvando}>
              {somenteConsulta ? 'Fechar' : 'Cancelar'}
            </Botao>
            {!somenteConsulta ? (
              <Botao variante="primario" type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </Botao>
            ) : null}
          </div>
        </header>

        <div className="corpoModalCliente">
          <section className="gradeCamposModalCliente">
            <CampoFormulario
              label="Cor primaria do PDF"
              name="corPrimariaOrcamento"
              type="color"
              value={formulario.corPrimariaOrcamento}
              onChange={alterarCampo}
              disabled={somenteConsulta || salvando}
            />
            <CampoFormulario
              label="Cor secundaria do PDF"
              name="corSecundariaOrcamento"
              type="color"
              value={formulario.corSecundariaOrcamento}
              onChange={alterarCampo}
              disabled={somenteConsulta || salvando}
            />
            <CampoFormulario
              label="Cor de destaque do PDF"
              name="corDestaqueOrcamento"
              type="color"
              value={formulario.corDestaqueOrcamento}
              onChange={alterarCampo}
              disabled={somenteConsulta || salvando}
            />
          </section>
        </div>

        <MensagemErroPopup mensagem={mensagemErro} titulo="Nao foi possivel salvar o layout do orcamento." />
      </form>
    </div>
  );
}

function CampoFormulario({ label, name, type = 'text', ...props }) {
  return (
    <div className="campoFormulario">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="entradaFormulario" {...props} />
    </div>
  );
}

function criarFormularioLayoutOrcamento(empresa) {
  return {
    corPrimariaOrcamento: empresa?.corPrimariaOrcamento || '#111827',
    corSecundariaOrcamento: empresa?.corSecundariaOrcamento || '#ef4444',
    corDestaqueOrcamento: empresa?.corDestaqueOrcamento || '#f59e0b'
  };
}
