// Security level entity mappings and policy builders (loaded from config)
const config = require('./config/policy.json');

const ENTITY_CATALOG = Array.isArray(config.entityCatalog) ? config.entityCatalog.slice() : [];

const SECURITY_LEVELS = (() => {
  const levels = Object.assign({}, config.securityLevels || {});
  // Expand special value for strict level to include all catalog entities
  if (levels.strict === '__ALL__') {
    levels.strict = ENTITY_CATALOG.slice();
  }
  return levels;
})();

function buildPolicyFromLevel(level) {
  const key = (level || '').toLowerCase();
  const entities = SECURITY_LEVELS[key] || SECURITY_LEVELS.basic;
  return { entities: entities.slice() };
}

function buildPolicyFromExpert(selectedEntities) {
  const set = new Set((selectedEntities || []).filter(Boolean));
  return { entities: Array.from(set) };
}

module.exports = {
  ENTITY_CATALOG,
  SECURITY_LEVELS,
  buildPolicyFromLevel,
  buildPolicyFromExpert
};


