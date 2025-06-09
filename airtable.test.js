const assert = require('assert');
const { createBenefitOwed } = require('./airtable');

async function testCreatesRecord() {
    let created = null;
    const base = {
        getTable(name) {
            if (name === 'Individual Gives') {
                return {
                    async selectRecordAsync(id) {
                        return {
                            id,
                            getCellValue(field) {
                                if (field === 'Create Benefit Owed') {
                                    return true;
                                }
                                return undefined;
                            }
                        };
                    }
                };
            } else if (name === 'Benefits Owed') {
                return {
                    async createRecordAsync(fields) {
                        created = fields;
                    }
                };
            }
        }
    };

    await createBenefitOwed({ giveId: 'rec123', base, log: () => {} });
    assert.deepStrictEqual(created, { 'Gives': [{ id: 'rec123' }] });
}

async function testSkipsWhenConditionFalse() {
    let created = null;
    const logs = [];
    const base = {
        getTable(name) {
            if (name === 'Individual Gives') {
                return {
                    async selectRecordAsync(id) {
                        return {
                            id,
                            getCellValue(field) {
                                if (field === 'Create Benefit Owed') {
                                    return false;
                                }
                                return undefined;
                            }
                        };
                    }
                };
            } else if (name === 'Benefits Owed') {
                return {
                    async createRecordAsync(fields) {
                        created = fields;
                    }
                };
            }
        }
    };

    await createBenefitOwed({ giveId: 'rec456', base, log: msg => logs.push(msg) });
    assert.strictEqual(created, null);
    assert.ok(logs.includes('Condition not met. No Benefits Owed record created.'));
}

async function run() {
    await testCreatesRecord();
    await testSkipsWhenConditionFalse();
    console.log('All tests passed.');
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
