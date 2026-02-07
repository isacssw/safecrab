/**
 * Safecrab - Security scanner for Linux VPS environments
 * Package entry point for programmatic usage
 */

export type {
  ListeningService,
  NetworkContext,
  ExposurePath,
  ServiceExposure,
  Finding,
  FindingSeverity,
} from "./engine/types.js";

export { collectListeningServices } from "./system/collectors/services.js";
export { buildNetworkContext } from "./engine/context.js";
export { resolveAllExposures } from "./engine/exposure.js";
export { analyzeExposures } from "./engine/heuristics.js";
export { renderReport, getExitCode } from "./ui/renderer.js";
