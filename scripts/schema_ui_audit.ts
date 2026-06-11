import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Define allowed properties from types.ts
const ALLOWED_LINK_PROPERTIES = new Set([
  'uuid', 'linkId', 'sourceNodeUuid', 'sourcePortUuid', 'targetNodeUuid', 'targetPortUuid',
  'layer', 'capacity', 'usage', 'inventoryMappingAttributes', 'teMetrics', 'protection',
  'source', 'destination', 'supportingLinks', 'otnLink', 'fgotnList', 'fgtsRange',
  'otnNrpProfile',
  '_isRFC8345', '_networkId' // UI enrichments in DetailView.tsx
]);

const ALLOWED_NODE_PROPERTIES = new Set([
  'uuid', 'nodeId', 'name', 'type', 'layer', 'location', 'ietfSystem', 'ietfGeoLocation',
  'ietfInterfaces', 'ietfAccessControlList', 'hardware', 'services', 'alias', 'description',
  'productRev', 'mfgName', 'productName', 'softwareRev', 'inventoryMappingAttributes',
  'facilityLocation', 'chassis', 'modules', 'gridConfig', 'otnNode',
  'supportingNodes', 'terminationPoints', 'activeNeRef',
  'supportingLinks', 'otnLink', 'fgotnList', 'fgtsRange'
]);

function getFiles(dir: string): string[] {
  let results: string[] = [];
  const list = readdirSync(dir);
  list.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = getFiles('./src').filter(f => !f.includes('types.ts') && !f.includes('mock-'));
let hasErrors = false;

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  
  // Find link property accesses like: ietfLink.xxx or currentLink.xxx or logicalLink.xxx
  const linkMatches = content.matchAll(/(?:ietfLink|currentLink|physLink|logicalLink)\.(\w+)/g);
  for (const match of linkMatches) {
    const prop = match[1];
    if (!ALLOWED_LINK_PROPERTIES.has(prop)) {
      console.error(`Error: Invalid link property access "${prop}" found in ${file}`);
      hasErrors = true;
    }
  }

  // Find node property accesses like: sourceNode.xxx or targetNode.xxx or oppNode.xxx or matchedLogical.xxx
  const nodeMatches = content.matchAll(/(?:sourceNode|targetNode|oppNode|leftSatNode|rightSatNode|matchedLogical|resolvedLogicalNode)\.(\w+)/g);
  for (const match of nodeMatches) {
    const prop = match[1];
    if (!ALLOWED_NODE_PROPERTIES.has(prop)) {
      console.error(`Error: Invalid node property access "${prop}" found in ${file}`);
      hasErrors = true;
    }
  }
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log('Schema-to-UI Audit completed successfully. All link and node property accesses are valid!');
  process.exit(0);
}
