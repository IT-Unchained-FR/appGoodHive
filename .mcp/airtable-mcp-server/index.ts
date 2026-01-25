#!/usr/bin/env node

/**
 * Custom Airtable MCP Server
 * 
 * This MCP server provides tools to interact with Airtable bases,
 * including reading records, creating records, updating records, and more.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import Airtable from 'airtable';

// Initialize Airtable client
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey) {
  throw new Error('AIRTABLE_API_KEY is not set');
}

if (!baseId) {
  throw new Error('AIRTABLE_BASE_ID is not set');
}

Airtable.configure({ apiKey });
const base = Airtable.base(baseId);

// Define available tools
const tools: Tool[] = [
  {
    name: 'list_tables',
    description: 'List all tables in the Airtable base. Returns table names and their schemas.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_table_schema',
    description: 'Get the schema (fields) of a specific table.',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: {
          type: 'string',
          description: 'The name of the table to get schema for',
        },
      },
      required: ['tableName'],
    },
  },
  {
    name: 'list_records',
    description: 'List records from a table. Supports filtering, sorting, and pagination.',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: {
          type: 'string',
          description: 'The name of the table to query',
        },
        view: {
          type: 'string',
          description: 'Optional view name to use for filtering',
        },
        filterByFormula: {
          type: 'string',
          description: 'Airtable formula to filter records (e.g., "{Status} = \'Active\'")',
        },
        sort: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              direction: { type: 'string', enum: ['asc', 'desc'] },
            },
            required: ['field', 'direction'],
          },
          description: 'Array of sort objects with field and direction',
        },
        maxRecords: {
          type: 'number',
          description: 'Maximum number of records to return (default: 100)',
          default: 100,
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific fields to return (if not provided, returns all fields)',
        },
      },
      required: ['tableName'],
    },
  },
  {
    name: 'get_record',
    description: 'Get a specific record by ID from a table.',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: {
          type: 'string',
          description: 'The name of the table',
        },
        recordId: {
          type: 'string',
          description: 'The ID of the record to retrieve',
        },
      },
      required: ['tableName', 'recordId'],
    },
  },
  {
    name: 'create_record',
    description: 'Create a new record in a table.',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: {
          type: 'string',
          description: 'The name of the table',
        },
        fields: {
          type: 'object',
          description: 'Object with field names as keys and values as field values',
          additionalProperties: true,
        },
      },
      required: ['tableName', 'fields'],
    },
  },
  {
    name: 'update_record',
    description: 'Update an existing record in a table.',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: {
          type: 'string',
          description: 'The name of the table',
        },
        recordId: {
          type: 'string',
          description: 'The ID of the record to update',
        },
        fields: {
          type: 'object',
          description: 'Object with field names as keys and new values as field values',
          additionalProperties: true,
        },
      },
      required: ['tableName', 'recordId', 'fields'],
    },
  },
  {
    name: 'delete_record',
    description: 'Delete a record from a table.',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: {
          type: 'string',
          description: 'The name of the table',
        },
        recordId: {
          type: 'string',
          description: 'The ID of the record to delete',
        },
      },
      required: ['tableName', 'recordId'],
    },
  },
  {
    name: 'create_records_batch',
    description: 'Create multiple records in a table in a single batch operation.',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: {
          type: 'string',
          description: 'The name of the table',
        },
        records: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fields: {
                type: 'object',
                additionalProperties: true,
              },
            },
            required: ['fields'],
          },
          description: 'Array of record objects, each with a fields property',
        },
      },
      required: ['tableName', 'records'],
    },
  },
  {
    name: 'update_records_batch',
    description: 'Update multiple records in a table in a single batch operation.',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: {
          type: 'string',
          description: 'The name of the table',
        },
        records: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              fields: {
                type: 'object',
                additionalProperties: true,
              },
            },
            required: ['id', 'fields'],
          },
          description: 'Array of record objects, each with an id and fields property',
        },
      },
      required: ['tableName', 'records'],
    },
  },
];

// Helper function to convert Airtable record to JSON
function recordToJson(record: Airtable.Record<any>): any {
  return {
    id: record.id,
    fields: record.fields,
    createdTime: record._rawJson?.createdTime,
  };
}

// Create MCP server
const server = new Server(
  {
    name: 'airtable-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_tables': {
        // Airtable doesn't have a direct API to list tables, so we'll return the base ID
        // Users need to know their table names
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  baseId,
                  message:
                    'Airtable API does not support listing tables directly. Please use get_table_schema with a known table name.',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_table_schema': {
        const { tableName } = args as { tableName: string };

        try {
          // Get first record to infer schema
          const records = await base(tableName).select({ maxRecords: 1 }).firstPage();
          const fields: Record<string, string> = {};

          if (records.length > 0) {
            Object.keys(records[0].fields).forEach((fieldName) => {
              const value = records[0].fields[fieldName];
              fields[fieldName] = Array.isArray(value)
                ? 'array'
                : typeof value === 'object' && value !== null
                  ? 'object'
                  : typeof value;
            });
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    tableName,
                    fields,
                    note: 'Field types are inferred from the first record. Actual types may vary.',
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { error: error.message || 'Failed to get table schema' },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }

      case 'list_records': {
        const {
          tableName,
          view,
          filterByFormula,
          sort,
          maxRecords = 100,
          fields,
        } = args as {
          tableName: string;
          view?: string;
          filterByFormula?: string;
          sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
          maxRecords?: number;
          fields?: string[];
        };

        try {
          const selectOptions: any = {
            maxRecords,
          };
          
          if (view) selectOptions.view = view;
          if (filterByFormula) selectOptions.filterByFormula = filterByFormula;
          if (fields && fields.length > 0) selectOptions.fields = fields;
          
          let select = base(tableName).select(selectOptions);

          if (sort && sort.length > 0) {
            select = select.sort(
              sort.map((s) => ({ field: s.field, direction: s.direction }))
            );
          }

          const records = await select.all();
          const recordsJson = records.map(recordToJson);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { records: recordsJson, count: recordsJson.length },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { error: error.message || 'Failed to list records' },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }

      case 'get_record': {
        const { tableName, recordId } = args as {
          tableName: string;
          recordId: string;
        };

        try {
          const record = await base(tableName).find(recordId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ record: recordToJson(record) }, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { error: error.message || 'Failed to get record' },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }

      case 'create_record': {
        const { tableName, fields } = args as {
          tableName: string;
          fields: Record<string, any>;
        };

        try {
          const record = await base(tableName).create(fields);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    record: recordToJson(record),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { error: error.message || 'Failed to create record' },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }

      case 'update_record': {
        const { tableName, recordId, fields } = args as {
          tableName: string;
          recordId: string;
          fields: Record<string, any>;
        };

        try {
          const record = await base(tableName).update(recordId, fields);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    record: recordToJson(record),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { error: error.message || 'Failed to update record' },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }

      case 'delete_record': {
        const { tableName, recordId } = args as {
          tableName: string;
          recordId: string;
        };

        try {
          await base(tableName).destroy(recordId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    message: `Record ${recordId} deleted successfully`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { error: error.message || 'Failed to delete record' },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }

      case 'create_records_batch': {
        const { tableName, records } = args as {
          tableName: string;
          records: Array<{ fields: Record<string, any> }>;
        };

        try {
          // Airtable allows up to 10 records per batch
          const batchSize = 10;
          const createdRecords: any[] = [];

          for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            const batchRecords = await base(tableName).create(
              batch.map((r) => r.fields)
            );
            createdRecords.push(...batchRecords.map(recordToJson));
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    records: createdRecords,
                    count: createdRecords.length,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { error: error.message || 'Failed to create records' },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }

      case 'update_records_batch': {
        const { tableName, records } = args as {
          tableName: string;
          records: Array<{ id: string; fields: Record<string, any> }>;
        };

        try {
          // Airtable allows up to 10 records per batch
          const batchSize = 10;
          const updatedRecords: any[] = [];

          for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            const batchRecords = await base(tableName).update(
              batch.map((r) => ({ id: r.id, fields: r.fields }))
            );
            updatedRecords.push(...batchRecords.map(recordToJson));
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    records: updatedRecords,
                    count: updatedRecords.length,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { error: error.message || 'Failed to update records' },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { error: `Unknown tool: ${name}` },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: error.message || 'Unknown error',
              stack: error.stack,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Airtable MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
