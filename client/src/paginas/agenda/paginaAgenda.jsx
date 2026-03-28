import { useEffect, useMemo, useState } from 'react';
import { Botao } from '../../componentes/comuns/botao';
import { ModalFiltros } from '../../componentes/comuns/modalFiltros';
import { CorpoPagina } from '../../componentes/layout/corpoPagina';
import { listarClientes, listarContatos, listarVendedores } from '../../servicos/clientes';
import { listarEmpresas } from '../../servicos/empresa';
import { listarUsuarios } from '../../servicos/usuarios';
import {
  atualizarAgendamento,
  excluirAgendamento,
  incluirAgendamento,
  listarAgendamentos,
  listarLocaisAgenda,
  listarRecursosAgenda,
  listarStatusVisita,
  listarTiposAgenda,
  listarTiposRecurso
} from '../../servicos/agenda';
import { ModalAgendamento } from './modalAgendamento';

const minutosInicioPadrao = 8 * 60;
const minutosFimPadrao = 18 * 60;
const intervaloMinutos = 15;
const alturaLinhaAgenda = 22;
const espacoVerticalCelulaAgenda = 4;
const configuracaoExpedientePadrao = {
  horaInicioManha: '08:00',
  horaFimManha: '12:00',
  horaInicioTarde: '13:00',
  horaFimTarde: '18:00',
  trabalhaSabado: false,
  horaInicioSabado: '08:00',
  horaFimSabado: '12:00'
};
const filtrosIniciaisAgenda = {
  idUsuario: [],
  idVendedor: '',
  idCliente: '',
  idLocal: '',
  idRecurso: [],
  idStatusVisita: ''
};

export function PaginaAgenda({ usuarioLogado }) {
  const [dataBase, definirDataBase] = useState(new Date());
  const [agendamentos, definirAgendamentos] = useState([]);
  const [locais, definirLocais] = useState([]);
  const [recursos, definirRecursos] = useState([]);
  const [tiposAgenda, definirTiposAgenda] = useState([]);
  const [statusVisita, definirStatusVisita] = useState([]);
  const [clientes, definirClientes] = useState([]);
  const [contatos, definirContatos] = useState([]);
  const [usuarios, definirUsuarios] = useState([]);
  const [vendedores, definirVendedores] = useState([]);
  const [empresa, definirEmpresa] = useState(null);
  const [modalAberto, definirModalAberto] = useState(false);
  const [modalFiltrosAberto, definirModalFiltrosAberto] = useState(false);
  const [dadosIniciaisModal, definirDadosIniciaisModal] = useState(null);
  const [idAgendamentoSelecionado, definirIdAgendamentoSelecionado] = useState(null);
  const [agendamentoCopiado, definirAgendamentoCopiado] = useState(null);
  const [faixaSelecionada, definirFaixaSelecionada] = useState(null);
  const [arrastandoFaixa, definirArrastandoFaixa] = useState(null);
  const [filtros, definirFiltros] = useState(() => criarFiltrosIniciaisAgenda(usuarioLogado));

  const inicioSemana = useMemo(() => obterInicioSemana(dataBase), [dataBase]);
  const diasSemana = useMemo(() => criarDiasSemana(inicioSemana), [inicioSemana]);
  const agendamentosFiltrados = useMemo(
    () => filtrarAgendamentos(agendamentos, filtros),
    [agendamentos, filtros]
  );
  const faixaHorariosSemana = useMemo(
    () => calcularFaixaHorariosSemana(agendamentosFiltrados, diasSemana, empresa),
    [agendamentosFiltrados, diasSemana, empresa]
  );
  const horarios = useMemo(
    () => criarHorarios(faixaHorariosSemana.minutosInicio, faixaHorariosSemana.minutosFim),
    [faixaHorariosSemana]
  );
  const filtrosAtivos = Object.values(filtros).some((valor) => (
    Array.isArray(valor) ? valor.length > 0 : Boolean(valor)
  ));

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    definirFiltros((estadoAtual) => {
      if (estadoAtual.idUsuario.length > 0 || !usuarioLogado?.idUsuario) {
        return estadoAtual;
      }

      return {
        ...estadoAtual,
        idUsuario: [String(usuarioLogado.idUsuario)]
      };
    });
  }, [usuarioLogado]);

  useEffect(() => {
    if (!arrastandoFaixa) {
      return undefined;
    }

    function finalizarSelecaoFaixa() {
      definirArrastandoFaixa(null);
    }

    window.addEventListener('mouseup', finalizarSelecaoFaixa);

    return () => {
      window.removeEventListener('mouseup', finalizarSelecaoFaixa);
    };
  }, [arrastandoFaixa]);

  useEffect(() => {
    function tratarAtalhosAgenda(evento) {
      if (modalAberto || modalFiltrosAberto || evento.defaultPrevented) {
        return;
      }

      const elementoAtivo = evento.target;
      const nomeTag = elementoAtivo?.tagName;

      if (elementoAtivo?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(nomeTag)) {
        return;
      }

      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'c') {
        const agendamentoSelecionado = agendamentos.find(
          (agendamento) => String(agendamento.idAgendamento) === String(idAgendamentoSelecionado)
        );

        if (!agendamentoSelecionado) {
          return;
        }

        evento.preventDefault();
        definirAgendamentoCopiado(agendamentoSelecionado);
        return;
      }

      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'v') {
        if (!agendamentoCopiado || !faixaSelecionada?.data || !faixaSelecionada?.horaInicio) {
          return;
        }

        evento.preventDefault();
        colarAgendamentoCopiado();
      }
    }

    window.addEventListener('keydown', tratarAtalhosAgenda);

    return () => {
      window.removeEventListener('keydown', tratarAtalhosAgenda);
    };
  }, [
    agendamentos,
    agendamentoCopiado,
    faixaSelecionada,
    idAgendamentoSelecionado,
    modalAberto,
    modalFiltrosAberto
  ]);

  async function carregarDados() {
    const [
      agendamentosCarregados,
      locaisCarregados,
      recursosCarregados,
      tiposRecursoCarregados,
      tiposAgendaCarregados,
      statusVisitaCarregados,
      clientesCarregados,
      contatosCarregados,
      vendedoresCarregados,
      usuariosCarregados,
      empresasCarregadas
    ] = await Promise.all([
      listarAgendamentos(),
      listarLocaisAgenda(),
      listarRecursosAgenda(),
      listarTiposRecurso(),
      listarTiposAgenda(),
      listarStatusVisita(),
      listarClientes(),
      listarContatos(),
      listarVendedores(),
      listarUsuarios(),
      listarEmpresas()
    ]);

    definirEmpresa(empresasCarregadas[0] || null);
    definirLocais(locaisCarregados);
    definirTiposAgenda(tiposAgendaCarregados.filter((tipoAgenda) => tipoAgenda.status));
    definirStatusVisita(statusVisitaCarregados.filter((status) => status.status));
    definirClientes(clientesCarregados.filter((cliente) => cliente.status));
    definirContatos(contatosCarregados.filter((contato) => contato.status));
    definirVendedores(vendedoresCarregados.filter((vendedor) => vendedor.status));
    definirUsuarios(usuariosCarregados.filter((usuario) => usuario.ativo));
    definirRecursos(enriquecerRecursos(recursosCarregados, tiposRecursoCarregados));
    definirAgendamentos(distribuirAgendamentosPorConflito(enriquecerAgendamentos(
      agendamentosCarregados,
      locaisCarregados,
      recursosCarregados,
      tiposRecursoCarregados,
      tiposAgendaCarregados,
      statusVisitaCarregados,
      clientesCarregados,
      contatosCarregados,
      vendedoresCarregados,
      usuariosCarregados
    )));
    definirIdAgendamentoSelecionado((estadoAtual) => {
      if (!estadoAtual) {
        return null;
      }

      return agendamentosCarregados.some(
        (agendamento) => String(agendamento.idAgendamento) === String(estadoAtual)
      )
        ? estadoAtual
        : null;
    });
    definirAgendamentoCopiado((estadoAtual) => {
      if (!estadoAtual) {
        return null;
      }

      return agendamentosCarregados.find(
        (agendamento) => String(agendamento.idAgendamento) === String(estadoAtual.idAgendamento)
      ) || estadoAtual;
    });
  }

  async function salvarAgendamento(dadosAgendamento) {
    const tipoAgendaSelecionado = tiposAgenda.find(
      (tipoAgenda) => String(tipoAgenda.idTipoAgenda) === String(dadosAgendamento.idTipoAgenda)
    );

    const payload = {
      data: dadosAgendamento.data,
      assunto: dadosAgendamento.assunto.trim(),
      horaInicio: dadosAgendamento.horaInicio,
      horaFim: dadosAgendamento.horaFim,
      idLocal: dadosAgendamento.idLocal ? Number(dadosAgendamento.idLocal) : null,
      idRecurso: dadosAgendamento.idsRecursos[0] ? Number(dadosAgendamento.idsRecursos[0]) : null,
      idsRecursos: dadosAgendamento.idsRecursos.map((idRecurso) => Number(idRecurso)),
      idUsuario: dadosAgendamento.idsUsuarios[0] ? Number(dadosAgendamento.idsUsuarios[0]) : null,
      idsUsuarios: dadosAgendamento.idsUsuarios.map((idUsuario) => Number(idUsuario)),
      idCliente: Number(dadosAgendamento.idCliente),
      idContato: dadosAgendamento.idContato ? Number(dadosAgendamento.idContato) : null,
      tipo: tipoAgendaSelecionado?.descricao || null,
      idTipoAgenda: Number(dadosAgendamento.idTipoAgenda),
      idStatusVisita: Number(dadosAgendamento.idStatusVisita),
      status: 1
    };

    if (dadosAgendamento.idAgendamento) {
      await atualizarAgendamento(dadosAgendamento.idAgendamento, payload);
    } else {
      await incluirAgendamento(payload);
    }

    await carregarDados();
    fecharModalAgendamento();
  }

  function abrirNovoAgendamento(data, horario) {
    definirDadosIniciaisModal({
      data,
      assunto: '',
      horaInicio: horario,
      horaFim: somarMinutosHorario(horario, 60)
    });
    definirModalAberto(true);
  }

  function abrirNovoAgendamentoPorFaixa() {
    if (faixaSelecionada?.data && faixaSelecionada?.horaInicio && faixaSelecionada?.horaFim) {
      definirDadosIniciaisModal({
        data: faixaSelecionada.data,
        assunto: '',
        horaInicio: faixaSelecionada.horaInicio,
        horaFim: faixaSelecionada.horaFim
      });
      definirModalAberto(true);
      return;
    }

    abrirNovoAgendamento(formatarDataIso(new Date()), '08:00');
  }

  function abrirEdicaoAgendamento(agendamento) {
    definirDadosIniciaisModal({
      idAgendamento: String(agendamento.idAgendamento),
      data: agendamento.data,
      assunto: agendamento.assunto || '',
      horaInicio: agendamento.horaInicio,
      horaFim: agendamento.horaFim,
      idLocal: String(agendamento.idLocal),
      idsRecursos: agendamento.idsRecursos,
      idsUsuarios: agendamento.idsUsuarios,
      idCliente: String(agendamento.idCliente),
      idContato: String(agendamento.idContato || ''),
      idTipoAgenda: String(agendamento.idTipoAgenda),
      idStatusVisita: String(agendamento.idStatusVisita || '')
    });
    definirModalAberto(true);
  }

  function fecharModalAgendamento() {
    definirModalAberto(false);
    definirDadosIniciaisModal(null);
  }

  function colarAgendamentoCopiado() {
    if (!agendamentoCopiado || !faixaSelecionada?.data || !faixaSelecionada?.horaInicio) {
      return;
    }

    const duracaoOriginal = Math.max(
      intervaloMinutos,
      converterHorarioParaMinutos(agendamentoCopiado.horaFim) - converterHorarioParaMinutos(agendamentoCopiado.horaInicio)
    );
    const faixaTemDuracaoPersonalizada = (
      faixaSelecionada.horaFim &&
      faixaSelecionada.horaFim !== somarMinutosHorario(faixaSelecionada.horaInicio, intervaloMinutos)
    );
    const horaInicioDestino = faixaSelecionada.horaInicio;
    const horaFimDestino = faixaTemDuracaoPersonalizada
      ? faixaSelecionada.horaFim
      : somarMinutosHorario(horaInicioDestino, duracaoOriginal);

    definirDadosIniciaisModal({
      data: faixaSelecionada.data,
      assunto: agendamentoCopiado.assunto || '',
      horaInicio: horaInicioDestino,
      horaFim: horaFimDestino,
      idLocal: agendamentoCopiado.idLocal ? String(agendamentoCopiado.idLocal) : '',
      idsRecursos: Array.isArray(agendamentoCopiado.idsRecursos)
        ? agendamentoCopiado.idsRecursos.map((idRecurso) => String(idRecurso))
        : [],
      idsUsuarios: Array.isArray(agendamentoCopiado.idsUsuarios)
        ? agendamentoCopiado.idsUsuarios.map((idUsuario) => String(idUsuario))
        : [],
      idCliente: agendamentoCopiado.idCliente ? String(agendamentoCopiado.idCliente) : '',
      idContato: agendamentoCopiado.idContato ? String(agendamentoCopiado.idContato) : '',
      idTipoAgenda: agendamentoCopiado.idTipoAgenda ? String(agendamentoCopiado.idTipoAgenda) : '',
      idStatusVisita: agendamentoCopiado.idStatusVisita ? String(agendamentoCopiado.idStatusVisita) : ''
    });
    definirModalAberto(true);
  }

  async function excluirRegistroAgendamento(idAgendamento) {
    await excluirAgendamento(idAgendamento);
    await carregarDados();
    fecharModalAgendamento();
  }

  function iniciarSelecaoFaixa(evento, data, horario) {
    evento.preventDefault();

    const faixaInicial = {
      data,
      horaInicio: horario,
      horaFim: somarMinutosHorario(horario, intervaloMinutos)
    };

    definirIdAgendamentoSelecionado(null);
    definirFaixaSelecionada(faixaInicial);
    definirArrastandoFaixa({
      data,
      horarioInicial: horario,
      horarioAtual: horario
    });
  }

  function expandirSelecaoFaixa(data, horario) {
    if (!arrastandoFaixa || arrastandoFaixa.data !== data) {
      return;
    }

    const faixaAtualizada = criarFaixaPorHorarios(data, arrastandoFaixa.horarioInicial, horario);
    definirArrastandoFaixa((estadoAtual) => ({
      ...estadoAtual,
      horarioAtual: horario
    }));
    definirFaixaSelecionada(faixaAtualizada);
  }

  return (
    <>
      <header className="cabecalhoPagina">
        <div>
          <h1>Agenda</h1>
          <p>Visualizacao semanal de segunda a sexta, com grade de 15 em 15 minutos.</p>
        </div>

        <div className="acoesCabecalhoPagina">
          <Botao
            variante="primario"
            icone="adicionar"
            somenteIcone
            title="Incluir agendamento"
            aria-label="Incluir agendamento"
            onClick={abrirNovoAgendamentoPorFaixa}
          >
            Incluir agendamento
          </Botao>
          <Botao
            variante={filtrosAtivos ? 'primario' : 'secundario'}
            icone="filtro"
            somenteIcone
            title="Filtrar"
            aria-label="Filtrar"
            onClick={() => definirModalFiltrosAberto(true)}
          >
            Filtrar
          </Botao>
          <Botao
            variante="secundario"
            icone="anterior"
            somenteIcone
            title="Semana anterior"
            aria-label="Semana anterior"
            onClick={() => definirDataBase(adicionarDias(inicioSemana, -7))}
          >
            Semana anterior
          </Botao>
          <Botao variante="secundario" onClick={() => definirDataBase(new Date())}>
            Hoje
          </Botao>
          <Botao
            variante="secundario"
            icone="proximo"
            somenteIcone
            title="Proxima semana"
            aria-label="Proxima semana"
            onClick={() => definirDataBase(adicionarDias(inicioSemana, 7))}
          >
            Proxima semana
          </Botao>
        </div>
      </header>

      <CorpoPagina>
        <section className="painelAgenda">
          <div className="agendaSemanal">
            <div className="cabecalhoAgendaGrade">
              <div className="colunaHorarioAgenda cabecalhoHorarioAgenda" />
              {diasSemana.map((dia) => (
                <div key={dia.iso} className="cabecalhoDiaAgenda">
                  <strong>{dia.rotulo}</strong>
                  <span>{dia.data}</span>
                </div>
              ))}
            </div>

            <div className="corpoAgendaGrade">
              <div className="linhaAgenda linhaAgendaEspaco" aria-hidden="true">
                <div className="colunaHorarioAgenda colunaHorarioAgendaEspaco" />
                {diasSemana.map((dia) => (
                  <div key={`espaco-${dia.iso}`} className="celulaAgenda celulaAgendaEspaco" />
                ))}
              </div>

              {horarios.map((horario) => (
                <div key={horario} className="linhaAgenda">
                  <div className="colunaHorarioAgenda etiquetaHorarioAgenda">{horario}</div>
                  {diasSemana.map((dia, indiceDia) => {
                    const agendamentosCelula = agendamentosFiltrados.filter(
                      (agendamento) => agendamento.data === dia.valor && agendamento.horaInicio === horario
                    );

                    return (
                      <div
                        key={`${dia.iso}-${horario}`}
                        className={`celulaAgenda ${horarioNoIntervaloSemExpediente(horario, empresa) ? 'celulaAgendaSemExpediente' : ''} ${celulaEstaNaFaixaSelecionada(faixaSelecionada, dia.valor, horario) ? 'celulaAgendaSelecionada' : ''}`}
                        onMouseDown={(evento) => iniciarSelecaoFaixa(evento, dia.valor, horario)}
                        onMouseEnter={() => expandirSelecaoFaixa(dia.valor, horario)}
                        onDoubleClick={() => abrirNovoAgendamento(dia.valor, horario)}
                      >
                        {agendamentosCelula.map((agendamento) => (
                          <button
                            key={agendamento.idAgendamento}
                            type="button"
                            className={`cartaoAgendamentoAgenda ${String(idAgendamentoSelecionado) === String(agendamento.idAgendamento) ? 'selecionado' : ''} ${indiceDia >= 3 ? 'tooltipEsquerda' : 'tooltipDireita'}`}
                            style={{
                              height: `${calcularAlturaAgendamento(agendamento.horaInicio, agendamento.horaFim)}px`,
                              background: criarEstiloCartaoAgenda(agendamento.corTipoAgenda),
                              color: criarCorTextoCartaoAgenda(agendamento.corTipoAgenda),
                              boxShadow: criarSombraCartaoAgenda(agendamento.corTipoAgenda),
                              '--corSelecaoAgenda': converterHexParaRgba(agendamento.corTipoAgenda, 0.42),
                              '--corSelecaoAgendaSuave': converterHexParaRgba(agendamento.corTipoAgenda, 0.16),
                              ...criarPosicionamentoCartaoAgenda(
                                agendamento.indiceColunaAgenda,
                                agendamento.totalColunasAgenda
                              )
                            }}
                            onClick={(evento) => {
                              evento.stopPropagation();
                              definirIdAgendamentoSelecionado(agendamento.idAgendamento);
                            }}
                            onDoubleClick={(evento) => {
                              evento.stopPropagation();
                              definirIdAgendamentoSelecionado(agendamento.idAgendamento);
                              abrirEdicaoAgendamento(agendamento);
                            }}
                          >
                            <strong>{agendamento.assunto || 'Sem assunto'}</strong>
                            <small>{agendamento.horaInicio} - {agendamento.horaFim}</small>
                            <div className="rodapeCartaoAgendamentoAgenda">
                              {agendamento.iconeStatusVisita ? (
                                <span className="iconeStatusCartaoAgenda" aria-label={agendamento.nomeStatusVisita} title={agendamento.nomeStatusVisita}>
                                  {agendamento.iconeStatusVisita}
                                </span>
                              ) : null}
                            </div>
                            <span className="tooltipAgendamentoAgenda" role="tooltip">
                              {criarLinhasTooltipAgendamento(agendamento).map((linha, indiceLinha) => (
                                indiceLinha === 0
                                  ? <strong key={`${agendamento.idAgendamento}-tooltip-${indiceLinha}`}>{linha}</strong>
                                  : <span key={`${agendamento.idAgendamento}-tooltip-${indiceLinha}`}>{linha}</span>
                              ))}
                            </span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      </CorpoPagina>

      <ModalAgendamento
        aberto={modalAberto}
        dadosIniciais={dadosIniciaisModal}
        locais={locais.filter((local) => local.status)}
        recursos={recursos.filter((recurso) => recurso.status)}
        clientes={clientes}
        contatos={contatos}
        usuarios={usuarios}
        tiposAgenda={tiposAgenda}
        statusVisita={statusVisita}
        usuarioLogado={usuarioLogado}
        permitirExcluir={usuarioLogado?.tipo !== 'Usuario padrao'}
        aoFechar={fecharModalAgendamento}
        aoSalvar={salvarAgendamento}
        aoExcluir={excluirRegistroAgendamento}
      />
      <ModalFiltros
        aberto={modalFiltrosAberto}
        titulo="Filtros da agenda"
        filtros={filtros}
        campos={[
          {
            name: 'idUsuario',
            label: 'Usuario',
            multiple: true,
            placeholder: 'Todos os usuarios',
            options: usuarios.map((usuario) => ({
              valor: String(usuario.idUsuario),
              label: usuario.nome
            }))
          },
          {
            name: 'idVendedor',
            label: 'Vendedor',
            options: vendedores.map((vendedor) => ({
              valor: String(vendedor.idVendedor),
              label: vendedor.nome
            }))
          },
          {
            name: 'idCliente',
            label: 'Cliente',
            options: clientes.map((cliente) => ({
              valor: String(cliente.idCliente),
              label: cliente.nomeFantasia || cliente.razaoSocial
            }))
          },
          {
            name: 'idLocal',
            label: 'Local',
            options: locais
              .filter((local) => local.status)
              .map((local) => ({
                valor: String(local.idLocal),
                label: local.descricao
              }))
          },
          {
            name: 'idRecurso',
            label: 'Recurso',
            multiple: true,
            placeholder: 'Todos os recursos',
            options: recursos
              .filter((recurso) => recurso.status)
              .map((recurso) => ({
                valor: String(recurso.idRecurso),
                label: `${recurso.sigla} - ${recurso.descricao}`
              }))
          },
          {
            name: 'idStatusVisita',
            label: 'Status',
            options: statusVisita.map((status) => ({
              valor: String(status.idStatusVisita),
              label: status.descricao
            }))
          }
        ]}
        aoFechar={() => definirModalFiltrosAberto(false)}
        aoAplicar={(novosFiltros) => {
          definirFiltros(novosFiltros);
          definirModalFiltrosAberto(false);
        }}
        aoLimpar={() => definirFiltros(criarFiltrosIniciaisAgenda(usuarioLogado))}
      />
    </>
  );
}

function criarFiltrosIniciaisAgenda(usuarioLogado) {
  return {
    ...filtrosIniciaisAgenda,
    idUsuario: usuarioLogado?.idUsuario ? [String(usuarioLogado.idUsuario)] : []
  };
}

function obterInicioSemana(data) {
  const dataNormalizada = new Date(data);
  dataNormalizada.setHours(0, 0, 0, 0);

  const diaSemana = dataNormalizada.getDay();
  const diferenca = diaSemana === 0 ? -6 : 1 - diaSemana;
  dataNormalizada.setDate(dataNormalizada.getDate() + diferenca);

  return dataNormalizada;
}

function criarDiasSemana(inicioSemana) {
  const rotulos = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta'];

  return rotulos.map((rotulo, indice) => {
    const data = adicionarDias(inicioSemana, indice);

    return {
      rotulo,
      data: data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      }),
      valor: formatarDataIso(data),
      iso: data.toISOString()
    };
  });
}

function criarHorarios(minutosInicio, minutosFim) {
  const horarios = [];

  for (let minutos = minutosInicio; minutos <= minutosFim; minutos += intervaloMinutos) {
    const horas = String(Math.floor(minutos / 60)).padStart(2, '0');
    const restoMinutos = String(minutos % 60).padStart(2, '0');
    horarios.push(`${horas}:${restoMinutos}`);
  }

  return horarios;
}

function calcularFaixaHorariosSemana(agendamentos, diasSemana, empresa) {
  const datasSemana = new Set(diasSemana.map((dia) => dia.valor));
  const agendamentosSemana = agendamentos.filter((agendamento) => datasSemana.has(agendamento.data));
  const configuracaoExpediente = obterConfiguracaoExpediente(empresa);
  const inicioPadrao = converterHorarioParaMinutos(configuracaoExpediente.horaInicioManha);
  const fimPadrao = converterHorarioParaMinutos(configuracaoExpediente.horaFimTarde);

  if (agendamentosSemana.length === 0) {
    return {
      minutosInicio: inicioPadrao,
      minutosFim: fimPadrao
    };
  }

  const menorHorario = agendamentosSemana.reduce((menorAtual, agendamento) => (
    Math.min(menorAtual, converterHorarioParaMinutos(agendamento.horaInicio))
  ), Number.POSITIVE_INFINITY);

  const maiorHorario = agendamentosSemana.reduce((maiorAtual, agendamento) => (
    Math.max(maiorAtual, converterHorarioParaMinutos(agendamento.horaFim))
  ), 0);

  return {
    minutosInicio: Math.min(inicioPadrao, arredondarMinutosParaBaixo(menorHorario)),
    minutosFim: Math.max(fimPadrao, arredondarMinutosParaCima(maiorHorario))
  };
}

function adicionarDias(data, dias) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + dias);
  return novaData;
}

function formatarPeriodoSemana(diasSemana) {
  const primeiroDia = diasSemana[0];
  const ultimoDia = diasSemana[diasSemana.length - 1];

  return `${primeiroDia.data} a ${ultimoDia.data}`;
}

function formatarDataIso(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function somarMinutosHorario(horario, minutosSomados) {
  const [horas, minutos] = horario.split(':').map(Number);
  const totalMinutos = (horas * 60) + minutos + minutosSomados;
  const novasHoras = String(Math.floor(totalMinutos / 60)).padStart(2, '0');
  const novosMinutos = String(totalMinutos % 60).padStart(2, '0');
  return `${novasHoras}:${novosMinutos}`;
}

function calcularAlturaAgendamento(horaInicio, horaFim) {
  const duracaoMinutos = converterHorarioParaMinutos(horaFim) - converterHorarioParaMinutos(horaInicio);
  const quantidadeIntervalos = Math.max(1, Math.ceil(duracaoMinutos / intervaloMinutos));
  return (quantidadeIntervalos * alturaLinhaAgenda) - espacoVerticalCelulaAgenda;
}

function converterHorarioParaMinutos(horario) {
  const [horas, minutos] = String(horario || '00:00').split(':').map(Number);
  return (horas * 60) + minutos;
}

function arredondarMinutosParaBaixo(totalMinutos) {
  return Math.floor(totalMinutos / intervaloMinutos) * intervaloMinutos;
}

function arredondarMinutosParaCima(totalMinutos) {
  return Math.ceil(totalMinutos / intervaloMinutos) * intervaloMinutos;
}

function obterConfiguracaoExpediente(empresa) {
  return {
    horaInicioManha: empresa?.horaInicioManha || configuracaoExpedientePadrao.horaInicioManha,
    horaFimManha: empresa?.horaFimManha || configuracaoExpedientePadrao.horaFimManha,
    horaInicioTarde: empresa?.horaInicioTarde || configuracaoExpedientePadrao.horaInicioTarde,
    horaFimTarde: empresa?.horaFimTarde || configuracaoExpedientePadrao.horaFimTarde,
    trabalhaSabado: Boolean(empresa?.trabalhaSabado),
    horaInicioSabado: empresa?.horaInicioSabado || configuracaoExpedientePadrao.horaInicioSabado,
    horaFimSabado: empresa?.horaFimSabado || configuracaoExpedientePadrao.horaFimSabado
  };
}

function horarioNoIntervaloSemExpediente(horario, empresa) {
  const configuracaoExpediente = obterConfiguracaoExpediente(empresa);
  const minutosHorario = converterHorarioParaMinutos(horario);
  const minutosFimManha = converterHorarioParaMinutos(configuracaoExpediente.horaFimManha);
  const minutosInicioTarde = converterHorarioParaMinutos(configuracaoExpediente.horaInicioTarde);

  return minutosHorario >= minutosFimManha && minutosHorario < minutosInicioTarde;
}

function enriquecerRecursos(recursos, tiposRecurso) {
  const tiposPorId = new Map(
    tiposRecurso.map((tipo) => [tipo.idTipoRecurso, tipo.descricao])
  );

  return recursos.map((recurso) => ({
    ...recurso,
    nomeTipoRecurso: tiposPorId.get(recurso.idTipoRecurso) || 'Nao informado'
  }));
}

function enriquecerAgendamentos(
  agendamentos,
  locais,
  recursos,
  tiposRecurso,
  tiposAgenda,
  statusVisita,
  clientes,
  contatos,
  vendedores,
  usuarios
) {
  const locaisPorId = new Map(locais.map((local) => [local.idLocal, local.descricao]));
  const tiposPorId = new Map(tiposRecurso.map((tipo) => [tipo.idTipoRecurso, tipo.descricao]));
  const recursosPorId = new Map(
    recursos.map((recurso) => [
      recurso.idRecurso,
      `${recurso.sigla} - ${recurso.descricao} (${tiposPorId.get(recurso.idTipoRecurso) || 'Nao informado'})`
    ])
  );
  const clientesPorId = new Map(
    clientes.map((cliente) => [cliente.idCliente, cliente.nomeFantasia || cliente.razaoSocial])
  );
  const contatosPorId = new Map(
    contatos.map((contato) => [contato.idContato, contato.nome])
  );
  const vendedoresPorId = new Map(
    vendedores.map((vendedor) => [vendedor.idVendedor, vendedor.nome])
  );
  const usuariosPorId = new Map(
    usuarios.map((usuario) => [usuario.idUsuario, usuario.nome])
  );
  const tiposAgendaPorId = new Map(
    tiposAgenda.map((tipoAgenda) => [tipoAgenda.idTipoAgenda, tipoAgenda])
  );
  const statusVisitaPorId = new Map(
    statusVisita.map((status) => [status.idStatusVisita, status])
  );

  return agendamentos.map((agendamento) => ({
    ...agendamento,
    nomeLocal: locaisPorId.get(agendamento.idLocal) || 'Nao informado',
    nomeRecurso: recursosPorId.get(agendamento.idRecurso) || 'Nao informado',
    nomeCliente: clientesPorId.get(agendamento.idCliente) || 'Nao informado',
    idVendedor: clientes.find((cliente) => String(cliente.idCliente) === String(agendamento.idCliente))?.idVendedor || null,
    nomeVendedor: vendedoresPorId.get(
      clientes.find((cliente) => String(cliente.idCliente) === String(agendamento.idCliente))?.idVendedor
    ) || '',
    nomeContato: contatosPorId.get(agendamento.idContato) || '',
    nomeUsuario: usuariosPorId.get(agendamento.idUsuario) || 'Nao informado',
    nomesUsuarios: (Array.isArray(agendamento.idsUsuarios) ? agendamento.idsUsuarios : [])
      .map((idUsuario) => usuariosPorId.get(idUsuario))
      .filter(Boolean),
    nomesRecursos: (Array.isArray(agendamento.idsRecursos) ? agendamento.idsRecursos : [])
      .map((idRecurso) => recursosPorId.get(idRecurso))
      .filter(Boolean),
    nomeTipoAgenda: tiposAgendaPorId.get(agendamento.idTipoAgenda)?.descricao || agendamento.tipo || 'Nao informado',
    corTipoAgenda: tiposAgendaPorId.get(agendamento.idTipoAgenda)?.cor || '#D9EAF7',
    nomeStatusVisita: statusVisitaPorId.get(agendamento.idStatusVisita)?.descricao || 'Nao informado',
    iconeStatusVisita: statusVisitaPorId.get(agendamento.idStatusVisita)?.icone || ''
  }));
}

function criarEstiloCartaoAgenda(cor) {
  const corCartao = cor || '#D9EAF7';
  return `linear-gradient(180deg, ${misturarCorComBase(corCartao, '#0F172A', 0.42)}, ${misturarCorComBase(corCartao, '#08111F', 0.58)})`;
}

function criarCorTextoCartaoAgenda(cor) {
  return misturarCorComBase(cor || '#D9EAF7', '#FFFFFF', 0.72);
}

function criarSombraCartaoAgenda(cor) {
  const corSombra = cor || '#D9EAF7';
  return `0 4px 10px ${converterHexParaRgba(corSombra, 0.18)}`;
}

function criarPosicionamentoCartaoAgenda(indice, quantidade) {
  const total = Math.max(1, quantidade);
  const espacamentoHorizontal = 4;
  const recuoHorizontal = 4;
  const larguraColuna = `calc((100% - ${(recuoHorizontal * 2) + ((total - 1) * espacamentoHorizontal)}px) / ${total})`;

  return {
    width: larguraColuna,
    left: `calc(${recuoHorizontal}px + (${indice} * (${larguraColuna} + ${espacamentoHorizontal}px)))`
  };
}

function distribuirAgendamentosPorConflito(agendamentos) {
  const agendamentosPorData = new Map();

  agendamentos.forEach((agendamento) => {
    const listaData = agendamentosPorData.get(agendamento.data) || [];
    listaData.push(agendamento);
    agendamentosPorData.set(agendamento.data, listaData);
  });

  return Array.from(agendamentosPorData.values()).flatMap((agendamentosData) => {
    const ordenados = [...agendamentosData].sort((primeiro, segundo) => {
      const diferencaInicio = converterHorarioParaMinutos(primeiro.horaInicio) - converterHorarioParaMinutos(segundo.horaInicio);

      if (diferencaInicio !== 0) {
        return diferencaInicio;
      }

      return converterHorarioParaMinutos(primeiro.horaFim) - converterHorarioParaMinutos(segundo.horaFim);
    });

    const grupos = [];
    let grupoAtual = [];
    let fimGrupoAtual = -1;

    ordenados.forEach((agendamento) => {
      const inicioAtual = converterHorarioParaMinutos(agendamento.horaInicio);
      const fimAtual = converterHorarioParaMinutos(agendamento.horaFim);

      if (grupoAtual.length === 0 || inicioAtual < fimGrupoAtual) {
        grupoAtual.push(agendamento);
        fimGrupoAtual = Math.max(fimGrupoAtual, fimAtual);
        return;
      }

      grupos.push(grupoAtual);
      grupoAtual = [agendamento];
      fimGrupoAtual = fimAtual;
    });

    if (grupoAtual.length > 0) {
      grupos.push(grupoAtual);
    }

    return grupos.flatMap(distribuirGrupoAgendamentos);
  });
}

function distribuirGrupoAgendamentos(grupoAgendamentos) {
  const ativos = [];
  const agendamentosDistribuidos = [];
  let totalColunasGrupo = 1;

  grupoAgendamentos.forEach((agendamento) => {
    const inicioAtual = converterHorarioParaMinutos(agendamento.horaInicio);

    for (let indice = ativos.length - 1; indice >= 0; indice -= 1) {
      if (ativos[indice].fim <= inicioAtual) {
        ativos.splice(indice, 1);
      }
    }

    const colunasOcupadas = new Set(ativos.map((item) => item.coluna));
    let colunaDisponivel = 0;

    while (colunasOcupadas.has(colunaDisponivel)) {
      colunaDisponivel += 1;
    }

    ativos.push({
      coluna: colunaDisponivel,
      fim: converterHorarioParaMinutos(agendamento.horaFim)
    });

    totalColunasGrupo = Math.max(totalColunasGrupo, ativos.length);
    agendamentosDistribuidos.push({
      ...agendamento,
      indiceColunaAgenda: colunaDisponivel
    });
  });

  return agendamentosDistribuidos.map((agendamento) => ({
    ...agendamento,
    totalColunasAgenda: totalColunasGrupo
  }));
}

function misturarCorComBase(corPrincipal, corBase, intensidadeCorPrincipal) {
  const [redPrincipal, greenPrincipal, bluePrincipal] = converterHexParaRgb(corPrincipal);
  const [redBase, greenBase, blueBase] = converterHexParaRgb(corBase);
  const intensidadeBase = 1 - intensidadeCorPrincipal;

  const red = Math.round((redPrincipal * intensidadeCorPrincipal) + (redBase * intensidadeBase));
  const green = Math.round((greenPrincipal * intensidadeCorPrincipal) + (greenBase * intensidadeBase));
  const blue = Math.round((bluePrincipal * intensidadeCorPrincipal) + (blueBase * intensidadeBase));

  return `rgb(${red}, ${green}, ${blue})`;
}

function converterHexParaRgb(corHexadecimal) {
  const corNormalizada = String(corHexadecimal || '#D9EAF7').replace('#', '');
  const corExpandida = corNormalizada.length === 3
    ? corNormalizada.split('').map((caractere) => caractere + caractere).join('')
    : corNormalizada;

  const red = Number.parseInt(corExpandida.slice(0, 2), 16);
  const green = Number.parseInt(corExpandida.slice(2, 4), 16);
  const blue = Number.parseInt(corExpandida.slice(4, 6), 16);

  if ([red, green, blue].some((valor) => Number.isNaN(valor))) {
    return [217, 234, 247];
  }

  return [red, green, blue];
}

function converterHexParaRgba(corHexadecimal, opacidade) {
  const [red, green, blue] = converterHexParaRgb(corHexadecimal);
  return `rgba(${red}, ${green}, ${blue}, ${opacidade})`;
}

function formatarDataTooltip(dataIso) {
  if (!dataIso) {
    return 'Nao informado';
  }

  const [ano, mes, dia] = String(dataIso).split('-');

  if (!ano || !mes || !dia) {
    return dataIso;
  }

  return `${dia}/${mes}/${ano}`;
}

function criarLinhasTooltipAgendamento(agendamento) {
  const linhas = [agendamento.assunto || 'Sem assunto'];

  if (agendamento.data) {
    linhas.push(`Data: ${formatarDataTooltip(agendamento.data)}`);
  }

  if (agendamento.horaInicio && agendamento.horaFim) {
    linhas.push(`Horario: ${agendamento.horaInicio} - ${agendamento.horaFim}`);
  }

  if (agendamento.nomeTipoAgenda) {
    linhas.push(`Tipo: ${agendamento.nomeTipoAgenda}`);
  }

  if (agendamento.nomeStatusVisita) {
    linhas.push(`Status: ${agendamento.nomeStatusVisita}`);
  }

  if (agendamento.nomeCliente && agendamento.nomeCliente !== 'Nao informado') {
    linhas.push(`Cliente: ${agendamento.nomeCliente}`);
  }

  if (agendamento.nomeContato) {
    linhas.push(`Contato: ${agendamento.nomeContato}`);
  }

  if (agendamento.nomeVendedor) {
    linhas.push(`Vendedor: ${agendamento.nomeVendedor}`);
  }

  if (agendamento.nomeLocal && agendamento.nomeLocal !== 'Nao informado') {
    linhas.push(`Local: ${agendamento.nomeLocal}`);
  }

  if (Array.isArray(agendamento.nomesRecursos) && agendamento.nomesRecursos.length > 0) {
    linhas.push(`Recursos: ${agendamento.nomesRecursos.join(', ')}`);
  }

  if (Array.isArray(agendamento.nomesUsuarios) && agendamento.nomesUsuarios.length > 0) {
    linhas.push(`Usuarios: ${agendamento.nomesUsuarios.join(', ')}`);
  }

  return linhas;
}

function criarFaixaPorHorarios(data, primeiroHorario, segundoHorario) {
  const minutosPrimeiroHorario = converterHorarioParaMinutos(primeiroHorario);
  const minutosSegundoHorario = converterHorarioParaMinutos(segundoHorario);
  const minutosInicio = Math.min(minutosPrimeiroHorario, minutosSegundoHorario);
  const minutosFim = Math.max(minutosPrimeiroHorario, minutosSegundoHorario) + intervaloMinutos;

  return {
    data,
    horaInicio: converterMinutosParaHorario(minutosInicio),
    horaFim: converterMinutosParaHorario(minutosFim)
  };
}

function converterMinutosParaHorario(totalMinutos) {
  const horas = String(Math.floor(totalMinutos / 60)).padStart(2, '0');
  const minutos = String(totalMinutos % 60).padStart(2, '0');
  return `${horas}:${minutos}`;
}

function celulaEstaNaFaixaSelecionada(faixaSelecionada, data, horario) {
  if (!faixaSelecionada || faixaSelecionada.data !== data) {
    return false;
  }

  const minutosHorario = converterHorarioParaMinutos(horario);
  const minutosInicio = converterHorarioParaMinutos(faixaSelecionada.horaInicio);
  const minutosFim = converterHorarioParaMinutos(faixaSelecionada.horaFim);

  return minutosHorario >= minutosInicio && minutosHorario < minutosFim;
}

function filtrarAgendamentos(agendamentos, filtros) {
  return agendamentos.filter((agendamento) => {
    const idsUsuariosFiltro = Array.isArray(filtros.idUsuario) ? filtros.idUsuario.map(String) : [];
    const idsUsuariosAgendamento = Array.isArray(agendamento.idsUsuarios)
      ? agendamento.idsUsuarios.map(String)
      : (agendamento.idUsuario ? [String(agendamento.idUsuario)] : []);

    if (
      idsUsuariosFiltro.length > 0 &&
      !idsUsuariosFiltro.every((idUsuario) => idsUsuariosAgendamento.includes(idUsuario))
    ) {
      return false;
    }

    if (filtros.idCliente && String(agendamento.idCliente) !== String(filtros.idCliente)) {
      return false;
    }

    if (filtros.idVendedor && String(agendamento.idVendedor || '') !== String(filtros.idVendedor)) {
      return false;
    }

    if (filtros.idLocal && String(agendamento.idLocal || '') !== String(filtros.idLocal)) {
      return false;
    }

    const idsRecursosFiltro = Array.isArray(filtros.idRecurso) ? filtros.idRecurso.map(String) : [];
    const idsRecursosAgendamento = Array.isArray(agendamento.idsRecursos)
      ? agendamento.idsRecursos.map(String)
      : (agendamento.idRecurso ? [String(agendamento.idRecurso)] : []);

    if (
      idsRecursosFiltro.length > 0 &&
      !idsRecursosFiltro.every((idRecurso) => idsRecursosAgendamento.includes(idRecurso))
    ) {
      return false;
    }

    if (filtros.idStatusVisita && String(agendamento.idStatusVisita) !== String(filtros.idStatusVisita)) {
      return false;
    }

    return true;
  });
}
