export const UNIT_CONVERSIONS: Record<string, number> = {
  'grams': 0.001,
  'ml': 0.001,
  'kg/L': 1,
  'cups': 0.25,
  'tablespoons': 0.015,
  'teaspoons': 0.005,
  'unit': 1 // This is a multiplier placeholder
};

export const convertToBase = (value: number, unit: string, ingredientWeight?: number) => {
  if (unit === 'unit') {
    // If user selects 'unit', we multiply by the individual item weight (e.g., 0.1kg for a carrot)
    return value * (ingredientWeight || 1);
  }
  return value * (UNIT_CONVERSIONS[unit] || 1);
};