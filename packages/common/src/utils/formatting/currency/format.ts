import { CurrencyCodeEnum } from "../../../enums";

/**
 * Formats a number as a currency string.
 *
 * @param amount The number to format.
 * @param currencyCode The ISO 4217 currency code. Defaults to CurrencyCodeEnum.VND.
 * @param locale The locale string to use for formatting. Defaults to 'vi-VN'.
 * @param options Additional options for Intl.NumberFormat.
 * @returns The formatted currency string.
 *
 * @example
 * formatCurrency(123456.789); // "123.457 ₫" (assuming VND default, locale vi-VN may round differently or have different spacing)
 * formatCurrency(123456.789, CurrencyCodeEnum.USD, 'en-US'); // "$123,456.79"
 */
export const formatCurrency = (
  amount: number,
  currencyCode: CurrencyCodeEnum | string = CurrencyCodeEnum.VND,
  locale: string = "vi-VN",
  options?: Intl.NumberFormatOptions
): string => {
  // currencyCode is already a string if it's an enum member of a string enum or a string literal.
  const currencyString = currencyCode;

  const defaultOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency: currencyString,
    // For VND, it's common to not show fraction digits if they are zero.
    // For JPY, there are no minor units.
    // Let's adjust default fraction digits based on currency or allow full override by options.
    minimumFractionDigits: currencyString === CurrencyCodeEnum.JPY ? 0 : 2,
    maximumFractionDigits: currencyString === CurrencyCodeEnum.JPY ? 0 : 2,
    ...options,
  };

  // If options explicitly set fraction digits, those should take precedence.
  if (options && typeof options.minimumFractionDigits === "number") {
    defaultOptions.minimumFractionDigits = options.minimumFractionDigits;
  }
  if (options && typeof options.maximumFractionDigits === "number") {
    defaultOptions.maximumFractionDigits = options.maximumFractionDigits;
  }

  // Specific handling for VND locale to match common display (e.g., 123.456 ₫)
  // The Intl.NumberFormat for 'vi-VN' with VND might produce "123.456,79 ₫" or similar.
  // If a very specific format like "123.456 ₫" (no decimals for whole numbers) is needed,
  // more complex logic or a different formatter might be required if Intl doesn't support it directly.

  try {
    return new Intl.NumberFormat(locale, defaultOptions).format(amount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    // Fallback for unsupported locales or currency codes
    const symbol =
      currencyString === CurrencyCodeEnum.VND ? "₫" : currencyString;
    const formattedAmount = amount.toFixed(
      defaultOptions.maximumFractionDigits
    );
    return `${formattedAmount} ${symbol}`.trim();
  }
};
