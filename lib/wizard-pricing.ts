// lib/wizard-pricing.ts

export const calcularJaladera = (medida: number, precioPorMetro: number): number => {
  // medida en mm, se convierte a metros
  return (medida / 1000) * precioPorMetro
}

export const calcularAjustes = (
  subtotal: number, 
  expressPercentage: number, 
  exhibicionPercentage: number
) => {
  const expressAmount = subtotal * (expressPercentage / 100)
  const exhibicionAmount = subtotal * (exhibicionPercentage / 100)
  
  return {
    expressAmount,
    exhibicionAmount,
    total: subtotal + expressAmount - exhibicionAmount
  }
}
