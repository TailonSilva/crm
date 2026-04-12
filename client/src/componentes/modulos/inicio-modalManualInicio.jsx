import { ModalManualPagina } from '../comuns/modalManualPagina';

export function ModalManualInicio({
  aberto,
  aoFechar,
  usuarioLogado
}) {
  return (
    <ModalManualPagina
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Manual da Pagina Inicial"
      descricao="Resumo da estrutura atual da home comercial."
      eyebrow="Dashboard"
      heroTitulo="Leitura comercial por abas"
      heroDescricao="A pagina inicial separa `Orcamentos`, `Vendas` e `Atendimentos` em abas e usa secoes compactas com leitura visual padronizada."
      painelHeroi={[
        { valor: '3 abas', rotulo: 'Orcamentos, Vendas e Atendimentos' },
        { valor: 'Top 5', rotulo: 'Itens exibidos por grafico' },
        { valor: 'Modal completo', rotulo: 'Lista total por sessao' }
      ]}
      cardsResumo={[
        {
          titulo: 'Indicadores iniciais',
          descricao: 'A home abre com cards compactos de leitura rapida.',
          detalhe: 'Hoje incluem Orcamentos em aberto, Pedidos no mes, Media de dias para conversao, Atendimentos no mes, Prospeccao no mes, Comissao no mes, Comissao entregue no mes, Positivacao no mes, % Positivacao da carteira, Catalogo e Carteira.',
          icone: 'inicio'
        },
        {
          titulo: 'Aba Orcamentos',
          descricao: 'Reune o funil e os resumos de orcamentos em aberto.',
          detalhe: 'As secoes usam apenas etapas em aberto, com visoes por grupo, marca e produto, sempre validando etapas obrigatorias por ID.',
          icone: 'orcamento'
        },
        {
          titulo: 'Aba Vendas',
          descricao: 'Reune devolucoes, vendas por grupo, marca, UF, cliente, produto e ranking.',
          detalhe: 'As leituras usam pedidos do mes corrente conforme a regra definida em cada sessao.',
          icone: 'pedido'
        },
        {
          titulo: 'Aba Atendimentos',
          descricao: 'Reune leituras por canal, origem, cliente, tipo e usuario.',
          detalhe: 'As sessoes usam sempre os atendimentos do mes corrente pela data do atendimento.',
          icone: 'atendimentos'
        },
        {
          titulo: 'Padrao visual',
          descricao: 'Graficos compactos exibem no maximo 5 linhas na home.',
          detalhe: 'Quando houver mais itens, o botao lateral abre um modal com a lista completa.',
          icone: 'lista'
        }
      ]}
      cardsFluxo={[
        {
          titulo: 'Ler os 5 principais',
          descricao: 'Cada grafico mostra apenas os 5 primeiros resultados na pagina.',
          icone: 'consultar'
        },
        {
          titulo: 'Abrir lista completa',
          descricao: 'O icone lateral ao lado do `Info` abre o modal com todos os registros daquela sessao.',
          icone: 'lista'
        },
        {
          titulo: 'Entender os calculos',
          descricao: 'O icone de `Informacao` explica cada sessao com texto curto.',
          icone: 'informacao'
        },
        {
          titulo: 'Alternar contexto',
          descricao: 'As abas separam a leitura de Orcamentos e Vendas sem misturar funil com analise comercial.',
          icone: 'configuracoes'
        }
      ]}
      blocosTexto={[
        {
          tag: 'Regras da home',
          titulo: 'Padrao atual dos graficos',
          itens: [
            'Graficos compactos da home usam o padrao `maximo de 5 itens + modal com lista completa`.',
            'Todo novo card ou grafico criado para a home deve entrar tambem na lista de configuracao da empresa (aba Pagina inicial).',
            'Cards e graficos usam tooltip padrao curto no icone de Informacao, com duas linhas: Composicao e Periodo.',
            'As secoes de resumo por relacionamento ocupam 2 colunas no grid principal da home.',
            'O tooltip da sessao fica no icone de informacao e o modal completo abre pelo icone lateral.',
            'Os calculos respeitam sempre as regras do recorte do mes corrente definidas para cada aba.'
          ]
        },
        {
          tag: 'Perfis',
          titulo: 'Leitura por perfil',
          items: undefined,
          itens: [
            usuarioLogado?.tipo === 'Usuario padrao'
              ? 'Usuario padrao ve cards e graficos da home com `orcamentos` e `pedidos` do proprio vendedor e com `atendimentos` do proprio usuario do registro.'
              : 'Perfis administrativos veem a home com leitura geral da operacao.',
            'O mesmo padrao visual das secoes e mantido independentemente do perfil.',
            'As explicacoes das secoes ajudam a identificar o periodo e a logica de calculo usada em cada bloco.'
          ]
        }
      ]}
      cardsRegras={[
        {
          titulo: 'Componentes reutilizaveis',
          descricao: 'As secoes da home devem priorizar componentes proprios e CSS por componente.',
          detalhe: 'Esse padrao evita concentrar layout complexo dentro de `paginaInicio.jsx`.',
          icone: 'caixa'
        },
        {
          titulo: 'Modal padrao de lista completa',
          descricao: 'O mesmo modal deve servir para qualquer sessao que mostre top 5 e permita ver todos.',
          detalhe: 'A ideia e reutilizar a mesma logica para novas secoes da home.',
          icone: 'lista'
        },
        {
          titulo: 'Leitura sem excesso',
          descricao: 'A home mostra apenas o essencial na primeira vista e deixa o restante para modal e tooltip.',
          detalhe: 'Isso evita poluicao visual em telas menores.',
          icone: 'selo'
        },
        {
          titulo: 'Atualizacao continua',
          descricao: 'Sempre que a estrutura da home mudar, o manual e o README devem ser atualizados junto.',
          detalhe: 'A documentacao da home acompanha o padrao visual e de calculo vigente.',
          icone: 'manual'
        }
      ]}
    />
  );
}

