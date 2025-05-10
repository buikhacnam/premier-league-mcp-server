import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

interface Env {
	PREMIER_LEAGUE_API: string;
}

const PREMIER_LEAGUE_API = "https://www.chelseafc.com/en/api/fixtures/league-table?entryId=30EGwHPO9uwBCc75RQY6kg";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Premier League Table",
		version: "1.0.0",
	});

	async init() {
		
		// Premier League Table tool
		this.server.tool("getPremierLeagueTable", {}, async () => {
			const apiUrl = PREMIER_LEAGUE_API;
			try {
				const response = await fetch(apiUrl);
				if (!response.ok) {
					return {
						content: [
							{
								type: "text",
								text: `Error fetching data: ${response.statusText}`,
							},
						],
					};
				}
				const data: any = await response.json();
				const table = data?.items?.[0]?.standings?.tables?.[0];

				if (table && table?.rows?.length > 0) {
					// Format the table data into a string
					let tableString =
						"Pos | Club                     | P  | PTS | W  | D  | L  | GD | Form\n";
					tableString +=
						"----|--------------------------|----|-----|----|----|----|----|----------\n";

					table.rows.forEach((row: any) => {
						const pos = String(row?.position ?? "").padEnd(3);
						const club = (row?.clubName ?? "").padEnd(24);
						const p = String(row?.played ?? "").padEnd(2);
						const pts = String(row?.points ?? "").padEnd(3);
						const w = String(row?.won ?? "").padEnd(2);
						const d = String(row?.drawn ?? "").padEnd(2);
						const l = String(row?.lost ?? "").padEnd(2);
						const gd = String(row?.goalDifference ?? "").padEnd(2);
						const form =
							(row?.recentForm?.length > 0
								? row.recentForm.join(" ")
								: "--"
							).padEnd(10);
						tableString += `${pos} | ${club} | ${p} | ${pts} | ${w} | ${d} | ${l} | ${gd} | ${form}\n`;
					});

					return { content: [{ type: "text", text: tableString }] };
				} else {
					return {
						content: [
							{
								type: "text",
								text: "Error: Could not parse Premier League table data.",
							},
						],
					};
				}
			} catch (error: any) {
				return {
					content: [
						{ type: "text", text: `Error: ${error?.message ?? "Unknown error"}` },
					],
				};
			}
		});
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			// @ts-ignore
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			// @ts-ignore
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
