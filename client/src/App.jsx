import { useEffect, useRef, useState } from 'react';
import { PaginaAgenda } from './paginas/agenda/paginaAgenda';
import { PaginaAtendimentos } from './paginas/atendimentos/paginaAtendimentos';
import { BarraLateral } from './componentes/layout/barraLateral';
import { PopupAvisos } from './componentes/comuns/popupAvisos';
import { PaginaClientes } from './paginas/clientes/paginaClientes';
import { PaginaConfiguracoes } from './paginas/configuracoes/paginaConfiguracoes';
import { PaginaLogin } from './paginas/login/paginaLogin';
import { PaginaPadrao } from './paginas/padrao/paginaPadrao';
import { PaginaProdutos } from './paginas/produtos/paginaProdutos';
import { listarAgendamentos } from './servicos/agenda';
import {
  limparSessaoUsuario,
  obterSessaoUsuario,
  salvarSessaoUsuario
} from './servicos/autenticacao';
import { paginasPainel } from './utilitarios/paginas';

function renderizarPagina(paginaSelecionada, usuarioLogado) {
  if (paginaSelecionada.id === 'clientes') {
    return <PaginaClientes usuarioLogado={usuarioLogado} />;
  }

  if (paginaSelecionada.id === 'agenda') {
    return <PaginaAgenda usuarioLogado={usuarioLogado} />;
  }

  if (paginaSelecionada.id === 'atendimentos') {
    return <PaginaAtendimentos usuarioLogado={usuarioLogado} />;
  }

  if (paginaSelecionada.id === 'produtos') {
    return <PaginaProdutos usuarioLogado={usuarioLogado} />;
  }

  if (paginaSelecionada.id === 'configuracoes') {
    return <PaginaConfiguracoes usuarioLogado={usuarioLogado} />;
  }

  return <PaginaPadrao pagina={paginaSelecionada} />;
}

export default function App() {
  const [paginaAtiva, definirPaginaAtiva] = useState(paginasPainel[0].id);
  const [usuarioLogado, definirUsuarioLogado] = useState(obterSessaoUsuario);
  const [avisosPopup, definirAvisosPopup] = useState([]);
  const avisosNotificadosRef = useRef(new Set());

  const paginaSelecionada =
    paginasPainel.find((pagina) => pagina.id === paginaAtiva) || paginasPainel[0];

  useEffect(() => {
    avisosNotificadosRef.current = new Set();
    definirAvisosPopup([]);
  }, [usuarioLogado?.idUsuario]);

  useEffect(() => {
    if (!usuarioLogado?.idUsuario) {
      return undefined;
    }

    let desmontado = false;

    async function verificarCompromissosProximos() {
      try {
        const agendamentos = await listarAgendamentos();

        if (desmontado) {
          return;
        }

        const agora = new Date();
        const proximosAvisos = agendamentos
          .filter((agendamento) => pertenceAoUsuarioLogado(agendamento, usuarioLogado.idUsuario))
          .map((agendamento) => ({
            ...agendamento,
            dataHorarioInicio: criarDataHorarioAgendamento(agendamento.data, agendamento.horaInicio)
          }))
          .filter((agendamento) => agendamento.dataHorarioInicio instanceof Date && !Number.isNaN(agendamento.dataHorarioInicio.getTime()))
          .map((agendamento) => ({
            ...agendamento,
            diferencaMinutos: Math.round((agendamento.dataHorarioInicio.getTime() - agora.getTime()) / 60000)
          }))
          .filter((agendamento) => agendamento.diferencaMinutos >= 0 && agendamento.diferencaMinutos <= 15)
          .sort((primeiro, segundo) => primeiro.dataHorarioInicio - segundo.dataHorarioInicio);

        const novosAvisos = proximosAvisos
          .filter((agendamento) => {
            const chaveAviso = criarChaveAvisoAgendamento(agendamento);
            return !avisosNotificadosRef.current.has(chaveAviso);
          })
          .map((agendamento) => {
            const chaveAviso = criarChaveAvisoAgendamento(agendamento);
            avisosNotificadosRef.current.add(chaveAviso);

            return {
              id: chaveAviso,
              icone: agendamento.iconeStatusVisita || 'Agenda',
              titulo: agendamento.assunto || 'Compromisso na agenda',
              subtitulo: agendamento.tipo || 'Agendamento',
              mensagem: criarMensagemPopupAgendamento(agendamento),
              detalhe: criarDetalhePopupAgendamento(agendamento)
            };
          });

        if (novosAvisos.length > 0) {
          definirAvisosPopup((estadoAtual) => [...novosAvisos, ...estadoAtual].slice(0, 4));
        }
      } catch (_erro) {
        return;
      }
    }

    verificarCompromissosProximos();
    const intervalo = window.setInterval(verificarCompromissosProximos, 60000);

    return () => {
      desmontado = true;
      window.clearInterval(intervalo);
    };
  }, [usuarioLogado]);

  useEffect(() => {
    if (avisosPopup.length === 0) {
      return undefined;
    }

    const temporizadores = avisosPopup.map((aviso) => window.setTimeout(() => {
      definirAvisosPopup((estadoAtual) => estadoAtual.filter((item) => item.id !== aviso.id));
    }, 12000));

    return () => {
      temporizadores.forEach((temporizador) => window.clearTimeout(temporizador));
    };
  }, [avisosPopup]);

  function entrar(usuario) {
    salvarSessaoUsuario(usuario);
    definirUsuarioLogado(usuario);
  }

  function sair() {
    limparSessaoUsuario();
    definirUsuarioLogado(null);
  }

  if (!usuarioLogado) {
    return <PaginaLogin aoEntrar={entrar} />;
  }

  return (
    <main className="aplicacao">
      <div className="estruturaPainel">
        <BarraLateral
          itens={paginasPainel}
          paginaAtiva={paginaAtiva}
          usuarioLogado={usuarioLogado}
          aoSelecionarPagina={definirPaginaAtiva}
          aoSair={sair}
        />

        <section className="areaConteudo">
          {renderizarPagina(paginaSelecionada, usuarioLogado)}
        </section>

        <PopupAvisos
          avisos={avisosPopup}
          aoFechar={(idAviso) => {
            definirAvisosPopup((estadoAtual) => estadoAtual.filter((aviso) => aviso.id !== idAviso));
          }}
        />
      </div>
    </main>
  );
}

function pertenceAoUsuarioLogado(agendamento, idUsuarioLogado) {
  const idsUsuarios = Array.isArray(agendamento.idsUsuarios)
    ? agendamento.idsUsuarios.map(String)
    : [];

  if (idsUsuarios.length > 0) {
    return idsUsuarios.includes(String(idUsuarioLogado));
  }

  return String(agendamento.idUsuario) === String(idUsuarioLogado);
}

function criarDataHorarioAgendamento(data, horario) {
  if (!data || !horario) {
    return null;
  }

  return new Date(`${data}T${horario}:00`);
}

function criarChaveAvisoAgendamento(agendamento) {
  return `${agendamento.idAgendamento}-${agendamento.data}-${agendamento.horaInicio}`;
}

function criarMensagemPopupAgendamento(agendamento) {
  if (agendamento.diferencaMinutos === 0) {
    return 'Seu compromisso comeca agora.';
  }

  if (agendamento.diferencaMinutos === 1) {
    return 'Seu compromisso comeca em 1 minuto.';
  }

  return `Seu compromisso comeca em ${agendamento.diferencaMinutos} minutos.`;
}

function criarDetalhePopupAgendamento(agendamento) {
  const partes = [`${agendamento.horaInicio} - ${agendamento.horaFim}`];

  if (agendamento.tipo) {
    partes.push(agendamento.tipo);
  }

  return partes.join(' | ');
}
