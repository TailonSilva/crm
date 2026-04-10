# Connecta CRM

Connecta CRM com `Electron`, `React + Vite`, `Express` e `SQLite`, com backend local, banco embarcado, interface em portugues e fluxo de distribuicao por `GitHub Releases`.

Hoje o projeto ja atende um cenario real de desktop comercial, com login, controle por perfil, agenda semanal, pagina inicial com indicadores, cadastros principais, modulo de atendimentos, orcamentos, pedidos, configuracoes auxiliares e atualizacao automatica do aplicativo.

## Stack

- `Electron` para a aplicacao desktop
- `React 19 + Vite` para a interface
- `Express 5` para a API local
- `SQLite` para persistencia embarcada
- `electron-builder` para empacotamento e publicacao
- `electron-updater` para auto-update via GitHub Releases

## Identidade atual

- Nome do aplicativo: `Connecta CRM`
- Nome tecnico do pacote: `connecta-crm`
- Instalador Windows: `Connecta-CRM-Setup-x.y.z.exe`
- Repositorio de releases e update: `TailonSilva/connecta-crm`
- `appId` atual: `com.crm.desktop`

Observacao importante:

- O nome visual do app ja mudou para `Connecta CRM`
- O `appId` foi mantido para preservar continuidade tecnica do aplicativo
- Em instalacoes antigas, mudar `productName` pode alterar a pasta de dados do Electron, entao essa decisao deve ser tratada com cuidado em novas mudancas de marca

## Estrutura principal

- `client/`: aplicacao React
- `client/src/componentes/`: componentes reutilizaveis da interface
- `client/src/idex.html`: pagina estatica de vendas em arquivo unico para apresentacao comercial da ferramenta
- `client/src/paginas/`: paginas do sistema
- `client/src/servicos/`: comunicacao com a API
- `client/src/utilitarios/`: funcoes auxiliares e regras compartilhadas do frontend
- `client/src/recursos/`: estilos e recursos visuais
- `electron/`: processo principal e preload do desktop
- `server/app.js`: configuracao principal da API Express
- `server/index.js`: inicializacao do servidor
- `server/rotas/`: rotas customizadas e autenticacao
- `server/configuracoes/`: banco SQLite, entidades e infraestrutura compartilhada
- `server/scripts/`: scripts utilitarios, incluindo populacao do banco

## Convencoes do projeto

- O projeto usa portugues em textos, nomes internos e documentacao sempre que nao houver conflito com APIs externas
- Todo identificador definido pelo projeto deve usar `camelCase`
- Componentes, utilitarios, servicos e estilos devem ser reaproveitados ao maximo
- Todo botao deve sair do componente reutilizavel padrao do projeto
- Os estilos padrao de botao sao `primario`, `secundario`, `complementar` e `perigo`
- Grades principais usam estrutura semantica real de tabela
- Acoes de linha usam o componente central de acoes da interface
- Selos de codigo usam o componente padrao de codigo do projeto
- Funcoes reutilizaveis do frontend ficam em `client/src/utilitarios`
- Servicos auxiliares de listagem usados por campos de busca e selecao retornam apenas registros ativos por padrao; listas principais de entidades continuam completas e modais de busca reutilizaveis filtram inativos automaticamente
- Campos de formulario com botoes laterais de busca, consulta ou cadastro devem usar os contêineres compartilhados de acao do formulario para manter o botao ao lado do input/select sem quebrar a grade
- Selects de contato devem exibir o rotulo no formato `Nome - Cargo` sempre que o cargo estiver preenchido
- Sempre que houver mudanca estrutural relevante de banco, fluxo desktop ou release, o README deve ser atualizado
- Sempre que houver alteracao relevante de arquitetura frontend, padroes reutilizaveis ou convencoes de implementacao, o README tambem deve ser atualizado no mesmo trabalho
- Grades de dados do aplicativo devem nascer do componente-base reutilizavel `GradePadrao`; excecoes ficam restritas a documentos de exportacao e PDF
- Quando um modulo precisar priorizar composicao visual flexivel em vez de tabela semantica fixa, o `GradePadrao` pode operar em modo de layout com `display: grid`, mantendo carregamento, estados e rolagem reutilizaveis
- Grades de dados devem priorizar leitura sem rolagem horizontal: colunas curtas como codigo, valores e acoes permanecem mais contidas, enquanto colunas textuais podem expandir, quebrar linha ou aplicar truncamento visual conforme o contexto
- Grades de dados nao devem empilhar duas informacoes diferentes na mesma celula; quando o registro exigir mais de um dado relevante, cada informacao deve ganhar sua propria coluna
- Sempre que o conteudo textual de uma celula ultrapassar duas linhas, a grade deve truncar visualmente com reticencias para preservar altura previsivel e leitura da listagem
- Quando uma grade tiver muitas colunas ou textos longos, a distribuicao horizontal deve usar presets de largura por contexto dentro do `GradePadrao`, em vez de voltar para tabelas isoladas ou CSS solto por pagina
- Quando a empresa puder escolher colunas visiveis de uma grade, essa configuracao deve ficar persistida no cadastro da `Empresa`, refletir todas as colunas persistidas daquele modulo e usar renderizacao dinamica de cabecalho, linhas e `colgroup`
- Grades configuraveis tambem devem permitir personalizar o `rotulo` exibido no cabecalho de cada coluna, mantendo `Acoes`, `Codigo` e `Status` com espacos fixos quando essa regra existir no modulo
- Grades principais com pesquisa e filtros devem priorizar filtro no backend: a interface envia os parametros atuais da tela para a API e a listagem retorna somente o recorte solicitado
- Quando a pagina precisar dados auxiliares para modais e selects, esse contexto deve ser carregado separado da grade principal, para evitar recarregar listas inteiras a cada digitacao ou troca de filtro
- Cada componente novo deve ter seu proprio arquivo de estilo com o mesmo nome do componente salvo em `client/src/recursos/estilos/`
- CSS de pagina deve ficar restrito a layout/composicao da pagina e tambem salvo em `client/src/recursos/estilos/`
- Classes CSS devem ser prefixadas pelo nome do componente para reduzir acoplamento visual e colisao de seletores
- Mesmo componentes de pagina devem seguir a mesma regra: `paginaInicio.jsx` usa `client/src/recursos/estilos/paginaInicio.css`, `funilVendas.jsx` usa `client/src/recursos/estilos/funilVendas.css`, e assim por diante
- Para `Usuario padrao`, cards e graficos da pagina inicial devem sempre filtrar por `idVendedor` do usuario logado; `Administrador` e `Gestor` veem leitura geral sem esse recorte

## Arquitetura atual das grades

- Grades principais de `Clientes`, `Produtos`, `Atendimentos`, `Orcamentos` e `Pedidos` nao devem mais carregar a tabela inteira para filtrar no frontend
- O fluxo esperado agora e: carregar contexto da pagina em uma etapa separada, enviar `pesquisa + filtros atuais` para a API e renderizar apenas o recorte devolvido pelo backend
- Dados auxiliares para filtros, selects, modais de busca e enriquecimento visual continuam vindo das tabelas auxiliares corretas, em requisicoes separadas da grade principal
- O frontend deve usar `client/src/utilitarios/montarParametrosConsulta.js` para montar query string e manter um formato consistente entre modulos
- Listagens enxutas de grade ficam concentradas em rotas dedicadas de `server/rotas/listagens.js` quando o modulo usar CRUD simples; fluxos customizados como `Orcamentos` e `Pedidos` continuam filtrando dentro das proprias rotas
- A camada SQL compartilhada de filtros fica em `server/utilitarios/filtrosSql.js` e deve ser o ponto central de normalizacao de valores, listas e filtros numericos
- O frontend nao deve depender de carregar todos os registros para preencher filtros de selecao; esses filtros devem buscar diretamente suas tabelas auxiliares, como `ramosAtividade`, `gruposEmpresa`, `gruposProduto`, `marcas`, `unidadesMedida`, `vendedores`, `etapas` e similares
- Quando a tela precisar contexto e grade ao mesmo tempo, falhas no contexto nao devem derrubar automaticamente a carga da grade; essas duas responsabilidades devem permanecer separadas
- Em erros de grade, a interface deve priorizar expor a mensagem real retornada pela API ou pelo navegador durante desenvolvimento para reduzir diagnostico por tentativa e erro

## Componentes e padroes reutilizaveis

Padroes centralizados no frontend:

- `Botao`: botoes primarios, secundarios, complementares, perigo e somente icone
- `GradePadrao`: componente-base unico para grades de dados da interface, com cabecalho fixo, rolagem vertical na lista, estados de carregamento/erro/vazio, `colgroup` opcional, distribuicao mais flexivel das colunas, suporte a presets de largura por contexto e classes de compatibilidade para preservar variacoes visuais existentes
- `AcoesRegistro`: acoes padrao de linha
- `CodigoRegistro`: selo visual de codigo
- `CampoImagemPadrao`: upload, preview e recorte de imagem com resolucao de saida configuravel por contexto e area de corte destacada no modal com moldura pontilhada e cantos arredondados
- `ModalItemProduto`: modal compartilhado de item para pedido e orcamento
- `ModalFiltros`: modal generico de filtros, com suporte a um botao unico de datas que abre um modal interno com todos os periodos da tela
- `CampoSelecaoMultiplaModal`: selecao multipla com botao-resumo e modal com checkbox
- `ModalBuscaTabela`: base reutilizavel para modais de busca em grade
- `ModalBuscaClientes`: busca reutilizavel de clientes
- `ModalBuscaContatos`: busca reutilizavel de contatos, com inclusao rapida quando o formulario ja tiver cliente definido
- `ModalBuscaProdutos`: busca reutilizavel de produtos
- `ModalHistoricoGrade`: base reutilizavel para modais amplos de historico em grade, com cabecalho, abas opcionais e acao de filtro
- `ModalRelatorioGrade`: base reutilizavel para modais amplos de relatorio, com cards de resumo no topo e filtro no cabecalho
- `ModalImportacaoCadastro`: modal reutilizavel para importacao por planilha, com download de modelo e tabela de linhas rejeitadas
- `ModalContatoCliente`: formulario reutilizavel de contato
- `ModalRamosAtividade`: lista e cadastro reutilizavel de ramos
- `ModalGruposProduto`: lista e cadastro de grupos de produto com botao dedicado para abrir um submodal compacto de selecao de tamanhos e ordem por grupo
- `ModalMarcas`: lista e cadastro reutilizavel de marcas
- `ModalUnidadesMedida`: lista e cadastro reutilizavel de unidades
- `TabelaHistoricoPedidos`: grade reutilizavel de pedidos para historicos e relatorios, com coluna de acoes opcional
- `DocumentoOrcamentoPdf`: layout isolado usado para exportacao do orcamento em PDF

Padroes aplicados recentemente:

- Busca de clientes foi unificada para atendimento e orcamento
- Busca de contatos foi unificada para atendimento, orcamento e pedido
- Quando a busca de contatos for aberta com um cliente ja definido, o proprio modal permite incluir um novo contato e devolve esse contato ja selecionado no formulario atual
- O cadastro de cliente reaproveita o mesmo fluxo de `Ramo de Atividade` usado em configuracoes
- No modal de cliente, as abas `Atendimento` e `Vendas` possuem grade propria com botao de filtro; os filtros de data abrem por padrao no mes corrente e o ultimo filtro aplicado fica salvo entre aberturas do modal, independentemente do cliente aberto
- O cadastro de produto reaproveita os mesmos fluxos de configuracao para `Grupo de Produto`, `Marca` e `Unidade`
- Modais com abas usam cabecalho e faixa de abas fixos, com rolagem apenas no corpo
- Modais empilhados possuem camadas de z-index separadas para evitar abertura por tras do modal pai
- O relatorio de Conversao exibe cards de orcamentos gerados, fechados, conversao, cancelados, % perca e em aberto; cancelados e % perca usam a etapa obrigatoria `Recusado`, enquanto `Pedido Excluido` fica separado como etapa tecnica obrigatoria para orcamentos cujo pedido vinculado foi removido

Utilitarios importantes:

- `normalizarTelefone.js`: padroniza telefone no formato brasileiro
- `normalizarPreco.js`: trata exibicao e digitacao de preco em real
- `obterPrimeiroCodigoDisponivel.js`: encontra o primeiro codigo livre para novos registros
- `codigoCliente.js`: centraliza a escolha e a formatacao do codigo principal do cliente com base na configuracao da empresa

## Modulos implementados

### Login e sessao
- Tela de login com a marca `Connecta CRM`
- Logo personalizada na tela inicial
- Validacao de `usuario` e `senha` via API local
- Sessao mantida apenas durante a janela atual do app; ao fechar e abrir novamente, o usuario precisa autenticar de novo
- Filtros das paginas principais ficam persistidos por usuario no `localStorage` do app Electron e reabrem com o ultimo estado aplicado

### Pagina inicial

- A pagina inicial usa abas `Orcamentos` e `Vendas` para separar funil e analise comercial
- A configuracao da empresa agora possui a aba `Pagina inicial`, com botoes `Graficos Orcamentos` e `Graficos Vendas`
- A mesma aba agora tambem possui o bloco `Cards resumo`, usado para configurar os cards que aparecem no topo das duas abas da home
- Cada aba da home pode ser configurada por lista, com `visivel`, `ordem`, `colunas` e `rotulo`, usando malha de `10 colunas`
- Os `Cards resumo` usam `visivel`, `ordem`, `colunas` e `rotulo`, e a composicao precisa caber em no maximo duas linhas de `10 colunas` cada
- A ordem das sessoes da home segue leitura visual: de cima para baixo e da esquerda para a direita
- Regra obrigatoria: sempre que um novo card ou uma nova sessao de grafico for criado na pagina inicial, ele tambem deve ser incluido na configuracao da empresa (aba `Pagina inicial`) para permitir controle de exibicao, ordem, largura e rotulo
- Os cards iniciais atuais mostram `Orcamentos em aberto`, `Pedidos no mes`, `Comissao no mes`, `Positivacao no mes`, `% Positivacao da carteira`, `Catalogo` e `Carteira`
- Todo card da home deve ter tooltip no icone de `Informacao`
- O texto do tooltip de card deve ser simples e direto, sempre com `composicao do valor` e `periodo considerado`, no mesmo padrao dos tooltips dos graficos
- Padrao de conteudo dos tooltips de card: no maximo duas linhas curtas (`Composicao` e `Periodo`), sem textos longos
- Os graficos compactos da home seguem o padrao `maximo de 5 itens + modal com lista completa`
- O modal com a lista completa deve ser reutilizavel para qualquer sessao da home que precise resumir muitos itens
- Os icones de `Informacao` de cards e graficos usam tooltip padrao curto com apenas `Composicao` e `Periodo`
- O icone lateral ao lado do `Informacao` abre o modal com a lista completa quando houver mais de 5 resultados
- As secoes graficas compactas da home ocupam `2 colunas` no grid principal, salvo quando uma sessao explicitar outro span
- A aba `Orcamentos` concentra `Funil de orcamentos`, `Orcamentos em aberto por grupo de produtos`, `Orcamentos em aberto por marca`, `Orcamentos em aberto por produto` e `Motivos de perda do mes`
- A sessao `Orcamentos em aberto por grupo de produtos` e componente reutilizavel proprio e aparece na configuracao da empresa em `Pagina inicial > Graficos Orcamentos`
- A aba `Vendas` concentra `Devolucoes do mes`, `Vendas do mes por grupo de produtos`, `Vendas do mes por marca`, `Vendas do mes por UF`, `Vendas do mes por cliente`, `Vendas do mes por produto` e `Vendedores/Clientes em destaque`
- `Devolucoes do mes` usa valores convertidos para positivo apenas para leitura do grafico
- O texto do tooltip de card e grafico deve ser simples e direto, com no maximo duas linhas curtas (`Composicao` e `Periodo`)
- Para `Usuario padrao`, toda a aba da home (`cards` e `graficos`) usa apenas registros de `orcamentos` e `pedidos` do vendedor vinculado ao usuario (`idVendedor`)
- Para `Administrador` e `Gestor`, a home mantem leitura consolidada da operacao sem recorte por vendedor
- A pagina inicial segue em evolucao e a composicao atual da home deve ser lida pelos blocos documentados acima
- As barras exibem novamente a descricao da etapa diretamente sobre a propria barra, junto do valor
- A descricao dentro da barra usa a paleta do projeto com variacao baseada na cor da etapa, e o valor aparece em negrito
- As barras usam uma largura mais contida e com maior espacamento entre linhas para aliviar a leitura visual
- A distribuicao vertical das barras respeita a altura disponivel do card lateral sem sobreposicao entre linhas
- O grafico do funil se ajusta automaticamente quando a quantidade de etapas aumenta, reduzindo proporcoes e espacamentos para manter o layout estavel
- O cabecalho do funil exibe apenas o titulo principal, sem subtitulo auxiliar
- A grade do funil prioriza aproximar o valor das barras e reservar mais largura para o card lateral de detalhe
- O espacamento entre a coluna dos valores e o card lateral foi ampliado para melhorar a leitura
- A troca de etapa aplica uma transicao curta no card lateral para reforcar a mudanca de contexto
- A coluna da direita mostra um card resumido da etapa selecionada, com a primeira etapa carregada por padrao
- O card lateral foi compactado para nao ultrapassar visualmente a altura ocupada pelas barras do funil
- A altura total das barras passa a respeitar o card lateral como limite visual no desktop
- Ao clicar em outra barra do funil, o card lateral troca para a etapa correspondente
- A pagina inicial foi separada em componentes proprios e usa arquivos CSS dedicados para indicadores e funil
- Todo novo card/componente da pagina inicial deve ser reutilizavel e possuir arquivo CSS proprio em `client/src/recursos/estilos/`
- O cabecalho e cada card de indicador da pagina inicial seguem o padrao de CSS separado por componente
- O funil da pagina inicial foi dividido em subcomponentes com classes prefixadas por componente (`funilVendas...`, `inicioIndicadorResumo...`, `inicioCabecalho...`)
- Todos os CSS desses componentes ficam centralizados em `client/src/recursos/estilos/`
- Componentes-base compartilhados como App, PaginaLogin, BarraLateral, Botao, BotaoMenu, Icone, CampoPesquisa, PopupAvisos, CorpoPagina e CartaoPaginaVazia tambem ja seguem esse padrao
- `client/src/recursos/estilos/aplicacao.css` agora contem apenas variaveis, reset global e estilos base de tags
- Blocos compartilhados e remanescentes do legado foram distribuídos em arquivos dedicados como `gradePadrao.css`, `registrosTabela.css`, `formulariosBase.css`, `modaisBase.css`, `modalSecundario.css` e CSS por pagina em `client/src/recursos/estilos/`
- Carregamento via API local
- Mensagem de erro dedicada se os indicadores nao puderem ser carregados

### Perfis de acesso

Perfis disponiveis:

- `Administrador`
- `Gestor`
- `Usuario padrao`

Regras atualmente aplicadas no frontend:

- `Usuario padrao` nao pode alterar configuracoes administrativas
- `Usuario padrao` nao acessa `Empresa` nem `Usuarios` na tela de configuracoes
- `Usuario padrao` consulta produtos, sem incluir, editar, importar ou inativar
- `Usuario padrao` enxerga apenas clientes da carteira do vendedor vinculado
- Na pagina inicial, `Usuario padrao` enxerga cards e graficos comerciais apenas de `orcamentos` e `pedidos` do proprio vendedor vinculado
- Ao incluir cliente, `Usuario padrao` recebe o vendedor fixado e bloqueado
- Na agenda, `Usuario padrao` nao pode excluir agendamentos
- Em configuracoes reutilizadas dentro de cadastros, usuarios sem permissao entram em modo de consulta

Observacao:

- As restricoes de permissao estao principalmente no frontend
- O backend ainda nao implementa uma camada completa de autorizacao por perfil

### Clientes

- Tela com grade, pesquisa e filtro
- Manual visual da pagina de clientes acessado por `F1`, com fluxo do cadastro, carteira e filtros persistidos
- Modal em abas para incluir, editar e consultar
- Abas principais do cadastro: `Dados gerais`, `Endereco`, `Observacoes` e `Contato`
- Os antigos grids de `Atendimento` e `Vendas` agora abrem em modais amplos separados, quase em tela cheia, para facilitar leitura operacional
- No historico de `Atendimentos`, a grade mostra `Data`, `Inicio`, `Fim`, `Assunto`, `Contato`, `Canal`, `Usuario` e `Acoes`
- O historico de `Atendimentos` tambem oferece busca por digitacao no cabecalho e filtros por `Data e horario`, um ou mais `Usuarios` e um ou mais `Canais`
- Dentro do modal amplo de `Vendas`, continuam duas visoes: `Pedidos` e `Itens do pedido`, agora no mesmo componente reutilizavel usado tambem em produtos
- O grid de `Pedidos` da aba Vendas nao exibe mais o nome do contato
- O grid de `Pedidos` mostra `Inclusao`, `Entrega`, `Pedido`, `Cliente` quando aplicavel, `Etapa`, `Vendedor`, `Prazo de pagamento`, `Total` e `Acoes`
- Os grids de `Pedidos` e `Itens do pedido` mostram colunas separadas de `Inclusao` e `Entrega`, e o filtro desse historico tambem separa os dois periodos
- O grid de `Itens do pedido` mostra `Inclusao`, `Entrega`, `Pedido`, `Referencia`, `Descricao`, `VALOR UN`, `QTD` e `Valor total`
- O historico de `Vendas` tambem oferece busca por digitacao no cabecalho e filtros por `Datas`, um ou mais `Pedidos`, um ou mais `Vendedores`, uma ou mais `Etapas` e `Produto` via modal de busca em grade; as opcoes de pedido consideram apenas pedidos do cliente consultado
- Thumbnail com codigo do cliente
- O cadastro de cliente aceita um `Codigo alternativo` numerico e opcional
- A empresa pode definir se o CRM exibe como principal o codigo padrao do cliente ou o `Codigo alternativo`; quando o alternativo estiver vazio, o sistema volta automaticamente ao codigo padrao
- O botao de importacao de clientes abre um modal com download de modelo em planilha; apos importar, o sistema informa as linhas rejeitadas e o motivo de cada uma
- Quando uma linha de clientes falha por vendedor, ramo de atividade ou grupo de empresa nao encontrado/inativo, o modal de importacao passa a exibir um grid de pendencias para escolher um registro existente e reprocessar apenas essas linhas
- A importacao de clientes valida com mensagens especificas campos como CNPJ/CPF, codigo numerico, vendedor, ramo, grupo, UF, CEP, email e status antes de inserir cada linha
- Integracao publica para consulta de `CEP`
- Integracao publica para consulta de `CNPJ`
- Aba de contatos com grade propria
- Formulario de contato reutilizavel
- Campo `Grupo de empresa` no modal do cliente, com atalho lateral para cadastrar e selecionar o grupo sem sair do fluxo
- Cada cliente pode se vincular a no maximo um `Grupo de empresa`, enquanto um grupo pode atender varios clientes
- Contatos do grupo aparecem como herdados no cadastro do cliente e ficam disponiveis para consulta no proprio modal
- Abertura do mesmo modal de `Ramo de Atividade` usado em configuracoes
- Inclusao e edicao de `Ramo de atividade` diretamente do cadastro de cliente, inclusive para `Usuario padrao`
- Os atalhos de `Grupo de empresa` e `Ramo de atividade` preservam o formulario do cliente enquanto o cadastro auxiliar e aberto
- Ao salvar um novo `Grupo de empresa` ou `Ramo de atividade` por esses atalhos, o registro retorna selecionado automaticamente no cliente
- Inativacao persiste no banco

Filtros de clientes:

- `Estado`
- `Cidade`
- `Grupo de empresa`
- `Ramo de atividade`
- `Vendedor`
- `Tipo`
- `Ativo`

### Produtos

- Tela com grade, pesquisa e filtro
- Manual visual da pagina de produtos acessado por `F1`, com regras de catalogo, classificacoes auxiliares e permissoes do perfil
- Modal no mesmo padrao visual de clientes
- Modos incluir, editar e consultar
- No modal do produto, a aba `Vendas` abre o mesmo historico amplo reutilizavel do cliente, filtrado automaticamente pelo produto selecionado e exibindo apenas itens dos pedidos
- Nesse historico do produto, os filtros consideram separadamente `Data de inclusao` e `Data de entrega`
- Codigo automatico ao incluir
- Upload de imagem no padrao reutilizavel do projeto, com recorte final em 320 x 320 px para a foto principal do produto
- Campo de preco com mascara e digitacao amigavel em real
- Campo `Grupo de Produto` com botao de pesquisa para abrir o modal de configuracao
- O modal de `Grupo de Produto` permite definir quais `Tamanhos` estao disponiveis para cada grupo e em qual ordem devem aparecer
- Campo `Marca` com botao de pesquisa para abrir o modal de configuracao
- Campo `Unidade` com botao de pesquisa para abrir o modal de configuracao
- O botao de importacao de produtos abre um modal com download de modelo em planilha; apos importar, o sistema informa as linhas rejeitadas e o motivo de cada uma
- Quando uma linha de produtos falha por grupo, marca ou unidade nao encontrado/inativo, o modal de importacao passa a exibir um grid de pendencias para escolher um registro existente e reprocessar apenas essas linhas
- A importacao de produtos diferencia referencias auxiliares inativas de referencias inexistentes e tambem valida preco, codigo numerico e status com mensagens mais objetivas
- Inclusao e selecao imediata de registros auxiliares dentro do cadastro de produto
- Inativacao persiste no banco

Filtros de produtos:

- `Grupo`
- `Marca`
- `Unidade`
- `Ativo`

### Agenda

- Agenda semanal de segunda a sexta
- Grade de `15 em 15 minutos`
- Expansao automatica da faixa horaria quando houver agendamento fora do expediente padrao
- Horario padrao baseado na configuracao de expediente da empresa
- Intervalo sem expediente com destaque visual leve
- Selecao de faixa por arraste
- Duplo clique na grade para incluir em um horario especifico
- Botao de incluir que usa a faixa selecionada
- Clique simples no card seleciona
- Duplo clique no card abre edicao
- Tooltip no hover com detalhes completos
- Cards coloridos conforme o tipo de agenda
- Suporte visual a conflitos de horario, dividindo o espaco em vez de sobrepor
- Copiar e colar agendamento com `Ctrl+C` e `Ctrl+V`
- Manual visual da agenda acessado por `F1`, com regras, obrigatoriedades, configuracoes e logicas reais da tela

Campos atuais do agendamento:

- `Assunto`
- `Dia`
- `Tipo`
- `Local`
- `Horario de inicio`
- `Horario de fim`
- `Cliente`
- `Contato do cliente`
- `Recursos` com selecao multipla
- `Usuarios` com selecao multipla
- `Status da visita`
- Ao incluir um agendamento, o campo `Status da visita` passa a vir preenchido automaticamente com o status ativo de menor ordem

Filtros da agenda:

- `Usuario` com selecao multipla
- `Vendedor`
- `Cliente`
- `Local`
- `Recurso` com selecao multipla
- `Status`

### Atendimentos

- Tela com grade, pesquisa e filtros
- Modal de atendimento com formulario proprio
- Manual visual da pagina acessado por `F1`, com fluxo, validacoes, permissoes e atalhos reais da tela
- A grade principal usa distribuicao dinamica por coluna, mantendo dados curtos e previsiveis como `Data`, `Inicio`, `Fim`, `Origem` e `Acoes` mais contidos, deixando `Assunto` e `Descricao` ocuparem a maior parte do espaco util
- A empresa pode definir em `Configuracoes > Atendimentos > Colunas do grid` quais colunas do cadastro aparecem na listagem principal, incluindo `Codigo`, `Agendamento`, `Data`, `Inicio`, `Fim`, `Cliente`, `Contato`, `Assunto`, `Descricao`, `Canal`, `Origem` e `Usuario`
- A configuracao do grid principal de `Atendimentos` tambem permite definir a ordem e o espaco ocupado por cada informacao em uma malha de `100` partes, com `Acoes` sempre visivel
- O atalho geral `Colunas do grid` abre um seletor por modulo; hoje `Atendimentos`, `Clientes`, `Produtos`, `Orcamentos` e `Pedidos` ja permitem configurar visibilidade, ordem, espaco e o `rotulo` do cabecalho por empresa
- As paginas principais desses modulos tambem exibem um botao direto de `Configurar grid` no cabecalho; `Usuario padrao` continua sem permissao para abrir esse ajuste
- Campos de cliente, contato e orcamento no mesmo fluxo comercial
- Busca de cliente por modal reutilizavel
- Busca de contato por modal reutilizavel com inclusao rapida de novo contato quando o cliente ja estiver definido; o contato criado volta selecionado automaticamente no atendimento
- Inclusao de cliente dentro da busca de clientes
- Campo de status do orcamento no proprio atendimento
- Integracao com abertura de orcamento e pedido a partir do atendimento
- Usuario administrador visualiza todos os clientes; `Usuario padrao` fica restrito a sua carteira

### Orcamentos

- Pagina propria de orcamentos
- Manual visual da pagina de orcamentos acessado por `F1`, com fluxo do funil, fechamento, motivos de perda e pedido derivado
- Modal em abas com `Dados gerais`, `Itens` e `Campos do orcamento`
- A inclusao e edicao de itens no orcamento seguem o mesmo padrao do pedido, preservando snapshots de descricao, referencia, unidade e imagem no proprio item
- Pedidos e orcamentos agora reutilizam o mesmo modal de item de produto, inclusive com o preview grande da imagem
- A logica de estado e manipulacao desses itens tambem foi centralizada em um hook compartilhado para reduzir duplicacao entre fluxos comerciais
- A imagem principal do produto continua sendo a origem padrao; quando o item do orcamento recebe uma imagem propria, ela fica exclusiva daquele item e e recortada em 1024 x 1024 px
- Busca reutilizavel de cliente e contato
- A busca de contato dentro do orcamento tambem permite incluir um novo contato do cliente ja selecionado e assumir esse contato automaticamente no formulario
- Itens com selecao direta de produto no proprio modal, com atalho de busca para abrir o grid de produtos sem sair do item
- Controle de etapa do orcamento
- Ao entrar nas etapas `Fechado`, `Fechado sem pedido`, `Pedido Excluido` ou `Recusado`, o orcamento passa a registrar `Data de fechamento` em campo proprio
- A `Data de fechamento` e obrigatoria nas etapas `Fechado`, `Fechado sem pedido`, `Pedido Excluido` e `Recusado`
- As etapas `Fechado sem pedido` e `Pedido Excluido` sao etapas tecnicas de uso automatico e nao aparecem nos selects manuais do usuario
- Motivo da perda obrigatorio quando a etapa exigir
- Integracao com abertura de pedido ao fechar o orcamento
- A troca rapida da etapa para `Fechado` no grid tambem oferece a geracao imediata do pedido
- Quando a troca para uma etapa final acontece pelo grid, a `Data de fechamento` usa automaticamente a data atual
- Dentro do modal do orcamento, a `Data de fechamento` pode ser ajustada manualmente antes de salvar
- O filtro da pagina de orcamentos tem um botao unico de `Datas` que abre um modal com os intervalos de `Data de inclusao` e `Data de fechamento`
- Orcamentos na etapa `Recusado` ficam somente para consulta por qualquer usuario
- Orcamentos com `pedido vinculado` tambem ficam somente para consulta por qualquer usuario
- A edicao do orcamento volta a ser permitida apenas quando o pedido vinculado e excluido, levando o registro para a etapa tecnica `Pedido Excluido`
- Modais de confirmacao do fluxo comercial abrem como sobreposicao fixa acima da pagina, inclusive no lancamento de pedido a partir do grid
- Campos configuraveis extras para o orcamento
- Os campos `Prazo de pagamento` nos modais de orcamento e pedido reutilizam o mesmo grid de `Prazos de pagamento` da area de Configuracoes, permitindo cadastrar, editar, inativar e selecionar o prazo sem sair do fluxo
- Os atalhos que abrem tabelas configuraveis dentro dos modais tambem respeitam as permissoes do perfil; para `Usuario padrao`, os atalhos de configuracao sensiveis abrem em modo de consulta
- Em `Prazos de pagamento`, os dias sao opcionais; quando nenhum dia for informado, a descricao automatica fica apenas com o nome do metodo de pagamento
- O modal de orcamento permite exportar um PDF com cabecalho da empresa, dados do cliente, tabela de itens, total e observacoes
- No aplicativo web, o botao de PDF abre a janela de impressao do navegador para salvar o documento como PDF; no Electron, usa a exportacao nativa com escolha de arquivo
- A tabela de itens do PDF do orcamento exibe uma coluna propria de foto entre o numero do item e a descricao, com a miniatura centralizada quando a imagem estiver disponivel
- As observacoes do PDF incluem a observacao principal do orcamento, os campos extras preenchidos no orcamento e os textos padrao ativos configurados em `Campos do pedido`
- O layout do PDF do orcamento foi separado em componente proprio para facilitar ajustes ou reversao da feature sem afetar o formulario principal
- O modal de orcamento em modo de inclusao pede confirmacao antes de fechar por `Cancelar`, `Escape` ou clique fora, inclusive quando aberto a partir do atendimento

### Pedidos

- Pagina propria de pedidos
- Manual visual da pagina de pedidos acessado por `F1`, com acompanhamento operacional, etapas, pagamento e permissoes
- Integracao com pedido originado de orcamento
- No modal de inclusao do pedido, os campos `Cliente` e `Contato` tambem possuem atalho de pesquisa para abrir os grids reutilizaveis sem sair do formulario
- A busca de contato dentro do pedido tambem permite incluir um novo contato do cliente atual e assumir esse contato automaticamente no formulario
- O modal do pedido agora possui o campo `Tipo de pedido`, alimentado por uma tabela auxiliar propria em `Configuracoes`
- A tabela `Tipos de pedido` nasce com `Venda` e `Devolucao` como registros obrigatorios do sistema, protegidos contra inativacao e exclusao
- Quando o `Tipo de pedido` for `Devolucao`, o sistema ajusta automaticamente o valor unitario dos itens para negativo e recalcula o total do pedido com valor negativo
- Em pedidos do tipo `Devolucao`, a quantidade dos itens tambem fica negativa e a etapa do pedido passa a ser travada automaticamente em `Entregue`
- Quando um pedido de `Devolucao` estiver em `Entregue`, o sistema exige um `Motivo da devolucao` em modal externo, vindo da tabela auxiliar de configuracao e validado sempre por `id`
- A mesma exigencia do `Motivo da devolucao` tambem vale para a troca rapida de etapa direto no grid de pedidos
- O modal de `Pedidos` agora possui a aba `Outros`, que concentra `Orcamento vinculado` e o campo visual do motivo, trazendo o valor preenchido quando existir ou vazio quando ainda nao houver motivo
- A aba `Outros` do pedido tambem concentra `% de comissao` e `Valor da comissao`, mantendo o percentual editavel no proprio pedido e o valor calculado sobre o total liquido dos itens
- O backend persiste `pedido.valorComissao` automaticamente em inclusao e edicao, calculando `total liquido dos itens x comissao (%)`; pedidos de devolucao debitam esse total por manterem valores negativos
- A pagina inicial agora exibe a secao `Devolucoes do mes`, agrupando pedidos do tipo `Devolucao` por `Motivo da devolucao`, com quantidade por motivo e valor total convertido para positivo apenas para leitura do grafico
- A pagina inicial agora exibe tambem `Vendas do mes por grupo de produtos`, com quantidade total dos itens vendidos, quantidade de pedidos e valor total por grupo nos pedidos com entrega no mes atual
- A pagina inicial agora exibe tambem `Vendas do mes por marca`, com quantidade total dos itens vendidos, quantidade de pedidos e valor total por marca nos pedidos com entrega no mes atual
- O cabecalho da pagina inicial agora possui as abas `Orcamentos` e `Vendas`, separando os graficos comerciais por contexto sem misturar funil com analise de vendas
- O modal de filtros da pagina de pedidos permite selecionar multiplas etapas ao mesmo tempo e salva esse recorte por usuario
- A etapa do pedido pode ser alterada direto no grid, no mesmo padrao visual adotado em Orcamentos
- O filtro da pagina de pedidos tem um botao unico de `Datas` que abre um modal com os intervalos de `Data de inclusao` e `Data de entrega`
- Ao mover um pedido para a etapa `Entregue`, a `Data de entrega` passa automaticamente para a data atual; dentro do modal, essa data ainda pode ser ajustada antes de salvar
- Quando um pedido chega em `Entregue`, o perfil `Usuario padrao` passa a consultar o registro sem edicao nem nova troca de etapa
- O modal de pedido aberto a partir do fechamento de um orcamento permite fechar direto pelo botao, clique fora ou `Escape`, devolvendo o fluxo ao orcamento
- Campos extras configuraveis
- Itens com snapshots de produto para preservar historico comercial
- O item do pedido herda a imagem do orcamento e, quando o usuario substituir essa imagem no proprio pedido, ela passa a ser exclusiva daquele item com recorte em 1024 x 1024 px
- Data de entrega baseada nas configuracoes da empresa

### Configuracoes

- Manual visual da pagina de configuracoes acessado por `F1`, com organizacao das secoes, permissoes e impacto dos cadastros no restante do CRM
- Sempre que uma regra, fluxo, validacao ou configuracao relevante de qualquer pagina mudar, o respectivo manual visual tambem deve ser atualizado para continuar refletindo o comportamento real da tela
- Refatoracoes internas sem impacto de uso nao exigem ajuste de manual visual, mas continuam exigindo atualizacao do README quando mudarem arquitetura, convencoes ou componentes-base reutilizaveis

A tela de configuracoes usa cards grandes e modais padrao. Hoje ela cobre:

- `Empresa`
- `Usuarios`
- `Ramos de atividade`
- `Grupos de empresa`
- `Vendedores`
- `Grupos de produto`
- `Marcas`
- `Tamanhos`
- `Unidades`
- `Metodos de pagamento`
- `Tipos de pedido`
- `Motivos da devolucao`
- `Prazos de pagamento`
- `Motivo da perda`
- `Etapas do pedido`
- `Etapas do orcamento`
- `Tamanhos`
- `Campos do orcamento`
- `Campos do pedido`
- `Canais de atendimento`
- `Origens de atendimento`
- `Locais da agenda`
- `Tipos de recurso`
- `Recursos`
- `Tipos de agenda`
- `Status da visita`
- `Atualizacao do sistema`
- secao inicial de `Relatorios`, com atalhos para `Vendas`, `Conversao` e `Atendimentos`
- os relatorios seguem o mesmo padrao visual: modal amplo, cards de resumo no topo, grade principal e botao de filtro no cabecalho
- `Vendas` ja esta funcional e lista pedidos pelas datas de `Inclusao` e `Entrega`, com cards de consolidado, chips de filtros ativos, botao de exportacao em PDF e grade de pedidos sem botoes de acao
- `Conversao` ja esta funcional e lista orcamentos em grade propria mais simples, com colunas separadas de inclusao, fechamento, cliente e contato, cards de gerados, fechados, conversao e abertos, filtros por cliente, usuario, vendedores, etapas, grupo de empresa, grupo de produto, marca e datas, alem de exportacao em PDF
- `Atendimentos` ja esta funcional e reaproveita a grade do historico por cliente com a coluna de `Cliente` adicionada, alem de cards com total atendido, clientes distintos, canal lider, origem lider, filtro no cabecalho e exportacao em PDF
- A secao `Atendimentos` tambem possui atalho para configurar por empresa quais colunas persistidas do cadastro aparecem na grade principal da pagina operacional
- `Pedidos Entregues` e `Atendimentos` ja usam a mesma base visual e ficam preparados para evolucao das regras especificas

Regras importantes:

- Campos textuais de formularios passam por normalizacao para capitalizacao automatica, evitando persistencia acidental em caixa alta
- Dados retornados pela busca de CNPJ tambem sao normalizados antes de preencher o formulario, evitando razao social, nome fantasia e endereco em caixa alta
- O card de `Atualizacao do sistema` fica apenas na aba `Gerais`
- O card de `Atualizacao do sistema` fica visivel para todos os perfis, mas permanece desabilitado apenas para `Usuario padrao`; `Administrador` e `Gestor` podem abrir o modal
- A secao inicial de `Relatorios` fica visivel na pagina de `Configuracoes`, mas seus atalhos permanecem desabilitados para `Usuario padrao`
- O relatorio `Vendas` usa filtros por `Cliente`, um ou mais `Vendedores`, uma ou mais `Etapas`, `Grupo de empresa`, `Grupo de produto`, `Marca`, `Data de inclusao` e `Data de entrega`; o filtro de cliente tambem oferece botao de busca em grade para agilizar a selecao, e o periodo padrao do filtro ja abre no mes corrente
- O cabecalho do relatorio `Vendas` exibe chips com os filtros ativos ao lado do botao de filtro e um botao dedicado para gerar o PDF do relatorio
- O PDF do relatorio `Vendas` preserva as cores do cabecalho na impressao e organiza `Gerado em` e `Usuario` em uma coluna alinhada a direita no topo
- O resumo do relatorio `Vendas` consolida `Pedidos no recorte`, `Valor total`, `Quantidade` somando unidades dos itens e `Positivacao` por clientes distintos
- O relatorio `Vendas` reaproveita a mesma grade base de pedidos usada no historico comercial, mas sem acoes de linha
- O relatorio `Conversao` usa uma grade simples de orcamentos sem acoes de linha, com colunas separadas de `Inclusao`, `Fechamento`, `Cliente` e `Contato`, filtros por `Cliente`, `Usuario`, `Vendedores`, `Etapas`, `Grupo de empresa`, `Grupo de produto`, `Marca` e datas, e considera como fechados os orcamentos em etapas de fechamento, fechado sem pedido e recusado para calcular a conversao
- O resumo do relatorio `Conversao` destaca `Orcamentos gerados`, `Orcamentos fechados`, `Conversao` e `Orcamentos em aberto`
- O relatorio `Atendimentos` reaproveita a grade base do historico de atendimentos do cliente, adicionando a coluna `Cliente` e removendo as acoes de linha no contexto gerencial
- O resumo do relatorio `Atendimentos` destaca `Total de atendimentos`, `Clientes atendidos`, `Canal lider` e `Origem lider` a partir da distribuicao atual carregada
- O relatorio `Atendimentos` tambem usa modal de filtros com `Cliente`, um ou mais `Usuarios`, um ou mais `Canais`, uma ou mais `Origens` e `Data`, mostra chips de filtros ativos no cabecalho e oferece exportacao em PDF
- `Ramos de atividade` e `Grupos de empresa` tambem ficam liberados para `Usuario padrao` na propria pagina de `Configuracoes`, no mesmo modelo operacional ja adotado dentro do cadastro de clientes
- O modal de atualizacao permite salvar o link do repositorio GitHub usado para leitura das releases
- `Etapas do pedido` e `Etapas do orcamento` agora possuem campo `Ordem`; os selects desses status respeitam essa ordem crescente nos formularios
- O campo `Abreviacao` foi removido das etapas de pedido e orcamento; as regras e exibicao passam a considerar `Descricao`, `Cor`, `Ordem`, `Status` e, para etapas de orcamento, `Considera no Funil de Vendas`
- A logica operacional de pedidos valida a etapa critica `Entregue` por `idEtapa` fixo (`5`), sem depender da descricao cadastrada
- A etapa critica de pedido usada pela logica do sistema nao pode ser inativada nem excluida (bloqueio no backend e no modal de Configuracoes)
- Etapas obrigatorias de orcamento nao podem ser inativadas nem excluidas (regra aplicada no backend e refletida no modal de Configuracoes)
- Regras obrigatorias das etapas de orcamento sao avaliadas por `idEtapaOrcamento` fixo (`1` Fechado, `2` Fechado sem pedido, `3` Pedido Excluido, `4` Recusado)
- A data de fechamento do orcamento tambem segue a validacao por `idEtapaOrcamento` fixo (`1`, `2` e `3`), sem depender da descricao da etapa
- Regras criticas de `Status da visita` sao avaliadas por `idStatusVisita` fixo (`1` Agendado, `2` Confirmado, `3` Realizado, `4` Cancelado, `5` Nao compareceu)
- Status criticos da agenda podem ser editados, mas nao podem ser inativados nem excluidos (bloqueio no modal de Configuracoes e no backend)
- `Tipos de agenda` e `Status da visita` agora possuem campo `Ordem`; os selects/imputs da agenda respeitam a ordem crescente definida em Configuracoes
- `Recursos` nao usam mais `Sigla`; o cadastro e a exibicao passam a considerar `Descricao`, `Tipo` e `Status`
- `Tamanhos` possuem cadastro proprio em Configuracoes com `Codigo`, `Tamanho` e `Status`
- Cada `Grupo de Produto` pode vincular varios `Tamanhos`; essa relacao guarda a `Ordem` usada para exibicao no fluxo comercial
- `Grupos de empresa` possuem cadastro proprio com descricao, status e grade de contatos; qualquer alteracao nesses contatos sincroniza os clientes vinculados
- Os modais de grid da pagina de `Configuracoes` possuem botao que abre `Modal de filtros`; inicialmente ha filtro de `Ativo` e o estado padrao ao abrir e `somente ativos`
- Os modais de grid da pagina de `Configuracoes` possuem altura fixa na area de listagem para evitar variacao de tamanho ao trocar filtro ou contexto

### Empresa

O cadastro de empresa tem modal proprio com abas:

- `Dados gerais`
- `Pagina inicial`
- `Endereco`
- `Agenda`
- Dashboard inicial expandido com rolagem vertical e leitura executiva mais completa
- Painel heroico com resumo do periodo, carteira aberta, conversao, entregas, ticket medio e agenda futura
- Grade principal com indicadores de:
  - clientes da carteira filtrada
  - contatos ativos
  - produtos ativos
  - atendimentos no periodo
  - orcamentos no recorte
  - carteira aberta em valor
  - pedidos no recorte
  - ticket medio
  - vendas em valores
  - itens vendidos
  - taxa de fechamento
- `Nome fantasia`
- Quando a logo da empresa e atualizada em Configuracoes, a barra lateral e os pontos que recarregam os dados da empresa passam a refletir a nova imagem sem exigir reinicio do aplicativo
- Os mesmos filtros da pagina inicial tambem sao aplicados aos cards de vendas, usando pedidos como base para valor total e quantidade total vendida
- `Documento`
- O dashboard inclui grafico diario de tendencia para `Atendimentos`, `Orcamentos` e `Pedidos` nos ultimos 7 dias do recorte
- O dashboard inclui rankings de `Vendedores`, `Produtos`, `Grupos de produto` e `Marcas` com barras comparativas
- O dashboard inclui painel de agenda dos proximos dias e bloco de saude comercial com conversao, fechamento e entregas
- Os cards de resumo da pagina inicial usam titulo no topo com tipografia mais contida, valor abaixo, descricao auxiliar e icone ampliado na direita com corte parcial pelo proprio card
- Endereco completo
- Horarios de expediente da manha e da tarde
- Flag para trabalho aos sabados
- Horarios de sabado quando aplicavel
- `diasValidadeOrcamento`
- `diasEntregaPedido`
- `Filtro padrao de status do orcamento`

Esses dados sao usados em:

- Tela de login
- Barra lateral
- Faixa horaria padrao da agenda
- Validade inicial de orcamentos
- Previsao inicial de entrega de pedidos

### Layout Orcamento

Na secao `Orcamentos/Pedidos` da pagina de `Configuracoes`, existe um card proprio chamado `Layout Orcamento`.

Campos de destaque:

- `Cor primaria do PDF do orcamento`
- `Cor secundaria do PDF do orcamento`
- `Cor de destaque do PDF do orcamento`
- `Primeiro plano dos itens do PDF do orcamento` para priorizar `Descricao` ou `Referencia`

Esses dados sao usados em:

- Identidade visual usada na exportacao em PDF do orcamento

### Usuarios

Usuarios possuem:

- foto
- nome
- usuario
- senha
- tipo
- ativo
- vendedor vinculado
- quando o proprio usuario logado atualiza sua foto em `Configuracoes`, a barra lateral passa a refletir a nova imagem sem precisar reiniciar ou fazer novo login

Regra importante:

- `Usuario padrao` deve obrigatoriamente estar vinculado a um vendedor

## Banco de dados

### Regras gerais

- Banco utilizado: `SQLite`
- Em build desktop, o banco principal fica na pasta persistente do usuario em `AppData/Roaming/Connecta CRM/data`
- Chaves primarias usam inteiros autoincrementais
- Campos booleanos usam `0` e `1`
- O projeto faz migracoes simples no startup com `ALTER TABLE` e recriacao de tabelas quando necessario
- Migracoes bem escritas preservam dados existentes; trocar a pasta de dados do app nao preserva automaticamente o mesmo arquivo de banco sem rotina de migracao
- O startup do Electron tenta migrar automaticamente bancos legados encontrados em pastas antigas de `AppData`, no diretório do executável, em `resources/data` e em caminhos antigos do app

### Tabelas principais do sistema

Cadastros comerciais:

- `ramoAtividade`
- `vendedor`
- `grupoProduto`
- `tamanho`
- `grupoProdutoTamanho`
- `marca`
- `unidadeMedida`
- `cliente`
- `contato`
- `produto`

Cadastros da empresa e acesso:

- `empresa`
- `usuario`

Cadastros comerciais e de processo:

- `canalAtendimento`
- `origemAtendimento`
- `atendimento`
- `orcamento`
- `itemOrcamento`
- `valorCampoOrcamento`
- `pedido`
- `itemPedido`
- `valorCampoPedido`

Cadastros de configuracao comercial:

- `metodoPagamento`
- `prazoPagamento`
- `motivoPerda`
- `etapaPedido`
- `etapaOrcamento`
- `campoOrcamentoConfiguravel`
- `campoPedidoConfiguravel`

Cadastros da agenda:

- `localAgenda`
- `tipoRecurso`
- `recurso`
- `tipoAgenda`
- `statusVisita`
- `agendamento`
- `agendamentoRecurso`
- `agendamentoUsuario`

## API

### CRUD generico

As tabelas registradas em `server/configuracoes/entidades.js` recebem automaticamente:

| Operacao | Metodo | Padrao da rota |
| --- | --- | --- |
| Listar todos | `GET` | `/api/recurso` |
| Consultar um | `GET` | `/api/recurso/:id` |
| Incluir novo | `POST` | `/api/recurso` |
| Atualizar | `PUT` | `/api/recurso/:id` |
| Excluir | `DELETE` | `/api/recurso/:id` |

Rotas CRUD atualmente expostas:

- `/api/ramosAtividade`
- `/api/vendedores`
- `/api/gruposProduto`
- `/api/tamanhos`
- `/api/gruposProdutoTamanhos`
- `/api/marcas`
- `/api/unidadesMedida`
- `/api/locaisAgenda`
- `/api/tiposRecurso`
- `/api/recursos`
- `/api/tiposAgenda`
- `/api/statusVisita`
- `/api/canaisAtendimento`
- `/api/origensAtendimento`
- `/api/metodosPagamento`
- `/api/prazosPagamento`
- `/api/tiposPedido`
- `/api/motivosDevolucao`
- `/api/motivosPerda`
- `/api/etapasPedido`
- `/api/etapasOrcamento`
- `/api/camposOrcamento`
- `/api/camposPedido`
- `/api/empresas`
- `/api/usuarios`
- `/api/clientes`
- `/api/contatos`
- `/api/produtos`
- `/api/atendimentos`
- `/api/listagens/clientes`: listagem enxuta para o grid principal, com busca textual e filtros enviados pela tela
- `/api/listagens/produtos`: listagem enxuta para o grid principal, com busca textual e filtros enviados pela tela
- `/api/listagens/atendimentos`: listagem enxuta para o grid principal, com busca textual, filtros e recorte por carteira quando aplicavel
- `/api/itensOrcamento`
- `/api/valoresCamposOrcamento`
- `/api/itensPedido`
- `/api/valoresCamposPedido`

### Rotas customizadas

- `POST /api/auth/login`: autenticacao
- `/api/agendamentos`: CRUD customizado para agendamento, com suporte a multiplos recursos e multiplos usuarios
- `/api/orcamentos`: fluxo customizado de orcamentos com itens e campos extras
- `/api/pedidos`: fluxo customizado de pedidos com itens e campos extras
- `GET /api/orcamentos` e `GET /api/pedidos` aceitam os filtros das paginas principais para reduzir carga no frontend e retornar apenas o recorte solicitado
- `GET /api/atualizacaoSistema`: leitura da configuracao de update
- `PUT /api/atualizacaoSistema`: persistencia da configuracao de update
- `/api/arquivos/imagens`: entrega de imagens locais do sistema

## Integracoes externas

Hoje o frontend usa APIs publicas para:

- `CEP`: `ViaCEP`
- `CNPJ`: `BrasilAPI`

Essas integracoes sao usadas no cadastro de clientes para preencher dados automaticamente.

## Seeds e dados de teste

O comando `npm run reset:banco` reseta o banco local para a base minima obrigatoria do sistema. O alias `npm run popular:banco` continua disponivel e aponta para o mesmo fluxo.

Depois do reset, a base fica somente com os registros obrigatorios:

- usuario administrador padrao
- configuracao de atualizacao do sistema
- status obrigatorios da agenda
- tipos obrigatorios da agenda
- etapa obrigatoria do pedido `Entregue`
- etapas obrigatorias do orcamento:
  `1 Fechado`
  `2 Fechado sem pedido`
  `3 Pedido Excluido`
  `4 Recusado`

## Como rodar

1. Instale as dependencias com `npm install`
2. Use os scripts conforme o fluxo desejado

### Desenvolvimento

- `npm run dev`: sobe backend, frontend web e Electron juntos
- `npm run dev:webapp`: sobe backend e frontend web juntos
- `npm run dev:backend`: sobe somente o backend Express com `nodemon`
- `npm run dev:web`: sobe somente o frontend web com Vite
- `npm run dev:electron`: abre somente o Electron, aguardando backend e frontend

Observacoes do ambiente local:

- Em desenvolvimento, o backend local usa a porta `3101`
- Em desenvolvimento, o banco usado pelo projeto deve ser `data/crm.sqlite` dentro deste repositorio
- Essa separacao evita conflito com uma versao instalada do app no mesmo computador, que continua usando a propria pasta de dados
- O frontend web em desenvolvimento aponta para `http://127.0.0.1:3101/api`
- A `Content-Security-Policy` definida em `client/index.html` precisa permitir `connect-src` para `http://127.0.0.1:3101` e `http://localhost:3101`; sem isso, o navegador bloqueia a API local antes mesmo de a requisicao chegar ao backend

### Inicializacao manual

- `npm run start:backend`: inicia o backend sem `nodemon`
- `npm run start:web`: inicia o frontend web
- `npm run start:electron`: gera a build web e abre o app no Electron

### Build

- `npm run build`: gera a build web
- `npm run build:web`: gera a build web em `dist/web`
- `npm run build:electron`: gera a build web e empacota o Electron em `dist/electron`
- `npm run release`: gera a build desktop e publica os artefatos no `GitHub Releases`

Observacao sobre empacotamento Electron:

- O `electron-builder` cria a pasta intermediaria `dist/electron/win-unpacked` para montar o instalador Windows
- Essa pasta nao e um modo portatil publicado para o cliente; e apenas uma etapa interna do empacotamento
- O projeto agora empacota primeiro em uma pasta temporaria fora do OneDrive e copia de volta apenas os artefatos finais para `dist/electron`
- Ao final de `npm run build:electron` e `npm run release`, `win-unpacked` nao permanece em `dist/electron`
- Quando o release conclui com sucesso, o arquivo de atualizacao `latest.yml` deve aparecer junto dos artefatos finais
- O fluxo de release nao depende da branch atual; ele depende da `version` do `package.json`, de uma tag compativel (`vx.y.z`) e do `GH_TOKEN`

### Reset do banco

- `npm run reset:banco`: reseta o banco local para a base minima obrigatoria
- `npm run popular:banco`: alias compativel que executa o mesmo reset

## Empacotamento desktop

Configuracao atual do instalador Windows:

- `NSIS`
- `oneClick: false`
- `allowToChangeInstallationDirectory: true`

Comportamento esperado:

- Na primeira instalacao, o cliente pode escolher a pasta onde o aplicativo sera instalado
- As atualizacoes seguintes acompanham a instalacao ja existente
- O banco do sistema continua na pasta de dados do Electron, separado da pasta do executavel

Arquivos gerados em release:

- `Connecta-CRM-Setup-x.y.z.exe`
- `Connecta-CRM-Setup-x.y.z.exe.blockmap`
- `latest.yml`

## Atualizacao automatica via GitHub Releases

O projeto esta preparado para buscar atualizacoes publicadas no repositorio `TailonSilva/connecta-crm` usando `electron-updater`.

Como funciona:

- Em build empacotada, a verificacao de atualizacao acontece somente por acao manual do cliente em `Configuracoes > Gerais > Atualizacao do sistema`
- O repositorio usado para leitura pode ser configurado pela tela `Configuracoes > Gerais > Atualizacao do sistema`
- Antes de iniciar a atualizacao manual, o modal oferece um botao para gerar e salvar um backup do banco de dados
- Se existir versao mais nova no `GitHub Releases`, o download acontece em segundo plano somente apos a acao manual do usuario
- Quando o download termina, o usuario recebe um aviso para reiniciar e concluir a instalacao
- Antes de instalar a atualizacao, o app cria um backup de seguranca dos dados em `AppData/Roaming/Connecta CRM/backups`

Mensagens visuais ja tratadas no modal:

- verificacao em andamento
- sem atualizacao disponivel
- nova versao encontrada
- progresso do download em percentual
- atualizacao baixada e pronta para reinicio
- erro de verificacao ou download

Fluxo para publicar uma nova versao:

1. Atualize o campo `version` no `package.json`
2. Gere a build/release vinculada a uma tag com a mesma versao
3. Garanta que a release no GitHub esteja publicada, nao como `draft`
4. Garanta que `latest.yml` e os artefatos estejam anexados
5. No terminal, defina `GH_TOKEN`
6. Execute `npm run release`

Antes de empacotar ou publicar:

- `npm run build:electron` e `npm run release` agora validam automaticamente se existe uma tag local compativel com a versao atual
- Tags aceitas: `1.4.4` ou `v1.4.4`
- Se a versao do `package.json` estiver divergente da tag, o comando interrompe antes do empacotamento

Exemplo no PowerShell:

```powershell
$env:GH_TOKEN="seu_token_aqui"
npm run release
```

Observacoes importantes:

- O auto-update depende de uma build instalada; nao roda no modo `dev`
- O repositorio usado pelo updater precisa estar acessivel para os clientes
- Cada release precisa ter versao maior que a anterior para o Electron detectar corretamente a atualizacao
- O nome do instalador publicado precisa bater com o `latest.yml`; hoje isso e garantido por `artifactName`

## Paleta visual atual

Variaveis CSS principais:

| Papel | Variavel | Hex |
| --- | --- | --- |
| Azul principal | `--corPrimaria` | `#1791E2` |
| Azul forte | `--corPrimariaForte` | `#0D78C8` |
| Azul suave | `--corPrimariaSuave` | `#5BBDF5` |
| Fundo | `--corFundo` | `#EEF4F9` |
| Superficie | `--corSuperficie` | `#FFFFFF` |
| Superficie suave | `--corSuperficieSuave` | `#DFE9F1` |
| Borda | `--corBorda` | `#C8D5DF` |
| Texto | `--corTexto` | `#3C4A57` |
| Texto suave | `--corTextoSuave` | `#7A8894` |

## Estado atual da navegacao

Paginas hoje presentes no painel:

- `Pagina inicial`
- `Agenda`
- `Atendimentos`
- `Clientes`
- `Produtos`
- `Orcamentos`
- `Pedidos`
- `Pedidos`
- `Configuracoes`

## Identidade visual aplicada

- Logo do login atualizada para a marca `Connecta CRM`
- Icone do aplicativo Electron configurado a partir do arquivo de marca em `build/icon.png`
- Instalador e executavel usando o nome visual da marca
