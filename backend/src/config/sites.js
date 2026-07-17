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

    // No issue filtering for TTX
    accAssignedToId: null,
    accAssignedToType: null,
    accIncludeAssignedToMembers: false,
    clearIssuesBeforeSync: true,

    primeControlsAssignedToIds: [],

    // Database Paths (relative to backend/data/)
    databases: {
      issues: 'TTX/issues.db',
      assets: 'TTX/assets.db',
      commissioning: 'TTX/commissioning.db'
    },

    // Static Asset Paths
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
        rooms: []
      }
    ]
  },

  TXE: {
    id: 'TXE',
    name: 'El Paso, Texas',
    fullName: 'El Paso Data Center',

    // ACC Project Configuration
    accProjectId: 'fe0c7a6d-1115-42d7-897e-206f80b63edb',
    accProjects: [
      {
        id: 'fe0c7a6d-1115-42d7-897e-206f80b63edb',
        key: 'hensel-phelps',
        name: 'TXE - Hensel Phelps (NB.TypeF2.0)'
      },
      {
        id: 'a0482399-f629-4aeb-9245-4da64cc2ac1c',
        key: 'je-dunn',
        name: 'TXE - JE Dunn (NB.TypeF2.0)'
      }
    ],

    // ACC Assets category from this ACC URL:
    // https://acc.autodesk.com/build/assets/projects/fe0c7a6d-1115-42d7-897e-206f80b63edb/assets?categoryId=10
    accAssetCategoryId: '10',
    accAssetCategoryName: 'Controls',

    // Do not use ACC company filter. It returned 0 from the public Issues API.
    accAssignedToId: null,
    accAssignedToType: null,
    accIncludeAssignedToMembers: false,

    // Clear old local issues before saving the latest Prime Controls filtered issue list.
    clearIssuesBeforeSync: true,

    // Prime Controls assigned-to IDs discovered from ACC Prime Controls filtered issues.
    primeControlsAssignedToIds: [
      // TXE Prime Controls company ID (for issues assigned directly to the company).
      '595923917',
      // Current TXE Prime Controls member IDs.
      '35C2BJAJKUECSQGN',
      'DJ52TVFQRUYFNK43'
    ],

    // Database Paths (relative to backend/data/)
    databases: {
      issues: 'TXE/issues.db',
      assets: 'TXE/assets.db',
      commissioning: 'TXE/commissioning.db'
    },

    // Static Asset Paths
    staticAssets: {
      excelFile: 'C:\\Users\\Prime\\OneDrive - Prime Controls\\Meta TXE - 2566006 - Meta TXE Phase 1 HP\\Documentation\\Asset List\\TXE_Asset List_Rev10_TXE.xlsx',
      contacts: 'TXE/contacts.json',
      scheduleImage: 'TXE/schedules/schedule.jpg',
      schedulePdf: 'TXE/schedules/6-week.pdf',
      buildingsDir: 'TXE/buildings/'
    },

    // Buildings / Bluebeam / Drawings Areas
    buildings: [
      {
        id: 'txe1',
        name: 'TXE1',
        description: 'Primary Data Hall',
        bluebeamUrl: 'https://app.bluebeam.com/sessions/200-116-966/editor',
        rooms: []
      },
      {
        id: 'txe2',
        name: 'TXE2',
        description: 'Secondary Data Hall',
        bluebeamUrl: 'https://app.bluebeam.com/sessions/647-792-551/editor',
        rooms: []
      },
      {
        id: 'txe3',
        name: 'TXE3',
        description: 'Data Hall',
        bluebeamUrl: 'https://app.bluebeam.com/sessions/767-176-208/editor',
        rooms: []
      },
      {
        id: 'txe5',
        name: 'TXE5',
        description: 'Data Hall',
        bluebeamUrl: 'https://app.bluebeam.com/sessions/190-437-699/editor',
        rooms: []
      },
      {
        id: 'txe6',
        name: 'TXE6',
        description: 'Data Hall',
        bluebeamUrl: 'https://app.bluebeam.com/sessions/319-599-320/editor',
        rooms: []
      },
      {
        id: 'txe7',
        name: 'TXE7',
        description: 'Data Hall',
        bluebeamUrl: 'https://app.bluebeam.com/sessions/300-225-768/editor',
        rooms: []
      },
      {
        id: 'txe10',
        name: 'TXE10',
        description: 'Network Building',
        bluebeamUrl: 'https://app.bluebeam.com/sessions/492-134-271/editor',
        rooms: []
      },
      {
        id: 'ibos',
        name: 'TXE-IBOS',
        description: 'Warehouse',
        bluebeamUrl: 'https://app.bluebeam.com/sessions/711-043-879/editor',
        rooms: []
      },
      {
        id: 'admin',
        name: 'TXE-ADMIN',
        description: 'ADMIN Building',
        bluebeamUrl: 'https://app.bluebeam.com/sessions/555-957-540/editor',
        rooms: []
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
