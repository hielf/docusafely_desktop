const {
  ENTITY_CATALOG,
  SECURITY_LEVELS,
  buildPolicyFromLevel,
  buildPolicyFromExpert
} = require('../../src/policy');

describe('Security Levels and Expert Policy Mapping', () => {
  test('Basic level includes expected entities', () => {
    const policy = buildPolicyFromLevel('basic');
    expect(policy.entities.sort()).toEqual(['person_name', 'address', 'phone', 'email'].sort());
  });

  test('Balanced level extends Basic with financial and IDs', () => {
    const policy = buildPolicyFromLevel('balanced');
    const expected = ['person_name', 'address', 'phone', 'email', 'ssn', 'credit_card', 'bank_account', 'drivers_license'];
    expect(policy.entities.sort()).toEqual(expected.sort());
  });

  test('Strict level contains all catalog entities', () => {
    const policy = buildPolicyFromLevel('strict');
    expect(new Set(policy.entities)).toEqual(new Set(ENTITY_CATALOG));
  });

  test('Unknown level falls back to Basic', () => {
    const policy = buildPolicyFromLevel('unknown');
    expect(policy.entities.sort()).toEqual(SECURITY_LEVELS.basic.slice().sort());
  });

  test('Expert builder deduplicates entities', () => {
    const policy = buildPolicyFromExpert(['email', 'phone', 'email']);
    expect(policy.entities.sort()).toEqual(['email', 'phone']);
  });

  test('Expert builder handles empty selections', () => {
    const policy = buildPolicyFromExpert([]);
    expect(policy.entities).toEqual([]);
  });
});


