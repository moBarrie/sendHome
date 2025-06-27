// Sierra Leone mobile network utilities
export const SIERRA_LEONE_NETWORKS = {
  // Working prefixes (tested with Monime m17 provider)
  AFRICELL_76: { prefix: "76", network: "Africell", working: true },
  AIRTEL_78: { prefix: "78", network: "Airtel", working: true },
  AIRTEL_79: { prefix: "79", network: "Airtel", working: true },

  // Additional prefixes to test/support
  AFRICELL_77: { prefix: "77", network: "Africell", working: false },
  AFRICELL_88: { prefix: "88", network: "Africell", working: false },
  ORANGE_30: { prefix: "30", network: "Orange", working: false },
  ORANGE_33: { prefix: "33", network: "Orange", working: false },
  ORANGE_34: { prefix: "34", network: "Orange", working: false },
  AIRTEL_70: { prefix: "70", network: "Airtel", working: false },
  QCELL_25: { prefix: "25", network: "QCell", working: false },
  QCELL_95: { prefix: "95", network: "QCell", working: false },
  QCELL_99: { prefix: "99", network: "QCell", working: false },
};

export const WORKING_PREFIXES = Object.values(SIERRA_LEONE_NETWORKS)
  .filter((network) => network.working)
  .map((network) => network.prefix);

export const ALL_PREFIXES = Object.values(SIERRA_LEONE_NETWORKS).map(
  (network) => network.prefix
);

export function validateSierraLeonePhone(phone) {
  // Remove all non-digits
  const cleanPhone = phone.replace(/\D/g, "");

  // Handle different formats
  let localNumber;
  if (cleanPhone.startsWith("232")) {
    // International format: 23276123456
    localNumber = cleanPhone.substring(3);
  } else if (cleanPhone.startsWith("0")) {
    // Local format with leading 0: 076123456
    localNumber = cleanPhone.substring(1);
  } else if (cleanPhone.length === 8) {
    // Local format: 76123456
    localNumber = cleanPhone;
  } else {
    return { valid: false, error: "Invalid phone number format" };
  }

  // Check if it's 8 digits
  if (localNumber.length !== 8) {
    return { valid: false, error: "Phone number must be 8 digits" };
  }

  // Get prefix (first 2 digits)
  const prefix = localNumber.substring(0, 2);

  // Find network info
  const networkInfo = Object.values(SIERRA_LEONE_NETWORKS).find(
    (network) => network.prefix === prefix
  );

  if (!networkInfo) {
    return {
      valid: false,
      error: `Unknown network prefix: ${prefix}`,
      prefix,
      localNumber,
    };
  }

  return {
    valid: true,
    prefix,
    network: networkInfo.network,
    working: networkInfo.working,
    localNumber,
    internationalFormat: `+232${localNumber}`,
    localFormat: localNumber,
    providerCode: "m17", // Universal provider for Sierra Leone
    warning: networkInfo.working
      ? null
      : `${networkInfo.network} (${prefix}) may not be supported yet`,
  };
}

export function formatPhoneForMonime(phone) {
  const validation = validateSierraLeonePhone(phone);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Return the format that works best with Monime
  return validation.localFormat;
}
