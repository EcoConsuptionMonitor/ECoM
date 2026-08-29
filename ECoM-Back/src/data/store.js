let idCounter = 1;

const nextId = () => String(idCounter++);

const usuarios = [];
const sessoes = [];
const ambientes = [];
const consumo = [];
const alertas = [];

export default {
  usuarios,
  sessoes,
  ambientes,
  consumo,
  alertas,
  nextId,
};
