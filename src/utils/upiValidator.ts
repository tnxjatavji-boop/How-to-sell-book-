/**
 * TradeXora UPI Intent & Protocol Validator (NPCI & UPI 2.0 Compliant)
 * 
 * Ensures all generated UPI intent URLs (upi://pay), QR code payloads,
 * and app-specific deep links strictly conform to NPCI standards to prevent
 * app rejections or failed transactions across PhonePe, Google Pay, Paytm, BHIM, etc.
 */

export interface UpiValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedIntentUrl: string;
  qrPayloadUrl: string;
  parameters: {
    pa: string;      // Payee VPA / UPI ID
    pn: string;      // Payee Name
    am: string;      // Amount in INR
    cu: string;      // Currency code (INR)
    tn?: string;     // Transaction Note
    tr?: string;     // Transaction Reference ID
    mc?: string;     // Merchant Code
  };
  supportedApps: {
    phonePeUrl: string;
    gPayUrl: string;
    paytmUrl: string;
    bhimUrl: string;
    credUrl: string;
    universalUrl: string;
  };
}

export interface BuildUpiParams {
  upiId: string;
  payeeName?: string;
  amount: number | string;
  note?: string;
  transactionRef?: string;
  merchantCode?: string;
}

/**
 * Validates a standalone UPI ID (VPA)
 * Example: 'username@okhdfcbank', '9876543210@paytm'
 */
export function validateUpiId(upiId: string): { isValid: boolean; error?: string } {
  if (!upiId || typeof upiId !== 'string') {
    return { isValid: false, error: 'UPI ID is required' };
  }

  const clean = upiId.trim();
  if (clean.length < 3 || clean.length > 256) {
    return { isValid: false, error: 'UPI ID length must be between 3 and 256 characters' };
  }

  if (!clean.includes('@')) {
    return { isValid: false, error: "UPI ID must contain '@' handle (e.g. name@bank)" };
  }

  // NPCI VPA format: [username]@[bankhandle]
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,64}$/;
  if (!upiRegex.test(clean)) {
    return { isValid: false, error: 'Invalid UPI ID format. Only alphanumeric characters, dots, dashes, and underscores allowed.' };
  }

  return { isValid: true };
}

/**
 * Formats amount strictly to standard numeric string with max 2 decimal places
 */
export function formatUpiAmount(rawAmount: number | string): string {
  const num = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount).replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num <= 0) return '0.00';
  // Avoid scientific notation and format up to 2 decimal places
  return Number.isInteger(num) ? num.toString() : num.toFixed(2);
}

/**
 * Validates and sanitizes a complete UPI intent string (upi://pay?...)
 */
export function validateUpiIntent(intentUrl: string): UpiValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let urlToParse = (intentUrl || '').trim();

  // Normalize scheme
  if (!urlToParse.startsWith('upi://pay') && !urlToParse.startsWith('upi://')) {
    if (urlToParse.startsWith('phonepe://pay') || urlToParse.startsWith('tez://upi/pay') || urlToParse.startsWith('paytmmp://pay') || urlToParse.startsWith('bhim://pay')) {
      // Valid app-specific scheme converted to universal for parsing
      const queryIdx = urlToParse.indexOf('?');
      urlToParse = queryIdx >= 0 ? `upi://pay${urlToParse.slice(queryIdx)}` : 'upi://pay';
    } else {
      errors.push("Invalid protocol. Must start with 'upi://pay'");
    }
  }

  let queryString = '';
  const questionMarkIdx = urlToParse.indexOf('?');
  if (questionMarkIdx >= 0) {
    queryString = urlToParse.substring(questionMarkIdx + 1);
  } else {
    errors.push('Missing query parameters in UPI intent string');
  }

  const queryParams = new URLSearchParams(queryString);
  const pa = (queryParams.get('pa') || '').trim();
  const pn = (queryParams.get('pn') || '').trim();
  const am = (queryParams.get('am') || '').trim();
  const cu = (queryParams.get('cu') || 'INR').trim().toUpperCase();
  const tn = (queryParams.get('tn') || '').trim();
  const tr = (queryParams.get('tr') || '').trim();
  const mc = (queryParams.get('mc') || '').trim();

  // 1. Validate Payee Address (pa)
  const upiValidation = validateUpiId(pa);
  if (!upiValidation.isValid) {
    errors.push(`Payee VPA (pa): ${upiValidation.error || 'Invalid UPI ID'}`);
  }

  // 2. Validate Payee Name (pn)
  if (!pn) {
    warnings.push("Payee name (pn) is empty. Using 'TradeXora'");
  } else if (pn.length > 99) {
    warnings.push('Payee name exceeds 99 characters limit');
  }

  // 3. Validate Amount (am)
  const parsedAmt = parseFloat(am);
  if (!am || isNaN(parsedAmt) || parsedAmt <= 0) {
    errors.push('Amount (am) must be a positive number greater than 0');
  } else if (parsedAmt < 100) {
    warnings.push('Amount is below platform standard minimum of ₹100');
  }

  // 4. Validate Currency (cu)
  if (cu !== 'INR') {
    errors.push(`Currency (cu) must be 'INR' (received '${cu}')`);
  }

  // 5. Validate Note (tn)
  if (tn && tn.length > 50) {
    warnings.push('Transaction note (tn) exceeds recommended 50 characters');
  }

  // Clean and construct sanitized query string
  const cleanPa = pa || 'tradexora0@okhdfcbank';
  const cleanPn = (pn || 'TradeXora').replace(/[^a-zA-Z0-9\s._-]/g, '').trim().slice(0, 99) || 'TradeXora';
  const cleanAm = formatUpiAmount(parsedAmt > 0 ? parsedAmt : 500);
  const cleanCu = 'INR';
  const cleanTn = (tn || 'TradeXora Deposit').replace(/[^a-zA-Z0-9\s._-]/g, '').trim().slice(0, 50);

  const cleanSearchParams = new URLSearchParams();
  cleanSearchParams.set('pa', cleanPa);
  cleanSearchParams.set('pn', cleanPn);
  cleanSearchParams.set('am', cleanAm);
  cleanSearchParams.set('cu', cleanCu);
  if (cleanTn) cleanSearchParams.set('tn', cleanTn);
  if (tr) cleanSearchParams.set('tr', tr.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 35));
  if (mc) cleanSearchParams.set('mc', mc.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10));

  const standardQuery = cleanSearchParams.toString();
  const sanitizedIntentUrl = `upi://pay?${standardQuery}`;

  const supportedApps = {
    universalUrl: sanitizedIntentUrl,
    phonePeUrl: `phonepe://pay?${standardQuery}`,
    gPayUrl: `tez://upi/pay?${standardQuery}`,
    paytmUrl: `paytmmp://pay?${standardQuery}`,
    bhimUrl: `bhim://pay?${standardQuery}`,
    credUrl: `credpay://upi/pay?${standardQuery}`
  };

  const qrPayloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(sanitizedIntentUrl)}`;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedIntentUrl,
    qrPayloadUrl,
    parameters: {
      pa: cleanPa,
      pn: cleanPn,
      am: cleanAm,
      cu: cleanCu,
      tn: cleanTn,
      tr,
      mc
    },
    supportedApps
  };
}

/**
 * Builds a certified, NPCI-compliant UPI intent payload from parameters
 */
export function buildStandardUpiIntent(params: BuildUpiParams): UpiValidationResult {
  const upiId = (params.upiId || 'tradexora0@okhdfcbank').trim();
  const payeeName = (params.payeeName || 'TradeXora Official').trim();
  const amountStr = formatUpiAmount(params.amount);
  const note = (params.note || 'TradeXora Deposit').trim();

  const searchParams = new URLSearchParams();
  searchParams.set('pa', upiId);
  searchParams.set('pn', payeeName);
  searchParams.set('am', amountStr);
  searchParams.set('cu', 'INR');
  if (note) searchParams.set('tn', note);
  if (params.transactionRef) searchParams.set('tr', params.transactionRef);
  if (params.merchantCode) searchParams.set('mc', params.merchantCode);

  const intentUrl = `upi://pay?${searchParams.toString()}`;
  return validateUpiIntent(intentUrl);
}
