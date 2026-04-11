import { useEffect, useRef, useState } from 'react';
import './recursos/estilos/app.css';
import { PaginaAgenda } from './paginas/agenda/paginaAgenda';
import { PaginaAtendimentos } from './paginas/atendimentos/paginaAtendimentos';
import { BarraLateral } from './componentes/layout/barraLateral';
import { PopupAvisos } from './componentes/comuns/popupAvisos';
import { PaginaClientes } from './paginas/clientes/paginaClientes';
import { PaginaConfiguracoes } from './paginas/configuracoes/paginaConfiguracoes';
import { PaginaInicio } from './paginas/inicio/paginaInicio';
import { PaginaLogin } from './paginas/login/paginaLogin';
import { PaginaOrcamentos } from './paginas/orcamentos/paginaOrcamentos';
import { PaginaPadrao } from './paginas/padrao/paginaPadrao';
import { PaginaPedidos } from './paginas/pedidos/paginaPedidos';
import { PaginaProdutos } from './paginas/produtos/paginaProdutos';
import { listarAgendamentos } from './servicos/agenda';
import {
  limparSessaoUsuario,
  obterSessaoUsuario,
  salvarSessaoUsuario
} from './servicos/autenticacao';
import { paginasPainel } from './utilitarios/paginas';

function renderizarPagina(paginaSelecionada, usuarioLogado) {
  if (paginaSelecionada.id === 'inicio') {
    return <PaginaInicio usuarioLogado={usuarioLogado} />;
  }

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

  if (paginaSelecionada.id === 'orcamentos') {
    return <PaginaOrcamentos usuarioLogado={usuarioLogado} />;
  }

  if (paginaSelecionada.id === 'pedidos') {
    return <PaginaPedidos usuarioLogado={usuarioLogado} />;
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
    function tratarUsuarioLogadoAtualizado(evento) {
      const proximoUsuario = evento.detail?.usuario || null;

      if (!proximoUsuario) {
        return;
      }

      salvarSessaoUsuario(proximoUsuario);
      definirUsuarioLogado(proximoUsuario);
    }

    window.addEventListener('usuario-logado-atualizado', tratarUsuarioLogadoAtualizado);

    return () => {
      window.removeEventListener('usuario-logado-atualizado', tratarUsuarioLogadoAtualizado);
    };
  }, []);

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

  useEffect(() => {
    let frameAtual = null;
    let timeoutAtual = null;

    function agendarAplicacaoFoco() {
      if (frameAtual !== null) {
        window.cancelAnimationFrame(frameAtual);
      }

      if (timeoutAtual !== null) {
        window.clearTimeout(timeoutAtual);
      }

      frameAtual = window.requestAnimationFrame(() => {
        timeoutAtual = window.setTimeout(() => {
          aplicarFocoNoModalAtivo();
        }, 0);
      });
    }

    const observador = new MutationObserver(() => {
      agendarAplicacaoFoco();
    });

    observador.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'open', 'aria-hidden', 'disabled']
    });

    agendarAplicacaoFoco();

    return () => {
      observador.disconnect();

      if (frameAtual !== null) {
        window.cancelAnimationFrame(frameAtual);
      }

      if (timeoutAtual !== null) {
        window.clearTimeout(timeoutAtual);
      }
    };
  }, []);

  useEffect(() => {
    function tratarAtalhoAcaoPrimaria(evento) {
      if (evento.key !== 'PageDown') {
        return;
      }

      const botaoAcaoPrimaria = encontrarBotaoAcaoPrimariaPageDown();

      if (!botaoAcaoPrimaria) {
        return;
      }

      evento.preventDefault();
      botaoAcaoPrimaria.click();
    }

    window.addEventListener('keydown', tratarAtalhoAcaoPrimaria);

    return () => {
      window.removeEventListener('keydown', tratarAtalhoAcaoPrimaria);
    };
  }, []);

  useEffect(() => {
    function tratarNavegacaoAbasModal(evento) {
      if (!evento.altKey || (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight')) {
        return;
      }

      const modalAtivo = encontrarModalAtivo({ incluirAlertDialog: false });

      if (!modalAtivo) {
        return;
      }

      evento.preventDefault();

      const houveTroca = navegarEntreAbasModal(modalAtivo, evento.key === 'ArrowRight' ? 1 : -1);

      if (!houveTroca) {
        return;
      }
    }

    window.addEventListener('keydown', tratarNavegacaoAbasModal, true);

    return () => {
      window.removeEventListener('keydown', tratarNavegacaoAbasModal, true);
    };
  }, []);

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
    <main className="app">
      <div className="appEstruturaPainel">
        <BarraLateral
          itens={paginasPainel}
          paginaAtiva={paginaAtiva}
          usuarioLogado={usuarioLogado}
          aoSelecionarPagina={definirPaginaAtiva}
          aoSair={sair}
        />

        <section className="appAreaConteudo">
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

function aplicarFocoNoModalAtivo() {
  const modalAtivo = encontrarModalAtivo();

  if (!modalAtivo) {
    return;
  }

  if (
    document.activeElement
    && document.activeElement !== document.body
    && modalAtivo.contains(document.activeElement)
  ) {
    return;
  }

  const alvoFoco = modalAtivo.getAttribute('role') === 'alertdialog'
    ? encontrarAcaoPrincipalConfirmacao(modalAtivo) || encontrarPrimeiroCampoModal(modalAtivo)
    : encontrarPrimeiroCampoModal(modalAtivo) || encontrarPrimeiroBotaoModal(modalAtivo);

  if (!alvoFoco) {
    return;
  }

  alvoFoco.focus({ preventScroll: true });
}

function encontrarAcaoPrincipalConfirmacao(modal) {
  const botoesConfirmacao = Array.from(
    modal.querySelectorAll('.acoesConfirmacaoModal button:not([disabled])')
  ).filter(elementoEstaVisivel);

  if (botoesConfirmacao.length > 0) {
    return botoesConfirmacao[botoesConfirmacao.length - 1];
  }

  return null;
}

function encontrarPrimeiroCampoModal(modal) {
  const seletorCampos = [
    'input:not([type="hidden"]):not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[contenteditable="true"]'
  ].join(', ');

  return Array.from(modal.querySelectorAll(seletorCampos)).find(elementoEstaVisivel) || null;
}

function encontrarPrimeiroBotaoModal(modal) {
  return Array.from(modal.querySelectorAll('button:not([disabled])')).find(elementoEstaVisivel) || null;
}

function navegarEntreAbasModal(modal, direcao) {
  const listaAbas = Array.from(modal.querySelectorAll('[role="tablist"]')).find((elemento) => {
    const abas = obterBotoesAbas(elemento);
    return abas.length > 1;
  });

  if (!listaAbas) {
    return false;
  }

  const abas = obterBotoesAbas(listaAbas);

  if (abas.length <= 1) {
    return false;
  }

  const indiceAtual = abas.findIndex((aba) => aba.getAttribute('aria-selected') === 'true');
  const indiceBase = indiceAtual >= 0 ? indiceAtual : 0;
  const proximoIndice = (indiceBase + direcao + abas.length) % abas.length;
  const proximaAba = abas[proximoIndice];

  if (!proximaAba || proximaAba === abas[indiceBase]) {
    return false;
  }

  proximaAba.click();

  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      focarPrimeiroCampoAbaAtiva(modal);
    }, 0);
  });

  return true;
}

function obterBotoesAbas(listaAbas) {
  return Array.from(listaAbas.querySelectorAll('button[aria-selected]:not([disabled])')).filter(elementoEstaVisivel);
}

function focarPrimeiroCampoAbaAtiva(modal) {
  const alvoFoco = encontrarPrimeiroCampoModal(modal) || encontrarPrimeiroBotaoModal(modal);

  if (!alvoFoco) {
    return;
  }

  alvoFoco.focus({ preventScroll: true });
}

function encontrarBotaoSalvarModalAtivo() {
  const modalAtivo = encontrarModalAtivo({ incluirAlertDialog: false });

  if (!modalAtivo) {
    return null;
  }

  const botoesPrioritarios = Array.from(
    modalAtivo.querySelectorAll('button[type="submit"]:not([disabled])')
  ).filter(elementoEstaVisivel);

  if (botoesPrioritarios.length > 0) {
    return botoesPrioritarios[botoesPrioritarios.length - 1];
  }

  const botoes = Array.from(modalAtivo.querySelectorAll('button:not([disabled])')).filter(elementoEstaVisivel);

  return botoes.find((botao) => {
    const aria = String(botao.getAttribute('aria-label') || '').trim().toLowerCase();
    const titulo = String(botao.getAttribute('title') || '').trim().toLowerCase();
    const texto = String(botao.textContent || '').trim().toLowerCase();

    return aria === 'salvar'
      || titulo === 'salvar'
      || texto === 'salvar'
      || aria === 'salvando'
      || titulo === 'salvando'
      || texto === 'salvando';
  }) || null;
}

function encontrarBotaoAdicionar(container) {
  if (!(container instanceof HTMLElement)) {
    return null;
  }

  const botoes = Array.from(container.querySelectorAll('button:not([disabled])')).filter(elementoEstaVisivel);

  const candidatos = botoes
    .map((botao, indice) => ({
      botao,
      indice,
      pontuacao: calcularPontuacaoBotaoAdicionar(botao)
    }))
    .filter((item) => item.pontuacao > 0)
    .sort((primeiro, segundo) => {
      if (segundo.pontuacao !== primeiro.pontuacao) {
        return segundo.pontuacao - primeiro.pontuacao;
      }

      return primeiro.indice - segundo.indice;
    });

  return candidatos[0]?.botao || null;
}

function calcularPontuacaoBotaoAdicionar(botao) {
  const descritores = [
    String(botao.getAttribute('aria-label') || '').trim().toLowerCase(),
    String(botao.getAttribute('title') || '').trim().toLowerCase(),
    String(botao.textContent || '').trim().toLowerCase()
  ].filter(Boolean);

  let melhorPontuacao = 0;

  descritores.forEach((descricao) => {
    melhorPontuacao = Math.max(melhorPontuacao, pontuarDescricaoAdicionar(descricao));
  });

  return melhorPontuacao;
}

function pontuarDescricaoAdicionar(descricao) {
  if (!descricao) {
    return 0;
  }

  if (
    descricao === 'adicionar'
    || descricao.startsWith('adicionar ')
    || descricao === 'incluir'
    || descricao.startsWith('incluir ')
    || descricao === 'novo'
    || descricao.startsWith('novo ')
  ) {
    return 100;
  }

  if (
    descricao.includes(' adicionar ')
    || descricao.includes(' incluir ')
    || descricao.includes(' novo ')
  ) {
    return 60;
  }

  return 0;
}

function encontrarBotaoAcaoPrimariaPageDown() {
  const botaoSalvarModal = encontrarBotaoSalvarModalAtivo();

  if (botaoSalvarModal) {
    return botaoSalvarModal;
  }

  const modalAtivo = encontrarModalAtivo({ incluirAlertDialog: false });

  if (modalAtivo) {
    const botaoAdicionarModal = encontrarBotaoAdicionar(modalAtivo);

    if (botaoAdicionarModal) {
      return botaoAdicionarModal;
    }
  }

  const paginaAtiva = document.querySelector('main');

  return encontrarBotaoAdicionar(paginaAtiva);
}

function encontrarModalAtivo({ incluirAlertDialog = true } = {}) {
  const seletor = incluirAlertDialog ? '[role="alertdialog"], [role="dialog"]' : '[role="dialog"]';
  const modaisAbertos = Array.from(document.querySelectorAll(seletor)).filter(elementoEstaVisivel);

  if (modaisAbertos.length === 0) {
    return null;
  }

  return modaisAbertos[modaisAbertos.length - 1];
}

function elementoEstaVisivel(elemento) {
  if (!(elemento instanceof HTMLElement)) {
    return false;
  }

  if (elemento.hidden || elemento.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  const estilo = window.getComputedStyle(elemento);
  if (estilo.display === 'none' || estilo.visibility === 'hidden') {
    return false;
  }

  return elemento.getClientRects().length > 0;
}
