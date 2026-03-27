# CRM Desktop

Projeto base com:

- `Electron` para a aplicacao desktop
- `React + Vite` para a interface
- `Express` para a API local
- `SQLite` para persistencia embutida

## Convencoes do projeto

- Todo o projeto deve usar portugues em textos, nomes de variaveis, componentes, funcoes, rotas internas e documentacao, sempre que isso nao entrar em conflito com APIs externas ou requisitos da ferramenta utilizada
- Todo identificador definido pelo projeto deve usar `camelCase`
- Esse padrao vale para nomes de arquivos internos, variaveis, funcoes, propriedades, rotas internas, tabelas, colunas, classes CSS e variaveis CSS
- Excecoes sao apenas nomes obrigatorios de ferramentas e convencoes externas, como `package.json`, `package-lock.json`, `.gitignore`, `.gitattributes`, `.vscode`, `node_modules` e `vite.config.js`
- O frontend deve ser dividido no maximo de componentes possivel, evitando concentrar estrutura e comportamento em arquivos grandes
- Todo botao deve ser implementado a partir de componente reutilizavel do projeto, evitando uso direto de `button` fora de componentes base
- O projeto deve trabalhar com tres estilos visuais padrao de botao: `primario`, `secundario` e `complementar`
- `primario` segue o estilo de destaque, como em `Novo cliente`
- `secundario` segue o estilo de apoio, como em `Importar`
- `complementar` segue o estilo de apoio contextual, como o botao `Sair` da barra lateral
- Todo icone de botao deve usar o padrao centralizado de icones do projeto
- O mesmo componente de botao deve suportar uso com texto, com icone + texto e somente icone, conforme a necessidade da interface
- Botoes de acoes em grades devem seguir um padrao proprio, usando somente icones e um componente dedicado para acoes de linha
- Grades de listagem devem usar o componente reutilizavel `GradePadrao`, mantendo cabecalho fixo e rolagem apenas na lista de itens
- Acoes de linha em grades devem usar o componente reutilizavel `AcoesRegistro`
- Sempre que falarmos em grid de listagem no projeto, a implementacao deve usar estrutura semantica de tabela com `table`, `thead`, `tbody`, `tr`, `th` e `td`
- Selos de codigo em listagens devem usar o componente reutilizavel `CodigoRegistro`, adotando como padrao visual o estilo atual da tela de clientes
- Toda alteracao em estrutura de banco de dados deve atualizar esta documentacao no mesmo ajuste, sem excecao
- Toda tabela deve possuir CRUD completo no backend, com rotas para listar, consultar por identificador, incluir, atualizar e excluir
- Sempre que uma tabela for criada ou alterada, o CRUD correspondente deve ser criado ou ajustado no mesmo ajuste
- Sempre que houver dados de teste com imagens, devem ser usados links publicos validos para permitir carregamento real da interface

## Padrao de CRUD

Cada tabela cadastrada no arquivo [entidades.js](c:\Users\tailo\OneDrive\Documentos\GitHub\crm\server\configuracoes\entidades.js) recebe automaticamente estas operacoes:

| Operacao | Metodo | Padrao da rota |
| --- | --- | --- |
| Listar todos | `GET` | `/api/recurso` |
| Consultar um | `GET` | `/api/recurso/:id` |
| Incluir novo | `POST` | `/api/recurso` |
| Atualizar | `PUT` | `/api/recurso/:id` |
| Excluir | `DELETE` | `/api/recurso/:id` |

Rotas atualmente registradas:

- `ramoAtividade`: `/api/ramosAtividade`
- `vendedor`: `/api/vendedores`
- `grupoProduto`: `/api/gruposProduto`
- `marca`: `/api/marcas`
- `unidadeMedida`: `/api/unidadesMedida`
- `cliente`: `/api/clientes`
- `contato`: `/api/contatos`
- `produto`: `/api/produtos`

## Documentacao do banco de dados

### Regras gerais

- Banco utilizado: `SQLite`
- Arquivo local: `data/crm.sqlite`
- Chaves primarias usam identificadores inteiros autoincrementais
- Campos booleanos usam `0` e `1` no SQLite
- Campos de data de criacao usam `CURRENT_TIMESTAMP` como valor padrao quando aplicavel

### Tabela `ramoAtividade`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `idRamo` | `INTEGER` | chave primaria |
| `descricao` | `VARCHAR(150)` | obrigatorio |
| `status` | `BOOLEAN` | obrigatorio, padrao `1` |

### Tabela `vendedor`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `idVendedor` | `INTEGER` | chave primaria |
| `nome` | `VARCHAR(150)` | obrigatorio |
| `email` | `VARCHAR(150)` | obrigatorio |
| `status` | `BOOLEAN` | obrigatorio, padrao `1` |

### Tabela `grupoProduto`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `idGrupo` | `INTEGER` | chave primaria |
| `descricao` | `VARCHAR(150)` | obrigatorio |
| `status` | `BOOLEAN` | obrigatorio, padrao `1` |

### Tabela `marca`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `idMarca` | `INTEGER` | chave primaria |
| `descricao` | `VARCHAR(150)` | obrigatorio |
| `status` | `BOOLEAN` | obrigatorio, padrao `1` |

### Tabela `unidadeMedida`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `idUnidade` | `INTEGER` | chave primaria |
| `descricao` | `VARCHAR(50)` | obrigatorio |
| `status` | `BOOLEAN` | obrigatorio, padrao `1` |

### Tabela `cliente`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `idCliente` | `INTEGER` | chave primaria |
| `idVendedor` | `INTEGER` | obrigatorio, chave estrangeira para `vendedor.idVendedor` |
| `idRamo` | `INTEGER` | obrigatorio, chave estrangeira para `ramoAtividade.idRamo` |
| `razaoSocial` | `VARCHAR(255)` | obrigatorio |
| `nomeFantasia` | `VARCHAR(255)` | obrigatorio |
| `tipo` | `VARCHAR(20)` | obrigatorio |
| `cnpj` | `VARCHAR(18)` | obrigatorio |
| `inscricaoEstadual` | `VARCHAR(20)` | opcional |
| `status` | `BOOLEAN` | obrigatorio, padrao `1` |
| `email` | `VARCHAR(150)` | opcional |
| `telefone` | `VARCHAR(20)` | opcional |
| `logradouro` | `VARCHAR(255)` | opcional |
| `numero` | `VARCHAR(10)` | opcional |
| `complemento` | `VARCHAR(100)` | opcional |
| `bairro` | `VARCHAR(100)` | opcional |
| `cidade` | `VARCHAR(100)` | opcional |
| `estado` | `CHAR(2)` | opcional |
| `cep` | `VARCHAR(10)` | opcional |
| `observacao` | `TEXT` | opcional |
| `imagem` | `VARCHAR(255)` | opcional |
| `dataCriacao` | `TIMESTAMP` | obrigatorio, padrao `CURRENT_TIMESTAMP` |

### Tabela `contato`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `idContato` | `INTEGER` | chave primaria |
| `idCliente` | `INTEGER` | obrigatorio, chave estrangeira para `cliente.idCliente` |
| `nome` | `VARCHAR(150)` | obrigatorio |
| `cargo` | `VARCHAR(100)` | opcional |
| `email` | `VARCHAR(150)` | opcional |
| `telefone` | `VARCHAR(20)` | opcional |
| `whatsapp` | `VARCHAR(20)` | opcional |
| `status` | `BOOLEAN` | obrigatorio, padrao `1` |
| `principal` | `BOOLEAN` | obrigatorio, padrao `0` |

### Tabela `produto`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `idProduto` | `INTEGER` | chave primaria |
| `referencia` | `VARCHAR(100)` | obrigatorio |
| `descricao` | `VARCHAR(255)` | obrigatorio |
| `idGrupo` | `INTEGER` | obrigatorio, chave estrangeira para `grupoProduto.idGrupo` |
| `idMarca` | `INTEGER` | obrigatorio, chave estrangeira para `marca.idMarca` |
| `idUnidade` | `INTEGER` | obrigatorio, chave estrangeira para `unidadeMedida.idUnidade` |
| `preco` | `DECIMAL(10,2)` | obrigatorio, padrao `0` |
| `imagem` | `VARCHAR(255)` | opcional |
| `status` | `BOOLEAN` | obrigatorio, padrao `1` |
| `dataCriacao` | `TIMESTAMP` | obrigatorio, padrao `CURRENT_TIMESTAMP` |

## Paleta de cores

Paleta inspirada na imagem de referencia do dashboard, com foco em azuis vibrantes, neutros frios e branco de interface.

| Papel | Variavel CSS | Hex |
| --- | --- | --- |
| Azul principal | `--corPrimaria` | `#1791E2` |
| Azul destaque | `--corDestaque` | `#1EA5F4` |
| Azul profundo | `--corPrimariaEscura` | `#0D78C8` |
| Cinza azulado | `--corBorda` | `#C7D3DD` |
| Cinza claro | `--corSuperficieSuave` | `#E8EEF2` |
| Branco gelo | `--corFundo` | `#F8FBFD` |
| Texto escuro | `--corTexto` | `#3C4A57` |

Sugestao de uso:

- `#1791E2` para botoes principais, links e graficos
- `#0D78C8` para hover, estados ativos e sidebar
- `#C7D3DD` e `#E8EEF2` para bordas, cards e fundos secundarios
- `#F8FBFD` para fundo base da interface
- `#3C4A57` para titulos e texto principal

## Padrao de Grade

- Toda listagem principal deve usar o componente [gradePadrao.jsx](c:\Users\tailo\OneDrive\Documentos\GitHub\crm\client\src\componentes\comuns\gradePadrao.jsx)
- Acoes padrao de linha devem usar [acoesRegistro.jsx](c:\Users\tailo\OneDrive\Documentos\GitHub\crm\client\src\componentes\comuns\acoesRegistro.jsx)
- Codigos de registros devem usar [codigoRegistro.jsx](c:\Users\tailo\OneDrive\Documentos\GitHub\crm\client\src\componentes\comuns\codigoRegistro.jsx)
- O padrao de grade deve ser construido com estrutura real de tabela, e nao com simulacao usando `div` ou `grid`
- O cabecalho da grade deve permanecer fixo
- Apenas os itens da grade devem ter rolagem vertical
- A definicao das colunas continua na tela de dominio, como em [cabecalhoGradeClientes.jsx](c:\Users\tailo\OneDrive\Documentos\GitHub\crm\client\src\paginas\clientes\cabecalhoGradeClientes.jsx)
- Cada linha da grade deve ser quebrada em componentes pequenos e especificos do dominio
- Mensagens de carregamento, erro e vazio devem passar pelo componente padrao da grade

## Como rodar

1. Instale as dependencias com `npm install`
2. Use os scripts conforme o fluxo desejado

### Desenvolvimento

- `npm run dev`: sobe backend, frontend web e Electron juntos
- `npm run dev:webapp`: sobe backend e frontend web juntos, sem Electron
- `npm run dev:backend`: sobe somente o backend Express
- `npm run dev:web`: sobe somente o frontend web com Vite
- `npm run dev:electron`: abre somente o Electron, esperando backend e web ja ativos

### Inicializacao manual

- `npm run start:backend`: inicia o backend sem nodemon
- `npm run start:web`: inicia o frontend web no Vite
- `npm run start:electron`: abre o app no Electron

### Build

- `npm run build:web`: gera a build web em `dist/web`
- `npm run build:electron`: gera a build web e empacota o app Electron em `dist/electron`

### Dados de teste

- `npm run popular:banco`: limpa e popula o banco com 10 registros em cada tabela
- Os campos `imagem` de `cliente` e `produto` usam links publicos validos para testes visuais na interface
- Os clientes de teste usam cidades reais do Brasil, com `cidade`, `estado` e `cep` coerentes

No modo desktop empacotado, o Electron inicia o backend local automaticamente e salva o SQLite em uma pasta de dados da aplicacao.

## Estrutura

- `client/`: aplicacao React
- `client/src/componentes/`: componentes reutilizaveis da interface
- `client/src/paginas/`: composicao das telas
- `client/src/servicos/`: comunicacao com a API
- `client/src/utilitarios/`: estruturas e funcoes auxiliares
- `client/src/recursos/`: estilos, imagens e outros arquivos visuais
- `electron/`: processo principal e preload do Electron
- `server/app.js`: configuracao principal da API Express
- `server/index.js`: inicializacao do servidor
- `server/rotas/`: definicao das rotas da API
- `server/repositorios/`: acesso aos dados do backend
- `server/configuracoes/`: configuracoes compartilhadas, como banco SQLite
