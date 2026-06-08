/**
 * RFC 6021 / RFC 6991 Common Internet Address YANG Data Types Validation and Normalization
 * Implementing Feature 30, Feature 31, and Feature 32.
 */

export interface ValidationResult {
  isValid: boolean;
  message: string;         // Explanation of validation success or failure
  canonical?: string;      // Canonical form according to RFC 6021 normalization rules
  version?: 'ipv4' | 'ipv6' | 'none'; // Version indicator for IP address and prefixes
}

// Helper to check if a string is a valid IPv4 address (dotted-quad format)
export function validateIPv4AddressString(val: string): { isValid: boolean; hasZone: boolean; sanitized: string } {
  // Pattern supporting dotted-quad and optional zone identifier %
  // Quad segment is 0-255.
  const parts = val.split('%');
  const ipPart = parts[0];
  const hasZone = parts.length > 1;
  const zone = parts.slice(1).join('%');

  const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ipPart.match(ipRegex);

  if (!match) {
    return { isValid: false, hasZone, sanitized: val };
  }

  for (let i = 1; i <= 4; i++) {
    const octet = parseInt(match[i], 10);
    if (octet < 0 || octet > 255 || match[i] !== octet.toString()) {
      // Avoid leading zeros unless it's just '0'
      if (match[i].length > 1 && match[i].startsWith('0')) {
        return { isValid: false, hasZone, sanitized: val };
      }
      if (octet < 0 || octet > 255) {
        return { isValid: false, hasZone, sanitized: val };
      }
    }
  }

  const canonicalIp = ipPart.split('.').map(o => parseInt(o, 10).toString()).join('.');
  const sanitized = hasZone ? `${canonicalIp}%${zone}` : canonicalIp;

  return { isValid: true, hasZone, sanitized };
}

// Helper to check if a string is a valid IPv6 address
export function validateIPv6AddressString(val: string): { isValid: boolean; hasZone: boolean; sanitized: string; canonical: string } {
  const parts = val.split('%');
  const rawIp = parts[0].trim();
  const hasZone = parts.length > 1;
  const zone = parts.slice(1).join('%').trim();

  // Pattern checks for basic characters
  if (!/^[0-9a-fA-F:.]+$/.test(rawIp)) {
    return { isValid: false, hasZone, sanitized: val, canonical: val };
  }

  // Count double colons inside
  const doubleColonCount = (rawIp.match(/::/g) || []).length;
  if (doubleColonCount > 1) {
    return { isValid: false, hasZone, sanitized: val, canonical: val };
  }

  // Cannot start or end with a single colon
  if ((rawIp.startsWith(':') && !rawIp.startsWith('::')) || (rawIp.endsWith(':') && !rawIp.endsWith('::'))) {
    return { isValid: false, hasZone, sanitized: val, canonical: val };
  }

  // Split segments
  const ipv4EmbeddedMatch = rawIp.match(/:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  let ipv4Part = '';
  let ipv6Main = rawIp;

  if (ipv4EmbeddedMatch) {
    ipv4Part = ipv4EmbeddedMatch[1];
    ipv6Main = rawIp.substring(0, rawIp.length - ipv4Part.length - 1);
    // Validate embedded IPv4
    const v4Res = validateIPv4AddressString(ipv4Part);
    if (!v4Res.isValid) {
      return { isValid: false, hasZone, sanitized: val, canonical: val };
    }
  }

  const segments = ipv6Main.split(':').filter(s => s !== '');
  
  // Check length of individual segments
  for (const seg of segments) {
    if (seg.length > 4) {
      return { isValid: false, hasZone, sanitized: val, canonical: val };
    }
  }

  // Ensure total count is valid
  const expectedSegments = ipv4Part ? 6 : 8;
  const actualSegmentsCount = segments.length;

  if (doubleColonCount === 0) {
    if (actualSegmentsCount !== expectedSegments) {
      return { isValid: false, hasZone, sanitized: val, canonical: val };
    }
  } else {
    if (actualSegmentsCount >= expectedSegments) {
      return { isValid: false, hasZone, sanitized: val, canonical: val };
    }
  }

  // Now, expand the address to full form to standardize it
  let fullSegments: string[] = [];
  if (doubleColonCount === 1) {
    const splitParts = ipv6Main.split('::');
    const leftSegs = splitParts[0].split(':').filter(s => s !== '');
    const rightSegs = splitParts[1].split(':').filter(s => s !== '');
    const missingCount = expectedSegments - (leftSegs.length + rightSegs.length);
    
    fullSegments = [
      ...leftSegs,
      ...Array(missingCount).fill('0'),
      ...rightSegs
    ];
  } else {
    fullSegments = [...segments];
  }

  // Normalize each segment to integer representation (removes leading zeroes)
  const normSegments = fullSegments.map(s => parseInt(s, 16).toString(16).toLowerCase());

  // Convert embedded IPv4 into hexadecimal form if required for canonicalization,
  // or preserve it standard. Standard canonical form for mixed IPv6 maps to standard lowercase segments.
  let canonicalIp = '';
  if (ipv4Part) {
    // Standard mixed form represents IPv4 part as decimal
    const decodedV4 = ipv4Part.split('.').map(o => parseInt(o, 10).toString()).join('.');
    canonicalIp = compressIPv6Segments(normSegments) + ':' + decodedV4;
  } else {
    canonicalIp = compressIPv6Segments(normSegments);
  }

  const canonicalWithZone = hasZone ? `${canonicalIp}%${zone.toLowerCase()}` : canonicalIp;
  return { isValid: true, hasZone, sanitized: canonicalWithZone, canonical: canonicalWithZone };
}

// Standard IPv6 RFC 5952 Compression algorithm
function compressIPv6Segments(segments: string[]): string {
  let longestRunStart = -1;
  let longestRunLength = 0;
  let currentRunStart = -1;
  let currentRunLength = 0;

  for (let i = 0; i < segments.length; i++) {
    if (segments[i] === '0') {
      if (currentRunLength === 0) {
        currentRunStart = i;
      }
      currentRunLength++;
    } else {
      if (currentRunLength > 0) {
        if (currentRunLength > longestRunLength) {
          longestRunLength = currentRunLength;
          longestRunStart = currentRunStart;
        }
        currentRunLength = 0;
      }
    }
  }
  if (currentRunLength > longestRunLength) {
    longestRunLength = currentRunLength;
    longestRunStart = currentRunStart;
  }

  // A run of size 1 should NOT be compressed to '::'
  if (longestRunLength <= 1) {
    return segments.join(':');
  }

  const left = segments.slice(0, longestRunStart).join(':');
  const right = segments.slice(longestRunStart + longestRunLength).join(':');
  return `${left}::${right}`;
}

/**
 * Validates the ip-address type (RFC 6021).
 * Can be IPv4 or IPv6, allows Zone identifiers.
 */
export function validateIpAddress(val: string): ValidationResult {
  const v = val.trim();
  if (!v) return { isValid: false, message: 'Value is empty.' };

  // Attempt IPv4
  const ipv4Res = validateIPv4AddressString(v);
  if (ipv4Res.isValid) {
    return {
      isValid: true,
      message: `Valid IPv4 address${ipv4Res.hasZone ? ' with interface zone' : ''}.`,
      canonical: ipv4Res.sanitized,
      version: 'ipv4'
    };
  }

  // Attempt IPv6
  const ipv6Res = validateIPv6AddressString(v);
  if (ipv6Res.isValid) {
    return {
      isValid: true,
      message: `Valid IPv6 address${ipv6Res.hasZone ? ' with scope/zone' : ''}.`,
      canonical: ipv6Res.canonical,
      version: 'ipv6'
    };
  }

  return {
    isValid: false,
    message: 'Value matches neither IPv4 (dotted-quad) nor IPv6 hex syntax patterns.',
    version: 'none'
  };
}

/**
 * Validates the ip-address-no-zone type (RFC 6021).
 * Can be IPv4 or IPv6, does NOT allow Zone identifiers.
 */
export function validateIpAddressNoZone(val: string): ValidationResult {
  const v = val.trim();
  if (v.includes('%')) {
    return {
      isValid: false,
      message: 'Zone identifiers (%) are not permitted inside the -no-zone variant.',
      version: 'none'
    };
  }
  return validateIpAddress(v);
}

/**
 * Validates the ipv4-address type.
 */
export function validateIpv4Address(val: string): ValidationResult {
  const v = val.trim();
  const res = validateIPv4AddressString(v);
  if (res.isValid) {
    return {
      isValid: true,
      message: `Valid IPv4 address${res.hasZone ? ' (Zones allowed under ietf-inet)' : ''}.`,
      canonical: res.sanitized,
      version: 'ipv4'
    };
  }
  return {
    isValid: false,
    message: 'Value is not a valid IPv4 dotted-quad address.',
    version: 'none'
  };
}

/**
 * Validates the ipv4-address-no-zone type.
 */
export function validateIpv4AddressNoZone(val: string): ValidationResult {
  const v = val.trim();
  if (v.includes('%')) {
    return {
      isValid: false,
      message: 'Zone indicators (%) are prohibited in ipv4-address-no-zone.',
      version: 'ipv4'
    };
  }
  return validateIpv4Address(v);
}

/**
 * Validates the ipv6-address type.
 */
export function validateIpv6Address(val: string): ValidationResult {
  const v = val.trim();
  const res = validateIPv6AddressString(v);
  if (res.isValid) {
    return {
      isValid: true,
      message: `Valid IPv6 address${res.hasZone ? ' with scope identifier' : ''}.`,
      canonical: res.canonical,
      version: 'ipv6'
    };
  }
  return {
    isValid: false,
    message: 'Value is not a valid IPv6 protocol address.',
    version: 'none'
  };
}

/**
 * Validates the ipv6-address-no-zone type.
 */
export function validateIpv6AddressNoZone(val: string): ValidationResult {
  const v = val.trim();
  if (v.includes('%')) {
    return {
      isValid: false,
      message: 'Zone indicators (%) are prohibited in ipv6-address-no-zone.',
      version: 'ipv6'
    };
  }
  return validateIpv6Address(v);
}

/**
 * Validates the ip-prefix type.
 */
export function validateIpPrefix(val: string): ValidationResult {
  const v = val.trim();
  const parts = v.split('/');
  if (parts.length !== 2) {
    return {
      isValid: false,
      message: 'Prefix missing subnet mask duration delimiter slash (/). Expected IP/PrefixLength.',
      version: 'none'
    };
  }

  const [ipStr, lenStr] = parts;
  const isV4 = ipStr.includes('.');
  const prefixLength = parseInt(lenStr, 10);

  if (isNaN(prefixLength) || lenStr !== prefixLength.toString()) {
    return {
      isValid: false,
      message: 'Prefix length must be a valid base-10 integer.',
      version: 'none'
    };
  }

  if (isV4) {
    const v4Res = validateIPv4AddressString(ipStr);
    if (!v4Res.isValid) {
      return { isValid: false, message: 'Prefix contains invalid base IPv4 address.', version: 'ipv4' };
    }
    if (prefixLength < 0 || prefixLength > 32) {
      return {
        isValid: false,
        message: 'IPv4 prefix length exceeds 32 bits (Range: 0..32).',
        version: 'ipv4'
      };
    }
    return {
      isValid: true,
      message: 'Valid IPv4 prefix format.',
      canonical: `${v4Res.sanitized}/${prefixLength}`,
      version: 'ipv4'
    };
  } else {
    const v6Res = validateIPv6AddressString(ipStr);
    if (!v6Res.isValid) {
      return { isValid: false, message: 'Prefix contains invalid base IPv6 address.', version: 'ipv6' };
    }
    if (prefixLength < 0 || prefixLength > 128) {
      return {
        isValid: false,
        message: 'IPv6 prefix length exceeds 128 bits (Range: 0..128).',
        version: 'ipv6'
      };
    }
    return {
      isValid: true,
      message: 'Valid IPv6 prefix format.',
      canonical: `${v6Res.canonical}/${prefixLength}`,
      version: 'ipv6'
    };
  }
}

/**
 * Validates the ipv4-prefix type.
 */
export function validateIpv4Prefix(val: string): ValidationResult {
  const res = validateIpPrefix(val);
  if (res.isValid && res.version !== 'ipv4') {
    return {
      isValid: false,
      message: 'Expected IPv4 prefix, but received IPv6 prefix format instead.',
      version: 'none'
    };
  }
  return res;
}

/**
 * Validates the ipv6-prefix type.
 */
export function validateIpv6Prefix(val: string): ValidationResult {
  const res = validateIpPrefix(val);
  if (res.isValid && res.version !== 'ipv6') {
    return {
      isValid: false,
      message: 'Expected IPv6 prefix, but received IPv4 prefix format instead.',
      version: 'none'
    };
  }
  return res;
}

/**
 * Validates the domain-name type (RFC 6021, length 1..253).
 */
export function validateDomainName(val: string): ValidationResult {
  const v = val.trim();
  if (v.length === 0 || v.length > 253) {
    return {
      isValid: false,
      message: `Domain name length (${v.length}) is out of bounds. Must be 1 to 253 US-ASCII characters.`
    };
  }

  // Cannot contain non-US-ASCII or forbidden symbols
  if (!/^[a-zA-Z0-9.\-_]+$/.test(v)) {
    return {
      isValid: false,
      message: 'Domain name contains invalid symbols. Only letters, digits, hyphen (-), underscore (_) and dots (.) are allowed.'
    };
  }

  // Label limits under RFC 1035 / RFC 1123
  const sublabels = v.split('.');
  for (const label of sublabels) {
    if (label.length === 0) {
      return { isValid: false, message: 'Domain label names cannot be empty (multiple sequential dots).' };
    }
    if (label.length > 63) {
      return {
        isValid: false,
        message: `Label "${label}" is too long (${label.length} chars). Individual label size limit is 63 characters.`
      };
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return {
        isValid: false,
        message: `Label "${label}" cannot start or end with a hyphen.`
      };
    }
  }

  // Canonicalize to standard lowercase domain format
  const canonical = v.toLowerCase();
  return {
    isValid: true,
    message: 'Valid domain name format compliant with RFC 1123.',
    canonical
  };
}

/**
 * Validates the host type (Union of domain-name and ip-address).
 */
export function validateHost(val: string): ValidationResult {
  const v = val.trim();

  // Try parsing as IP address
  const ipRes = validateIpAddress(v);
  if (ipRes.isValid) {
    return {
      isValid: true,
      message: `Valid host (IP Address: ${ipRes.version?.toUpperCase()}).`,
      canonical: ipRes.canonical,
      version: ipRes.version
    };
  }

  // Try parsing as domain name
  const domRes = validateDomainName(v);
  if (domRes.isValid) {
    return {
      isValid: true,
      message: 'Valid host (Domain Name).',
      canonical: domRes.canonical,
      version: 'none'
    };
  }

  return {
    isValid: false,
    message: 'Host must be either a valid IPv4/IPv6 address or a compliant FQDN DNS name.'
  };
}

/**
 * Validates URIs according to RFC 3986 and STD 66, doing canonical normalization.
 */
export function validateUri(val: string): ValidationResult {
  const v = val.trim();
  if (v.length === 0) {
    return { isValid: false, message: 'URI value is empty.' };
  }

  // Basic check for RFC 3986 allowed characters
  // A URI permits schemes, hostports, paths, query, fragments and percent encoded bytes.
  if (!/^[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/.test(v)) {
    return {
      isValid: false,
      message: 'URI contains invalid characters. Must correspond to RFC 3986 characters.'
    };
  }

  // Verify that percent encoding is well-formed
  const rawPercentMatches = v.match(/%[0-9a-fA-F]{0,2}/g) || [];
  for (const item of rawPercentMatches) {
    if (!/^%[0-9a-fA-F]{2}$/.test(item)) {
      return {
        isValid: false,
        message: `Malformed percent-encoding token "${item}" found. Expected % followed by 2 hex digits.`
      };
    }
  }

  try {
    // Attempt standard normalization (RFC 3986)
    // 1. Lowercase scheme and host
    // 2. Decode percent-encoded unreserved characters: A-Za-z0-9_.-~
    // Let's implement this manually to handle non-standard schemas securely in general.
    let normalized = v;

    // Isolate scheme if present
    const schemeMatch = v.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
    if (schemeMatch) {
      const scheme = schemeMatch[1].toLowerCase();
      const rest = v.substring(schemeMatch[0].length);
      normalized = scheme + ':' + rest;
    } else {
      // Relative URI is allowed but let's notify the user
    }

    // Replace percent encodings of unreserved chars
    normalized = normalized.replace(/%([0-9a-fA-F]{2})/g, (match, hex) => {
      const CodeDec = parseInt(hex, 16);
      const char = String.fromCharCode(CodeDec);
      // Unreserved characters: A-Z (65-90), a-z (97-122), 0-9 (48-57), hyphen 45, period 46, underscore 95, tilde 126
      if (
        (CodeDec >= 65 && CodeDec <= 90) ||
        (CodeDec >= 97 && CodeDec <= 122) ||
        (CodeDec >= 48 && CodeDec <= 57) ||
        CodeDec === 45 || CodeDec === 46 || CodeDec === 95 || CodeDec === 126
      ) {
        return char;
      }
      // Otherwise keep percent-encoded but normalize hex digits to uppercase
      return '%' + hex.toUpperCase();
    });

    // If host-port structure is present (starts with // after scheme)
    const hostRegex = /^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)([^/?#]+)/;
    const hostMatch = normalized.match(hostRegex);
    if (hostMatch) {
      const protocolAndSlashes = hostMatch[1];
      const hostPort = hostMatch[2].toLowerCase(); // scheme and host in lowercase
      const remainingPathAndQuery = normalized.substring(hostMatch[0].length);
      normalized = protocolAndSlashes + hostPort + remainingPathAndQuery;
    }

    return {
      isValid: true,
      message: 'Valid URI syntax.',
      canonical: normalized
    };
  } catch (err: any) {
    return {
      isValid: false,
      message: `URI parsing exception: ${err.message}`
    };
  }
}

/**
 * Validates the dscp type (0..63).
 */
export function validateDscp(val: string): ValidationResult {
  const cleanVal = val.trim();
  const num = parseInt(cleanVal, 10);
  if (isNaN(num) || cleanVal !== num.toString()) {
    return { isValid: false, message: 'DSCP must be an integer.' };
  }
  if (num < 0 || num > 63) {
    return {
      isValid: false,
      message: `DSCP marking '${num}' is out of bounds. Permitted range is 0 to 63.`
    };
  }
  return {
    isValid: true,
    message: 'Valid DiffServ Code Point.',
    canonical: num.toString()
  };
}

/**
 * Validates the ipv6-flow-label type (0..1048575).
 */
export function validateIpv6FlowLabel(val: string): ValidationResult {
  const cleanVal = val.trim();
  const num = parseInt(cleanVal, 10);
  if (isNaN(num) || cleanVal !== num.toString()) {
    return { isValid: false, message: 'IPv6 Flow Label must be an integer.' };
  }
  if (num < 0 || num > 1048575) {
    return {
      isValid: false,
      message: `Flow label '${num}' is out of bounds. Standard 20-bit field range is 0 to 1048575.`
    };
  }
  return {
    isValid: true,
    message: 'Valid IPv6 flow-label.',
    canonical: num.toString()
  };
}

/**
 * Validates the port-number type (0..65535).
 */
export function validatePortNumber(val: string): ValidationResult {
  const cleanVal = val.trim();
  const num = parseInt(cleanVal, 10);
  if (isNaN(num) || cleanVal !== num.toString()) {
    return { isValid: false, message: 'Port number must be a valid base-10 integer.' };
  }
  if (num < 0 || num > 65535) {
    return {
      isValid: false,
      message: `Port '${num}' is out of bounds. Standard 16-bit uint range is 0 to 65535.`
    };
  }
  return {
    isValid: true,
    message: 'Valid TCP/UDP port number.',
    canonical: num.toString()
  };
}

/**
 * Validates the as-number type (uint32).
 */
export function validateAsNumber(val: string): ValidationResult {
  const cleanVal = val.trim();
  const num = parseInt(cleanVal, 10);
  if (isNaN(num) || cleanVal !== num.toString()) {
    return { isValid: false, message: 'AS-Number must be a valid integer.' };
  }
  if (num < 0 || num > 4294967295) {
    return {
      isValid: false,
      message: `AS number '${num}' is out of bounds. Unsigned 32-bit range is 0 to 4294967295.`
    };
  }
  return {
    isValid: true,
    message: 'Valid BGP Autonomous System Identifier.',
    canonical: num.toString()
  };
}

/**
 * Validates the ip-version enumeration type.
 */
export function validateIpVersion(val: string): ValidationResult {
  const cleanVal = val.trim().toLowerCase();
  if (cleanVal === 'unknown' || cleanVal === '0') {
    return { isValid: true, message: 'IP Version Unknown.', canonical: 'unknown' };
  }
  if (cleanVal === 'ipv4' || cleanVal === '1') {
    return { isValid: true, message: 'IPv4 protocol representation selected.', canonical: 'ipv4' };
  }
  if (cleanVal === 'ipv6' || cleanVal === '2') {
    return { isValid: true, message: 'IPv6 protocol representation selected.', canonical: 'ipv6' };
  }
  return {
    isValid: false,
    message: 'Invalid IP Version enum selection. Allowed values: unknown (0), ipv4 (1), ipv6 (2).'
  };
}
