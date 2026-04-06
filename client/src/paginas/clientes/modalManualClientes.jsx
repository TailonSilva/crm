import { ModalManualPagina } from '../../componentes/comuns/modalManualPagina';

export function ModalManualClientes({
  aberto,
  aoFechar,
  clientes = [],
  contatos = [],
  gruposEmpresa = [],
  vendedores = [],
  ramosAtividade = [],
  filtros = {},
  usuarioLogado
}) {
  const filtrosAtivos = Object.values(filtros).filter(Boolean).length;

  return (
    <ModalManualPagina
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Manual de Clientes"
      descricao="Guia visual do cadastro de clientes, contatos, filtros persistidos e regras de carteira aplicadas na tela."
      eyebrow="Base cadastral"
      heroTitulo="Como a pagina de Clientes organiza a carteira"
      heroDescricao="A tela concentra os cadastros de clientes e seus contatos, permitindo consultar dados comerciais, definir vendedor responsavel e manter a carteira organizada com filtros persistidos por usuario."
      painelHeroi={[
        { valor: clientes.length, rotulo: 'Clientes na grade atual' },
        { valor: contatos.length, rotulo: 'Contatos carregados' },
        { valor: ramosAtividade.length, rotulo: 'Ramos de atividade cadastrados' }
      ]}
      cardsResumo={[
        {
          titulo: 'Grade principal',
          descricao: `${clientes.length} cliente(s) no recorte visivel.`,
          detalhe: 'A listagem mostra contato principal, vendedor, cidade, estado e status.',
          icone: 'contato'
        },
        {
          titulo: 'Carteira comercial',
          descricao: `${vendedores.length} vendedor(es) disponivel(is) para vinculacao.`,
          detalhe: 'Usuario padrao com vendedor vinculado trabalha sobre a propria carteira.',
          icone: 'usuarios'
        },
        {
          titulo: 'Classificacao',
          descricao: `${ramosAtividade.length} ramo(s) de atividade auxiliam o filtro e a segmentacao da base.`,
          detalhe: 'O ramo pode ser mantido sem sair do modal do cliente.',
          icone: 'cadastro'
        },
        {
          titulo: 'Grupos empresariais',
          descricao: `${gruposEmpresa.length} grupo(s) de empresa disponivel(is) para vinculo.`,
          detalhe: 'Os contatos do grupo podem ser herdados pelos clientes vinculados.',
          icone: 'empresa'
        },
        {
          titulo: 'Filtros ativos',
          descricao: filtrosAtivos > 0
            ? `${filtrosAtivos} filtro(s) aplicados na tela.`
            : 'Nenhum filtro ativo no momento.',
          detalhe: 'O contexto e restaurado automaticamente ao reabrir a pagina.',
          icone: 'filtro'
        }
      ]}
      cardsFluxo={[
        {
          titulo: 'Cadastrar cliente',
          descricao: 'Use o botao Novo cliente para abrir o formulario completo com dados gerais, vendedor e contatos.',
          icone: 'adicionar'
        },
        {
          titulo: 'Manter contatos',
          descricao: 'Os contatos diretos do cliente sao registrados no mesmo modal; contatos do grupo vinculado aparecem como herdados para consulta.',
          icone: 'mensagem'
        },
        {
          titulo: 'Consultar ou editar',
          descricao: 'A grade permite abrir o registro em consulta ou edicao, conforme o perfil e o fluxo desejado.',
          icone: 'consultar'
        },
        {
          titulo: 'Importar por planilha',
          descricao: 'O botao de importacao abre um modal com download do modelo em planilha, mostra as linhas rejeitadas e, nas pendencias de vendedor, ramo ou grupo, permite escolher um registro existente para reprocessar.',
          icone: 'importar'
        },
        {
          titulo: 'Abrir historicos amplos',
          descricao: 'Atendimento e Vendas agora abrem modais amplos separados para priorizar a leitura dos grids sem comprimir o restante do cadastro.',
          icone: 'pedido'
        },
        {
          titulo: 'Inativar sem perder historico',
          descricao: 'A exclusao operacional da tela acontece por inativacao do cliente, preservando o registro no sistema.',
          icone: 'confirmar'
        }
      ]}
      blocosTexto={[
        {
          tag: 'Cadastro',
          titulo: 'Informacoes importantes do formulario',
          itens: [
            'O codigo sugerido do cliente e calculado automaticamente a partir do primeiro codigo disponivel.',
            'O cadastro agora aceita um Codigo alternativo numerico e opcional para identificacao comercial adicional.',
            'O vendedor pode vir bloqueado para Usuario padrao quando a carteira e restrita ao proprio vendedor.',
            'O cliente pode ser vinculado a um Grupo de empresa, herdando os contatos cadastrados nesse grupo.',
            'O cadastro de contatos diretos e salvo junto com o cliente, mantendo o vinculo por idCliente.',
            'Quando o usuario abrir a busca de contatos a partir de Atendimento, Orcamento ou Pedido com um cliente ja definido, esse mesmo formulario de contato pode ser aberto de dentro da busca e o novo contato volta selecionado automaticamente no registro comercial.',
            'Ramos de atividade e grupos de empresa podem ser mantidos sem sair do modal, sem perder o preenchimento ja feito no cliente.',
            'Ao concluir um novo ramo ou grupo pelo atalho do campo, o registro criado volta selecionado automaticamente no formulario do cliente.',
            'O modelo de importacao traz uma aba de instrucoes com campos obrigatorios, tipo esperado e limite de caracteres para facilitar o preenchimento.',
            'Na importacao, o sistema aponta com mais precisao quando CNPJ/CPF, codigo, UF, CEP, email, status ou referencias de apoio estiverem invalidos, inativos ou nao encontrados.',
            'Quando vendedor, ramo de atividade ou grupo de empresa nao forem resolvidos na importacao, o proprio modal apresenta um grid para vincular um registro existente e reenviar apenas essas linhas.',
            'Quando a empresa estiver configurada para usar o Codigo alternativo como principal, os grids que exibem codigo passam a priorizar esse valor e usam o codigo padrao como fallback se o alternativo estiver vazio.'
          ]
        },
        {
          tag: 'Grade',
          titulo: 'Como a listagem ajuda na operacao',
          itens: [
            'A pesquisa textual filtra rapidamente a grade combinando dados relevantes do cliente.',
            'Os filtros incluem estado, cidade, grupo de empresa, ramo, vendedor, tipo e status do cadastro.',
            'A busca tambem considera o Codigo alternativo quando ele estiver preenchido.',
            'A grade prioriza leitura sem rolagem horizontal e agora separa codigo, cliente, documento, contato e e-mail em colunas proprias.',
            'Quando um texto passa de duas linhas, a propria celula aplica reticencias para manter a altura da listagem mais previsivel.',
            'O contato principal e enriquecido para aparecer diretamente na grade.',
            'A listagem ja considera a carteira do vendedor quando o perfil e restrito.',
            'Atendimento e Vendas sairam do corpo principal do cliente e agora abrem modais quase em tela cheia; ambos ganharam busca por digitacao no cabecalho e filtros mais completos. Em Atendimento, a grade separa Data, Inicio, Fim, Assunto e Contato, e o filtro usa um botao unico de Data e horario mais selecao multipla de Usuario e Canal. Em Vendas, continuam as duas visoes de Pedidos e Itens do pedido com colunas separadas de Inclusao e Entrega e filtros por Datas, um ou mais Pedidos, um ou mais Vendedores, uma ou mais Etapas e Produto via busca em grade.'
          ]
        }
      ]}
      cardsRegras={[
        {
          titulo: 'Persistencia de filtros',
          descricao: 'Estado da tela e filtros ficam salvos por usuario para que a pagina reabra no mesmo contexto.',
          detalhe: 'Isso vale inclusive para filtros de vendedor em ambientes administrativos.',
          icone: 'filtro'
        },
        {
          titulo: 'Carteira restrita',
          descricao: usuarioLogado?.tipo === 'Usuario padrao'
            ? 'Neste perfil, a pagina trabalha com a carteira vinculada ao usuario quando houver vendedor definido.'
            : 'Perfis administrativos visualizam toda a base de clientes cadastrada.',
          detalhe: 'A restricao tambem vale para o filtro e para o vendedor sugerido no modal.',
          icone: 'usuarios'
        },
        {
          titulo: 'Ramo no proprio fluxo',
          descricao: 'O atalho interno de ramo de atividade pode incluir e editar registros sem sair do cadastro do cliente, inclusive para Usuario padrao.',
          detalhe: 'O formulario principal permanece preenchido e o novo ramo retorna selecionado automaticamente.',
          icone: 'configuracoes'
        },
        {
          titulo: 'Grupo no proprio fluxo',
          descricao: 'O grupo de empresa pode ser cadastrado diretamente do modal do cliente e selecionado sem sair do preenchimento.',
          detalhe: 'Esse atalho permanece disponivel mesmo para perfis operacionais.',
          icone: 'empresa'
        }
      ]}
    />
  );
}
