# How to Use Your Airtable MCP Server

## ✅ Setup Complete!

Your custom Airtable MCP server is now installed and ready to use.

## 🔄 Restart Cursor

**Important:** You need to restart Cursor for the MCP server to be loaded:

1. Quit Cursor completely (Cmd+Q on Mac, or close the application)
2. Reopen Cursor
3. The MCP server will automatically start when Cursor loads

## 🧪 Testing the MCP Server

Once Cursor is restarted, you can test the MCP server by asking me to:

1. **List records from a table:**
   - "List all records from the [TableName] table"
   - "Show me the first 10 records from [TableName]"

2. **Get table schema:**
   - "What fields are in the [TableName] table?"
   - "Show me the schema for [TableName]"

3. **Query with filters:**
   - "Find records in [TableName] where [Field] equals [Value]"
   - "List active records from [TableName]"

4. **Create records:**
   - "Create a new record in [TableName] with [field data]"

5. **Update records:**
   - "Update record [ID] in [TableName] to set [field] to [value]"

## 📋 Available Tools

Your MCP server provides these tools:

- `list_tables` - List all tables (note: Airtable API limitation)
- `get_table_schema` - Get field schema for a table
- `list_records` - Query records with filters, sorting, pagination
- `get_record` - Get a specific record by ID
- `create_record` - Create a new record
- `update_record` - Update an existing record
- `delete_record` - Delete a record
- `create_records_batch` - Create multiple records at once
- `update_records_batch` - Update multiple records at once

## 🔍 Verify It's Working

After restarting Cursor, you can verify the MCP is loaded by:

1. Opening the MCP panel in Cursor (if available)
2. Asking me to use an Airtable tool
3. Checking for any error messages in Cursor's console

## 🐛 Troubleshooting

If the MCP server doesn't work:

1. **Check environment variables:**
   - Verify `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` in `.env.local`
   - Make sure they're correct and have proper permissions

2. **Check the script:**
   - The script at `.mcp/bin/airtable-mcp-custom` should be executable
   - Run: `chmod +x .mcp/bin/airtable-mcp-custom` if needed

3. **Check dependencies:**
   - Make sure `pnpm install` completed successfully
   - Verify `@modelcontextprotocol/sdk` and `airtable` are in `node_modules`

4. **Check logs:**
   - Look for error messages in Cursor's developer console
   - The MCP server logs to stderr (you might see errors in the console)

## 📝 Example Usage

Once restarted, try asking:

- "What tables do I have in my Airtable base?"
- "Show me the schema for my Jobs table"
- "List the first 5 records from my Jobs table"
- "Create a new job record with title 'Software Engineer' and status 'Active'"

The MCP server will handle all the Airtable API interactions for you!
