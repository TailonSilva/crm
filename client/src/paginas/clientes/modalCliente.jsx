import { useEffect, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { BotaoAcaoGrade } from '../../componentes/comuns/botaoAcaoGrade';
import { CampoImagemPadrao } from '../../componentes/comuns/campoImagemPadrao';
import { atualizarContato, buscarCep, buscarCnpj } from '../../servicos/clientes';
import {
  listarAtendimentos,
  listarCanaisAtendimento,
  listarOrigensAtendimento
} from '../../servicos/atendimentos';
import { listarUsuarios } from '../../servicos/usuarios';
import { normalizarTelefone } from '../../utilitarios/normalizarTelefone';
import { ModalAtendimento } from '../atendimentos/modalAtendimento';

const abasModalCliente = [
  { id: 'dadosGerais', label: 'Dados gerais' },
  { id: 'endereco', label: 'Endereco' },
  { id: 'observacoes', label: 'Observacoes' },
  { id: 'contatos', label: 'Contato' },
  { id: 'atendimento', label: 'Atendimento' },
  { id: 'vendas', label: 'Vendas' }
];

const estadoInicialFormulario = {
  idVendedor: '',
  idRamo: '',
  razaoSocial: '',
  nomeFantasia: '',
  tipo: '',
  cnpj: '',
  inscricaoEstadual: '',
  email: '',
  telefone: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  observacao: '',
  imagem: '',
  status: true
};

const estadoInicialContato = {
  idContato: '',
  nome: '',
  cargo: '',
  email: '',
  telefone: '',
  whatsapp: '',
  status: true,
  principal: false
};

export function ModalCliente({
  aberto,
  cliente,
  codigoSugerido,
  contatos,
  vendedores,
  ramosAtividade,
  idVendedorBloqueado,
  modo = 'novo',
  aoFechar,
  aoSalvar
}) {
  const [formulario, definirFormulario] = useState(estadoInicialFormulario);
  const [contatosFormulario, definirContatosFormulario] = useState([]);
  const [formularioContato, definirFormularioContato] = useState(estadoInicialContato);
  const [modoContato, definirModoContato] = useState('novo');
  const [modalContatoAberto, definirModalContatoAberto] = useState(false);
  const [abaAtiva, definirAbaAtiva] = useState(abasModalCliente[0].id);
  const [salvando, definirSalvando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');
  const [buscandoCep, definirBuscandoCep] = useState(false);
  const [buscandoCnpj, definirBuscandoCnpj] = useState(false);
  const [atendimentosCliente, definirAtendimentosCliente] = useState([]);
  const [canaisAtendimento, definirCanaisAtendimento] = useState([]);
  const [origensAtendimento, definirOrigensAtendimento] = useState([]);
  const [carregandoAtendimentos, definirCarregandoAtendimentos] = useState(false);
  const [mensagemErroAtendimentos, definirMensagemErroAtendimentos] = useState('');
  const [atendimentoSelecionado, definirAtendimentoSelecionado] = useState(null);
  const [modalAtendimentoAberto, definirModalAtendimentoAberto] = useState(false);
  const [confirmandoSaida, definirConfirmandoSaida] = useState(false);
  const somenteLeitura = modo === 'consulta';
  const modoInclusao = !cliente;
  const vendedorBloqueado = Boolean(idVendedorBloqueado);
  const tipoPessoaFisica = formulario.tipo === 'Pessoa fisica';
  const rotuloDocumento = tipoPessoaFisica ? 'CPF' : 'CNPJ';

  useEffect(() => {
    if (!aberto) {
      return;
    }

    definirFormulario(criarFormularioCliente(cliente, idVendedorBloqueado));
    definirContatosFormulario(criarContatosFormulario(contatos));
    definirFormularioContato(estadoInicialContato);
    definirModoContato('novo');
    definirModalContatoAberto(false);
    definirAbaAtiva(abasModalCliente[0].id);
    definirMensagemErro('');
    definirSalvando(false);
    definirBuscandoCep(false);
    definirBuscandoCnpj(false);
    definirAtendimentosCliente([]);
    definirCanaisAtendimento([]);
    definirOrigensAtendimento([]);
    definirCarregandoAtendimentos(false);
    definirMensagemErroAtendimentos('');
    definirAtendimentoSelecionado(null);
    definirModalAtendimentoAberto(false);
    definirConfirmandoSaida(false);
  }, [aberto, cliente, contatos, idVendedorBloqueado]);

  useEffect(() => {
    if (!aberto || !cliente?.idCliente) {
      return;
    }

    let cancelado = false;

    async function carregarAtendimentosCliente() {
      definirCarregandoAtendimentos(true);
      definirMensagemErroAtendimentos('');

      try {
        const [
          atendimentosCarregados,
          usuariosCarregados,
          canaisCarregados,
          origensCarregadas
        ] = await Promise.all([
          listarAtendimentos(),
          listarUsuarios(),
          listarCanaisAtendimento(),
          listarOrigensAtendimento()
        ]);

        if (cancelado) {
          return;
        }

        definirCanaisAtendimento(canaisCarregados);
        definirOrigensAtendimento(origensCarregadas);
        definirAtendimentosCliente(
          enriquecerAtendimentosCliente(
            atendimentosCarregados,
            cliente.idCliente,
            contatos,
            usuariosCarregados,
            canaisCarregados,
            origensCarregadas
          )
        );
      } catch (erro) {
        if (!cancelado) {
          definirMensagemErroAtendimentos('Nao foi possivel carregar os atendimentos deste cliente.');
        }
      } finally {
        if (!cancelado) {
          definirCarregandoAtendimentos(false);
        }
      }
    }

    carregarAtendimentosCliente();

    return () => {
      cancelado = true;
    };
  }, [aberto, cliente?.idCliente, contatos]);

  useEffect(() => {
    if (!aberto) {
      return undefined;
    }

    function tratarTecla(evento) {
      if (evento.key === 'Escape' && modalContatoAberto) {
        definirModalContatoAberto(false);
        definirModoContato('novo');
        return;
      }

      if (evento.key === 'Escape' && !salvando) {
        tentarFecharModal();
      }
    }

    window.addEventListener('keydown', tratarTecla);

    return () => {
      window.removeEventListener('keydown', tratarTecla);
    };
  }, [aberto, aoFechar, salvando, modalContatoAberto]);

  if (!aberto) {
    return null;
  }

  async function submeterFormulario(evento) {
    evento.preventDefault();

    if (somenteLeitura) {
      return;
    }

    const camposObrigatorios = [
      ['idVendedor', 'Selecione um vendedor.'],
      ['idRamo', 'Selecione um ramo de atividade.'],
      ['razaoSocial', 'Informe a razao social.'],
      ['nomeFantasia', 'Informe o nome fantasia.'],
      ['tipo', 'Informe o tipo do cliente.'],
      ['cnpj', `Informe o ${rotuloDocumento}.`]
    ];

    const mensagemValidacao = camposObrigatorios.find(([campo]) => {
      const valor = formulario[campo];
      return valor === '' || valor === null || valor === undefined;
    });

    if (mensagemValidacao) {
      definirMensagemErro(mensagemValidacao[1]);
      return;
    }

    definirSalvando(true);
    definirMensagemErro('');

    try {
      await aoSalvar({
        ...formulario,
        contatos: contatosFormulario
      });
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel salvar o cliente.');
      definirSalvando(false);
    }
  }

  function alterarCampo(evento) {
    const { name, value, type, checked } = evento.target;

    definirFormulario((estadoAtual) => ({
      ...estadoAtual,
      [name]: type === 'checkbox'
        ? checked
        : name === 'telefone' ? normalizarTelefone(value) : value
    }));
  }

  function alterarCampoContato(evento) {
    const { name, value, type, checked } = evento.target;

    definirFormularioContato((estadoAtual) => ({
      ...estadoAtual,
      [name]: type === 'checkbox'
        ? checked
        : ['telefone', 'whatsapp'].includes(name) ? normalizarTelefone(value) : value
    }));
  }

  async function buscarDadosCep() {
    if (somenteLeitura) {
      return;
    }

    definirBuscandoCep(true);
    definirMensagemErro('');

    try {
      const dadosCep = await buscarCep(formulario.cep);

      definirFormulario((estadoAtual) => ({
        ...estadoAtual,
        cep: dadosCep.cep || estadoAtual.cep,
        logradouro: dadosCep.logradouro || estadoAtual.logradouro,
        complemento: dadosCep.complemento || estadoAtual.complemento,
        bairro: dadosCep.bairro || estadoAtual.bairro,
        cidade: dadosCep.localidade || estadoAtual.cidade,
        estado: dadosCep.uf || estadoAtual.estado
      }));
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel consultar o CEP.');
      definirAbaAtiva('endereco');
    } finally {
      definirBuscandoCep(false);
    }
  }

  async function buscarDadosCnpj() {
    if (somenteLeitura || tipoPessoaFisica) {
      return;
    }

    definirBuscandoCnpj(true);
    definirMensagemErro('');

    try {
      const dadosCnpj = await buscarCnpj(formulario.cnpj);

      definirFormulario((estadoAtual) => ({
        ...estadoAtual,
        cnpj: formatarCnpj(dadosCnpj.cnpj || estadoAtual.cnpj),
        razaoSocial: dadosCnpj.razao_social || estadoAtual.razaoSocial,
        nomeFantasia: dadosCnpj.nome_fantasia || estadoAtual.nomeFantasia,
        email: dadosCnpj.email || estadoAtual.email,
        telefone: normalizarTelefone(dadosCnpj.ddd_telefone_1 || estadoAtual.telefone),
        cep: formatarCep(dadosCnpj.cep || estadoAtual.cep),
        logradouro: montarLogradouroCnpj(dadosCnpj) || estadoAtual.logradouro,
        numero: dadosCnpj.numero || estadoAtual.numero,
        complemento: dadosCnpj.complemento || estadoAtual.complemento,
        bairro: dadosCnpj.bairro || estadoAtual.bairro,
        cidade: normalizarTextoCapitalizado(dadosCnpj.municipio) || estadoAtual.cidade,
        estado: dadosCnpj.uf || estadoAtual.estado
      }));
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel consultar o CNPJ.');
      definirAbaAtiva('dadosGerais');
    } finally {
      definirBuscandoCnpj(false);
    }
  }

  function iniciarNovoContato() {
    if (somenteLeitura) {
      return;
    }

    definirFormularioContato(estadoInicialContato);
    definirModoContato('novo');
    definirModalContatoAberto(true);
    definirMensagemErro('');
  }

  function editarContato(contato) {
    definirFormularioContato(criarFormularioContato(contato));
    definirModoContato('edicao');
    definirModalContatoAberto(true);
    definirMensagemErro('');
  }

  function consultarContato(contato) {
    definirFormularioContato(criarFormularioContato(contato));
    definirModoContato('consulta');
    definirModalContatoAberto(true);
    definirMensagemErro('');
  }

  async function inativarContato(idContato) {
    if (somenteLeitura) {
      return;
    }

    const contato = contatosFormulario.find((item) => item.idContato === idContato);

    if (typeof idContato === 'number') {
      await atualizarContato(idContato, {
        status: 0,
        principal: 0
      });
    }

    definirContatosFormulario((estadoAtual) =>
      estadoAtual.map((contato) => (
        contato.idContato === idContato
          ? { ...contato, status: false, principal: false }
          : contato
      ))
    );

    if (cliente?.idCliente && typeof idContato === 'number' && contato) {
      definirMensagemErro('');
    }
  }

  function salvarContatoLocal() {
    if (!formularioContato.nome.trim()) {
      definirMensagemErro('Informe o nome do contato.');
      definirAbaAtiva('contatos');
      return;
    }

    const identificadorContato = formularioContato.idContato || `novo-${Date.now()}`;

    definirContatosFormulario((estadoAtual) => {
      const listaSemContatoAtual = estadoAtual.filter(
        (contato) => contato.idContato !== identificadorContato
      );

      const contatoPreparado = {
        ...formularioContato,
        idContato: identificadorContato
      };

      return [...listaSemContatoAtual, contatoPreparado]
        .map((contato) => ({
          ...contato,
          principal: contatoPreparado.principal
            ? contato.idContato === identificadorContato
            : contato.principal
        }))
        .sort((contatoA, contatoB) => Number(contatoB.status) - Number(contatoA.status));
    });

    definirFormularioContato(estadoInicialContato);
    definirModoContato('novo');
    definirModalContatoAberto(false);
    definirMensagemErro('');
  }

  function consultarAtendimento(atendimento) {
    definirAtendimentoSelecionado(atendimento);
    definirModalAtendimentoAberto(true);
  }

  function fecharModalAtendimento() {
    definirAtendimentoSelecionado(null);
    definirModalAtendimentoAberto(false);
  }

  return (
    <div className="camadaModal" role="presentation" onMouseDown={fecharAoClicarNoFundo}>
      <form
        className="modalCliente"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalCliente"
        onMouseDown={(evento) => evento.stopPropagation()}
        onSubmit={submeterFormulario}
      >
        <header className="cabecalhoModalCliente">
          <h2 id="tituloModalCliente">
            {somenteLeitura ? 'Consultar cliente' : cliente ? 'Editar cliente' : 'Incluir cliente'}
          </h2>

          <div className="acoesCabecalhoModalCliente">
            <Botao variante="secundario" type="button" onClick={tentarFecharModal} disabled={salvando}>
              {somenteLeitura ? 'Fechar' : 'Cancelar'}
            </Botao>
            {!somenteLeitura ? (
              <Botao variante="primario" type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </Botao>
            ) : null}
          </div>
        </header>

        <div className="abasModalCliente" role="tablist" aria-label="Secoes do cadastro do cliente">
          {abasModalCliente.map((aba) => (
            <button
              key={aba.id}
              type="button"
              role="tab"
              className={`abaModalCliente ${abaAtiva === aba.id ? 'ativa' : ''}`}
              aria-selected={abaAtiva === aba.id}
              onClick={() => definirAbaAtiva(aba.id)}
            >
              {aba.label}
            </button>
          ))}
        </div>

        <div className={`corpoModalCliente ${abaAtiva === 'atendimento' ? 'corpoModalClienteSemRolagem' : ''}`.trim()}>
          {abaAtiva === 'dadosGerais' ? (
            <section className="painelDadosGeraisCliente">
              <CampoImagemPadrao
                valor={formulario.imagem}
                alt={`Imagem de ${formulario.nomeFantasia || formulario.razaoSocial || 'cliente'}`}
                iniciais={obterIniciaisCliente(formulario)}
                codigo={cliente?.idCliente || codigoSugerido || 0}
                disabled={somenteLeitura}
                onChange={(imagem) => definirFormulario((estadoAtual) => ({
                  ...estadoAtual,
                  imagem: imagem || estadoAtual.imagem
                }))}
              />

              <div className="gradeCamposModalCliente">
                <CampoFormulario label="Razao social" name="razaoSocial" value={formulario.razaoSocial} onChange={alterarCampo} disabled={somenteLeitura} required />
                <CampoFormulario label="Nome fantasia" name="nomeFantasia" value={formulario.nomeFantasia} onChange={alterarCampo} disabled={somenteLeitura} required />
                <CampoFormularioComAcao
                  label={rotuloDocumento}
                  name="cnpj"
                  value={formulario.cnpj}
                  onChange={alterarCampo}
                  aoAcionar={buscarDadosCnpj}
                  carregando={buscandoCnpj}
                  somenteIcone
                  rotuloAcao={tipoPessoaFisica ? 'Documento sem busca automatica' : 'Buscar CNPJ'}
                  disabled={somenteLeitura || tipoPessoaFisica}
                  required
                />
                <CampoSelect
                  label="Tipo"
                  name="tipo"
                  value={formulario.tipo}
                  onChange={alterarCampo}
                  options={[
                    { valor: 'Pessoa fisica', label: 'Pessoa fisica' },
                    { valor: 'Pessoa juridica', label: 'Pessoa juridica' }
                  ]}
                  disabled={somenteLeitura}
                  required
                />
                <CampoFormulario label="Inscricao estadual" name="inscricaoEstadual" value={formulario.inscricaoEstadual} onChange={alterarCampo} disabled={somenteLeitura} />
                <CampoSelect label="Vendedor" name="idVendedor" value={formulario.idVendedor} onChange={alterarCampo} options={vendedores.map((vendedor) => ({ valor: String(vendedor.idVendedor), label: vendedor.nome }))} disabled={somenteLeitura || vendedorBloqueado} required />
                <CampoSelect label="Ramo de atividade" name="idRamo" value={formulario.idRamo} onChange={alterarCampo} options={ramosAtividade.map((ramo) => ({ valor: String(ramo.idRamo), label: ramo.descricao }))} disabled={somenteLeitura} required />
                <label className="campoCheckboxFormulario" htmlFor="status">
                  <input id="status" type="checkbox" name="status" checked={formulario.status} onChange={alterarCampo} disabled={somenteLeitura} />
                  <span>Cliente ativo</span>
                </label>
              </div>
            </section>
          ) : null}

          {abaAtiva === 'endereco' ? (
            <section className="gradeCamposModalCliente">
              <CampoFormularioComAcao label="CEP" name="cep" value={formulario.cep} onChange={alterarCampo} aoAcionar={buscarDadosCep} carregando={buscandoCep} rotuloAcao="Buscar CEP" disabled={somenteLeitura} />
              <CampoFormulario label="Logradouro" name="logradouro" value={formulario.logradouro} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoFormulario label="Numero" name="numero" value={formulario.numero} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoFormulario label="Complemento" name="complemento" value={formulario.complemento} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoFormulario label="Bairro" name="bairro" value={formulario.bairro} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoFormulario label="Cidade" name="cidade" value={formulario.cidade} onChange={alterarCampo} disabled={somenteLeitura} />
              <CampoFormulario label="Estado" name="estado" value={formulario.estado} onChange={alterarCampo} disabled={somenteLeitura} maxLength={2} />
            </section>
          ) : null}

          {abaAtiva === 'observacoes' ? (
            <section className="gradeCamposModalCliente">
              <div className="campoFormulario campoFormularioIntegral">
                <label htmlFor="observacao">Observacoes</label>
                <textarea id="observacao" name="observacao" value={formulario.observacao} onChange={alterarCampo} disabled={somenteLeitura} rows={8} className="entradaFormulario entradaFormularioTextoLongo" />
              </div>
            </section>
          ) : null}

          {abaAtiva === 'contatos' ? (
            <section className="painelContatosModalCliente">
              <div className="cabecalhoGradeContatosModal">
                <div>
                  <h3>Contatos cadastrados</h3>
                </div>
                <Botao
                  variante={somenteLeitura ? 'secundario' : 'primario'}
                  type="button"
                  onClick={iniciarNovoContato}
                  disabled={somenteLeitura}
                >
                  Adicionar
                </Botao>
              </div>

              <div className="gradeContatosModal">
                <table className="tabelaContatosModal">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Contato</th>
                      <th></th>
                      <th className="cabecalhoAcoesContato">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contatosFormulario.length > 0 ? (
                      contatosFormulario.map((contato) => (
                        <tr key={contato.idContato}>
                          <td>
                            <div className="celulaContatoModal">
                              <strong>{contato.nome}</strong>
                              <span>{contato.cargo || 'Cargo nao informado'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="celulaContatoComunicacao">
                              <span>{contato.email || 'E-mail nao informado'}</span>
                              {contato.telefone || contato.whatsapp ? (
                                <a
                                  href={montarLinkWhatsapp(contato.whatsapp || contato.telefone)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="linkContatoWhatsapp"
                                >
                                  {normalizarTelefone(contato.whatsapp || contato.telefone)}
                                </a>
                              ) : (
                                <span>Telefone nao informado</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="grupoEtiquetasContato">
                              <span className={`etiquetaStatus ${contato.status ? 'ativo' : 'inativo'}`}>
                                {contato.status ? 'Ativo' : 'Inativo'}
                              </span>
                              {contato.principal ? (
                                <span className="etiquetaStatus etiquetaPrincipal">Principal</span>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <div className="acoesContatoModal">
                              <BotaoAcaoGrade icone="editar" titulo="Editar contato" onClick={() => editarContato(contato)} disabled={somenteLeitura} />
                              <BotaoAcaoGrade icone="inativar" titulo="Inativar contato" onClick={() => inativarContato(contato.idContato)} disabled={somenteLeitura} />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="mensagemTabelaContatosModal">
                          Nenhum contato cadastrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {abaAtiva === 'atendimento' ? (
            <section className="painelContatosModalCliente painelAtendimentosCliente">
              <div className="cabecalhoGradeContatosModal">
                <div>
                  <h3>Ultimos atendimentos</h3>
                  <p className="subtituloGradeAtendimentoCliente">Exibindo os 30 registros mais recentes deste cliente.</p>
                </div>
              </div>

              <div className="gradeContatosModal gradeAtendimentosCliente">
                <table className="tabelaContatosModal tabelaAtendimentosCliente">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Assunto</th>
                      <th>Canal</th>
                      <th>Usuario</th>
                      <th className="cabecalhoAcoesContato">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carregandoAtendimentos ? (
                      <tr>
                        <td colSpan={5} className="mensagemTabelaContatosModal">
                          Carregando atendimentos...
                        </td>
                      </tr>
                    ) : mensagemErroAtendimentos ? (
                      <tr>
                        <td colSpan={5} className="mensagemTabelaContatosModal">
                          {mensagemErroAtendimentos}
                        </td>
                      </tr>
                    ) : !cliente?.idCliente ? (
                      <tr>
                        <td colSpan={5} className="mensagemTabelaContatosModal">
                          Os atendimentos ficarao disponiveis apos salvar o cliente.
                        </td>
                      </tr>
                    ) : atendimentosCliente.length > 0 ? (
                      atendimentosCliente.map((atendimento) => (
                        <tr key={atendimento.idAtendimento}>
                          <td>{formatarDataAtendimento(atendimento.data)}</td>
                          <td>
                            <div className="celulaContatoModal">
                              <strong>{atendimento.assunto}</strong>
                              <span>{atendimento.nomeContato || atendimento.descricao || 'Sem detalhes adicionais'}</span>
                            </div>
                          </td>
                          <td>{atendimento.nomeCanalAtendimento}</td>
                          <td>{atendimento.nomeUsuario}</td>
                          <td>
                            <div className="acoesContatoModal">
                              <BotaoAcaoGrade
                                icone="consultar"
                                titulo="Consultar atendimento"
                                onClick={() => consultarAtendimento(atendimento)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="mensagemTabelaContatosModal">
                          Nenhum atendimento encontrado para este cliente.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {abaAtiva === 'vendas' ? (
            <section className="painelVazioModalCliente">
              <p>Conteudo em construcao.</p>
            </section>
          ) : null}
        </div>

        {mensagemErro ? <p className="mensagemErroFormulario">{mensagemErro}</p> : null}

        {modalContatoAberto ? (
          <div className="camadaModalContato" role="presentation" onMouseDown={fecharModalContatoNoFundo}>
            <section className="modalContatoCliente" role="dialog" aria-modal="true" aria-labelledby="tituloModalContato" onMouseDown={(evento) => evento.stopPropagation()}>
              <div className="cabecalhoModalContato">
                <h3 id="tituloModalContato">
                  {modoContato === 'consulta'
                    ? 'Consultar contato'
                    : modoContato === 'edicao' ? 'Editar contato' : 'Adicionar contato'}
                </h3>
                <div className="acoesFormularioContatoModal">
                  <Botao variante="secundario" type="button" onClick={fecharModalContato}>
                    {modoContato === 'consulta' ? 'Fechar' : 'Cancelar'}
                  </Botao>
                  {modoContato !== 'consulta' ? (
                    <Botao variante="primario" type="button" onClick={salvarContatoLocal}>
                      {modoContato === 'edicao' ? 'Atualizar contato' : 'Adicionar contato'}
                    </Botao>
                  ) : null}
                </div>
              </div>

              <div className="corpoModalContato">
                <div className="gradeCamposModalCliente">
                  <CampoFormulario label="Nome" name="nome" value={formularioContato.nome} onChange={alterarCampoContato} disabled={modoContato === 'consulta'} />
                  <CampoFormulario label="Cargo" name="cargo" value={formularioContato.cargo} onChange={alterarCampoContato} disabled={modoContato === 'consulta'} />
                  <CampoFormulario label="E-mail" name="email" type="email" value={formularioContato.email} onChange={alterarCampoContato} disabled={modoContato === 'consulta'} />
                  <CampoFormulario label="Telefone" name="telefone" value={formularioContato.telefone} onChange={alterarCampoContato} disabled={modoContato === 'consulta'} />
                  <CampoFormulario label="WhatsApp" name="whatsapp" value={formularioContato.whatsapp} onChange={alterarCampoContato} disabled={modoContato === 'consulta'} />
                  <label className="campoCheckboxFormulario" htmlFor="statusContato">
                    <input id="statusContato" type="checkbox" name="status" checked={formularioContato.status} onChange={alterarCampoContato} disabled={modoContato === 'consulta'} />
                    <span>Contato ativo</span>
                  </label>
                  <label className="campoCheckboxFormulario" htmlFor="principalContato">
                    <input id="principalContato" type="checkbox" name="principal" checked={formularioContato.principal} onChange={alterarCampoContato} disabled={modoContato === 'consulta'} />
                    <span>Contato principal</span>
                  </label>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        <ModalAtendimento
          aberto={modalAtendimentoAberto}
          atendimento={atendimentoSelecionado}
          clientes={cliente ? [cliente] : []}
          contatos={contatos}
          usuarioLogado={null}
          canaisAtendimento={canaisAtendimento}
          origensAtendimento={origensAtendimento}
          modo="consulta"
          aoFechar={fecharModalAtendimento}
          aoSalvar={async () => {}}
        />

        {confirmandoSaida ? (
          <div className="camadaConfirmacaoModal" role="presentation" onMouseDown={fecharConfirmacaoSaida}>
            <div
              className="modalConfirmacaoAgenda"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="tituloConfirmacaoSaidaCliente"
              onMouseDown={(evento) => evento.stopPropagation()}
            >
              <div className="cabecalhoConfirmacaoModal">
                <h4 id="tituloConfirmacaoSaidaCliente">Cancelar cadastro</h4>
              </div>

              <div className="corpoConfirmacaoModal">
                <p>Se fechar agora, todas as informacoes preenchidas serao perdidas.</p>
              </div>

              <div className="acoesConfirmacaoModal">
                <Botao variante="secundario" type="button" onClick={fecharConfirmacaoSaida} disabled={salvando}>
                  Nao
                </Botao>
                <Botao variante="perigo" type="button" onClick={confirmarSaida} disabled={salvando}>
                  Sim
                </Botao>
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );

  function fecharAoClicarNoFundo(evento) {
    if (evento.target === evento.currentTarget && !salvando) {
      tentarFecharModal();
    }
  }

  function tentarFecharModal() {
    if (!somenteLeitura && modoInclusao) {
      definirConfirmandoSaida(true);
      return;
    }

    aoFechar();
  }

  function fecharConfirmacaoSaida() {
    if (salvando) {
      return;
    }

    definirConfirmandoSaida(false);
  }

  function confirmarSaida() {
    definirConfirmandoSaida(false);
    aoFechar();
  }

  function fecharModalContato() {
    definirModalContatoAberto(false);
    definirModoContato('novo');
  }

  function fecharModalContatoNoFundo(evento) {
    if (evento.target === evento.currentTarget) {
      fecharModalContato();
    }
  }
}

function CampoFormulario({ label, name, type = 'text', ...props }) {
  return (
    <div className="campoFormulario">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} className="entradaFormulario" {...props} />
    </div>
  );
}

function CampoFormularioComAcao({
  label,
  name,
  aoAcionar,
  carregando,
  rotuloAcao,
  somenteIcone = false,
  disabled = false,
  ...props
}) {
  return (
    <div className="campoFormulario">
      <label htmlFor={name}>{label}</label>
      <div className="campoComAcao">
        <input id={name} name={name} type="text" className="entradaFormulario" disabled={disabled} {...props} />
        <Botao variante="secundario" icone="pesquisa" type="button" className="botaoCampoAcao" onClick={aoAcionar} disabled={carregando || disabled} somenteIcone={somenteIcone} title={rotuloAcao} aria-label={rotuloAcao}>
          {carregando ? 'Buscando...' : rotuloAcao}
        </Botao>
      </div>
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

function criarFormularioCliente(cliente, idVendedorBloqueado) {
  if (!cliente) {
    return {
      ...estadoInicialFormulario,
      idVendedor: idVendedorBloqueado ? String(idVendedorBloqueado) : ''
    };
  }

  return {
    idVendedor: String(cliente.idVendedor || ''),
    idRamo: String(cliente.idRamo || ''),
    razaoSocial: cliente.razaoSocial || '',
    nomeFantasia: cliente.nomeFantasia || '',
    tipo: cliente.tipo || '',
    cnpj: cliente.cnpj || '',
    inscricaoEstadual: cliente.inscricaoEstadual || '',
    email: cliente.email || '',
    telefone: cliente.telefone || '',
    logradouro: cliente.logradouro || '',
    numero: cliente.numero || '',
    complemento: cliente.complemento || '',
    bairro: cliente.bairro || '',
    cidade: cliente.cidade || '',
    estado: cliente.estado || '',
    cep: cliente.cep || '',
    observacao: cliente.observacao || '',
    imagem: cliente.imagem || '',
    status: Boolean(cliente.status)
  };
}

function criarContatosFormulario(contatos) {
  return (contatos || []).map((contato) => ({
    idContato: contato.idContato,
    nome: contato.nome || '',
    cargo: contato.cargo || '',
    email: contato.email || '',
    telefone: contato.telefone || '',
    whatsapp: contato.whatsapp || '',
    status: Boolean(contato.status),
    principal: Boolean(contato.principal)
  }));
}

function criarFormularioContato(contato) {
  if (!contato) {
    return estadoInicialContato;
  }

  return {
    idContato: contato.idContato || '',
    nome: contato.nome || '',
    cargo: contato.cargo || '',
    email: contato.email || '',
    telefone: contato.telefone || '',
    whatsapp: contato.whatsapp || '',
    status: Boolean(contato.status),
    principal: Boolean(contato.principal)
  };
}

function obterIniciaisCliente(cliente) {
  const nomeBase = cliente.nomeFantasia || cliente.razaoSocial || 'Cliente';

  return nomeBase
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');
}

function formatarCep(cep) {
  const digitos = String(cep || '').replace(/\D/g, '').slice(0, 8);

  if (digitos.length <= 5) {
    return digitos;
  }

  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

function formatarCnpj(cnpj) {
  const digitos = String(cnpj || '').replace(/\D/g, '').slice(0, 14);

  return digitos
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function montarLogradouroCnpj(dadosCnpj) {
  const partes = [
    normalizarTextoCapitalizado(dadosCnpj.descricao_tipo_de_logradouro),
    normalizarTextoCapitalizado(dadosCnpj.logradouro)
  ].filter(Boolean);

  return partes.join(' ');
}

function normalizarTextoCapitalizado(valor) {
  if (!valor) {
    return '';
  }

  return String(valor)
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ');
}

function montarLinkWhatsapp(telefone) {
  const digitos = String(telefone || '').replace(/\D/g, '');

  if (!digitos) {
    return '#';
  }

  const telefoneComPais = digitos.startsWith('55') ? digitos : `55${digitos}`;

  return `https://wa.me/${telefoneComPais}`;
}

function enriquecerAtendimentosCliente(
  atendimentos,
  idCliente,
  contatos,
  usuarios,
  canaisAtendimento,
  origensAtendimento
) {
  const contatosPorId = new Map(
    (contatos || []).map((contato) => [contato.idContato, contato.nome])
  );
  const usuariosPorId = new Map(
    (usuarios || []).map((usuario) => [usuario.idUsuario, usuario.nome])
  );
  const canaisPorId = new Map(
    (canaisAtendimento || []).map((canal) => [canal.idCanalAtendimento, canal.descricao])
  );
  const origensPorId = new Map(
    (origensAtendimento || []).map((origem) => [origem.idOrigemAtendimento, origem.descricao])
  );

  return (atendimentos || [])
    .filter((atendimento) => String(atendimento.idCliente) === String(idCliente))
    .sort(ordenarAtendimentosMaisRecentes)
    .slice(0, 30)
    .map((atendimento) => ({
      ...atendimento,
      nomeContato: contatosPorId.get(atendimento.idContato) || '',
      nomeUsuario: usuariosPorId.get(atendimento.idUsuario) || 'Nao informado',
      nomeCanalAtendimento: canaisPorId.get(atendimento.idCanalAtendimento) || 'Nao informado',
      nomeOrigemAtendimento: origensPorId.get(atendimento.idOrigemAtendimento) || 'Nao informado'
    }));
}

function ordenarAtendimentosMaisRecentes(atendimentoA, atendimentoB) {
  const dataHoraA = `${atendimentoA.data || ''}T${atendimentoA.horaInicio || '00:00'}`;
  const dataHoraB = `${atendimentoB.data || ''}T${atendimentoB.horaInicio || '00:00'}`;

  return new Date(dataHoraB).getTime() - new Date(dataHoraA).getTime();
}

function formatarDataAtendimento(data) {
  if (!data) {
    return 'Nao informada';
  }

  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${data}T00:00:00`));
}
