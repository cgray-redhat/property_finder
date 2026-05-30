/** Default underwriting assumptions per PRD (User Story 1.2). */
export const DEFAULT_MAINTENANCE_RATE = 0.01;
export const DEFAULT_VACANCY_RATE = 0.05;
export const DEFAULT_DOWN_PAYMENT_PERCENT = 0.2;
export const DEFAULT_INTEREST_RATE_ANNUAL = 0.065;
export const DEFAULT_LOAN_TERM_YEARS = 30;
export const DEFAULT_CLOSING_COSTS_PERCENT = 0.03;

export type PropertyUnderwritingInput = {
  purchasePrice: number;
  monthlyRent: number;
  /** Annual property taxes (optional; defaults to 0). */
  propertyTaxesAnnual?: number;
  /** Annual insurance premium (optional; defaults to 0). */
  insuranceAnnual?: number;
  /** Override maintenance rate as a decimal (default 1% of purchase price). */
  maintenanceRate?: number;
  /** Override vacancy rate as a decimal (default 5% of gross rent). */
  vacancyRate?: number;
};

export type FinancingInput = {
  downPaymentPercent?: number;
  closingCosts?: number;
  /** Closing costs as a decimal of purchase price when closingCosts is omitted. */
  closingCostsPercent?: number;
  interestRateAnnual?: number;
  loanTermYears?: number;
};

export type OperatingExpenseBreakdown = {
  vacancy: number;
  maintenance: number;
  propertyTaxes: number;
  insurance: number;
  total: number;
};

export type UnderwritingResult = {
  grossAnnualRent: number;
  operatingExpenses: OperatingExpenseBreakdown;
  noi: number;
  capRate: number;
  annualMortgagePayment: number;
  annualCashFlow: number;
  downPayment: number;
  closingCosts: number;
  totalCashInvested: number;
  cashOnCashReturn: number;
  loanAmount: number;
};

export type UnderwritingInput = {
  property: PropertyUnderwritingInput;
  financing?: FinancingInput;
};

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundRate(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

/**
 * Annual operating expenses excluding mortgage (debt service).
 * Applies PRD default rules: 1% maintenance on purchase price,
 * 5% vacancy against gross rent.
 */
export function calculateOperatingExpenses(
  input: PropertyUnderwritingInput,
): OperatingExpenseBreakdown {
  const grossAnnualRent = input.monthlyRent * 12;
  const maintenanceRate = input.maintenanceRate ?? DEFAULT_MAINTENANCE_RATE;
  const vacancyRate = input.vacancyRate ?? DEFAULT_VACANCY_RATE;

  const vacancy = roundCurrency(grossAnnualRent * vacancyRate);
  const maintenance = roundCurrency(input.purchasePrice * maintenanceRate);
  const propertyTaxes = roundCurrency(input.propertyTaxesAnnual ?? 0);
  const insurance = roundCurrency(input.insuranceAnnual ?? 0);
  const total = roundCurrency(vacancy + maintenance + propertyTaxes + insurance);

  return { vacancy, maintenance, propertyTaxes, insurance, total };
}

/**
 * Net Operating Income = annual rental income minus operating expenses.
 * Mortgage payments are intentionally excluded per PRD Section 5.
 */
export function calculateNOI(input: PropertyUnderwritingInput): number {
  const grossAnnualRent = input.monthlyRent * 12;
  const expenses = calculateOperatingExpenses(input);

  return roundCurrency(grossAnnualRent - expenses.total);
}

/**
 * Capitalization Rate = NOI / Purchase Price.
 */
export function calculateCapRate(input: PropertyUnderwritingInput): number {
  if (input.purchasePrice <= 0) {
    return 0;
  }

  return roundRate(calculateNOI(input) / input.purchasePrice);
}

/**
 * Standard amortizing loan monthly payment.
 */
export function calculateMonthlyMortgagePayment(
  loanAmount: number,
  interestRateAnnual: number,
  loanTermYears: number,
): number {
  if (loanAmount <= 0) {
    return 0;
  }

  if (interestRateAnnual === 0) {
    return roundCurrency(loanAmount / (loanTermYears * 12));
  }

  const monthlyRate = interestRateAnnual / 12;
  const paymentCount = loanTermYears * 12;
  const factor = (monthlyRate * (1 + monthlyRate) ** paymentCount) /
    ((1 + monthlyRate) ** paymentCount - 1);

  return roundCurrency(loanAmount * factor);
}

/**
 * Cash-on-Cash Return = Annual Cash Flow / Total Cash Invested.
 * Annual Cash Flow = NOI minus annual mortgage (debt service).
 * Total Cash Invested = down payment + closing costs.
 */
export function calculateCashOnCashReturn(
  property: PropertyUnderwritingInput,
  financing: FinancingInput = {},
): number {
  const result = runUnderwriting({ property, financing });
  if (result.totalCashInvested <= 0) {
    return 0;
  }

  return roundRate(result.annualCashFlow / result.totalCashInvested);
}

/**
 * Full underwriting pass: NOI, Cap Rate, and Cash-on-Cash in one call.
 */
export function runUnderwriting(input: UnderwritingInput): UnderwritingResult {
  const { property, financing = {} } = input;

  const grossAnnualRent = property.monthlyRent * 12;
  const operatingExpenses = calculateOperatingExpenses(property);
  const noi = roundCurrency(grossAnnualRent - operatingExpenses.total);
  const capRate =
    property.purchasePrice > 0
      ? roundRate(noi / property.purchasePrice)
      : 0;

  const downPaymentPercent =
    financing.downPaymentPercent ?? DEFAULT_DOWN_PAYMENT_PERCENT;
  const interestRateAnnual =
    financing.interestRateAnnual ?? DEFAULT_INTEREST_RATE_ANNUAL;
  const loanTermYears = financing.loanTermYears ?? DEFAULT_LOAN_TERM_YEARS;

  const downPayment = roundCurrency(property.purchasePrice * downPaymentPercent);
  const closingCosts =
    financing.closingCosts ??
    roundCurrency(
      property.purchasePrice *
        (financing.closingCostsPercent ?? DEFAULT_CLOSING_COSTS_PERCENT),
    );
  const totalCashInvested = roundCurrency(downPayment + closingCosts);
  const loanAmount = roundCurrency(property.purchasePrice - downPayment);

  const monthlyMortgage = calculateMonthlyMortgagePayment(
    loanAmount,
    interestRateAnnual,
    loanTermYears,
  );
  const annualMortgagePayment = roundCurrency(monthlyMortgage * 12);
  const annualCashFlow = roundCurrency(noi - annualMortgagePayment);
  const cashOnCashReturn =
    totalCashInvested > 0
      ? roundRate(annualCashFlow / totalCashInvested)
      : 0;

  return {
    grossAnnualRent,
    operatingExpenses,
    noi,
    capRate,
    annualMortgagePayment,
    annualCashFlow,
    downPayment,
    closingCosts,
    totalCashInvested,
    cashOnCashReturn,
    loanAmount,
  };
}
