# How to Connect to Your Airtable MCP Server

## 🚀 Quick Start

### Step 1: Verify Setup
Everything is already configured! Your `.mcp.json` file has:
- ✅ Command path: `.mcp/bin/airtable-mcp-custom`
- ✅ Base ID: `AIRTABLE_BASE_ID`
- ✅ The launcher can load `AIRTABLE_API_KEY` from `.env.local`
- ✅ Executable script is ready

### Step 2: Restart Cursor
**This is the most important step!**

1. **Quit Cursor completely:**
   - Mac: Press `Cmd + Q` or go to `Cursor > Quit Cursor`
   - Windows/Linux: Close all Cursor windows

2. **Reopen Cursor:**
   - Open Cursor again
   - The MCP server will automatically start when Cursor loads

### Step 3: Verify Connection
After restarting, you can verify the connection by:

1. **Ask me to use an Airtable tool:**
   - "List records from a table in my Airtable base"
   - "What tables do I have?"
   - "Show me the schema for a table"

2. **Check MCP status:**
   - If Cursor has an MCP panel, check if "airtable" appears as connected
   - Look for any error messages in Cursor's console

## 🔍 How Cursor Connects

Cursor automatically:
1. Reads `.mcp.json` from your project root
2. Starts the MCP server using the command specified
3. Loads Airtable variables from `.env.local`/`.env` if needed
4. Establishes a connection via stdio (standard input/output)

## 🧪 Manual Test (Optional)

If you want to test the server manually before restarting Cursor:

```bash
# Set environment variables (or add them to .env.local)
export AIRTABLE_API_KEY="your_api_key_here"
export AIRTABLE_BASE_ID="app8JaoSpgzzKFYRN"

# Run the server (it will wait for MCP protocol messages)
npx tsx .mcp/airtable-mcp-server/index.ts
```

The server will start and wait for MCP protocol messages. Press `Ctrl+C` to stop it.

## 📋 Connection Checklist

Before restarting Cursor, verify:

- [x] `.mcp.json` exists and is valid JSON
- [x] `.mcp/bin/airtable-mcp-custom` is executable
- [x] `.mcp/airtable-mcp-server/index.ts` exists
- [x] Dependencies are installed (`@modelcontextprotocol/sdk` and `airtable`)
- [x] Environment variables are set in `.env.local`

## 🐛 Troubleshooting

### If the MCP server doesn't connect:

1. **Check the script path:**
   ```bash
   ls -la .mcp/bin/airtable-mcp-custom
   ```
   Should show `-rwxr-xr-x` (executable)

2. **Test the script manually:**
   ```bash
   cd /Users/juhan/Developer/GoodHive/GoodHive-Web
   .mcp/bin/airtable-mcp-custom
   ```
   Should start without errors (will wait for input)

3. **Check environment variables:**
   - Verify `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` in `.env.local`
   - Make sure they're valid and have proper permissions

4. **Check dependencies:**
   ```bash
   pnpm list @modelcontextprotocol/sdk airtable
   ```
   Both should be listed

5. **Check Cursor logs:**
   - Look for MCP-related errors in Cursor's developer console
   - On Mac: `View > Developer > Toggle Developer Tools`

### Common Issues:

**Issue:** "Command not found"
- **Solution:** Make sure the script path in `.mcp.json` is relative to project root

**Issue:** "Permission denied"
- **Solution:** Run `chmod +x .mcp/bin/airtable-mcp-custom`

**Issue:** "Module not found"
- **Solution:** Run `pnpm install` to install dependencies

**Issue:** "Invalid API key"
- **Solution:** Verify your Airtable API key is correct and has access to the base

## ✅ Success Indicators

You'll know it's working when:
- I can successfully call Airtable tools
- No error messages appear in Cursor
- You can ask me to query/create/update Airtable records

## 🎯 Next Steps After Connection

Once connected, try asking me:

1. "What tables are in my Airtable base?"
2. "Show me the schema for the [TableName] table"
3. "List the first 5 records from [TableName]"
4. "Create a new record in [TableName] with [field data]"

I'll use the MCP server to interact with your Airtable base!
