import { MOCK_DEVICES, MOCK_LINKS, MOCK_SERVICES, MOCK_SLICES } from './mock-data';
import { NetworkService } from '../services/networkService';

export interface ResolvedResource {
  id: string;
  type: 'device' | 'link' | 'service' | 'slice' | 'port' | 'hardware' | 'channel' | 'acl';
}

/**
 * Rapid prefix filter to eliminate 99.9% of text nodes from doing database searches on mouseover/click.
 */
export function isProbablyManagedObject(text: string | null | undefined): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return false;
  return resolveManagedObject(trimmed) !== null;
}

/**
 * Resolves any arbitrary text string (ID or Name) to a managed object.
 */
export function resolveManagedObject(text: string): ResolvedResource | null {
  if (!text || typeof text !== 'string') return null;
  
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > 80) return null; // Ignore long descriptions or empty strings
  
  // --- DEVICE MATCHING ---
  // 1. Direct active device ID matches
  const activeDev = MOCK_DEVICES.find(d => d.id === trimmed);
  if (activeDev) {
    return { id: activeDev.id, type: 'device' };
  }

  // 2. Direct active device Name matches
  const activeDevByName = MOCK_DEVICES.find(d => d.name === trimmed);
  if (activeDevByName) {
    return { id: activeDevByName.id, type: 'device' };
  }

  // 3. Passive device ID/Name matches
  try {
    const passiveService = NetworkService.getInstance();
    const passiveDevices = passiveService.getPassiveDevices();
    const passiveMatchById = passiveDevices.find(d => d.id === trimmed);
    if (passiveMatchById) {
      return { id: passiveMatchById.id, type: 'device' };
    }
    const passiveMatchByName = passiveDevices.find(d => d.name === trimmed);
    if (passiveMatchByName) {
      return { id: passiveMatchByName.id, type: 'device' };
    }
  } catch (err) {
    // Gracefully fallback if service is uninitialized during static phase
  }

  // 4. Pattern matches for device IDs
  if (/^node-[a-zA-Z0-9_-]+$/i.test(trimmed)) {
    return { id: trimmed, type: 'device' };
  }
  if (/^odf-[0-9a-zA-Z_-]+$/i.test(trimmed)) {
    return { id: trimmed, type: 'device' };
  }

  // --- LINK MATCHING ---
  // 1. Direct active link ID matching
  const activeLink = MOCK_LINKS.find(l => l.id === trimmed);
  if (activeLink) {
    return { id: activeLink.id, type: 'link' };
  }

  // 2. Passive line/cable list matches
  try {
    const passiveService = NetworkService.getInstance();
    const passiveCables = passiveService.getPassiveCables();
    const passiveCableMatch = passiveCables.find(c => c.id === trimmed || c.name === trimmed);
    if (passiveCableMatch) {
      return { id: passiveCableMatch.id, type: 'link' };
    }
  } catch (err) {
    // Gracefully handle
  }

  // 3. Patterns for links/cables
  if (/^link-[a-zA-Z0-9_-]+/i.test(trimmed) || /^cable-[a-zA-Z0-9_-]+/i.test(trimmed)) {
    return { id: trimmed, type: 'link' };
  }
  if (/^[ql]{1,2}\d+$/i.test(trimmed)) { // matches l1, ql1, l2, ql2
    return { id: trimmed, type: 'link' };
  }

  // --- SERVICE / SLICE MATCHING ---
  // 1. Service list matches
  const svc = MOCK_SERVICES.find(s => s.id === trimmed || s.name === trimmed);
  if (svc) {
    return { id: svc.id, type: 'service' };
  }
  if (/^svc-[0-9a-zA-Z_-]+/i.test(trimmed)) {
    return { id: trimmed, type: 'service' };
  }

  // 2. Slice list matches
  const slc = MOCK_SLICES.find(s => s.id === trimmed || s.name === trimmed);
  if (slc) {
    return { id: slc.id, type: 'slice' };
  }
  if (/^slice-[0-9a-zA-Z_-]+/i.test(trimmed)) {
    return { id: trimmed, type: 'slice' };
  }

  // --- PORT MATCHING ---
  // If text contains a slash (like R1-Core/eth0, node-TK1/port-1, d1/eth0)
  if (trimmed.includes('/') && trimmed.split('/').length === 2) {
    const [devPart, portPart] = trimmed.split('/');
    const resolvedDev = resolveManagedObject(devPart);
    if (resolvedDev && resolvedDev.type === 'device') {
      return { id: trimmed, type: 'port' }; // Route fully as `port` sub-resource
    }
  }
  if (/^port-[a-zA-Z0-9_-]+/i.test(trimmed)) {
    return { id: trimmed, type: 'port' };
  }

  // --- HARDWARE MATCHING ---
  if (/^(ch|mod|slot|hw|sub)-[a-zA-Z0-9_-]+/i.test(trimmed)) {
    return { id: trimmed, type: 'hardware' };
  }

  // --- ACL & CHANNELS ---
  if (/^acl-[a-zA-Z0-9_-]+/i.test(trimmed)) {
    return { id: trimmed, type: 'acl' };
  }
  if (/^channel-[a-zA-Z0-9_-]+/i.test(trimmed)) {
    return { id: trimmed, type: 'channel' };
  }

  return null;
}
