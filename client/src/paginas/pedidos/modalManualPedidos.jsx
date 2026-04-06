import { ModalManualPagina } from '../../componentes/comuns/modalManualPagina';

export function ModalManualPedidos({
  aberto,
  aoFechar,
  pedidos = [],
  etapasPedido = [],
  prazosPagamento = [],
  filtros = {},
  usuarioLogado
}) {
  const filtrosAtivos = Object.values(filtros).filter((valor) => {
    if (Array.isArray(valor)) {
      return valor.length > 0;
    }

    return Boolean(valor);
  }).length;

  return (
    <ModalManualPagina
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Manual de Pedidos"
      descricao="Guia visual do acompanhamento de pedidos, etapas comerciais, pagamento e regras de permissao da tela."
      eyebrow="Execucao comercial"
      heroTitulo="Como a pagina de Pedidos acompanha o fechamento do CRM"
      heroDescricao="A pagina de Pedidos acompanha os registros gerados a partir das propostas fechadas ou criados diretamente na tela. Ela concentra etapa do pedido, pagamento, itens e consulta operacional da execucao comercial."
      painelHeroi={[
        { valor: pedidos.length, rotulo: 'Pedidos na grade atual' },
        { valor: etapasPedido.length, rotulo: 'Etapas de pedido' },
        { valor: prazosPagamento.length, rotulo: 'Prazos de pagamento carregados' }
      ]}
      cardsResumo={[
        {
          titulo: 'Grade operacional',
          descricao: `${pedidos.length} pedido(s) aparecem no recorte atual.`,
          detalhe: 'A listagem cruza cliente, usuario, vendedor e etapa do pedido.',
          icone: 'pedido'
        },
        {
          titulo: 'Etapas do processo',
          descricao: `${etapasPedido.length} etapa(s) configurada(s) organizam o andamento do pedido.`,
          detalhe: 'As etapas sao mantidas na pagina de Configuracoes.',
          icone: 'cadastro'
        },
        {
          titulo: 'Pagamento',
          descricao: `${prazosPagamento.length} prazo(s) de pagamento podem ser usados no modal do pedido.`,
          detalhe: 'Os prazos podem existir sem dias e manter apenas o metodo, conforme a configuracao atual.',
          icone: 'pagamento'
        },
        {
          titulo: 'Filtros ativos',
          descricao: filtrosAtivos > 0
            ? `${filtrosAtivos} filtro(s) aplicados agora.`
            : 'Nenhum filtro ativo no momento.',
          detalhe: 'O estado da tela e salvo por usuario.',
          icone: 'filtro'
        }
      ]}
      cardsFluxo={[
        {
          titulo: 'Criar pedido',
          descricao: 'O pedido pode nascer diretamente pela tela ou a partir do fechamento de um orcamento.',
          icone: 'adicionar'
        },
        {
          titulo: 'Consultar e editar',
          descricao: 'A grade permite consultar o registro e, quando permitido pelo perfil e pela etapa, seguir em edicao mantendo o contexto comercial do pedido.',
          icone: 'consultar'
        },
        {
          titulo: 'Controlar etapa',
          descricao: 'Cada pedido recebe uma etapa de acompanhamento e pode ter a etapa alterada direto no grid para agilizar a operacao.',
          icone: 'editar'
        },
        {
          titulo: 'Excluir com confirmacao',
          descricao: 'Quando o perfil permite, a tela exige confirmacao antes de excluir um pedido.',
          icone: 'confirmar'
        }
      ]}
      blocosTexto={[
        {
          tag: 'Formulario',
          titulo: 'O que o modal concentra',
          itens: [
            'Cliente, contato, usuario do registro e vendedor compoem a base comercial do pedido, com atalhos de busca para cliente e contato no modo de inclusao.',
            'Ao abrir a busca de contatos com um cliente ja definido, o proprio modal permite cadastrar um novo contato e devolver esse contato ja selecionado no pedido.',
            'Itens, valores e pagamento sao herdados do fluxo comercial e podem ser ajustados no modal.',
            'A imagem do item pode herdar o que veio do orcamento; quando o usuario trocar essa imagem no pedido, ela passa a ser exclusiva daquele item e e recortada em 1024 x 1024 px.',
            'Prazos de pagamento podem ser cadastrados no proprio fluxo, respeitando o perfil.',
            'Campos personalizados do pedido aparecem conforme a configuracao carregada no sistema.'
          ]
        },
        {
          tag: 'Grade',
          titulo: 'Como usar a listagem principal',
          itens: [
            'A pesquisa textual ajuda a localizar rapidamente pedidos por dados do cliente e do registro.',
            'Os filtros incluem cliente, usuario do registro, vendedor, uma ou mais etapas e um botao Datas que abre o painel com os periodos de inclusao e entrega.',
            'A grade permite trocar a etapa do pedido sem abrir o modal completo.',
            'As colunas foram ajustadas para leitura sem rolagem horizontal e agora separam codigo, cliente, contato, etapa, vendedor e total em campos proprios.',
            'Textos que excedem duas linhas passam a ser truncados com reticencias para manter a altura da grade sob controle.',
            'Ao reabrir a tela, os filtros anteriores sao restaurados automaticamente.'
          ]
        }
      ]}
      cardsRegras={[
        {
          titulo: 'Persistencia do contexto',
          descricao: 'A tela salva por usuario o ultimo recorte de filtros para retomar a mesma analise depois.',
          detalhe: 'Isso reduz retrabalho em operacoes de acompanhamento.',
          icone: 'filtro'
        },
        {
          titulo: 'Permissao de exclusao',
          descricao: usuarioLogado?.tipo === 'Usuario padrao'
            ? 'Usuario padrao nao pode excluir pedidos diretamente pela grade.'
            : 'Perfis com permissao podem excluir pedidos mediante confirmacao explicita.',
          detalhe: 'A regra segue a politica operacional do CRM.',
          icone: 'usuarios'
        },
        {
          titulo: 'Etapa entregue automatica',
          descricao: 'Ao mover o pedido para a etapa Entregue, a data de entrega passa automaticamente para a data atual.',
          detalhe: 'Dentro do modal do pedido, essa data ainda pode ser ajustada manualmente antes de salvar.',
          icone: 'confirmar'
        },
        {
          titulo: 'Prazos coerentes com o sistema',
          descricao: 'Os atalhos de prazo de pagamento dentro do pedido respeitam o mesmo modelo de permissao adotado em Atendimentos e Orcamentos.',
          detalhe: 'Isso evita diferenca de comportamento entre modais comerciais.',
          icone: 'configuracoes'
        },
        {
          titulo: 'Consulta apos entrega',
          descricao: usuarioLogado?.tipo === 'Usuario padrao'
            ? 'Quando o pedido chega em Entregue, o perfil Usuario padrao passa a consultar o registro sem edicao.'
            : 'A etapa Entregue bloqueia a edicao apenas para Usuario padrao; perfis administrativos seguem com gestao completa.',
          detalhe: 'A validacao do status operacional usa o identificador fixo da etapa do sistema.',
          icone: 'pedido'
        }
      ]}
    />
  );
}
