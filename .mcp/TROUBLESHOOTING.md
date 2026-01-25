# Airtable MCP Troubleshooting

## Current Issue: Authorization Error

You're getting "You are not authorized to perform this operation" which means:

### Possible Causes:

1. **API Key Permissions**
   - Your API key might not have the right scopes
   - Check that it has read/write access to the base

2. **Base Access**
   - The API key might not have access to base `app8JaoSpgzzKFYRN`
   - Verify the base ID is correct

3. **API Key Format**
   - Personal Access Tokens (PAT) should start with `pat...`
   - API keys should start with `key...`
   - Make sure you're using the right type

## How to Fix:

### Step 1: Verify Your API Key

1. Go to https://airtable.com/api
2. Select your base: `app8JaoSpgzzKFYRN`
3. Check the API documentation for your base
4. Verify your API key has access

### Step 2: Create/Update API Key

1. Go to https://airtable.com/account
2. Click on "Developer Hub" or "API"
3. Create a new Personal Access Token (PAT)
4. Make sure it has:
   - Access to the correct base
   - Read and Write permissions
   - The right scopes

### Step 3: Update `.env.local`

Add or update the Airtable variables in `.env.local`:

```bash
AIRTABLE_API_KEY=your_new_api_key_here
AIRTABLE_BASE_ID=app8JaoSpgzzKFYRN
```

The MCP launcher will load these values automatically.

### Step 4: Test the Connection

Run the test script:

```bash
node .mcp/test-airtable.js [TableName]
```

Replace `[TableName]` with an actual table name from your base.

## Alternative: Use Airtable Web Interface

1. Go to https://airtable.com
2. Open your base
3. Check the table names in the left sidebar
4. Note down the exact table names (case-sensitive!)

## Once You Have Table Names

You can test with:

```bash
# Test with a specific table
node .mcp/test-airtable.js "YourTableName"
```

## After Fixing Authorization

1. Restart Cursor
2. The MCP server should connect automatically
3. Ask me to query your Airtable base
