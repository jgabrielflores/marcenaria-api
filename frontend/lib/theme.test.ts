import { describe, expect, it } from "vitest";

import { formatDate, formatMoney, formatPhone } from "./theme";

describe("formatMoney", () => {
  it("returns an em dash for null", () => {
    expect(formatMoney(null)).toBe("—");
  });

  it("formats a decimal string as BRL currency", () => {
    const result = formatMoney("1500.5");
    expect(result).toContain("R$");
    expect(result).toContain("1.500,50");
  });
});

describe("formatPhone", () => {
  it("formats an 11-digit mobile number", () => {
    expect(formatPhone("11999998888")).toBe("(11) 99999-8888");
  });

  it("formats a 10-digit landline number", () => {
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
  });

  it("returns the input unchanged when it is not 10 or 11 digits", () => {
    expect(formatPhone("123")).toBe("123");
  });
});

describe("formatDate", () => {
  it("returns an em dash for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("formats a date-only string as dd/mm/yyyy without a timezone shift", () => {
    expect(formatDate("2026-06-04")).toBe("04/06/2026");
  });
});
