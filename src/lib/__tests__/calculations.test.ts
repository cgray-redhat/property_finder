import {
  calculateCapRate,
  calculateCashOnCashReturn,
  calculateMonthlyMortgagePayment,
  calculateNOI,
  calculateOperatingExpenses,
  DEFAULT_CLOSING_COSTS_PERCENT,
  DEFAULT_DOWN_PAYMENT_PERCENT,
  DEFAULT_INTEREST_RATE_ANNUAL,
  DEFAULT_LOAN_TERM_YEARS,
  DEFAULT_MAINTENANCE_RATE,
  DEFAULT_VACANCY_RATE,
  runUnderwriting,
  type PropertyUnderwritingInput,
} from "@/lib/calculations";

/** Mock property data sheet — Austin duplex (baseline scenario). */
const AUSTIN_DUPLEX: PropertyUnderwritingInput = {
  purchasePrice: 300_000,
  monthlyRent: 2_500,
};

/** Mock property data sheet — Phoenix SFH with taxes and insurance. */
const PHOENIX_SFH: PropertyUnderwritingInput = {
  purchasePrice: 425_000,
  monthlyRent: 2_800,
  propertyTaxesAnnual: 4_250,
  insuranceAnnual: 1_800,
};

/** Mock property data sheet — low-yield Atlanta condo. */
const ATLANTA_CONDO: PropertyUnderwritingInput = {
  purchasePrice: 185_000,
  monthlyRent: 1_350,
  propertyTaxesAnnual: 2_200,
  insuranceAnnual: 950,
};

/** Mock property data sheet — high cap-rate Cleveland property. */
const CLEVELAND_TRIPLEX: PropertyUnderwritingInput = {
  purchasePrice: 220_000,
  monthlyRent: 3_200,
  propertyTaxesAnnual: 3_100,
  insuranceAnnual: 1_200,
};

describe("calculateOperatingExpenses", () => {
  it("applies 1% maintenance and 5% vacancy defaults", () => {
    const expenses = calculateOperatingExpenses(AUSTIN_DUPLEX);

    expect(expenses.vacancy).toBe(1_500);
    expect(expenses.maintenance).toBe(3_000);
    expect(expenses.propertyTaxes).toBe(0);
    expect(expenses.insurance).toBe(0);
    expect(expenses.total).toBe(4_500);
  });

  it("includes optional taxes and insurance in operating expenses", () => {
    const expenses = calculateOperatingExpenses(PHOENIX_SFH);

    expect(expenses.vacancy).toBe(1_680);
    expect(expenses.maintenance).toBe(4_250);
    expect(expenses.propertyTaxes).toBe(4_250);
    expect(expenses.insurance).toBe(1_800);
    expect(expenses.total).toBe(11_980);
  });

  it("allows custom maintenance and vacancy rates", () => {
    const expenses = calculateOperatingExpenses({
      ...AUSTIN_DUPLEX,
      maintenanceRate: 0.015,
      vacancyRate: 0.08,
    });

    expect(expenses.maintenance).toBe(4_500);
    expect(expenses.vacancy).toBe(2_400);
    expect(expenses.total).toBe(6_900);
  });
});

describe("calculateNOI", () => {
  it("calculates annual rent minus operating expenses (excludes mortgage)", () => {
    // Gross: 30,000 | Expenses: 4,500 | NOI: 25,500
    expect(calculateNOI(AUSTIN_DUPLEX)).toBe(25_500);
  });

  it("subtracts taxes and insurance from gross rent", () => {
    // Gross: 33,600 | Expenses: 11,980 | NOI: 21,620
    expect(calculateNOI(PHOENIX_SFH)).toBe(21_620);
  });
});

describe("calculateCapRate", () => {
  it("returns NOI divided by purchase price", () => {
    // 25,500 / 300,000 = 0.085
    expect(calculateCapRate(AUSTIN_DUPLEX)).toBe(0.085);
  });

  it("returns 0 when purchase price is zero", () => {
    expect(
      calculateCapRate({ purchasePrice: 0, monthlyRent: 2_000 }),
    ).toBe(0);
  });
});

describe("calculateMonthlyMortgagePayment", () => {
  it("calculates a standard 30-year amortizing payment", () => {
    const payment = calculateMonthlyMortgagePayment(
      240_000,
      DEFAULT_INTEREST_RATE_ANNUAL,
      DEFAULT_LOAN_TERM_YEARS,
    );

    expect(payment).toBe(1_516.96);
  });

  it("returns 0 for zero loan amount", () => {
    expect(calculateMonthlyMortgagePayment(0, 0.065, 30)).toBe(0);
  });

  it("handles zero interest rate as straight-line principal paydown", () => {
    expect(calculateMonthlyMortgagePayment(120_000, 0, 30)).toBe(333.33);
  });
});

describe("calculateCashOnCashReturn", () => {
  it("uses NOI minus debt service over total cash invested", () => {
    const coc = calculateCashOnCashReturn(AUSTIN_DUPLEX, {
      downPaymentPercent: DEFAULT_DOWN_PAYMENT_PERCENT,
      closingCostsPercent: DEFAULT_CLOSING_COSTS_PERCENT,
      interestRateAnnual: DEFAULT_INTEREST_RATE_ANNUAL,
      loanTermYears: DEFAULT_LOAN_TERM_YEARS,
    });

    // NOI 25,500 - annual debt 18,203.52 = 7,296.48 cash flow
    // Cash invested: 60,000 + 9,000 = 69,000
    // CoC ≈ 0.1057
    expect(coc).toBe(0.1057);
  });
});

describe("runUnderwriting", () => {
  it("produces a full Austin duplex underwriting sheet", () => {
    const result = runUnderwriting({
      property: AUSTIN_DUPLEX,
      financing: {
        downPaymentPercent: 0.2,
        closingCostsPercent: 0.03,
        interestRateAnnual: 0.065,
        loanTermYears: 30,
      },
    });

    expect(result.grossAnnualRent).toBe(30_000);
    expect(result.operatingExpenses).toEqual({
      vacancy: 1_500,
      maintenance: 3_000,
      propertyTaxes: 0,
      insurance: 0,
      total: 4_500,
    });
    expect(result.noi).toBe(25_500);
    expect(result.capRate).toBe(0.085);
    expect(result.downPayment).toBe(60_000);
    expect(result.closingCosts).toBe(9_000);
    expect(result.totalCashInvested).toBe(69_000);
    expect(result.loanAmount).toBe(240_000);
    expect(result.annualMortgagePayment).toBe(18_203.52);
    expect(result.annualCashFlow).toBe(7_296.48);
    expect(result.cashOnCashReturn).toBe(0.1057);
  });

  it("produces a Phoenix SFH sheet with taxes and insurance", () => {
    const result = runUnderwriting({ property: PHOENIX_SFH });

    expect(result.noi).toBe(21_620);
    expect(result.capRate).toBe(0.0509);
    expect(result.totalCashInvested).toBe(97_750);
    expect(result.annualCashFlow).toBe(-4_168.36);
    expect(result.cashOnCashReturn).toBe(-0.0426);
  });

  it("produces an Atlanta condo sheet with low cap rate", () => {
    const result = runUnderwriting({ property: ATLANTA_CONDO });

    expect(result.noi).toBe(10_390);
    expect(result.capRate).toBe(0.0562);
    expect(result.annualCashFlow).toBe(-835.52);
    expect(result.cashOnCashReturn).toBe(-0.0196);
  });

  it("produces a Cleveland triplex sheet with strong returns", () => {
    const result = runUnderwriting({
      property: CLEVELAND_TRIPLEX,
      financing: {
        downPaymentPercent: 0.25,
        closingCosts: 5_500,
        interestRateAnnual: 0.07,
        loanTermYears: 30,
      },
    });

    expect(result.grossAnnualRent).toBe(38_400);
    expect(result.operatingExpenses.total).toBe(8_420);
    expect(result.noi).toBe(29_980);
    expect(result.capRate).toBe(0.1363);
    expect(result.downPayment).toBe(55_000);
    expect(result.totalCashInvested).toBe(60_500);
    expect(result.cashOnCashReturn).toBe(0.2778);
  });

  it("accepts explicit closing costs instead of a percentage", () => {
    const result = runUnderwriting({
      property: AUSTIN_DUPLEX,
      financing: { closingCosts: 12_000 },
    });

    expect(result.closingCosts).toBe(12_000);
    expect(result.totalCashInvested).toBe(72_000);
  });

  it("uses PRD default assumption constants", () => {
    expect(DEFAULT_MAINTENANCE_RATE).toBe(0.01);
    expect(DEFAULT_VACANCY_RATE).toBe(0.05);
    expect(DEFAULT_DOWN_PAYMENT_PERCENT).toBe(0.2);
    expect(DEFAULT_INTEREST_RATE_ANNUAL).toBe(0.065);
    expect(DEFAULT_LOAN_TERM_YEARS).toBe(30);
    expect(DEFAULT_CLOSING_COSTS_PERCENT).toBe(0.03);
  });
});
