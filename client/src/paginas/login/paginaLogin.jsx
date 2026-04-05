import { useEffect, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import '../../recursos/estilos/paginaLogin.css';
import { autenticarUsuario } from '../../servicos/autenticacao';
import { listarEmpresas } from '../../servicos/empresa';
import logoConnecta from '../../recursos/imagens/logo-connecta.png';

export function PaginaLogin({ aoEntrar }) {
  const [empresa, definirEmpresa] = useState(null);
  const [usuario, definirUsuario] = useState('');
  const [senha, definirSenha] = useState('');
  const [carregando, definirCarregando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');

  useEffect(() => {
    carregarEmpresa();
  }, []);

  async function carregarEmpresa() {
    try {
      const empresas = await listarEmpresas();
      definirEmpresa(empresas[0] || null);
    } catch (_erro) {
      definirEmpresa(null);
    }
  }

  async function submeterLogin(evento) {
    evento.preventDefault();
    definirCarregando(true);
    definirMensagemErro('');

    try {
      const usuarioAutenticado = await autenticarUsuario(usuario, senha);
      aoEntrar(usuarioAutenticado);
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel entrar.');
      definirCarregando(false);
    }
  }

  const logoExibida = empresa?.imagem || logoConnecta;
  const rotuloLogo = empresa?.nomeFantasia || empresa?.razaoSocial || 'Connecta CRM';

  return (
    <main className="paginaLogin">
      <section className="paginaLoginCartao">
        <div className="paginaLoginMarca">
          <div className="paginaLoginLogo" aria-hidden="true">
            <img
              className="paginaLoginLogoImagem"
              src={logoExibida}
              alt={rotuloLogo}
            />
          </div>

          <div>
            <strong>{empresa?.nomeFantasia || empresa?.razaoSocial || 'Connecta CRM'}</strong>
            <p>{empresa?.slogan || 'Acesse sua conta para continuar.'}</p>
          </div>
        </div>

        <form className="paginaLoginFormulario" onSubmit={submeterLogin}>
          <div className="campoFormulario">
            <label htmlFor="usuarioLogin">Usuario</label>
            <input
              id="usuarioLogin"
              className="entradaFormulario"
              value={usuario}
              onChange={(evento) => definirUsuario(evento.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="campoFormulario">
            <label htmlFor="senhaLogin">Senha</label>
            <input
              id="senhaLogin"
              type="password"
              className="entradaFormulario"
              value={senha}
              onChange={(evento) => definirSenha(evento.target.value)}
              autoComplete="current-password"
            />
          </div>

          {mensagemErro ? <p className="mensagemErroFormulario paginaLoginMensagemErro">{mensagemErro}</p> : null}

          <Botao variante="primario" type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </Botao>
        </form>
      </section>
    </main>
  );
}
