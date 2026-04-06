import { useEffect, useState } from 'react';
import { incluirContato } from '../../servicos/clientes';
import { ModalContatoCliente } from '../../paginas/clientes/modalContatoCliente';
import { ModalBuscaTabela } from './modalBuscaTabela';

const estadoInicialContato = {
  nome: '',
  cargo: '',
  email: '',
  telefone: '',
  whatsapp: '',
  status: true,
  principal: false
};

export function ModalBuscaContatos({
  aberto,
  idCliente = '',
  contatos = [],
  placeholder = 'Pesquisar contatos',
  ariaLabelPesquisa = 'Pesquisar contatos',
  aoCriarContato = null,
  aoSelecionar,
  aoFechar
}) {
  const [contatosLocais, definirContatosLocais] = useState(contatos);
  const [modalContatoAberto, definirModalContatoAberto] = useState(false);
  const [formularioContato, definirFormularioContato] = useState(estadoInicialContato);

  useEffect(() => {
    definirContatosLocais((estadoAtual) => combinarContatosUnicos(contatos, estadoAtual));
  }, [contatos]);

  function abrirModalNovoContato() {
    if (!idCliente) {
      return;
    }

    definirFormularioContato(estadoInicialContato);
    definirModalContatoAberto(true);
  }

  function fecharModalNovoContato() {
    definirFormularioContato(estadoInicialContato);
    definirModalContatoAberto(false);
  }

  function alterarCampoContato(evento) {
    const { name, value, type, checked } = evento.target;

    definirFormularioContato((estadoAtual) => ({
      ...estadoAtual,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function salvarNovoContato() {
    if (!String(formularioContato.nome || '').trim()) {
      return;
    }

    const contatoCriado = await incluirContato({
      ...formularioContato,
      idCliente: Number(idCliente),
      status: formularioContato.status ? 1 : 0,
      principal: formularioContato.principal ? 1 : 0
    });

    const contatoNormalizado = {
      ...formularioContato,
      ...contatoCriado,
      idContato: contatoCriado?.idContato || contatoCriado?.id || null,
      idCliente: Number(idCliente),
      status: contatoCriado?.status ?? (formularioContato.status ? 1 : 0),
      principal: contatoCriado?.principal ?? (formularioContato.principal ? 1 : 0)
    };

    definirContatosLocais((estadoAtual) => {
      const listaAtual = Array.isArray(estadoAtual) ? estadoAtual : [];

      return [...listaAtual, contatoNormalizado].sort(
        (contatoA, contatoB) => Number(Boolean(contatoB?.status)) - Number(Boolean(contatoA?.status))
      );
    });

    if (typeof aoCriarContato === 'function') {
      aoCriarContato(contatoNormalizado);
    }

    fecharModalNovoContato();

    if (contatoNormalizado?.idContato) {
      aoSelecionar(contatoNormalizado);
    }
  }

  return (
    <>
      <ModalBuscaTabela
        aberto={aberto}
        titulo="Buscar contato"
        placeholder={placeholder}
        ariaLabelPesquisa={ariaLabelPesquisa}
        colunas={[
          { key: 'nome', label: 'Contato', render: (contato) => contato.nome || '-' },
          { key: 'cargo', label: 'Cargo', render: (contato) => contato.cargo || '-' },
          { key: 'email', label: 'E-mail', render: (contato) => contato.email || '-' },
          {
            key: 'telefone',
            label: 'Telefone',
            render: (contato) => contato.whatsapp || contato.telefone || '-'
          }
        ]}
        registros={contatosLocais}
        obterTextoBusca={(contato) => [
          contato.nome,
          contato.cargo,
          contato.email,
          contato.telefone,
          contato.whatsapp
        ].join(' ')}
        obterChaveRegistro={(contato) => contato.idContato}
        aoSelecionar={aoSelecionar}
        aoFechar={aoFechar}
        rotuloAcaoPrimaria={idCliente ? 'Adicionar' : ''}
        tituloAcaoPrimaria="Adicionar contato"
        aoAcionarPrimaria={idCliente ? abrirModalNovoContato : null}
        mensagemVazio="Nenhum contato encontrado."
      />

      <ModalContatoCliente
        aberto={modalContatoAberto}
        modo="novo"
        formulario={formularioContato}
        aoAlterarCampo={alterarCampoContato}
        aoFechar={fecharModalNovoContato}
        aoSalvar={salvarNovoContato}
      />
    </>
  );
}

function combinarContatosUnicos(contatosBase, contatosExtras) {
  const mapa = new Map();

  [...(Array.isArray(contatosBase) ? contatosBase : []), ...(Array.isArray(contatosExtras) ? contatosExtras : [])]
    .forEach((contato) => {
      const idContato = contato?.idContato || contato?.id;

      if (!idContato) {
        return;
      }

      mapa.set(String(idContato), {
        ...contato,
        idContato
      });
    });

  return Array.from(mapa.values());
}
