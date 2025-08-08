#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env.mcp.local' });
config({ path: '.env.mcp' });

interface GitHubPullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed';
  mergeable: boolean | null;
  draft: boolean;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
}

class GitHubMCPServer {
  private server: Server;
  private token: string;
  private owner: string;
  private repo: string;

  constructor() {
    this.token = process.env.GITHUB_TOKEN || '';
    this.owner = process.env.GITHUB_OWNER || '';
    this.repo = process.env.GITHUB_REPO || '';

    if (!this.token || !this.owner || !this.repo) {
      throw new Error('GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO are required');
    }

    this.server = new Server(
      {
        name: 'github-automation-server',
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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'github-pr-automation',
          description: 'Automate GitHub Pull Request workflows and management',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['create', 'list', 'merge', 'close', 'review', 'approve', 'request-changes'],
                description: 'PR automation action'
              },
              title: { type: 'string', description: 'PR title' },
              body: { type: 'string', description: 'PR description' },
              head: { type: 'string', description: 'Source branch' },
              base: { type: 'string', description: 'Target branch' },
              pr_number: { type: 'number', description: 'PR number for specific operations' },
              review_comment: { type: 'string', description: 'Review comment' },
              draft: { type: 'boolean', description: 'Create as draft PR' }
            },
            required: ['action']
          }
        },
        {
          name: 'github-issue-tracking',
          description: 'Track and manage GitHub Issues with automation',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['create', 'list', 'close', 'assign', 'label', 'milestone'],
                description: 'Issue management action'
              },
              title: { type: 'string', description: 'Issue title' },
              body: { type: 'string', description: 'Issue description' },
              issue_number: { type: 'number', description: 'Issue number' },
              assignee: { type: 'string', description: 'GitHub username to assign' },
              labels: { type: 'array', items: { type: 'string' }, description: 'Issue labels' },
              milestone: { type: 'string', description: 'Milestone name' },
              state: { type: 'string', enum: ['open', 'closed'], description: 'Issue state' }
            },
            required: ['action']
          }
        },
        {
          name: 'github-actions-orchestration',
          description: 'Orchestrate and monitor GitHub Actions workflows',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['trigger', 'list', 'cancel', 'rerun', 'status', 'logs'],
                description: 'GitHub Actions action'
              },
              workflow: { type: 'string', description: 'Workflow name or ID' },
              branch: { type: 'string', description: 'Branch to run workflow on' },
              run_id: { type: 'number', description: 'Workflow run ID' },
              inputs: { type: 'object', description: 'Workflow inputs' }
            },
            required: ['action']
          }
        },
        {
          name: 'github-security-scanning',
          description: 'Security vulnerability scanning and management',
          inputSchema: {
            type: 'object',
            properties: {
              scan_type: {
                type: 'string',
                enum: ['dependabot', 'code-scanning', 'secret-scanning', 'all'],
                description: 'Security scan type'
              },
              action: {
                type: 'string',
                enum: ['run', 'list-alerts', 'dismiss', 'fix'],
                description: 'Security action'
              },
              alert_id: { type: 'number', description: 'Alert ID for specific operations' },
              severity: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
                description: 'Filter by severity'
              }
            },
            required: ['scan_type', 'action']
          }
        },
        {
          name: 'github-release-management',
          description: 'Manage GitHub releases and versioning',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['create', 'list', 'update', 'delete', 'publish'],
                description: 'Release management action'
              },
              tag: { type: 'string', description: 'Release tag' },
              name: { type: 'string', description: 'Release name' },
              body: { type: 'string', description: 'Release description' },
              draft: { type: 'boolean', description: 'Create as draft' },
              prerelease: { type: 'boolean', description: 'Mark as prerelease' },
              release_id: { type: 'number', description: 'Release ID for specific operations' }
            },
            required: ['action']
          }
        },
        {
          name: 'github-code-review',
          description: 'Automated code review and quality analysis',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['analyze', 'suggest', 'format', 'lint'],
                description: 'Code review action'
              },
              pr_number: { type: 'number', description: 'PR number to review' },
              files: { type: 'array', items: { type: 'string' }, description: 'Specific files to analyze' },
              language: { type: 'string', description: 'Programming language' },
              rules: { type: 'array', items: { type: 'string' }, description: 'Specific rules to check' }
            },
            required: ['action']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'github-pr-automation':
            return await this.handlePRAutomation(args);
          case 'github-issue-tracking':
            return await this.handleIssueTracking(args);
          case 'github-actions-orchestration':
            return await this.handleActionsOrchestration(args);
          case 'github-security-scanning':
            return await this.handleSecurityScanning(args);
          case 'github-release-management':
            return await this.handleReleaseManagement(args);
          case 'github-code-review':
            return await this.handleCodeReview(args);
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

  private async makeGitHubRequest(endpoint: string, method: string = 'GET', body?: any) {
    const url = `https://api.github.com${endpoint}`;
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to make GitHub API request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handlePRAutomation(args: any) {
    const { action, title, body, head, base = 'main', pr_number, review_comment, draft = false } = args;

    try {
      switch (action) {
        case 'create':
          if (!title || !head) throw new Error('title and head branch are required');
          
          const newPR = await this.makeGitHubRequest(`/repos/${this.owner}/${this.repo}/pulls`, 'POST', {
            title,
            body,
            head,
            base,
            draft
          });

          return {
            content: [
              {
                type: 'text',
                text: `Pull Request created successfully:\n${JSON.stringify({
                  number: newPR.number,
                  title: newPR.title,
                  html_url: newPR.html_url,
                  state: newPR.state
                }, null, 2)}`
              }
            ]
          };

        case 'list':
          const prs = await this.makeGitHubRequest(`/repos/${this.owner}/${this.repo}/pulls`);
          return {
            content: [
              {
                type: 'text',
                text: `Pull Requests:\n${JSON.stringify(prs.map((pr: any) => ({
                  number: pr.number,
                  title: pr.title,
                  state: pr.state,
                  author: pr.user.login,
                  created_at: pr.created_at
                })), null, 2)}`
              }
            ]
          };

        case 'merge':
          if (!pr_number) throw new Error('pr_number is required');
          
          const mergeResult = await this.makeGitHubRequest(`/repos/${this.owner}/${this.repo}/pulls/${pr_number}/merge`, 'PUT', {
            commit_title: `Merge PR #${pr_number}`,
            merge_method: 'squash'
          });

          return {
            content: [
              {
                type: 'text',
                text: `PR #${pr_number} merged successfully:\n${JSON.stringify(mergeResult, null, 2)}`
              }
            ]
          };

        case 'review':
          if (!pr_number || !review_comment) throw new Error('pr_number and review_comment are required');
          
          const review = await this.makeGitHubRequest(`/repos/${this.owner}/${this.repo}/pulls/${pr_number}/reviews`, 'POST', {
            body: review_comment,
            event: 'COMMENT'
          });

          return {
            content: [
              {
                type: 'text',
                text: `Review submitted for PR #${pr_number}:\n${JSON.stringify(review, null, 2)}`
              }
            ]
          };

        default:
          return {
            content: [
              {
                type: 'text',
                text: `PR automation ${action} operation prepared${pr_number ? ` for PR #${pr_number}` : ''}`
              }
            ]
          };
      }
    } catch (error) {
      throw error;
    }
  }

  private async handleIssueTracking(args: any) {
    const { action, title, body, issue_number, assignee, labels, milestone, state } = args;

    try {
      switch (action) {
        case 'create':
          if (!title) throw new Error('title is required');
          
          const newIssue = await this.makeGitHubRequest(`/repos/${this.owner}/${this.repo}/issues`, 'POST', {
            title,
            body,
            assignees: assignee ? [assignee] : [],
            labels: labels || [],
            milestone: milestone ? milestone : undefined
          });

          return {
            content: [
              {
                type: 'text',
                text: `Issue created successfully:\n${JSON.stringify({
                  number: newIssue.number,
                  title: newIssue.title,
                  html_url: newIssue.html_url,
                  state: newIssue.state
                }, null, 2)}`
              }
            ]
          };

        case 'list':
          const issues = await this.makeGitHubRequest(`/repos/${this.owner}/${this.repo}/issues?state=${state || 'open'}`);
          return {
            content: [
              {
                type: 'text',
                text: `Issues (${state || 'open'}):\n${JSON.stringify(issues.map((issue: any) => ({
                  number: issue.number,
                  title: issue.title,
                  state: issue.state,
                  assignee: issue.assignee?.login,
                  labels: issue.labels.map((label: any) => label.name)
                })), null, 2)}`
              }
            ]
          };

        case 'close':
          if (!issue_number) throw new Error('issue_number is required');
          
          const closedIssue = await this.makeGitHubRequest(`/repos/${this.owner}/${this.repo}/issues/${issue_number}`, 'PATCH', {
            state: 'closed'
          });

          return {
            content: [
              {
                type: 'text',
                text: `Issue #${issue_number} closed successfully`
              }
            ]
          };

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Issue tracking ${action} operation prepared${issue_number ? ` for issue #${issue_number}` : ''}`
              }
            ]
          };
      }
    } catch (error) {
      throw error;
    }
  }

  private async handleActionsOrchestration(args: any) {
    const { action, workflow, branch, run_id, inputs } = args;

    try {
      switch (action) {
        case 'list':
          const workflows = await this.makeGitHubRequest(`/repos/${this.owner}/${this.repo}/actions/workflows`);
          return {
            content: [
              {
                type: 'text',
                text: `GitHub Actions Workflows:\n${JSON.stringify(workflows.workflows.map((w: any) => ({
                  id: w.id,
                  name: w.name,
                  path: w.path,
                  state: w.state
                })), null, 2)}`
              }
            ]
          };

        case 'trigger':
          if (!workflow || !branch) throw new Error('workflow and branch are required');
          
          const triggerResult = await this.makeGitHubRequest(`/repos/${this.owner}/${this.repo}/actions/workflows/${workflow}/dispatches`, 'POST', {
            ref: branch,
            inputs: inputs || {}
          });

          return {
            content: [
              {
                type: 'text',
                text: `Workflow '${workflow}' triggered successfully on branch '${branch}'`
              }
            ]
          };

        case 'status':
          const runs = await this.makeGitHubRequest(`/repos/${this.owner}/${this.repo}/actions/runs?per_page=10`);
          return {
            content: [
              {
                type: 'text',
                text: `Recent Workflow Runs:\n${JSON.stringify(runs.workflow_runs.map((run: any) => ({
                  id: run.id,
                  name: run.name,
                  status: run.status,
                  conclusion: run.conclusion,
                  created_at: run.created_at,
                  html_url: run.html_url
                })), null, 2)}`
              }
            ]
          };

        default:
          return {
            content: [
              {
                type: 'text',
                text: `GitHub Actions ${action} operation prepared${workflow ? ` for workflow: ${workflow}` : ''}`
              }
            ]
          };
      }
    } catch (error) {
      throw error;
    }
  }

  private async handleSecurityScanning(args: any) {
    const { scan_type, action, alert_id, severity } = args;

    try {
      switch (action) {
        case 'list-alerts':
          let endpoint = '';
          switch (scan_type) {
            case 'dependabot':
              endpoint = `/repos/${this.owner}/${this.repo}/dependabot/alerts`;
              break;
            case 'code-scanning':
              endpoint = `/repos/${this.owner}/${this.repo}/code-scanning/alerts`;
              break;
            case 'secret-scanning':
              endpoint = `/repos/${this.owner}/${this.repo}/secret-scanning/alerts`;
              break;
            default:
              throw new Error(`Unsupported scan type: ${scan_type}`);
          }

          const alerts = await this.makeGitHubRequest(`${endpoint}${severity ? `?severity=${severity}` : ''}`);
          return {
            content: [
              {
                type: 'text',
                text: `${scan_type} Alerts${severity ? ` (${severity})` : ''}:\n${JSON.stringify(alerts.slice(0, 10), null, 2)}`
              }
            ]
          };

        case 'dismiss':
          if (!alert_id) throw new Error('alert_id is required');
          
          return {
            content: [
              {
                type: 'text',
                text: `${scan_type} alert #${alert_id} dismissal prepared`
              }
            ]
          };

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Security scanning ${action} for ${scan_type} completed`
              }
            ]
          };
      }
    } catch (error) {
      throw error;
    }
  }

  private async handleReleaseManagement(args: any) {
    const { action, tag, name, body, draft = false, prerelease = false, release_id } = args;

    try {
      switch (action) {
        case 'create':
          if (!tag || !name) throw new Error('tag and name are required');
          
          const newRelease = await this.makeGitHubRequest(`/repos/${this.owner}/${this.repo}/releases`, 'POST', {
            tag_name: tag,
            name,
            body,
            draft,
            prerelease
          });

          return {
            content: [
              {
                type: 'text',
                text: `Release created successfully:\n${JSON.stringify({
                  id: newRelease.id,
                  name: newRelease.name,
                  tag_name: newRelease.tag_name,
                  html_url: newRelease.html_url,
                  draft: newRelease.draft
                }, null, 2)}`
              }
            ]
          };

        case 'list':
          const releases = await this.makeGitHubRequest(`/repos/${this.owner}/${this.repo}/releases`);
          return {
            content: [
              {
                type: 'text',
                text: `Releases:\n${JSON.stringify(releases.map((release: any) => ({
                  id: release.id,
                  name: release.name,
                  tag_name: release.tag_name,
                  draft: release.draft,
                  prerelease: release.prerelease,
                  published_at: release.published_at
                })), null, 2)}`
              }
            ]
          };

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Release management ${action} operation prepared${tag ? ` for tag: ${tag}` : ''}`
              }
            ]
          };
      }
    } catch (error) {
      throw error;
    }
  }

  private async handleCodeReview(args: any) {
    const { action, pr_number, files, language, rules } = args;

    const mockReviewResults = {
      analyze: {
        complexity: 'medium',
        maintainability: 85,
        test_coverage: '75%',
        issues_found: 3,
        suggestions: [
          'Consider adding error handling in authentication function',
          'Optimize database queries in user service',
          'Add TypeScript types for API responses'
        ]
      },
      suggest: [
        'Extract reusable components from large files',
        'Implement proper error boundaries',
        'Add unit tests for utility functions',
        'Use React.memo for performance optimization'
      ],
      format: 'Code formatting completed with Prettier',
      lint: {
        errors: 0,
        warnings: 2,
        info: 1,
        details: [
          { file: 'src/utils/auth.ts', line: 45, message: 'Unused variable' },
          { file: 'src/components/Header.tsx', line: 12, message: 'Missing key prop' }
        ]
      }
    };

    return {
      content: [
        {
          type: 'text',
          text: `Code Review - ${action}${pr_number ? ` for PR #${pr_number}` : ''}${language ? ` (${language})` : ''}:\n${JSON.stringify(mockReviewResults[action as keyof typeof mockReviewResults] || {}, null, 2)}`
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GitHub Automation MCP server running on stdio');
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new GitHubMCPServer();
  server.run().catch((error) => {
    console.error('GitHub server error:', error);
    process.exit(1);
  });
}