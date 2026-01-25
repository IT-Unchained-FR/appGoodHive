# Airtable MCP Server

A custom Model Context Protocol (MCP) server for interacting with Airtable bases.

## Features

This MCP server provides the following tools:

- **list_tables** - List all tables in the Airtable base
- **get_table_schema** - Get the schema (fields) of a specific table
- **list_records** - List records from a table with filtering, sorting, and pagination
- **get_record** - Get a specific record by ID
- **create_record** - Create a new record in a table
- **update_record** - Update an existing record
- **delete_record** - Delete a record from a table
- **create_records_batch** - Create multiple records in a single batch operation
- **update_records_batch** - Update multiple records in a single batch operation

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment variables in `.env.local` (recommended):
```bash
AIRTABLE_API_KEY=your_api_key
AIRTABLE_BASE_ID=your_base_id
```

The launcher at `.mcp/bin/airtable-mcp-custom` will load these automatically.

3. Make the script executable:
```bash
chmod +x .mcp/bin/airtable-mcp-custom
```

## Usage Examples

### List Records
Query records from a table with filters:
```json
{
  "tool": "list_records",
  "arguments": {
    "tableName": "Jobs",
    "filterByFormula": "{Status} = 'Active'",
    "maxRecords": 10,
    "sort": [{"field": "Created", "direction": "desc"}]
  }
}
```

### Create Record
Create a new record:
```json
{
  "tool": "create_record",
  "arguments": {
    "tableName": "Jobs",
    "fields": {
      "Title": "Software Engineer",
      "Company": "GoodHive",
      "Status": "Active"
    }
  }
}
```

### Update Record
Update an existing record:
```json
{
  "tool": "update_record",
  "arguments": {
    "tableName": "Jobs",
    "recordId": "recXXXXXXXXXXXXXX",
    "fields": {
      "Status": "Closed"
    }
  }
}
```

### Batch Operations
Create multiple records at once:
```json
{
  "tool": "create_records_batch",
  "arguments": {
    "tableName": "Jobs",
    "records": [
      {"fields": {"Title": "Job 1", "Status": "Active"}},
      {"fields": {"Title": "Job 2", "Status": "Active"}}
    ]
  }
}
```

## Notes

- The Airtable API has rate limits. Batch operations are automatically split into chunks of 10 records.
- Only SELECT queries are allowed in the `execute_sql` tool for security.
- Field types in `get_table_schema` are inferred from the first record and may not be 100% accurate.

## Troubleshooting

If you encounter issues:

1. Verify your `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` are correct
2. Check that the table names match exactly (case-sensitive)
3. Ensure your API key has the necessary permissions for the base
4. Check the MCP server logs for detailed error messages
