export type CodexIncomeMarginInputs = {
  currency: string;
  observedOn: string;
  takeHome: number;
  annualHours: number;
  utilisation: number;
  overhead: number;
  reserve: number;
  projectHours: number;
  directCosts: number;
  riskBuffer: number;
  quote: number;
};

export type CodexIncomeMarginResult = {
  annualRevenueRequirement: number;
  hourlyFloor: number;
  projectFloor: number;
  downsideFloor: number;
  cushion: number;
};

const numericKeys = [
  "takeHome",
  "annualHours",
  "utilisation",
  "overhead",
  "reserve",
  "projectHours",
  "directCosts",
  "riskBuffer",
  "quote",
] as const;

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function calculateCodexIncomeMargin(inputs: CodexIncomeMarginInputs): {
  result: CodexIncomeMarginResult | null;
  errors: string[];
} {
  const errors: string[] = [];
  if (numericKeys.some((key) => !Number.isFinite(inputs[key]) || inputs[key] < 0)) {
    errors.push("Every numeric input must be a finite value of zero or more.");
  }
  if (!/^[A-Z]{3}$/.test(inputs.currency)) {
    errors.push("Enter a three-letter ISO currency code.");
  }
  if (!isIsoDate(inputs.observedOn)) {
    errors.push("Record a valid date on which the costs were observed.");
  }
  if (inputs.utilisation <= 0 || inputs.utilisation > 100) {
    errors.push("Billable utilisation must be greater than 0% and no more than 100%.");
  }
  if (inputs.overhead > 100 || inputs.reserve > 100 || inputs.riskBuffer > 100) {
    errors.push("Percentage inputs cannot exceed 100%.");
  }
  if (inputs.overhead + inputs.reserve >= 95) {
    errors.push("Overhead plus reserve must leave at least 5% of collected revenue.");
  }
  if (inputs.annualHours <= 0 || inputs.annualHours > 8784) {
    errors.push("Annual working hours must be greater than zero and no more than 8,784.");
  }
  if (errors.length) return { result: null, errors };

  const allocationRate = (inputs.overhead + inputs.reserve) / 100;
  const denominator = 1 - allocationRate;
  const billableHours = inputs.annualHours * (inputs.utilisation / 100);
  const annualRevenueRequirement = inputs.takeHome / denominator;
  const hourlyFloor = annualRevenueRequirement / billableHours;
  const labourAllocation = hourlyFloor * inputs.projectHours;
  const grossedUpDirectCosts = inputs.directCosts / denominator;
  const baseFloor = labourAllocation + grossedUpDirectCosts;
  const projectFloor = baseFloor * (1 + inputs.riskBuffer / 100);
  const downsideBase = hourlyFloor * inputs.projectHours * 1.5
    + (inputs.directCosts * 1.25) / denominator;
  const downsideFloor = downsideBase * (1 + Math.max(inputs.riskBuffer, 25) / 100);
  const cushion = inputs.quote - projectFloor;

  return {
    result: { annualRevenueRequirement, hourlyFloor, projectFloor, downsideFloor, cushion },
    errors,
  };
}
