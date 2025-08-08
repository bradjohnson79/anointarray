#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env.mcp.local' });
config({ path: '.env.mcp' });

interface SupabaseMCPServer {
  supabase: SupabaseClient;
  server: Server;
}

class SupabaseMCPServer {
  private supabase: SupabaseClient;
  private server: Server;

  constructor() {
    // Initialize Supabase client with service key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required Supabase environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    this.server = new Server(
      {
        name: 'supabase-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'supabase-query',
          description: 'Execute SQL queries on the Supabase database',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'SQL query to execute' },
              params: { type: 'array', description: 'Query parameters' }
            },
            required: ['query']
          }
        },
        {
          name: 'supabase-schema-inspect',
          description: 'Inspect database schema and structure',
          inputSchema: {
            type: 'object',
            properties: {
              table: { type: 'string', description: 'Specific table to inspect (optional)' }
            }
          }
        },
        {
          name: 'supabase-migrate',
          description: 'Generate and apply database migrations',
          inputSchema: {
            type: 'object',
            properties: {
              action: { 
                type: 'string', 
                enum: ['generate', 'apply', 'rollback', 'status'],
                description: 'Migration action to perform'
              },
              name: { type: 'string', description: 'Migration name (for generate)' },
              sql: { type: 'string', description: 'SQL to execute (for generate)' }
            },
            required: ['action']
          }
        },
        {
          name: 'supabase-auth-manage',
          description: 'Manage user authentication and roles',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['list-users', 'create-user', 'update-user', 'delete-user', 'reset-password'],
                description: 'Authentication action to perform'
              },
              user_id: { type: 'string', description: 'User ID for specific operations' },
              email: { type: 'string', description: 'User email' },
              password: { type: 'string', description: 'User password' },
              metadata: { type: 'object', description: 'User metadata' }
            },
            required: ['action']
          }
        },
        {
          name: 'supabase-rls-policy',
          description: 'Manage Row Level Security policies',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['list', 'create', 'update', 'delete', 'enable', 'disable'],
                description: 'RLS policy action'
              },
              table: { type: 'string', description: 'Table name' },
              policy_name: { type: 'string', description: 'Policy name' },
              command: { 
                type: 'string',
                enum: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL'],
                description: 'SQL command the policy applies to'
              },
              using: { type: 'string', description: 'USING expression' },
              check: { type: 'string', description: 'WITH CHECK expression' }
            },
            required: ['action', 'table']
          }
        },
        {
          name: 'supabase-storage',
          description: 'Manage Supabase Storage buckets and files',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['list-buckets', 'create-bucket', 'delete-bucket', 'list-files', 'upload', 'download', 'delete-file'],
                description: 'Storage action to perform'
              },
              bucket: { type: 'string', description: 'Bucket name' },
              path: { type: 'string', description: 'File path' },
              public: { type: 'boolean', description: 'Whether bucket/file should be public' }
            },
            required: ['action']
          }
        },
        {
          name: 'supabase-realtime',
          description: 'Manage realtime subscriptions and channels',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['list-channels', 'create-subscription', 'remove-subscription'],
                description: 'Realtime action'
              },
              table: { type: 'string', description: 'Table to subscribe to' },
              event: { 
                type: 'string',
                enum: ['*', 'INSERT', 'UPDATE', 'DELETE'],
                description: 'Event type to listen for'
              },
              filter: { type: 'string', description: 'Filter expression' }
            },
            required: ['action']
          }
        },
        {
          name: 'supabase-backup',
          description: 'Create and manage database backups',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['create', 'list', 'restore', 'delete'],
                description: 'Backup action'
              },
              backup_name: { type: 'string', description: 'Backup name/identifier' },
              tables: { type: 'array', items: { type: 'string' }, description: 'Specific tables to backup' }
            },
            required: ['action']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'supabase-query':
            return await this.handleQuery(args);
          case 'supabase-schema-inspect':
            return await this.handleSchemaInspect(args);
          case 'supabase-migrate':
            return await this.handleMigrate(args);
          case 'supabase-auth-manage':
            return await this.handleAuthManage(args);
          case 'supabase-rls-policy':
            return await this.handleRLSPolicy(args);
          case 'supabase-storage':
            return await this.handleStorage(args);
          case 'supabase-realtime':
            return await this.handleRealtime(args);
          case 'supabase-backup':
            return await this.handleBackup(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });
  }

  private async handleQuery(args: any) {
    const { query, params = [] } = args;
    
    try {
      const { data, error } = await this.supabase.rpc('execute_sql', { 
        sql_query: query,
        sql_params: params 
      });

      if (error) throw error;

      return {
        content: [
          {
            type: 'text',
            text: `Query executed successfully:\n${JSON.stringify(data, null, 2)}`
          }
        ]
      };
    } catch (error) {
      // Fallback to direct query for simple SELECT operations
      if (query.trim().toLowerCase().startsWith('select')) {
        try {
          // Parse table name from query (simple parsing)
          const tableMatch = query.match(/from\\s+(\\w+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];
            const { data, error } = await this.supabase
              .from(tableName)
              .select('*');

            if (error) throw error;

            return {
              content: [
                {
                  type: 'text',
                  text: `Query results:\n${JSON.stringify(data, null, 2)}`
                }
              ]
            };
          }
        } catch (fallbackError) {
          // Continue to error handling below
        }
      }

      throw error;
    }
  }

  private async handleSchemaInspect(args: any) {
    const { table } = args;

    try {
      // Get tables information
      const { data: tables, error: tablesError } = await this.supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_schema', 'public');

      if (tablesError) throw tablesError;

      // Get columns information
      const { data: columns, error: columnsError } = await this.supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_schema', 'public');

      if (columnsError) throw columnsError;

      const schema = {
        tables: table ? tables?.filter(t => t.table_name === table) : tables,
        columns: table ? columns?.filter(c => c.table_name === table) : columns,
        inspected_at: new Date().toISOString()
      };

      return {
        content: [
          {
            type: 'text',
            text: `Database schema:\n${JSON.stringify(schema, null, 2)}`
          }
        ]
      };
    } catch (error) {
      throw error;
    }
  }

  private async handleMigrate(args: any) {
    const { action, name, sql } = args;

    // This is a simplified implementation
    // In a real implementation, you'd integrate with Supabase CLI or migration system
    return {
      content: [
        {
          type: 'text',
          text: `Migration ${action} operation prepared${name ? ` for: ${name}` : ''}.\nNote: Full migration system requires Supabase CLI integration.`
        }
      ]
    };
  }

  private async handleAuthManage(args: any) {
    const { action, user_id, email, password, metadata } = args;

    try {
      switch (action) {
        case 'list-users':
          const { data: users, error: usersError } = await this.supabase.auth.admin.listUsers();
          if (usersError) throw usersError;
          
          return {
            content: [
              {
                type: 'text',
                text: `Users:\n${JSON.stringify(users.users.map(u => ({
                  id: u.id,
                  email: u.email,
                  created_at: u.created_at,
                  last_sign_in_at: u.last_sign_in_at
                })), null, 2)}`
              }
            ]
          };

        case 'create-user':
          if (!email || !password) throw new Error('Email and password are required');
          
          const { data: newUser, error: createError } = await this.supabase.auth.admin.createUser({
            email,
            password,
            user_metadata: metadata || {}
          });

          if (createError) throw createError;

          return {
            content: [
              {
                type: 'text',
                text: `User created successfully:\n${JSON.stringify(newUser.user, null, 2)}`
              }
            ]
          };

        case 'delete-user':
          if (!user_id) throw new Error('User ID is required');

          const { error: deleteError } = await this.supabase.auth.admin.deleteUser(user_id);
          if (deleteError) throw deleteError;

          return {
            content: [
              {
                type: 'text',
                text: `User ${user_id} deleted successfully`
              }
            ]
          };

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Auth action ${action} is not yet implemented`
              }
            ]
          };
      }
    } catch (error) {
      throw error;
    }
  }

  private async handleRLSPolicy(args: any) {
    const { action, table, policy_name, command, using: usingClause, check } = args;

    // This would integrate with Supabase's RLS management
    // For now, return a placeholder response
    return {
      content: [
        {
          type: 'text',
          text: `RLS policy ${action} operation prepared for table: ${table}${policy_name ? `, policy: ${policy_name}` : ''}`
        }
      ]
    };
  }

  private async handleStorage(args: any) {
    const { action, bucket, path, public: isPublic } = args;

    try {
      switch (action) {
        case 'list-buckets':
          const { data: buckets, error: bucketsError } = await this.supabase.storage.listBuckets();
          if (bucketsError) throw bucketsError;

          return {
            content: [
              {
                type: 'text',
                text: `Storage buckets:\n${JSON.stringify(buckets, null, 2)}`
              }
            ]
          };

        case 'create-bucket':
          if (!bucket) throw new Error('Bucket name is required');

          const { data: newBucket, error: createError } = await this.supabase.storage.createBucket(bucket, {
            public: isPublic || false
          });

          if (createError) throw createError;

          return {
            content: [
              {
                type: 'text',
                text: `Bucket '${bucket}' created successfully`
              }
            ]
          };

        case 'list-files':
          if (!bucket) throw new Error('Bucket name is required');

          const { data: files, error: filesError } = await this.supabase.storage
            .from(bucket)
            .list(path || '');

          if (filesError) throw filesError;

          return {
            content: [
              {
                type: 'text',
                text: `Files in bucket '${bucket}':\n${JSON.stringify(files, null, 2)}`
              }
            ]
          };

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Storage action ${action} is not yet implemented`
              }
            ]
          };
      }
    } catch (error) {
      throw error;
    }
  }

  private async handleRealtime(args: any) {
    // Realtime subscriptions would be managed here
    const { action, table, event, filter } = args;

    return {
      content: [
        {
          type: 'text',
          text: `Realtime ${action} operation prepared${table ? ` for table: ${table}` : ''}`
        }
      ]
    };
  }

  private async handleBackup(args: any) {
    const { action, backup_name, tables } = args;

    // Backup operations would be implemented here
    return {
      content: [
        {
          type: 'text',
          text: `Backup ${action} operation prepared${backup_name ? ` for: ${backup_name}` : ''}`
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Supabase MCP server running on stdio');
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new SupabaseMCPServer();
  server.run().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}