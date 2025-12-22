/**
 * ERC/EIP to LP (Lux Proposal) Mapping Utilities
 * 
 * This module provides functions to look up correspondences between
 * Ethereum standards (ERC/EIP) and Lux Network equivalents (LP/LRC).
 */

// Type definitions
export interface ERCMapping {
  lp: string;
  lrc: string;
  title: string;
  path: string;
  status: string;
  extensions?: Array<{
    lp: string;
    title: string;
    path: string;
  }>;
}

export interface EIPMapping {
  lp: string;
  title: string;
  path: string;
  category: string;
  status: string;
}

export interface LPMapping {
  erc?: string;
  eip?: string;
  lrc?: string;
  type?: 'extension';
}

// ERC to LP mappings
const ercToLpData: Record<string, ERCMapping> = {
  'ERC-20': { lp: 'LP-3020', lrc: 'LRC-20', title: 'Fungible Token Standard', path: '/docs/lp-3020', status: 'Final' },
  'ERC-165': { lp: 'LP-3165', lrc: 'LRC-165', title: 'Interface Detection', path: '/docs/lp-3165', status: 'Final' },
  'ERC-173': { lp: 'LP-3173', lrc: 'LRC-173', title: 'Contract Ownership', path: '/docs/lp-3173', status: 'Final' },
  'ERC-721': { lp: 'LP-3721', lrc: 'LRC-721', title: 'Non-Fungible Token Standard', path: '/docs/lp-3721', status: 'Final' },
  'ERC-777': { lp: 'LP-3777', lrc: 'LRC-777', title: 'Advanced Token Standard', path: '/docs/lp-3777', status: 'Final' },
  'ERC-1155': { lp: 'LP-3155', lrc: 'LRC-1155', title: 'Multi-Token Standard', path: '/docs/lp-3155', status: 'Final' },
  'ERC-1271': { lp: 'LP-3271', lrc: 'LRC-1271', title: 'Signature Validation', path: '/docs/lp-3271', status: 'Final' },
  'ERC-1363': { lp: 'LP-3363', lrc: 'LRC-1363', title: 'Payable Token', path: '/docs/lp-3363', status: 'Final' },
  'ERC-1967': { lp: 'LP-3967', lrc: 'LRC-1967', title: 'Proxy Storage Slots', path: '/docs/lp-3967', status: 'Final' },
  'ERC-2612': { lp: 'LP-3612', lrc: 'LRC-2612', title: 'Permit Extension', path: '/docs/lp-3612', status: 'Final' },
  'ERC-2981': { lp: 'LP-3981', lrc: 'LRC-2981', title: 'NFT Royalties', path: '/docs/lp-3981', status: 'Final' },
  'ERC-3009': { lp: 'LP-3009', lrc: 'LRC-3009', title: 'Transfer With Authorization', path: '/docs/lp-3009', status: 'Final' },
  'ERC-3156': { lp: 'LP-3156', lrc: 'LRC-3156', title: 'Flash Loans', path: '/docs/lp-3156', status: 'Draft' },
  'ERC-3525': { lp: 'LP-3525', lrc: 'LRC-3525', title: 'Semi-Fungible Token', path: '/docs/lp-3525', status: 'Final' },
  'ERC-4337': { lp: 'LP-3337', lrc: 'LRC-4337', title: 'Account Abstraction', path: '/docs/lp-3337', status: 'Final' },
  'ERC-4626': { lp: 'LP-3626', lrc: 'LRC-4626', title: 'Tokenized Vault', path: '/docs/lp-3626', status: 'Final' },
  'ERC-4675': { lp: 'LP-3675', lrc: 'LRC-4675', title: 'Multi-Fractional NFT', path: '/docs/lp-3675', status: 'Final' },
  'ERC-5169': { lp: 'LP-3169', lrc: 'LRC-5169', title: 'Client Script URI', path: '/docs/lp-3169', status: 'Final' },
  'ERC-5192': { lp: 'LP-3192', lrc: 'LRC-5192', title: 'Soulbound Tokens', path: '/docs/lp-3192', status: 'Final' },
  'ERC-5528': { lp: 'LP-3528', lrc: 'LRC-5528', title: 'Refundable Token', path: '/docs/lp-3528', status: 'Final' },
  'ERC-6551': { lp: 'LP-3551', lrc: 'LRC-6551', title: 'Token Bound Accounts', path: '/docs/lp-3551', status: 'Final' },
  'ERC-6909': { lp: 'LP-3909', lrc: 'LRC-6909', title: 'Minimal Multi-Token', path: '/docs/lp-3909', status: 'Final' },
  'ERC-7201': { lp: 'LP-3201', lrc: 'LRC-7201', title: 'Namespaced Storage Layout', path: '/docs/lp-3201', status: 'Final' },
  'ERC-7572': { lp: 'LP-3572', lrc: 'LRC-7572', title: 'Contract-level Metadata', path: '/docs/lp-3572', status: 'Final' },
  'ERC-7579': { lp: 'LP-3579', lrc: 'LRC-7579', title: 'Modular Smart Accounts', path: '/docs/lp-3579', status: 'Final' },
};

// EIP to LP mappings
const eipToLpData: Record<string, EIPMapping> = {
  'EIP-2935': { lp: 'LP-3704', title: 'Historical Block Hashes', path: '/docs/lp-3704', category: 'Verkle/Stateless', status: 'Final' },
  'EIP-4762': { lp: 'LP-3703', title: 'Statelessness Gas Costs', path: '/docs/lp-3703', category: 'Verkle/Stateless', status: 'Final' },
  'EIP-6800': { lp: 'LP-3702', title: 'Verkle State Transition', path: '/docs/lp-3702', category: 'Verkle/Stateless', status: 'Final' },
  'EIP-7251': { lp: 'LP-3672', title: 'Maximum Effective Balance Increase', path: '/docs/lp-3672', category: 'Pectra Upgrade', status: 'Final' },
  'EIP-7623': { lp: 'LP-3673', title: 'Calldata Cost Increase', path: '/docs/lp-3673', category: 'Pectra Upgrade', status: 'Final' },
  'EIP-7685': { lp: 'LP-3671', title: 'Execution Layer Requests', path: '/docs/lp-3671', category: 'Pectra Upgrade', status: 'Final' },
  'EIP-7691': { lp: 'LP-3674', title: 'Blob Throughput Increase', path: '/docs/lp-3674', category: 'Pectra Upgrade', status: 'Final' },
  'EIP-7702': { lp: 'LP-3670', title: 'EOA Account Code', path: '/docs/lp-3670', category: 'Pectra Upgrade', status: 'Final' },
};

// LP to ERC/EIP reverse mapping
const lpToStandardData: Record<string, LPMapping> = {
  'LP-3009': { erc: 'ERC-3009', lrc: 'LRC-3009' },
  'LP-3020': { erc: 'ERC-20', lrc: 'LRC-20' },
  'LP-3021': { erc: 'ERC-20', lrc: 'LRC-20', type: 'extension' },
  'LP-3022': { erc: 'ERC-20', lrc: 'LRC-20', type: 'extension' },
  'LP-3023': { erc: 'ERC-20', lrc: 'LRC-20', type: 'extension' },
  'LP-3025': { erc: 'ERC-20', lrc: 'LRC-20', type: 'extension' },
  'LP-3155': { erc: 'ERC-1155', lrc: 'LRC-1155' },
  'LP-3156': { erc: 'ERC-3156', lrc: 'LRC-3156' },
  'LP-3157': { erc: 'ERC-1155', lrc: 'LRC-1155', type: 'extension' },
  'LP-3165': { erc: 'ERC-165', lrc: 'LRC-165' },
  'LP-3169': { erc: 'ERC-5169', lrc: 'LRC-5169' },
  'LP-3173': { erc: 'ERC-173', lrc: 'LRC-173' },
  'LP-3192': { erc: 'ERC-5192', lrc: 'LRC-5192' },
  'LP-3201': { erc: 'ERC-7201', lrc: 'LRC-7201' },
  'LP-3271': { erc: 'ERC-1271', lrc: 'LRC-1271' },
  'LP-3337': { erc: 'ERC-4337', lrc: 'LRC-4337' },
  'LP-3338': { erc: 'ERC-4337', lrc: 'LRC-4337', type: 'extension' },
  'LP-3363': { erc: 'ERC-1363', lrc: 'LRC-1363' },
  'LP-3525': { erc: 'ERC-3525', lrc: 'LRC-3525' },
  'LP-3528': { erc: 'ERC-5528', lrc: 'LRC-5528' },
  'LP-3551': { erc: 'ERC-6551', lrc: 'LRC-6551' },
  'LP-3572': { erc: 'ERC-7572', lrc: 'LRC-7572' },
  'LP-3579': { erc: 'ERC-7579', lrc: 'LRC-7579' },
  'LP-3612': { erc: 'ERC-2612', lrc: 'LRC-2612' },
  'LP-3626': { erc: 'ERC-4626', lrc: 'LRC-4626' },
  'LP-3627': { erc: 'ERC-4626', lrc: 'LRC-4626', type: 'extension' },
  'LP-3670': { eip: 'EIP-7702' },
  'LP-3671': { eip: 'EIP-7685' },
  'LP-3672': { eip: 'EIP-7251' },
  'LP-3673': { eip: 'EIP-7623' },
  'LP-3674': { eip: 'EIP-7691' },
  'LP-3675': { erc: 'ERC-4675', lrc: 'LRC-4675' },
  'LP-3702': { eip: 'EIP-6800' },
  'LP-3703': { eip: 'EIP-4762' },
  'LP-3704': { eip: 'EIP-2935' },
  'LP-3721': { erc: 'ERC-721', lrc: 'LRC-721' },
  'LP-3722': { erc: 'ERC-721', lrc: 'LRC-721', type: 'extension' },
  'LP-3723': { erc: 'ERC-721', lrc: 'LRC-721', type: 'extension' },
  'LP-3777': { erc: 'ERC-777', lrc: 'LRC-777' },
  'LP-3909': { erc: 'ERC-6909', lrc: 'LRC-6909' },
  'LP-3967': { erc: 'ERC-1967', lrc: 'LRC-1967' },
  'LP-3981': { erc: 'ERC-2981', lrc: 'LRC-2981' },
};

// Quick number to LP lookup
const quickLookupData: Record<string, string> = {
  '20': 'LP-3020', '165': 'LP-3165', '173': 'LP-3173', '721': 'LP-3721',
  '777': 'LP-3777', '1155': 'LP-3155', '1271': 'LP-3271', '1363': 'LP-3363',
  '1967': 'LP-3967', '2612': 'LP-3612', '2935': 'LP-3704', '2981': 'LP-3981',
  '3009': 'LP-3009', '3156': 'LP-3156', '3525': 'LP-3525', '4337': 'LP-3337',
  '4626': 'LP-3626', '4675': 'LP-3675', '4762': 'LP-3703', '5169': 'LP-3169',
  '5192': 'LP-3192', '5528': 'LP-3528', '6551': 'LP-3551', '6800': 'LP-3702',
  '6909': 'LP-3909', '7201': 'LP-3201', '7251': 'LP-3672', '7572': 'LP-3572',
  '7579': 'LP-3579', '7623': 'LP-3673', '7685': 'LP-3671', '7691': 'LP-3674',
  '7702': 'LP-3670',
};

/**
 * Look up LP information from an ERC number
 */
export function ercToLP(erc: string | number): ERCMapping | undefined {
  const normalized = normalizeStandard(erc, 'ERC');
  return ercToLpData[normalized];
}

/**
 * Look up LP information from an EIP number
 */
export function eipToLP(eip: string | number): EIPMapping | undefined {
  const normalized = normalizeStandard(eip, 'EIP');
  return eipToLpData[normalized];
}

/**
 * Look up ERC/EIP from an LP number
 */
export function lpToStandard(lp: string | number): LPMapping | undefined {
  const normalized = normalizeLP(lp);
  return lpToStandardData[normalized];
}

/**
 * Quick lookup from any standard number to LP
 */
export function quickLookup(num: string | number): string | undefined {
  return quickLookupData[String(num)];
}

/**
 * Get all ERC mappings
 */
export function getAllERCMappings(): Record<string, ERCMapping> {
  return { ...ercToLpData };
}

/**
 * Get all EIP mappings
 */
export function getAllEIPMappings(): Record<string, EIPMapping> {
  return { ...eipToLpData };
}

/**
 * Search for standards containing a keyword
 */
export function searchStandards(keyword: string): Array<{
  standard: string;
  lp: string;
  title: string;
  path: string;
}> {
  const results: Array<{ standard: string; lp: string; title: string; path: string }> = [];
  const lowerKeyword = keyword.toLowerCase();
  
  for (const [erc, data] of Object.entries(ercToLpData)) {
    if (erc.toLowerCase().includes(lowerKeyword) ||
        data.title.toLowerCase().includes(lowerKeyword) ||
        data.lrc.toLowerCase().includes(lowerKeyword)) {
      results.push({ standard: erc, lp: data.lp, title: data.title, path: data.path });
    }
  }
  
  for (const [eip, data] of Object.entries(eipToLpData)) {
    if (eip.toLowerCase().includes(lowerKeyword) ||
        data.title.toLowerCase().includes(lowerKeyword)) {
      results.push({ standard: eip, lp: data.lp, title: data.title, path: data.path });
    }
  }
  
  return results;
}

// Helper functions
function normalizeStandard(input: string | number, prefix: 'ERC' | 'EIP'): string {
  const str = String(input);
  if (str.toUpperCase().startsWith(prefix)) {
    return str.toUpperCase().replace(/^(ERC|EIP)-?/, `${prefix}-`);
  }
  return `${prefix}-${str}`;
}

function normalizeLP(input: string | number): string {
  const str = String(input);
  if (str.toUpperCase().startsWith('LP')) {
    return str.toUpperCase().replace(/^LP-?/, 'LP-');
  }
  return `LP-${str}`;
}

export default {
  ercToLP,
  eipToLP,
  lpToStandard,
  quickLookup,
  getAllERCMappings,
  getAllEIPMappings,
  searchStandards,
};
