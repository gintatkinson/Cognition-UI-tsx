/**
 * RFC 9911 / ietf-yang-types Common Data Types Validation & Normalization Library
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  normalized?: string;
}

// Regex patterns strictly from RFC 9911
export const PATTERNS = {
  // Object Identifier: matches valid root arc (0, 1, or 2) and subsequent sub-arcs
  OBJECT_IDENTIFIER: /^(([0-1](\.[1-3]?[0-9]))|(2\.(0|([1-9][0-9]*))))(\.(0|([1-9][0-9]*)))*$/,
  
  // Object Identifier with max 128 sub-identifiers
  OBJECT_IDENTIFIER_128: /^[0-9]+(\.[0-9]+){0,127}$/,
  
  // YANG 1.1 Identifier
  YANG_IDENTIFIER: /^[a-zA-Z_][a-zA-Z0-9\-_.]*$/,

  // profile of ISO 8601 for date-and-time (Gregorian calendar, leap seconds allowed as '60', timezone checks)
  DATE_AND_TIME: /^[0-9]{4}-(1[0-2]|0[1-9])-(0[1-9]|[1-2][0-9]|3[0-1])T(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|[\+\-]((1[0-3]|0[0-9]):([0-5][0-9])|14:00))?$/,
  
  // Date with optional timezone offset
  DATE: /^[0-9]{4}-(1[0-2]|0[1-9])-(0[1-9]|[1-2][0-9]|3[0-1])(Z|[\+\-]((1[0-3]|0[0-9]):([0-5][0-9])|14:00))?$/,
  
  // Date without time zone offset
  DATE_NO_ZONE: /^[0-9]{4}-(1[0-2]|0[1-9])-(0[1-9]|[1-2][0-9]|3[0-1])$/,
  
  // Time with optional timezone offset
  TIME: /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|[\+\-]((1[0-3]|0[0-9]):([0-5][0-9])|14:00))?$/,
  
  // Time without timezone offset
  TIME_NO_ZONE: /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?$/,

  // Physical/Media Address (colon-separated hexadecimal octets)
  PHYS_ADDRESS: /^([0-9a-fA-F]{2}(:[0-9a-fA-F]{2})*)?$/,
  
  // MAC-address 48-bit (6 colon-separated hexadecimal octets)
  MAC_ADDRESS: /^[0-9a-fA-F]{2}(:[0-9a-fA-F]{2}){5}$/,

  // Hex-string
  HEX_STRING: /^([0-9a-fA-F]{2}(:[0-9a-fA-F]{2})*)?$/,

  // UUID (RFC 9562 format)
  UUID: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,

  // Dotted-quad (IPv4 style address string)
  DOTTED_QUAD: /^(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$/,

  // BCP 47 / RFC 5646 language tag
  LANGUAGE_TAG: /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/
};

const MAX_UINT32 = 4294967295n;
const MAX_UINT64 = 18446744073709551615n;
const MIN_INT32 = -2147483648n;
const MAX_INT32 = 2147483647n;

/**
 * Feature 6: Numeric Counters and Gauges
 */
export function validateCounter32(value: string, oldValue?: string, allowDiscontinuity: boolean = false): ValidationResult {
  try {
    const valStr = value.trim();
    if (!/^\d+$/.test(valStr)) {
      return { valid: false, error: "Counter must be a non-negative integer." };
    }
    const val = BigInt(valStr);
    if (val < 0n || val > MAX_UINT32) {
      return { valid: false, error: `Value out of bounds (0 to ${MAX_UINT32}).` };
    }
    
    if (oldValue !== undefined) {
      const oldVal = BigInt(oldValue);
      if (val < oldVal && !allowDiscontinuity) {
        return { 
          valid: false, 
          error: "Monotonicity violation: Counter value cannot decrease unless reset/discontinuity is signaled." 
        };
      }
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid numeric notation." };
  }
}

export function validateCounter64(value: string, oldValue?: string, allowDiscontinuity: boolean = false): ValidationResult {
  try {
    const valStr = value.trim();
    if (!/^\d+$/.test(valStr)) {
      return { valid: false, error: "Counter must be a non-negative integer." };
    }
    const val = BigInt(valStr);
    if (val < 0n || val > MAX_UINT64) {
      return { valid: false, error: `Value out of bounds (0 to ${MAX_UINT64}).` };
    }
    
    if (oldValue !== undefined) {
      const oldVal = BigInt(oldValue);
      if (val < oldVal && !allowDiscontinuity) {
        return { 
          valid: false, 
          error: "Monotonicity violation: Counter value cannot decrease unless reset/discontinuity is signaled." 
        };
      }
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid numeric notation." };
  }
}

export function validateGauge32(value: string): ValidationResult {
  try {
    const valStr = value.trim();
    if (!/^\d+$/.test(valStr)) {
      return { valid: false, error: "Gauge must be a non-negative integer." };
    }
    const val = BigInt(valStr);
    if (val < 0n || val > MAX_UINT32) {
      return { valid: false, error: `Value exceeds maximum limit for 32-bit gauge (${MAX_UINT32}).` };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid numerical format." };
  }
}

export function validateGauge64(value: string): ValidationResult {
  try {
    const valStr = value.trim();
    if (!/^\d+$/.test(valStr)) {
      return { valid: false, error: "Gauge must be a non-negative integer." };
    }
    const val = BigInt(valStr);
    if (val < 0n || val > MAX_UINT64) {
      return { valid: false, error: `Value exceeds maximum limit for 64-bit gauge (${MAX_UINT64}).` };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid numerical format." };
  }
}

/**
 * Feature 7: Identifiers and Object References
 */
export function validateObjectIdentifier(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, error: "Object Identifier cannot be empty." };
  }
  
  // Test regex format
  if (!PATTERNS.OBJECT_IDENTIFIER.test(trimmed)) {
    // Let's provide structured OID checks
    const parts = trimmed.split('.');
    if (parts.length > 0) {
      const firstArc = parseInt(parts[0], 10);
      if (isNaN(firstArc) || firstArc < 0 || firstArc > 2) {
        return { valid: false, error: "First arc must be 0, 1, or 2 (ASN.1 restrictions)." };
      }
      if (parts.length > 1) {
        const secondArc = parseInt(parts[1], 10);
        if (firstArc < 2 && (isNaN(secondArc) || secondArc < 0 || secondArc > 39)) {
          return { valid: false, error: "Second arc must be between 0 and 39 if the first arc is 0 or 1." };
        }
      }
    }
    return { valid: false, error: "Does not match OID hierarchical registration notation (e.g. 1.3.6.1)." };
  }

  // Also check part length boundaries (Feature 7)
  const parts = trimmed.split('.');
  if (parts.length > 128) {
    return { valid: false, error: "Object identifier exceeds limit of 128 sub-identifiers." };
  }

  return { valid: true };
}

export function validateYangIdentifier(value: string): ValidationResult {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "YANG identifier cannot be empty." };
  }
  if (!PATTERNS.YANG_IDENTIFIER.test(trimmed)) {
    if (trimmed.toLowerCase().startsWith("xml")) {
      return { valid: false, error: "YANG identifiers must not start with 'xml' or its variants." };
    }
    return { valid: false, error: "YANG identifiers must start with a letter/underscore and contain letters, digits, '-' or '.'." };
  }
  return { valid: true };
}

/**
 * Feature 8: Date and Time Types
 */
export function validateDateTimeAndOffset(value: string, isLeapSecondExpected: boolean = false): ValidationResult {
  const trimmed = value.trim();
  if (!PATTERNS.DATE_AND_TIME.test(trimmed)) {
    return { valid: false, error: "Timestamp must match Profile of ISO 8601 format (e.g., YYYY-MM-DDTHH:MM:SS.ssZ or with +/-offset)." };
  }

  // Extra parser validation
  try {
    // Check offsets bounds e.g. -14:00 to +14:00
    const offsetMatch = trimmed.match(/([\+\-])(\d{2}):(\d{2})$/);
    if (offsetMatch) {
      const sign = offsetMatch[1];
      const hours = parseInt(offsetMatch[2], 10);
      const mins = parseInt(offsetMatch[3], 10);
      
      const totalMinutes = hours * 60 + mins;
      if (totalMinutes > 14 * 60) {
        return { valid: false, error: "Timezone offset exceeds the bounds of RFC 9557 (-14:00 to +14:00)." };
      }
    }
    
    // Check if seconds = 60 is handled as a leap second
    const secMatch = trimmed.match(/T\d{2}:\d{2}:(\d{2})/);
    if (secMatch && secMatch[1] === '60') {
      if (!isLeapSecondExpected) {
        return { 
          valid: false, 
          error: "Leap seconds (second = 60) are only allowed on actual designated leap second schedules. Turn on Leap Second toggle to permit." 
        };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Faulty datetime layout structure." };
  }
}

export function validateDateType(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!PATTERNS.DATE.test(trimmed)) {
    return { valid: false, error: "Date must match format YYYY-MM-DD with optional timezone offset." };
  }
  return { valid: true };
}

export function validateDateNoZoneType(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!PATTERNS.DATE_NO_ZONE.test(trimmed)) {
    return { valid: false, error: "Date without timezone must match YYYY-MM-DD." };
  }
  return { valid: true };
}

export function validateTimeType(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!PATTERNS.TIME.test(trimmed)) {
    return { valid: false, error: "Time must match HH:MM:SS with optional timezone offset." };
  }
  return { valid: true };
}

export function validateTimeNoZoneType(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!PATTERNS.TIME_NO_ZONE.test(trimmed)) {
    return { valid: false, error: "Time without timezone must match HH:MM:SS." };
  }
  return { valid: true };
}

/**
 * Feature 9: Time Durations
 */
export function validateDuration32(value: string, unitLabel: string): ValidationResult {
  try {
    const valStr = value.trim();
    if (!/^-?\d+$/.test(valStr)) {
      return { valid: false, error: `${unitLabel} duration must be an integer.` };
    }
    const val = BigInt(valStr);
    if (val < MIN_INT32 || val > MAX_INT32) {
      return { valid: false, error: `Value out of signed 32-bit integer range (${MIN_INT32} to ${MAX_INT32}).` };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid duration representation." };
  }
}

export function validateDuration64(value: string, unitLabel: string): ValidationResult {
  try {
    const valStr = value.trim();
    if (!/^-?\d+$/.test(valStr)) {
      return { valid: false, error: `${unitLabel} duration must be an integer.` };
    }
    // BigInt can check 64-bit limits
    const val = BigInt(valStr);
    const minS64 = -9223372036854775808n;
    const maxS64 = 9223372036854775807n;
    if (val < minS64 || val > maxS64) {
      return { valid: false, error: "Value out of signed 64-bit integer range." };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid 64-bit duration notation." };
  }
}

export function validateTimeticks(value: string): ValidationResult {
  try {
    const valStr = value.trim();
    if (!/^\d+$/.test(valStr)) {
      return { valid: false, error: "Timeticks must be an unsigned integer." };
    }
    const val = BigInt(valStr);
    if (val < 0n || val > MAX_UINT32) {
      return { valid: false, error: `Timeticks exceeds overflow range (0 to ${MAX_UINT32} centiseconds).` };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid timeticks representation." };
  }
}

/**
 * Feature 10: General Address, Identity, and Language Tags
 */
export function validateMacAddress(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!PATTERNS.MAC_ADDRESS.test(trimmed)) {
    return { valid: false, error: "Must be a 48-bit IEEE 802 MAC address formatted as 6 colon-separated hex pairs (e.g., aa:bb:cc:dd:ee:ff)." };
  }
  return { 
    valid: true, 
    normalized: trimmed.toLowerCase() // Normalization to lowercase canonical representation
  };
}

export function validatePhysicalAddress(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!PATTERNS.PHYS_ADDRESS.test(trimmed)) {
    return { valid: false, error: "Must be media/physical address of colon-separated hexadecimal pairs." };
  }
  return {
    valid: true,
    normalized: trimmed.toLowerCase() // Normalization
  };
}

export function validateHexString(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!PATTERNS.HEX_STRING.test(trimmed)) {
    return { valid: false, error: "Must be colon-separated hexadecimal octets." };
  }
  return {
    valid: true,
    normalized: trimmed.toLowerCase() // Normalization
  };
}

export function validateUuid(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!PATTERNS.UUID.test(trimmed)) {
    return { valid: false, error: "Must match 36-character standard UUID layout (RFC 9562)." };
  }
  return {
    valid: true,
    normalized: trimmed.toLowerCase() // Canonical lowercase
  };
}

export function validateDottedQuad(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!PATTERNS.DOTTED_QUAD.test(trimmed)) {
    return { valid: false, error: "Dotted-quad notation must contain 4 octets from 0 to 255 separated by dots." };
  }
  return { valid: true };
}

export function validateLanguageTag(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!PATTERNS.LANGUAGE_TAG.test(trimmed)) {
    return { valid: false, error: "Language tag must be a well-formed BCP 47 structure (e.g. 'en', 'en-US', 'ja-JP')." };
  }
  return {
    valid: true,
    normalized: trimmed.toLowerCase() // Canonical representation is lowercase
  };
}

export function validateXPath(value: string): ValidationResult {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "XPath statement cannot be empty." };
  }
  // Basic syntactic validation for XPath 1.0 (checking brackets balancing, initial slash, patterns)
  const openBrackets = (trimmed.match(/\[/g) || []).length;
  const closeBrackets = (trimmed.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    return { valid: false, error: "Mismatched brackets standard in XPath statement selectors." };
  }
  
  const openParens = (trimmed.match(/\(/g) || []).length;
  const closeParens = (trimmed.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return { valid: false, error: "Mismatched parentheses in XPath function calls." };
  }

  // Ensure path characters are general subset of valid XPath patterns
  if (/[^\w\d\s\-\_\/\.\:\[\]\=\'\\"\(\)\*\@]/i.test(trimmed)) {
    return { valid: false, error: "Contains invalid characters for XPath 1.0 syntax." };
  }

  return { valid: true };
}
