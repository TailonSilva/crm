import { forwardRef } from 'react';
import { Icone } from './icone';

export const CampoPesquisa = forwardRef(function CampoPesquisa({
  valor,
  aoAlterar,
  placeholder = 'Pesquisar...',
  ariaLabel = 'Pesquisar'
}, ref) {
  return (
    <label className="campoPesquisa">
      <Icone nome="pesquisa" className="iconeCampoPesquisa" />
      <input
        ref={ref}
        className="entradaCampoPesquisa"
        type="search"
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </label>
  );
});
