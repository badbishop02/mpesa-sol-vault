import { normalizePhone, validateAmount, calculateFee } from "@/hooks/useMpesaDeposit";

describe("normalizePhone", () => {
  it("normalizes 0712345678 to 254712345678", () => {
    expect(normalizePhone("0712345678")).toBe("254712345678");
  });

  it("normalizes 712345678 to 254712345678", () => {
    expect(normalizePhone("712345678")).toBe("254712345678");
  });

  it("accepts +254712345678", () => {
    expect(normalizePhone("+254712345678")).toBe("254712345678");
  });

  it("accepts 254712345678 as is", () => {
    expect(normalizePhone("254712345678")).toBe("254712345678");
  });

  it("handles phone with spaces and dashes", () => {
    expect(normalizePhone("0712-345-678")).toBe("254712345678");
    expect(normalizePhone("0712 345 678")).toBe("254712345678");
  });

  it("throws on invalid phone numbers", () => {
    expect(() => normalizePhone("12345")).toThrow("Enter a valid Kenyan phone number");
    expect(() => normalizePhone("0812345678")).toThrow("Enter a valid Kenyan phone number"); // Wrong prefix
    expect(() => normalizePhone("071234567")).toThrow("Enter a valid Kenyan phone number"); // Too short
    expect(() => normalizePhone("07123456789")).toThrow("Enter a valid Kenyan phone number"); // Too long
    expect(() => normalizePhone("")).toThrow("Enter a valid Kenyan phone number");
    expect(() => normalizePhone("abcdefghijk")).toThrow("Enter a valid Kenyan phone number");
  });
});

describe("validateAmount", () => {
  it("accepts valid amounts within default bounds", () => {
    expect(() => validateAmount(100)).not.toThrow();
    expect(() => validateAmount(1000)).not.toThrow();
    expect(() => validateAmount(50000)).not.toThrow();
  });

  it("accepts amounts within custom bounds", () => {
    expect(() => validateAmount(500, 100, 1000)).not.toThrow();
  });

  it("throws when amount is NaN", () => {
    expect(() => validateAmount(NaN)).toThrow("Invalid amount");
  });

  it("throws when amount is not finite", () => {
    expect(() => validateAmount(Infinity)).toThrow("Invalid amount");
    expect(() => validateAmount(-Infinity)).toThrow("Invalid amount");
  });

  it("throws when below minimum", () => {
    expect(() => validateAmount(5)).toThrow("Minimum deposit is KES 10");
    expect(() => validateAmount(50, 100, 1000)).toThrow("Minimum deposit is KES 100");
  });

  it("throws when above maximum", () => {
    expect(() => validateAmount(200000)).toThrow("Maximum deposit is KES 150,000");
    expect(() => validateAmount(1500, 100, 1000)).toThrow("Maximum deposit is KES 1,000");
  });

  it("throws when amount is zero or negative", () => {
    expect(() => validateAmount(0)).toThrow("Minimum deposit is KES 10");
    expect(() => validateAmount(-100)).toThrow("Minimum deposit is KES 10");
  });
});

describe("calculateFee", () => {
  it("returns 0 for amounts <= 100", () => {
    expect(calculateFee(50)).toBe(0);
    expect(calculateFee(100)).toBe(0);
  });

  it("returns correct fees for various amounts", () => {
    expect(calculateFee(200)).toBe(7); // 101-500 range
    expect(calculateFee(500)).toBe(7);
    expect(calculateFee(800)).toBe(13); // 501-1000 range
    expect(calculateFee(1000)).toBe(13);
    expect(calculateFee(1200)).toBe(23); // 1001-1500 range
    expect(calculateFee(2000)).toBe(33); // 1501-2500 range
    expect(calculateFee(3000)).toBe(53); // 2501-3500 range
    expect(calculateFee(4000)).toBe(75); // 3501-5000 range
    expect(calculateFee(6000)).toBe(105); // 5001-7500 range
    expect(calculateFee(8000)).toBe(120); // 7501-10000 range
    expect(calculateFee(12000)).toBe(165); // 10001-15000 range
    expect(calculateFee(18000)).toBe(185); // 15001-20000 range
    expect(calculateFee(25000)).toBe(200); // 20001-35000 range
    expect(calculateFee(45000)).toBe(220); // 35001-50000 range
    expect(calculateFee(60000)).toBe(250); // Above 50000
  });
});