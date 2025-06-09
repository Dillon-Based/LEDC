# LEDC

This repository contains a small Airtable automation script. The script checks a record in the **Individual Gives** table and, when a condition is met, creates records in **Benefits Owed**. Each benefit listed on the give record (looked up from the related Campaign) is inserted as its own record and linked back to the original give via the **Gives** field.

## Running tests

A simple test suite is provided to exercise the automation logic with mocked Airtable tables. Run it with Node:

```bash
node airtable.test.js
```

The automation expects the ID of the triggering **Individual Gives** record. The
script looks for an input variable named `giveId`, but it will also accept
`recordId` or `giveid` for convenience.
