/**
 * Multi-Site Configuration
 *
 * This file defines all site-specific settings for the ACC Issue Display application.
 * Each site has its own ACC project, databases, static assets, and building hierarchy.
 */

const sites = {
  TTX: {
    id: 'TTX',
    name: 'Temple, TX',
    fullName: 'Temple Data Center',

    // ACC Project Configuration
    accProjectId: 'b38e25ea-eca5-4a70-9f0b-85eeb399056f',
    accAssignedToId: '277458593',

    // Database Paths (relative to backend/data/)
    databases: {
      issues: 'TTX/issues.db',
      assets: 'TTX/assets.db',
      commissioning: 'TTX/commissioning.db'
    },

    // Static Asset Paths (relative to backend/data/)
    staticAssets: {
      excelFile: 'TTX/Asset List_Rev10.xlsx',
      contacts: 'TTX/contacts.json',
      scheduleImage: 'TTX/schedules/schedule.jpg',
      schedulePdf: 'TTX/schedules/6-week.pdf',
      buildingsDir: 'TTX/buildings/'
    },

    // Buildings Hierarchy
    buildings: [
      {
        id: 'ttx1',
        name: 'TTX1',
        description: 'Primary Data Hall',
        rooms: [
          {
            id: 'dha',
            name: 'DHA',
            fullName: 'Data Hall A',
            images: {
              default: 'TTX1_DHA.jpg'
            },
            markers: [
              {
                id: 'zone-1a1',
                x: 0.25,
                y: 0.35,
                zone: '1A1',
                label: 'Zone 1A1',
                alwaysShow: false
              },
              {
                id: 'zone-1a2',
                x: 0.75,
                y: 0.35,
                zone: '1A2',
                label: 'Zone 1A2',
                alwaysShow: false
              }
            ]
          },
          {
            id: 'dhb',
            name: 'DHB',
            fullName: 'Data Hall B',
            images: {
              default: 'TTX1_DHB.jpg'
            }
          },
          {
            id: 'dhc',
            name: 'DHC',
            fullName: 'Data Hall C',
            images: {
              default: 'TTX1_DHC.jpg'
            }
          },
          {
            id: 'dhd',
            name: 'DHD',
            fullName: 'Data Hall D',
            images: {
              default: 'TTX1_DHD.jpg'
            }
          },
          {
            id: 'ns1',
            name: 'NS1',
            fullName: 'Network Space 1',
            images: {
              default: 'TTX1_NS1.jpg'
            }
          },
          {
            id: 'ns2',
            name: 'NS2',
            fullName: 'Network Space 2',
            images: {
              default: 'TTX1_NS2.jpg'
            }
          }
        ]
      },
      {
        id: 'ttx2',
        name: 'TTX2',
        description: 'Secondary Data Hall',
        rooms: [
          {
            id: 'dha',
            name: 'DHA',
            fullName: 'Data Hall A',
            images: {
              default: 'TTX2_DHA.jpg'
            }
          },
          {
            id: 'dhb',
            name: 'DHB',
            fullName: 'Data Hall B',
            images: {
              default: 'TTX2_DHB.jpg'
            }
          },
          {
            id: 'dhc',
            name: 'DHC',
            fullName: 'Data Hall C',
            images: {
              default: 'TTX2_DHC.jpg'
            }
          },
          {
            id: 'dhd',
            name: 'DHD',
            fullName: 'Data Hall D',
            images: {
              default: 'TTX2_DHD.jpg'
            }
          },
          {
            id: 'ns1',
            name: 'NS1',
            fullName: 'Network Space 1',
            images: {
              default: 'TTX2_NS1.jpg'
            }
          },
          {
            id: 'ns2',
            name: 'NS2',
            fullName: 'Network Space 2',
            images: {
              default: 'TTX2_NS2.jpg'
            }
          }
        ]
      },
      {
        id: 'ttx3',
        name: 'TTX3',
        description: 'Tertiary Data Hall',
        rooms: [] // TODO: Add rooms when available
      }
    ]
  },

  TXE: {
    id: 'TXE',
    name: 'El Paso, TX',
    fullName: 'El Paso Data Center',

    // ACC Project Configuration
    accProjectId: 'fe0c7a6d-1115-42d7-897e-206f80b63edb',
    accAssignedToId: null, // TODO: Add when issues are assigned to Prime Controls

    // Database Paths (relative to backend/data/)
    databases: {
      issues: 'TXE/issues.db',
      assets: 'TXE/assets.db',
      commissioning: 'TXE/commissioning.db'
    },

    // Static Asset Paths (relative to backend/data/)
    staticAssets: {
      excelFile: 'TXE/Asset_List_Placeholder.xlsx', // TODO: Upload real Excel file
      contacts: 'TXE/contacts.json',
      scheduleImage: 'TXE/schedules/schedule.jpg',
      schedulePdf: 'TXE/schedules/6-week.pdf',
      buildingsDir: 'TXE/buildings/'
    },

    // Buildings Hierarchy
    buildings: [
      {
        id: 'txe1',
        name: 'TXE1',
        description: 'Primary Data Hall',
        rooms: [] // TODO: Define room structure and upload images
      },
      {
        id: 'txe2',
        name: 'TXE2',
        description: 'Secondary Data Hall',
        rooms: [] // TODO: Define room structure and upload images
      },
      {
        id: 'txe10',
        name: 'TXE10',
        description: 'Support Building',
        rooms: [] // TODO: Define room structure and upload images
      }
    ]
  }
};

/**
 * Get configuration for a specific site
 * @param {string} siteId - Site identifier (TTX, TXE, etc.)
 * @returns {Object} Site configuration object
 * @throws {Error} If site ID is invalid
 */
export function getSiteConfig(siteId) {
  if (!siteId) {
    throw new Error('Site ID is required');
  }

  const upperSiteId = siteId.toUpperCase();
  const siteConfig = sites[upperSiteId];

  if (!siteConfig) {
    throw new Error(`Invalid site ID: ${siteId}. Available sites: ${Object.keys(sites).join(', ')}`);
  }

  return siteConfig;
}

/**
 * Validate if a site ID exists
 * @param {string} siteId - Site identifier to validate
 * @returns {boolean} True if site exists
 */
export function isValidSite(siteId) {
  if (!siteId) return false;
  return sites.hasOwnProperty(siteId.toUpperCase());
}

/**
 * Get list of all available site IDs
 * @returns {Array<string>} Array of site IDs
 */
export function getAllSiteIds() {
  return Object.keys(sites);
}

/**
 * Get list of all sites with basic info (for API responses)
 * @returns {Array<Object>} Array of site objects with id, name, and fullName
 */
export function getAllSites() {
  return Object.values(sites).map(site => ({
    id: site.id,
    name: site.name,
    fullName: site.fullName
  }));
}

/**
 * Get building configuration for a site
 * @param {string} siteId - Site identifier
 * @param {string} buildingId - Building identifier
 * @returns {Object|null} Building configuration or null if not found
 */
export function getBuildingConfig(siteId, buildingId) {
  const siteConfig = getSiteConfig(siteId);
  return siteConfig.buildings.find(b => b.id === buildingId) || null;
}

/**
 * Get room configuration for a building
 * @param {string} siteId - Site identifier
 * @param {string} buildingId - Building identifier
 * @param {string} roomId - Room identifier
 * @returns {Object|null} Room configuration or null if not found
 */
export function getRoomConfig(siteId, buildingId, roomId) {
  const building = getBuildingConfig(siteId, buildingId);
  if (!building) return null;
  return building.rooms.find(r => r.id === roomId) || null;
}

export default sites;
