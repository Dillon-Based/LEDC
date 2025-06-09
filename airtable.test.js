const assert = require('assert');
const { createBenefitOwed } = require('./airtable');

async function testCreatesRecord() {
    const createdRecords = [];
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
                                if (field === 'Campaign Benefits') {
                                    return [{ id: 'ben1' }, { id: 'ben2' }];
                                }
                                return undefined;
                            }
                        };
                    }
                };
            } else if (name === 'Benefits Owed') {
                return {
                    async createRecordAsync(fields) {
                        createdRecords.push(fields);
                    }
                };
            }
        }
    };

    await createBenefitOwed({ giveId: 'rec123', base, log: () => {} });
    assert.deepStrictEqual(createdRecords, [
        { 'Gives': [{ id: 'rec123' }], 'Campaign Benefit': [{ id: 'ben1' }] },
        { 'Gives': [{ id: 'rec123' }], 'Campaign Benefit': [{ id: 'ben2' }] }
    ]);
}

async function testSkipsWhenConditionFalse() {
    const createdRecords = [];
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
                        createdRecords.push(fields);
                    }
                };
            }
        }
    };

    await createBenefitOwed({ giveId: 'rec456', base, log: msg => logs.push(msg) });
    assert.deepStrictEqual(createdRecords, []);
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
