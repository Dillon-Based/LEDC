// This script is meant to be run from an Airtable automation.
// Given a record ID from the "Individual Gives" table, it checks
// whether the record meets a condition and, if so, creates a new
// record in the "Benefits Owed" table linking back to the original
// record via the "Gives" field.

async function createBenefitOwed({ giveId, base, log = console.log }) {
    if (typeof giveId !== 'string' || !giveId) {
        throw new Error("Invalid or missing 'giveId'. Check your automation setup.");
    }

    const givesTable = base.getTable('Individual Gives');
    const benefitsOwedTable = base.getTable('Benefits Owed');

    // Fetch the record that triggered the automation
    const giveRecord = await givesTable.selectRecordAsync(giveId);
    if (!giveRecord) {
        throw new Error(`Could not find a record in 'Individual Gives' with ID ${giveId}`);
    }

    // Example condition: a checkbox field named "Create Benefit Owed" is checked
    const shouldCreate = giveRecord.getCellValue('Create Benefit Owed');
    if (!shouldCreate) {
        log('Condition not met. No Benefits Owed record created.');
        return;
    }

    // Lookup benefits from the Campaign table via a field on the give record
    const campaignBenefits =
        giveRecord.getCellValue('Campaign Benefits') || [];
    const benefits = Array.isArray(campaignBenefits)
        ? campaignBenefits
        : [campaignBenefits];

    for (const benefit of benefits.filter(Boolean)) {
        const benefitId =
            typeof benefit === 'object' && benefit !== null
                ? benefit.id
                : benefit;
        const fields = { 'Gives': [{ id: giveRecord.id }] };
        if (benefitId) {
            fields['Campaign Benefit'] = [{ id: benefitId }];
        }
        await benefitsOwedTable.createRecordAsync(fields);
    }

    log('Benefits Owed records created successfully.');
}

// Export for tests when running in Node
if (typeof module !== 'undefined') {
    module.exports = { createBenefitOwed };
}

if (typeof input !== 'undefined' && typeof base !== 'undefined') {
    const cfg = input.config();
    const giveId = cfg.giveId || cfg.recordId || cfg.giveid;
    createBenefitOwed({ giveId, base }).catch(error => { throw error; });
}
