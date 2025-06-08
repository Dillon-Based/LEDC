// Pull input variable from automation
let { giveId } = input.config();

// Validate input
if (typeof giveId !== 'string' || !giveId) {
    throw new Error("No valid 'giveId' passed to script. Check the automation input.");
}

console.log(`Processing Individual Give ID: ${giveId}`);

// Reference tables
const givesTable = base.getTable('Individual Gives');
const tiersTable = base.getTable('Tiers');
const benefitsOwedTable = base.getTable('Benefits Owed');

(async () => {
    try {
        // Fetch the Individual Give record
        const giveRecord = await givesTable.selectRecordAsync(giveId);
        if (!giveRecord) {
            throw new Error(`Could not find Individual Give with ID ${giveId}`);
        }

        // Handle Tier field (single linked or array)
        const tierCell = giveRecord.getCellValue('Tier');
        if (!tierCell) {
            throw new Error('No Tier linked to this Individual Give.');
        }
        const tierId = Array.isArray(tierCell) ? tierCell[0]?.id : tierCell.id;
        if (!tierId) {
            throw new Error('Invalid Tier reference.');
        }
        console.log(`Found Tier ID: ${tierId}`);

        // Fetch Tier record
        const tierRecord = await tiersTable.selectRecordAsync(tierId);
        if (!tierRecord) {
            throw new Error(`Could not find Tier record with ID ${tierId}`);
        }

        // Get linked benefits
        const benefits = tierRecord.getCellValue('Benefits');
        if (!Array.isArray(benefits) || benefits.length === 0) {
            throw new Error('No Benefits linked to this Tier.');
        }
        console.log(`Found ${benefits.length} benefits to assign.`);

        // Determine the give date
        const giveDate = giveRecord.getCellValue('Date');
        if (!giveDate) {
            throw new Error('No Date found on Individual Give. Cannot assign expiration.');
        }

        // Calculate expiration date (12 months after giveDate)
        const expirationDate = new Date(giveDate);
        expirationDate.setMonth(expirationDate.getMonth() + 12);
        const expirationIso = expirationDate.toISOString().split('T')[0];

        // Prepare records to create
        const recordsToCreate = benefits.map(benefit => ({
            fields: {
                'Benefit': [{ id: benefit.id }],
                'Gives': [{ id: giveRecord.id }],
                'Start Date': giveDate,
                'Expiration Date': expirationIso
            }
        }));

        // Create records in batches of up to 50
        while (recordsToCreate.length > 0) {
            await benefitsOwedTable.createRecordsAsync(recordsToCreate.splice(0, 50));
        }

        console.log('All Benefits Owed records created successfully.');
    } catch (error) {
        console.error(error);
        throw error;
    }
})();
