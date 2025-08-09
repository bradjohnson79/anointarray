#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

const execAsync = promisify(exec);

class SemgrepMCPServer {
  private server: Server;
  
  constructor() {
    this.server = new Server({
      name: 'semgrep-mcp-server',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });
    
    this.setupToolHandlers();
    this.setupErrorHandling();
  }
  
  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }
  
  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'semgrep_scan',
            description: 'Run Semgrep security and code quality scan on files',
            inputSchema: {
              type: 'object',
              properties: {
                paths: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'File paths or directories to scan (default: current directory)',
                },
                config: {
                  type: 'string',
                  description: 'Semgrep ruleset (e.g., "auto", "p/javascript", "p/typescript", "p/security-audit")',
                  default: 'auto'
                },
                severity: {
                  type: 'string',
                  description: 'Minimum severity level (INFO, WARNING, ERROR)',
                  default: 'WARNING'
                },
                format: {
                  type: 'string',
                  description: 'Output format (text, json, sarif)',
                  default: 'json'
                },
                exclude: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Patterns to exclude from scanning'
                }
              },
            },
          },
          {
            name: 'semgrep_ci',
            description: 'Run Semgrep CI scan with comprehensive rules',
            inputSchema: {
              type: 'object',
              properties: {
                paths: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'File paths or directories to scan (default: current directory)',
                },
                fail_on_findings: {
                  type: 'boolean',
                  description: 'Exit with non-zero code if findings are detected',
                  default: false
                }
              },
            },
          },
          {
            name: 'semgrep_custom_rule',
            description: 'Run Semgrep with custom rule or pattern',
            inputSchema: {
              type: 'object',
              properties: {
                pattern: {
                  type: 'string',
                  description: 'Custom Semgrep pattern to search for',
                },
                language: {
                  type: 'string',
                  description: 'Programming language (javascript, typescript, python, etc.)',
                },
                paths: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'File paths or directories to scan (default: current directory)',
                },
              },
              required: ['pattern', 'language'],
            },
          },
        ],
      };
    });
    
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'semgrep_scan':
            return await this.handleSemgrepScan(args);
          case 'semgrep_ci':
            return await this.handleSemgrepCI(args);
          case 'semgrep_custom_rule':
            return await this.handleSemgrepCustomRule(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error running ${name}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }
  
  private async handleSemgrepScan(args: any) {
    const {
      paths = ['.'],
      config = 'auto',
      severity = 'WARNING',
      format = 'json',
      exclude = []
    } = args;
    
    let command = ['semgrep', '--config', config];
    
    if (format) {
      command.push('--json');
    }
    
    command.push('--severity', severity);
    
    if (exclude.length > 0) {
      exclude.forEach((pattern: string) => {
        command.push('--exclude', pattern);
      });
    }
    
    command.push(...paths);
    
    const { stdout, stderr } = await execAsync(command.join(' '));
    
    let results;
    if (format === 'json') {
      try {
        results = JSON.parse(stdout);
        const summary = {
          total_findings: results.results?.length || 0,
          errors: results.errors?.length || 0,
          paths_scanned: results.paths?.scanned?.length || 0,
          findings_by_severity: {}
        };
        
        if (results.results) {
          results.results.forEach((finding: any) => {
            const sev = finding.extra?.severity || 'unknown';
            summary.findings_by_severity[sev] = (summary.findings_by_severity[sev] || 0) + 1;
          });
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `## Semgrep Scan Results\\n\\n**Summary:**\\n- Total findings: ${summary.total_findings}\\n- Paths scanned: ${summary.paths_scanned}\\n- Errors: ${summary.errors}\\n\\n**Findings by severity:**\\n${Object.entries(summary.findings_by_severity).map(([sev, count]) => `- ${sev}: ${count}`).join('\\n')}\\n\\n**Detailed Results:**\\n\`\`\`json\\n${JSON.stringify(results, null, 2)}\\n\`\`\``,
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text',
              text: `## Semgrep Scan Results\\n\\n${stdout}\\n\\n${stderr ? `**Errors:**\\n${stderr}` : ''}`,
            },
          ],
        };
      }
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `## Semgrep Scan Results\\n\\n${stdout}\\n\\n${stderr ? `**Errors:**\\n${stderr}` : ''}`,
          },
        ],
      };
    }
  }
  
  private async handleSemgrepCI(args: any) {
    const {
      paths = ['.'],
      fail_on_findings = false
    } = args;
    
    const command = ['semgrep', '--config=auto', '--json', ...paths];
    
    try {
      const { stdout, stderr } = await execAsync(command.join(' '));
      const results = JSON.parse(stdout);
      
      const summary = {
        total_findings: results.results?.length || 0,
        critical_findings: results.results?.filter((f: any) => f.extra?.severity === 'ERROR').length || 0,
        security_findings: results.results?.filter((f: any) => 
          f.extra?.metadata?.category === 'security' || 
          f.extra?.metadata?.['owasp']
        ).length || 0,
      };
      
      return {
        content: [
          {
            type: 'text',
            text: `## Semgrep CI Scan Results\\n\\n**Summary:**\\n- Total findings: ${summary.total_findings}\\n- Critical findings: ${summary.critical_findings}\\n- Security findings: ${summary.security_findings}\\n\\n**Full Results:**\\n\`\`\`json\\n${JSON.stringify(results, null, 2)}\\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      if (!fail_on_findings && error instanceof Error && error.message.includes('exit code 1')) {
        // Semgrep exits with code 1 when findings are found, this is normal
        const output = (error as any).stdout || '';
        try {
          const results = JSON.parse(output);
          return {
            content: [
              {
                type: 'text',
                text: `## Semgrep CI Scan Results\\n\\nFindings detected:\\n\`\`\`json\\n${JSON.stringify(results, null, 2)}\\n\`\`\``,
              },
            ],
          };
        } catch {
          return {
            content: [
              {
                type: 'text',
                text: `## Semgrep CI Scan Results\\n\\n${output}`,
              },
            ],
          };
        }
      }
      throw error;
    }
  }
  
  private async handleSemgrepCustomRule(args: any) {
    const { pattern, language, paths = ['.'] } = args;
    
    const command = [
      'semgrep',
      '--pattern', `'${pattern}'`,
      '--lang', language,
      '--json',
      ...paths
    ];
    
    const { stdout, stderr } = await execAsync(command.join(' '));
    const results = JSON.parse(stdout);
    
    return {
      content: [
        {
          type: 'text',
          text: `## Custom Pattern Search Results\\n\\n**Pattern:** \`${pattern}\`\\n**Language:** ${language}\\n**Matches found:** ${results.results?.length || 0}\\n\\n\`\`\`json\\n${JSON.stringify(results, null, 2)}\\n\`\`\``,
        },
      ],
    };
  }
  
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Semgrep MCP server running on stdio');
  }
}

const server = new SemgrepMCPServer();
server.run().catch(console.error);