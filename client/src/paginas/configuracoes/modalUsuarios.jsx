import { useEffect, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { BotaoAcaoGrade } from '../../componentes/comuns/botaoAcaoGrade';
import { CampoImagemPadrao } from '../../componentes/comuns/campoImagemPadrao';
import { CodigoRegistro } from '../../componentes/comuns/codigoRegistro';
import { GradePadrao } from '../../componentes/comuns/gradePadrao';
import { ModalFiltros } from '../../componentes/comuns/modalFiltros';
import { normalizarValorEntradaFormulario } from '../../utilitarios/normalizarTextoFormulario';
import { registroEstaAtivo } from '../../utilitarios/statusRegistro';

const estadoInicialUsuario = {
  imagem: '',
  nome: '',
  usuario: '',
  senha: '',
  tipo: 'Usuario padrao',
  idVendedor: '',
  ativo: true
};

const tiposUsuario = [
  { valor: 'Administrador', label: 'Administrador' },
  { valor: 'Gestor', label: 'Gestor' },
  { valor: 'Usuario padrao', label: 'Usuario padrao' }
];

export function ModalUsuarios({
  aberto,
  usuarios,
  vendedores,
  somenteConsulta = false,
  aoFechar,
  aoSalvar,
  aoInativar
}) {
  const vendedoresAtivos = vendedores.filter((vendedor) => registroEstaAtivo(vendedor.status));
  const [modalFormularioAberto, definirModalFormularioAberto] = useState(false);
  const [modoFormulario, definirModoFormulario] = useState('novo');
  const [usuarioSelecionado, definirUsuarioSelecionado] = useState(null);
  const [formulario, definirFormulario] = useState(estadoInicialUsuario);
  const [salvando, definirSalvando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [modalFiltrosAberto, definirModalFiltrosAberto] = useState(false);
  const [filtros, definirFiltros] = useState(criarFiltrosIniciaisUsuarios());
  const usuariosFiltrados = usuarios.filter((usuario) => {
    if (!filtros.status) {
      return true;
    }

    return filtros.status === '1' ? registroEstaAtivo(usuario.ativo) : !registroEstaAtivo(usuario.ativo);
  });

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirModalFormularioAberto(false);
    definirModoFormulario('novo');
    definirUsuarioSelecionado(null);
    definirFormulario(estadoInicialUsuario);
    definirSalvando(false);
    definirMensagemErro('');
    definirModalFiltrosAberto(false);
    definirFiltros(criarFiltrosIniciaisUsuarios());
  }, [aberto]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    function tratarTecla(evento) {
      if (evento.key === 'Escape' && modalFormularioAberto) {
        fecharFormularioUsuario();
        return;
      }

      if (evento.key === 'Escape' && !salvando) {
        aoFechar();
      }
    }

    window.addEventListener('keydown', tratarTecla);

    return () => {
      window.removeEventListener('keydown', tratarTecla);
    };
  }, [aberto, aoFechar, modalFormularioAberto, salvando]);

  if (!aberto) {
    return null;
  }

  function abrirNovoUsuario() {
    definirUsuarioSelecionado(null);
    definirFormulario(estadoInicialUsuario);
    definirModoFormulario('novo');
    definirMensagemErro('');
    definirModalFormularioAberto(true);
  }

  function abrirEdicaoUsuario(usuario) {
    definirUsuarioSelecionado(usuario);
    definirFormulario(criarFormularioUsuario(usuario));
    definirModoFormulario('edicao');
    definirMensagemErro('');
    definirModalFormularioAberto(true);
  }

  function abrirConsultaUsuario(usuario) {
    definirUsuarioSelecionado(usuario);
    definirFormulario(criarFormularioUsuario(usuario));
    definirModoFormulario('consulta');
    definirMensagemErro('');
    definirModalFormularioAberto(true);
  }

  function fecharFormularioUsuario() {
    definirModalFormularioAberto(false);
    definirUsuarioSelecionado(null);
    definirModoFormulario('novo');
    definirFormulario(estadoInicialUsuario);
    definirMensagemErro('');
    definirSalvando(false);
  }

  function alterarCampo(evento) {
    const { name, value, type, checked } = evento.target;
    const valorNormalizado = normalizarValorEntradaFormulario(evento);

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      [name]: type === 'checkbox' ? checked : valorNormalizado
    }));
  }

  async function submeterUsuario(evento) {
    evento.preventDefault();

    if (modoFormulario === 'consulta') {
      return;
    }

    const camposObrigatorios = [
      ['nome', 'Informe o nome do usuario.'],
      ['usuario', 'Informe o login do usuario.'],
      ['senha', 'Informe a senha do usuario.'],
      ['tipo', 'Selecione o tipo do usuario.']
    ];

    const mensagemValidacao = camposObrigatorios.find(([campo]) => {
      const valor = formulario[campo];
      return valor === '' || valor === null || valor === undefined;
    });

    if (mensagemValidacao) {
      definirMensagemErro(mensagemValidacao[1]);
      return;
    }

    if (formulario.tipo === 'Usuario padrao' && !formulario.idVendedor) {
      definirMensagemErro('Selecione o vendedor vinculado ao usuario padrao.');
      return;
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      await aoSalvar({
        idUsuario: usuarioSelecionado?.idUsuario,
        ...formulario
      });
      fecharFormularioUsuario();
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel salvar o usuario.');
      definirSalvando(false);
    }
  }

  function fecharAoClicarNoFundo(evento) {
    if (evento.target === evento.currentTarget && !salvando) {
      aoFechar();
    }
  }

  function fecharFormularioNoFundo(evento) {
    if (evento.target === evento.currentTarget && !salvando) {
      fecharFormularioUsuario();
    }
  }

  return (
    <div className="camadaModal" role="presentation" onMouseDown={fecharAoClicarNoFundo}>
      <section
        className="modalCliente"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalUsuarios"
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className="cabecalhoModalCliente">
          <h2 id="tituloModalUsuarios">Usuarios</h2>

          <div className="acoesCabecalhoModalCliente">
            <Botao
              variante="secundario"
              type="button"
              icone="filtro"
              somenteIcone
              title="Filtros"
              aria-label="Filtros"
              onClick={() => definirModalFiltrosAberto(true)}
            >
              Filtro
            </Botao>
            <Botao
              variante="secundario"
              type="button"
              icone="fechar"
              somenteIcone
              title="Fechar"
              aria-label="Fechar"
              onClick={aoFechar}
            >
              Fechar
            </Botao>
            {!somenteConsulta ? (
              <Botao
                variante="primario"
                type="button"
                icone="adicionar"
                somenteIcone
                title="Incluir usuario"
                aria-label="Incluir usuario"
                onClick={abrirNovoUsuario}
              >
                Incluir usuario
              </Botao>
            ) : null}
          </div>
        </header>

        <div className="corpoModalCliente corpoModalUsuarios corpoModalUsuariosConfiguracao">
          <section className="painelContatosModalCliente painelContatosConfiguracao">
            <GradePadrao
              className="gradeContatosModal"
              classNameTabela="tabelaContatosModal tabelaUsuariosModal"
              classNameMensagem="mensagemTabelaContatosModal"
              cabecalho={(
                <tr>
                  <th>Foto</th>
                  <th>Nome</th>
                  <th>Codigo</th>
                  <th>Tipo</th>
                  <th>Vendedor</th>
                  <th>Status</th>
                  <th className="cabecalhoAcoesContato">Acoes</th>
                </tr>
              )}
              temItens={usuariosFiltrados.length > 0}
              mensagemVazia="Nenhum usuario encontrado para o filtro atual."
            >
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario.idUsuario}>
                  <td>
                    <div className="celulaAvatarCliente">
                      {usuario.imagem ? (
                        <img className="avatarClienteImagem" src={usuario.imagem} alt={`Foto de ${usuario.nome}`} />
                      ) : (
                        <span className="avatarClientePlaceholder">
                          {obterIniciaisUsuario(usuario.nome)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="celulaContatoModal">
                      <strong>{usuario.nome}</strong>
                    </div>
                  </td>
                  <td>
                    <CodigoRegistro valor={usuario.idUsuario} />
                  </td>
                  <td>{usuario.tipo}</td>
                  <td>{usuario.nomeVendedor || 'Nao vinculado'}</td>
                  <td>
                    <span className={`etiquetaStatus ${usuario.ativo ? 'ativo' : 'inativo'}`}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="celulaAcoesUsuarios">
                    <div className="acoesContatoModal">
                      <BotaoAcaoGrade icone="consultar" titulo="Consultar usuario" onClick={() => abrirConsultaUsuario(usuario)} />
                      {!somenteConsulta ? (
                        <BotaoAcaoGrade icone="editar" titulo="Editar usuario" onClick={() => abrirEdicaoUsuario(usuario)} />
                      ) : null}
                      {!somenteConsulta ? (
                        <BotaoAcaoGrade icone="inativar" titulo="Inativar usuario" onClick={() => aoInativar(usuario)} />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </GradePadrao>
          </section>
        </div>

        <ModalFiltros
          aberto={modalFiltrosAberto}
          titulo="Filtros de usuarios"
          filtros={filtros}
          campos={[
            {
              name: 'status',
              label: 'Ativo',
              options: [
                { valor: '1', label: 'Ativos' },
                { valor: '0', label: 'Inativos' }
              ]
            }
          ]}
          aoFechar={() => definirModalFiltrosAberto(false)}
          aoAplicar={(proximosFiltros) => {
            definirFiltros(proximosFiltros);
            definirModalFiltrosAberto(false);
          }}
          aoLimpar={() => definirFiltros(criarFiltrosIniciaisUsuarios())}
        />

        {modalFormularioAberto ? (
          <div className="camadaModalContato" role="presentation" onMouseDown={fecharFormularioNoFundo}>
            <form
              className="modalContatoCliente"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tituloModalFormularioUsuario"
              onMouseDown={(evento) => evento.stopPropagation()}
              onSubmit={submeterUsuario}
            >
              <div className="cabecalhoModalContato">
                <h3 id="tituloModalFormularioUsuario">
                  {modoFormulario === 'consulta'
                    ? 'Consultar usuario'
                    : modoFormulario === 'edicao'
                      ? 'Editar usuario'
                      : 'Incluir usuario'}
                </h3>
                <div className="acoesFormularioContatoModal">
                  <Botao variante="secundario" type="button" onClick={fecharFormularioUsuario} disabled={salvando}>
                    {modoFormulario === 'consulta' ? 'Fechar' : 'Cancelar'}
                  </Botao>
                  {modoFormulario !== 'consulta' ? (
                    <Botao variante="primario" type="submit" disabled={salvando}>
                      {salvando ? 'Salvando...' : 'Salvar'}
                    </Botao>
                  ) : null}
                </div>
              </div>

              <div className="corpoModalContato">
                <div className="painelDadosGeraisCliente">
                  <CampoImagemPadrao
                    valor={formulario.imagem}
                    alt={`Imagem de ${formulario.nome || 'usuario'}`}
                    iniciais={obterIniciaisUsuario(formulario.nome)}
                    disabled={modoFormulario === 'consulta'}
                    onChange={(imagem) => definirFormulario((estadoAtual) => ({
                      ...estadoAtual,
                      imagem: imagem || estadoAtual.imagem
                    }))}
                  />

                  <div className="gradeCamposModalCliente">
                    <CampoFormulario label="Nome" name="nome" value={formulario.nome} onChange={alterarCampo} disabled={modoFormulario === 'consulta'} required />
                    <CampoFormulario label="Usuario" name="usuario" value={formulario.usuario} onChange={alterarCampo} disabled={modoFormulario === 'consulta'} required />
                    <CampoFormulario label="Senha" name="senha" type="password" value={formulario.senha} onChange={alterarCampo} disabled={modoFormulario === 'consulta'} required />
                    <CampoSelect label="Tipo" name="tipo" value={formulario.tipo} onChange={alterarCampo} options={tiposUsuario} disabled={modoFormulario === 'consulta'} required />
                    <CampoSelect
                      label="Vendedor"
                      name="idVendedor"
                      value={formulario.idVendedor}
                      onChange={alterarCampo}
                      options={vendedoresAtivos.map((vendedor) => ({
                        valor: String(vendedor.idVendedor),
                        label: vendedor.nome
                      }))}
                      disabled={modoFormulario === 'consulta' || formulario.tipo !== 'Usuario padrao'}
                    />
                    <label className="campoCheckboxFormulario" htmlFor="ativoUsuario">
                      <input
                        id="ativoUsuario"
                        type="checkbox"
                        name="ativo"
                        checked={formulario.ativo}
                        onChange={alterarCampo}
                        disabled={modoFormulario === 'consulta'}
                      />
                      <span>Usuario ativo</span>
                    </label>
                  </div>
                </div>
              </div>

              {mensagemErro ? <p className="mensagemErroFormulario">{mensagemErro}</p> : null}
            </form>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function criarFiltrosIniciaisUsuarios() {
  return {
    status: '1'
  };
}

function CampoFormulario({ label, name, type = 'text', ...props }) {
  return (
    <div className="campoFormulario">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="entradaFormulario" {...props} />
    </div>
  );
}

function CampoSelect({ label, name, options, ...props }) {
  return (
    <div className="campoFormulario">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} className="entradaFormulario" {...props}>
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.valor} value={option.valor}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function criarFormularioUsuario(usuario) {
  if (!usuario) {
    return estadoInicialUsuario;
  }

  return {
    imagem: usuario.imagem || '',
    nome: usuario.nome || '',
    usuario: usuario.usuario || '',
    senha: usuario.senha || '',
    tipo: usuario.tipo || 'Usuario padrao',
    idVendedor: String(usuario.idVendedor || ''),
    ativo: Boolean(usuario.ativo)
  };
}

function obterIniciaisUsuario(nome) {
  const nomeBase = nome || 'Usuario';

  return nomeBase
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');
}
