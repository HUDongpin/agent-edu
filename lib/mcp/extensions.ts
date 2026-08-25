import type { McpExtensionRecord } from "./types";

/**
 * Extensions are versioned independently of the MCP core revision. This frozen
 * manifest prevents the course from accidentally presenting an extension's
 * maturity or wire shape as part of MCP_PROTOCOL_VERSION.
 */
export const MCP_EXTENSION_SNAPSHOT_DATE = "2026-08-24" as const;

export const MCP_EXTENSIONS = [
  {
    id: "io.modelcontextprotocol/ui",
    name: "MCP Apps",
    maturity: "stable",
    specificationVersion: "2026-01-26",
    specificationUrl: "https://github.com/modelcontextprotocol/ext-apps/blob/10195ad91851502134930e9b80ec2c04e277a720/specification/2026-01-26/apps.mdx",
    revision: "10195ad91851502134930e9b80ec2c04e277a720",
    observedOn: MCP_EXTENSION_SNAPSHOT_DATE,
    negotiation: "Client and server explicitly advertise io.modelcontextprotocol/ui support and compatible MIME types.",
    fallback: "Return useful ordinary tool content and omit UI metadata when the host does not negotiate the extension.",
  },
  {
    id: "io.modelcontextprotocol/tasks",
    name: "Tasks",
    maturity: "draft",
    specificationVersion: "draft@e434597",
    specificationUrl: "https://github.com/modelcontextprotocol/ext-tasks/blob/e4345978be1f602f1fc48d89051e8559dd5302a6/specification/draft/tasks.md",
    revision: "e4345978be1f602f1fc48d89051e8559dd5302a6",
    observedOn: MCP_EXTENSION_SNAPSHOT_DATE,
    negotiation: "The client declares io.modelcontextprotocol/tasks on each eligible request and the server advertises it through discovery.",
    fallback: "Return the ordinary Complete result or a Missing Required Client Capability error; never surprise an unsupported client with resultType task.",
  },
  {
    id: "io.modelcontextprotocol/enterprise-managed-authorization",
    name: "Enterprise-Managed Authorization",
    maturity: "stable",
    specificationVersion: "stable@fb374c7",
    specificationUrl: "https://github.com/modelcontextprotocol/ext-auth/blob/fb374c7db2b34f18ca9183882e0beecdf661892b/README.md",
    revision: "fb374c7db2b34f18ca9183882e0beecdf661892b",
    observedOn: MCP_EXTENSION_SNAPSHOT_DATE,
    negotiation: "Adopt only when the deployment's enterprise identity policy and participating implementations support it.",
    fallback: "Use the core user-authorization flow or disable the remote integration when enterprise policy cannot be established.",
  },
  {
    id: "io.modelcontextprotocol/oauth-client-credentials",
    name: "OAuth Client Credentials",
    maturity: "draft",
    specificationVersion: "draft@fb374c7",
    specificationUrl: "https://github.com/modelcontextprotocol/ext-auth/blob/fb374c7db2b34f18ca9183882e0beecdf661892b/README.md",
    revision: "fb374c7db2b34f18ca9183882e0beecdf661892b",
    observedOn: MCP_EXTENSION_SNAPSHOT_DATE,
    negotiation: "Use only for a documented machine identity and with both implementations explicitly supporting the draft extension.",
    fallback: "Do not silently substitute a user token or bypass consent; choose another authorized deployment model.",
  },
] as const satisfies readonly McpExtensionRecord[];
