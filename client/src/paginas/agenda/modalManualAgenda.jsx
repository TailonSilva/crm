import { useMemo } from 'react';
import { Icone } from '../../componentes/comuns/icone';
import { ModalManualPagina } from '../../componentes/comuns/modalManualPagina';
import { registroEstaAtivo } from '../../utilitarios/statusRegistro';

const intervaloMinutosManual = 15;
const configuracaoExpedientePadrao = {
  horaInicioManha: '08:00',
  horaFimManha: '12:00',
  horaInicioTarde: '13:00',
  horaFimTarde: '18:00',
  trabalhaSabado: false,
  horaInicioSabado: '08:00',
  horaFimSabado: '12:00'
};

export function ModalManualAgenda({
  aberto,
  aoFechar,
  empresa,
  tiposAgenda = [],
  statusVisita = [],
  locais = [],
  recursos = [],
  filtros = {},
  usuarioLogado
}) {
  const configuracaoExpediente = useMemo(
    () => obterConfiguracaoExpediente(empresa),
    [empresa]
  );

  const resumoObrigatoriedades = useMemo(
    () => criarResumoObrigatoriedades(tiposAgenda),
    [tiposAgenda]
  );

  const statusInicial = useMemo(
    () => obterStatusInicial(statusVisita),
    [statusVisita]
  );

  const filtrosAtivos = useMemo(
    () => Object.values(filtros).reduce((total, valor) => {
      if (Array.isArray(valor)) {
        return total + valor.length;
      }

      return total + (valor ? 1 : 0);
    }, 0),
    [filtros]
  );

  const cardsResumo = [
    {
      titulo: 'Grade da agenda',
      descricao: `Visualizacao semanal com intervalos de ${intervaloMinutosManual} minutos por linha.`,
      detalhe: configuracaoExpediente.trabalhaSabado ? 'Segunda a sabado' : 'Segunda a sexta',
      icone: 'agenda'
    },
    {
      titulo: 'Expediente base',
      descricao: `${configuracaoExpediente.horaInicioManha} as ${configuracaoExpediente.horaFimManha} e ${configuracaoExpediente.horaInicioTarde} as ${configuracaoExpediente.horaFimTarde}.`,
      detalhe: configuracaoExpediente.trabalhaSabado
        ? `Sabado: ${configuracaoExpediente.horaInicioSabado} as ${configuracaoExpediente.horaFimSabado}`
        : 'Sabado oculto salvo quando houver expediente ou agendamento',
      icone: 'tamanho'
    },
    {
      titulo: 'Status inicial',
      descricao: statusInicial
        ? `Novos agendamentos entram com "${statusInicial.descricao}".`
        : 'Sem status ativo configurado para preenchimento automatico.',
      detalhe: statusVisita.length > 0 ? `${statusVisita.length} status ativos disponiveis` : 'Cadastre status em Configuracoes',
      icone: 'selo'
    },
    {
      titulo: 'Estrutura atual',
      descricao: `${locais.filter((local) => registroEstaAtivo(local.status)).length} locais ativos e ${recursos.filter((recurso) => registroEstaAtivo(recurso.status)).length} recursos ativos.`,
      detalhe: `${tiposAgenda.length} tipos de agenda ativos`,
      icone: 'caixa'
    }
  ];

  const cardsFluxo = [
    {
      titulo: 'Criar pela grade',
      descricao: 'Arraste uma faixa para reservar o horario e use o botao de incluir para abrir o formulario ja preenchido.',
      icone: 'adicionar'
    },
    {
      titulo: 'Editar rapido',
      descricao: 'Clique simples seleciona o card. Duplo clique abre a edicao completa do agendamento.',
      icone: 'editar'
    },
    {
      titulo: 'Acompanhar detalhes',
      descricao: 'Passe o mouse sobre o card para ver cliente, contato, local, usuarios e demais dados sem abrir modal.',
      icone: 'consultar'
    },
    {
      titulo: 'Atualizar status',
      descricao: 'Clique com o botao direito no card para trocar o status da visita diretamente pela agenda.',
      icone: 'confirmar'
    }
  ];

  const cardsRegras = [
    {
      titulo: 'Filtros persistidos',
      descricao: 'Os filtros da Agenda ficam salvos por usuario e voltam automaticamente na proxima abertura da tela.',
      detalhe: filtrosAtivos > 0 ? `${filtrosAtivos} filtro(s) ativos neste momento.` : 'Nenhum filtro ativo agora.',
      icone: 'filtro'
    },
    {
      titulo: 'Conflitos visuais',
      descricao: 'Agendamentos no mesmo horario dividem a largura do dia para evitar sobreposicao e manter leitura.',
      detalhe: 'O card segue a cor do tipo de agenda configurado.',
      icone: 'medida'
    },
    {
      titulo: 'Atalhos de produtividade',
      descricao: 'Com um card selecionado, use Ctrl+C para copiar e Ctrl+V em outra faixa para colar o compromisso.',
      detalhe: 'Os atalhos sao ignorados quando ha formulario aberto ou campo em foco.',
      icone: 'cadastro'
    },
    {
      titulo: 'Permissoes e fluxo comercial',
      descricao: usuarioLogado?.tipo === 'Usuario padrao'
        ? 'Seu perfil pode criar e editar, mas nao excluir agendamentos.'
        : 'Perfis com permissao podem incluir, editar e excluir agendamentos.',
      detalhe: 'Agendas encerradas podem abrir um atendimento com os dados ja preenchidos.',
      icone: 'usuarios'
    },
    {
      titulo: 'Foco e atalho',
      descricao: 'Ao abrir um modal da agenda, o foco vai para o primeiro campo editavel; em confirmacoes, a acao principal fica pronta para teclado.',
      detalhe: '`PageDown` prioriza Salvar e, quando nao houver salvamento disponivel, aciona Adicionar, Incluir ou Novo no contexto atual.',
      icone: 'manual'
    }
  ];

  return (
    <ModalManualPagina
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Manual da Agenda"
      descricao="Guia visual com fluxo, configuracoes, regras e obrigatoriedades reais da tela."
      eyebrow="Operacao diaria"
      heroTitulo="Como a Agenda funciona no Connecta CRM"
      heroDescricao="A Agenda foi desenhada para planejar compromissos por semana, controlar disponibilidade, acelerar lancamentos e transformar visitas concluidas em atendimento comercial quando fizer sentido."
      painelHeroi={[
        { valor: configuracaoExpediente.trabalhaSabado ? 'Seg a sab' : 'Seg a sex', rotulo: 'Dias exibidos na grade base' },
        { valor: `${intervaloMinutosManual} min`, rotulo: 'Granularidade de cada faixa' },
        { valor: tiposAgenda.length, rotulo: 'Tipos ativos com cor propria' }
      ]}
      cardsResumo={cardsResumo}
      cardsFluxo={cardsFluxo}
      blocosTexto={[
        {
          tag: 'Formulario',
          titulo: 'Campos e validacoes principais',
          itens: [
            'Assunto, dia, horario de inicio, horario de fim, tipo e status sao obrigatorios em qualquer agendamento.',
            'Contato do cliente depende do cliente escolhido e fica bloqueado ate haver cliente selecionado.',
            'Cliente e contato usam os mesmos modais reutilizaveis de busca do fluxo comercial.',
            'Ao confirmar a busca de cliente ou contato, o foco retorna para o campo preenchido no agendamento.',
            'Local, cliente e recurso podem se tornar obrigatorios conforme a configuracao do tipo de agenda.',
            'Usuarios e recursos aceitam selecao multipla dentro de submodais do proprio formulario.',
            'Somente registros ativos aparecem nas listas de tipos, status, locais, clientes, contatos, usuarios e recursos.'
          ]
        }
      ]}
      secoesExtras={(
        <section className="modalManualPaginaSecao modalManualPaginaSecaoDupla">
          <div className="modalManualPaginaPainelLista">
            <div className="modalManualPaginaSecaoCabecalho">
              <span className="modalManualPaginaTag">Obrigatoriedades</span>
              <h4>Regras por tipo de agenda</h4>
            </div>

            <div className="modalManualPaginaListaBlocos">
              {resumoObrigatoriedades.length > 0 ? resumoObrigatoriedades.map((tipoAgenda) => (
                <article key={tipoAgenda.id} className="modalManualPaginaListaBloco">
                  <div className="modalManualPaginaListaBlocoCabecalho">
                    <strong>{tipoAgenda.nome}</strong>
                    <span style={{ '--corTipoAgendaManual': tipoAgenda.cor }} className="modalManualPaginaCorTipo">
                      Cor ativa
                    </span>
                  </div>

                  <div className="modalManualPaginaListaChips">
                    {tipoAgenda.tags.map((tag) => (
                      <span
                        key={`${tipoAgenda.id}-${tag.rotulo}`}
                        className={`modalManualPaginaChip ${tag.obrigatorio ? 'obrigatorio' : 'opcional'}`}
                      >
                        {tag.rotulo}: {tag.obrigatorio ? 'obrigatorio' : 'opcional'}
                      </span>
                    ))}
                  </div>
                </article>
              )) : (
                <div className="modalManualPaginaEstadoVazio">
                  <Icone nome="alerta" />
                  <p>Nenhum tipo de agenda ativo foi encontrado para montar as obrigatoriedades.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      cardsRegras={cardsRegras}
    />
  );
}

function criarResumoObrigatoriedades(tiposAgenda) {
  return tiposAgenda
    .filter((tipoAgenda) => registroEstaAtivo(tipoAgenda?.status))
    .map((tipoAgenda) => ({
      id: tipoAgenda.idTipoAgenda,
      nome: tipoAgenda.descricao || 'Tipo sem descricao',
      cor: tipoAgenda.cor || '#1791e2',
      tags: [
        { rotulo: 'Cliente', obrigatorio: Boolean(tipoAgenda.obrigarCliente) },
        { rotulo: 'Local', obrigatorio: Boolean(tipoAgenda.obrigarLocal) },
        { rotulo: 'Recurso', obrigatorio: Boolean(tipoAgenda.obrigarRecurso) }
      ]
    }));
}

function obterStatusInicial(statusVisita) {
  const statusAtivos = statusVisita
    .filter((status) => registroEstaAtivo(status?.status))
    .sort((primeiro, segundo) => {
      const ordemPrimeira = Number(primeiro?.ordem);
      const ordemSegunda = Number(segundo?.ordem);
      const valorPrimeiro = Number.isFinite(ordemPrimeira) && ordemPrimeira > 0
        ? ordemPrimeira
        : Number(primeiro?.idStatusVisita) || Number.MAX_SAFE_INTEGER;
      const valorSegundo = Number.isFinite(ordemSegunda) && ordemSegunda > 0
        ? ordemSegunda
        : Number(segundo?.idStatusVisita) || Number.MAX_SAFE_INTEGER;

      return valorPrimeiro - valorSegundo;
    });

  return statusAtivos[0] || null;
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
