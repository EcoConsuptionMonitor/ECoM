export const TARIFAS_PADRAO = {
  agua: 5.82,
  energia: 0.65,
};

export async function obterTarifas(userId) {
  const { query } = await import('../lib/db.js');
  const resultado = await query('SELECT * FROM tarifas WHERE user_id = $1', [
    userId,
  ]);

  const tarifas = { ...TARIFAS_PADRAO };
  resultado.rows.forEach((item) => {
    if (item.tipo === 'agua' || item.tipo === 'energia') {
      tarifas[item.tipo] = item.valor_por_unidade;
    }
  });
  return tarifas;
}

export function obterTarifa(tarifas, userId, tipo) {
  if (tarifas && tarifas[tipo] != null) {
    return tarifas[tipo];
  }
  return TARIFAS_PADRAO[tipo];
}