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
- Sempre que houver mudanca estrutural relevante de banco, fluxo desktop ou release, o README deve ser atualizado

## Componentes e padroes reutilizaveis

Padroes centralizados no frontend:

- `Botao`: botoes primarios, secundarios, complementares, perigo e somente icone
- `GradePadrao`: grades principais com cabecalho fixo e rolagem na lista
- `AcoesRegistro`: acoes padrao de linha
- `CodigoRegistro`: selo visual de codigo
- `CampoImagemPadrao`: upload e preview de imagem
- `ModalFiltros`: modal generico de filtros
- `CampoSelecaoMultiplaModal`: selecao multipla com botao-resumo e modal com checkbox
- `ModalBuscaTabela`: base reutilizavel para modais de busca em grade
- `ModalBuscaClientes`: busca reutilizavel de clientes
- `ModalBuscaContatos`: busca reutilizavel de contatos
- `ModalContatoCliente`: formulario reutilizavel de contato
- `ModalRamosAtividade`: lista e cadastro reutilizavel de ramos
- `ModalGruposProduto`: lista e cadastro de grupos de produto com botao dedicado para abrir um submodal compacto de selecao de tamanhos e ordem por grupo
- `ModalMarcas`: lista e cadastro reutilizavel de marcas
- `ModalUnidadesMedida`: lista e cadastro reutilizavel de unidades

Padroes aplicados recentemente:

- Busca de clientes foi unificada para atendimento e orcamento
- Busca de contatos foi unificada para atendimento e orcamento
- O cadastro de cliente reaproveita o mesmo fluxo de `Ramo de Atividade` usado em configuracoes
- O cadastro de produto reaproveita os mesmos fluxos de configuracao para `Grupo de Produto`, `Marca` e `Unidade`
- Modais com abas usam cabecalho e faixa de abas fixos, com rolagem apenas no corpo
- Modais empilhados possuem camadas de z-index separadas para evitar abertura por tras do modal pai

Utilitarios importantes:

- `normalizarTelefone.js`: padroniza telefone no formato brasileiro
- `normalizarPreco.js`: trata exibicao e digitacao de preco em real
- `obterPrimeiroCodigoDisponivel.js`: encontra o primeiro codigo livre para novos registros

## Modulos implementados

### Login e sessao

- Tela de login com a marca `Connecta CRM`
- Logo personalizada na tela inicial
- Validacao de `usuario` e `senha` via API local
- Sessao persistida no frontend
- Rodape da barra lateral com dados do usuario logado

### Pagina inicial

- Painel inicial com indicadores de:
  - clientes cadastrados
  - produtos cadastrados
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
- Ao incluir cliente, `Usuario padrao` recebe o vendedor fixado e bloqueado
- Na agenda, `Usuario padrao` nao pode excluir agendamentos
- Em configuracoes reutilizadas dentro de cadastros, usuarios sem permissao entram em modo de consulta

Observacao:

- As restricoes de permissao estao principalmente no frontend
- O backend ainda nao implementa uma camada completa de autorizacao por perfil

### Clientes

- Tela com grade, pesquisa e filtro
- Modal em abas para incluir, editar e consultar
- Abas atuais: `Dados gerais`, `Endereco`, `Observacoes`, `Contato`, `Atendimento` e `Vendas`
- Thumbnail com codigo do cliente
- Integracao publica para consulta de `CEP`
- Integracao publica para consulta de `CNPJ`
- Aba de contatos com grade propria
- Formulario de contato reutilizavel
- Abertura do mesmo modal de `Ramo de Atividade` usado em configuracoes
- Inclusao de novo ramo diretamente do cadastro de cliente, sem sair do fluxo
- Inativacao persiste no banco

Filtros de clientes:

- `Estado`
- `Cidade`
- `Ramo de atividade`
- `Vendedor`
- `Tipo`
- `Ativo`

### Produtos

- Tela com grade, pesquisa e filtro
- Modal no mesmo padrao visual de clientes
- Modos incluir, editar e consultar
- Codigo automatico ao incluir
- Upload de imagem no padrao reutilizavel do projeto
- Campo de preco com mascara e digitacao amigavel em real
- Campo `Grupo de Produto` com botao de pesquisa para abrir o modal de configuracao
- O modal de `Grupo de Produto` permite definir quais `Tamanhos` estao disponiveis para cada grupo e em qual ordem devem aparecer
- Campo `Marca` com botao de pesquisa para abrir o modal de configuracao
- Campo `Unidade` com botao de pesquisa para abrir o modal de configuracao
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
- Campos de cliente, contato e orcamento no mesmo fluxo comercial
- Busca de cliente por modal reutilizavel
- Busca de contato por modal reutilizavel
- Inclusao de cliente dentro da busca de clientes
- Campo de status do orcamento no proprio atendimento
- Integracao com abertura de orcamento e pedido a partir do atendimento
- Usuario administrador visualiza todos os clientes; `Usuario padrao` fica restrito a sua carteira

### Orcamentos

- Pagina propria de orcamentos
- Modal em abas com `Dados gerais`, `Itens` e `Campos do orcamento`
- Busca reutilizavel de cliente e contato
- Itens com busca de produto
- Controle de etapa do orcamento
- Motivo da perda obrigatorio quando a etapa exigir
- Integracao com abertura de pedido ao fechar o orcamento
- Campos configuraveis extras para o orcamento

### Pedidos

- Pagina propria de pedidos
- Integracao com pedido originado de orcamento
- Campos extras configuraveis
- Itens com snapshots de produto para preservar historico comercial
- Data de entrega baseada nas configuracoes da empresa

### Configuracoes

A tela de configuracoes usa cards grandes e modais padrao. Hoje ela cobre:

- `Empresa`
- `Usuarios`
- `Ramos de atividade`
- `Vendedores`
- `Grupos de produto`
- `Marcas`
- `Tamanhos`
- `Unidades`
- `Metodos de pagamento`
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

Regras importantes:

- O card de `Atualizacao do sistema` fica apenas na aba `Gerais`
- O card de `Atualizacao do sistema` fica visivel apenas para `Administrador`
- O modal de atualizacao permite salvar o link do repositorio GitHub usado para leitura das releases
- `Etapas do pedido` e `Etapas do orcamento` agora possuem campo `Ordem`; os selects desses status respeitam essa ordem crescente nos formularios
- O campo `Abreviacao` foi removido das etapas de pedido e orcamento; as regras e exibicao passam a considerar `Descricao`, `Cor`, `Ordem`, `Status` e, para etapas de orcamento, `Considera no Funil de Vendas`
- Etapas obrigatorias de orcamento nao podem ser inativadas nem excluidas (regra aplicada no backend e refletida no modal de Configuracoes)
- Regras obrigatorias das etapas de orcamento sao avaliadas por `idEtapaOrcamento` fixo (`1` Fechado, `2` Fechado sem pedido, `3` Pedido excluido)
- Regras criticas de `Status da visita` sao avaliadas por `idStatusVisita` fixo (`1` Agendado, `2` Confirmado, `3` Realizado, `4` Cancelado, `5` Nao compareceu)
- Status criticos da agenda podem ser editados, mas nao podem ser inativados nem excluidos (bloqueio no modal de Configuracoes e no backend)
- `Tipos de agenda` e `Status da visita` agora possuem campo `Ordem`; os selects/imputs da agenda respeitam a ordem crescente definida em Configuracoes
- `Recursos` nao usam mais `Sigla`; o cadastro e a exibicao passam a considerar `Descricao`, `Tipo` e `Status`
- `Tamanhos` possuem cadastro proprio em Configuracoes com `Codigo`, `Tamanho` e `Status`
- Cada `Grupo de Produto` pode vincular varios `Tamanhos`; essa relacao guarda a `Ordem` usada para exibicao no fluxo comercial
- Os modais de grid da pagina de `Configuracoes` possuem botao que abre `Modal de filtros`; inicialmente ha filtro de `Ativo` e o estado padrao ao abrir e `somente ativos`
- Os modais de grid da pagina de `Configuracoes` possuem altura fixa na area de listagem para evitar variacao de tamanho ao trocar filtro ou contexto

### Empresa

O cadastro de empresa tem modal proprio com abas:

- `Dados gerais`
- `Endereco`
- `Agenda`
- `Orcamentos/Pedidos`

Campos de destaque:

- `Razao social`
- `Nome fantasia`
- `Slogan`
- `Documento`
- `Imagem`
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

### Usuarios

Usuarios possuem:

- foto
- nome
- usuario
- senha
- tipo
- ativo
- vendedor vinculado

Regra importante:

- `Usuario padrao` deve obrigatoriamente estar vinculado a um vendedor

## Banco de dados

### Regras gerais

- Banco utilizado: `SQLite`
- O banco fica na pasta de dados da instalacao do Electron
- Chaves primarias usam inteiros autoincrementais
- Campos booleanos usam `0` e `1`
- O projeto faz migracoes simples no startup com `ALTER TABLE` e recriacao de tabelas quando necessario
- Migracoes bem escritas preservam dados existentes; trocar a pasta de dados do app nao preserva automaticamente o mesmo arquivo de banco

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
- `/api/itensOrcamento`
- `/api/valoresCamposOrcamento`
- `/api/itensPedido`
- `/api/valoresCamposPedido`

### Rotas customizadas

- `POST /api/auth/login`: autenticacao
- `/api/agendamentos`: CRUD customizado para agendamento, com suporte a multiplos recursos e multiplos usuarios
- `/api/orcamentos`: fluxo customizado de orcamentos com itens e campos extras
- `/api/pedidos`: fluxo customizado de pedidos com itens e campos extras
- `GET /api/atualizacaoSistema`: leitura da configuracao de update
- `PUT /api/atualizacaoSistema`: persistencia da configuracao de update
- `/api/arquivos/imagens`: entrega de imagens locais do sistema

## Integracoes externas

Hoje o frontend usa APIs publicas para:

- `CEP`: `ViaCEP`
- `CNPJ`: `BrasilAPI`

Essas integracoes sao usadas no cadastro de clientes para preencher dados automaticamente.

## Seeds e dados de teste

O script `npm run popular:banco` recria dados de teste e hoje gera principalmente:

- cadastros base comerciais
- etapas padrao de orcamento em formato de funil
- clientes e contatos de exemplo
- produtos de exemplo
- grupos, marcas, unidades e demais configuracoes auxiliares

Os dados de teste usam:

- links publicos para imagens
- cidades reais do Brasil
- dados coerentes para validacao visual da interface

## Como rodar

1. Instale as dependencias com `npm install`
2. Use os scripts conforme o fluxo desejado

### Desenvolvimento

- `npm run dev`: sobe backend, frontend web e Electron juntos
- `npm run dev:webapp`: sobe backend e frontend web juntos
- `npm run dev:backend`: sobe somente o backend Express com `nodemon`
- `npm run dev:web`: sobe somente o frontend web com Vite
- `npm run dev:electron`: abre somente o Electron, aguardando backend e frontend

### Inicializacao manual

- `npm run start:backend`: inicia o backend sem `nodemon`
- `npm run start:web`: inicia o frontend web
- `npm run start:electron`: gera a build web e abre o app no Electron

### Build

- `npm run build`: gera a build web
- `npm run build:web`: gera a build web em `dist/web`
- `npm run build:electron`: gera a build web e empacota o Electron em `dist/electron`
- `npm run release`: gera a build desktop e publica os artefatos no `GitHub Releases`

### Popular banco

- `npm run popular:banco`: limpa e popula o banco com dados de teste

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

- Em build empacotada, o app verifica atualizacoes automaticamente apos abrir
- O repositorio usado para leitura pode ser configurado pela tela `Configuracoes > Gerais > Atualizacao do sistema`
- O app pode verificar atualizacao automaticamente ou por acao manual do usuario
- Se existir versao mais nova no `GitHub Releases`, o download acontece em segundo plano
- Quando o download termina, o usuario recebe um aviso para reiniciar e concluir a instalacao

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
- `Configuracoes`

## Identidade visual aplicada

- Logo do login atualizada para a marca `Connecta CRM`
- Icone do aplicativo Electron configurado a partir do arquivo de marca em `build/icon.png`
- Instalador e executavel usando o nome visual da marca
