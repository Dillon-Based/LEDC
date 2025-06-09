// This script is meant to be run from an Airtable automation.
// Given a record ID from the "Individual Gives" table, it checks
// whether the record meets a condition and, if so, creates a new
// record in the "Benefits Owed" table linking back to the original
// record via the "Gives" field.

let { giveId } = input.config();

if (typeof giveId !== 'string' || !giveId) {
    throw new Error("Invalid or missing 'giveId'. Check your automation setup.");
}

const givesTable = base.getTable('Individual Gives');
const benefitsOwedTable = base.getTable('Benefits Owed');

(async () => {
    // Fetch the record that triggered the automation
    const giveRecord = await givesTable.selectRecordAsync(giveId);
    if (!giveRecord) {
        throw new Error(`Could not find a record in 'Individual Gives' with ID ${giveId}`);
    }

    // Example condition: a checkbox field named "Create Benefit Owed" is checked
    const shouldCreate = giveRecord.getCellValue('Create Benefit Owed');
    if (!shouldCreate) {
        console.log('Condition not met. No Benefits Owed record created.');
        return;
    }

    // Create the Benefits Owed record and link it back to the triggering give
    await benefitsOwedTable.createRecordAsync({
        'Gives': [{ id: giveRecord.id }]
    });

    console.log('Benefits Owed record created successfully.');
})();
