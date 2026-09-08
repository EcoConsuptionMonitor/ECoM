let idCounter = 1;

const nextId = () => String(idCounter++);

const usuarios = [];
const sessoes = [];
const ambientes = [];
const consumo = [];
const alertas = [];
const tarifas = [];
const sensores = [];

export default {
  usuarios,
  sessoes,
  ambientes,
  consumo,
  alertas,
  tarifas,
  sensores,
  nextId,
};
