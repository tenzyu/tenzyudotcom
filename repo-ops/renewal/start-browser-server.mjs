import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, openSync } from "node:fs";
import { resolve } from "node:path";
import { publicBrowserEnvironment } from "./browser-environment.mjs";

const repositoryRoot = resolve(import.meta.dirname, "../..");
const evidenceDir = resolve(
	process.env.BROWSER_EVIDENCE_DIR ?? "/tmp/tenzyudotcom-browser-evidence",
);

if (
	evidenceDir === repositoryRoot ||
	evidenceDir.startsWith(`${repositoryRoot}/`)
) {
	throw new Error("BROWSER_EVIDENCE_DIR must be outside the repository");
}

mkdirSync(evidenceDir, { recursive: true, mode: 0o700 });
const log = openSync(`${evidenceDir}/web-server.log`, "w", 0o600);
const env = publicBrowserEnvironment();
const build = spawnSync("bun", ["--no-env-file", "nx", "run", "ui:build"], {
	cwd: repositoryRoot,
	env,
	stdio: ["ignore", log, log],
});
if (build.error) throw build.error;
if (build.status !== 0) {
	throw new Error(`UI dependency build exited ${build.status}`);
}

const child = spawn(
	"bun",
	["--no-env-file", "run", "dev", "--hostname", "127.0.0.1", "--port", "4173"],
	{
		cwd: resolve(repositoryRoot, "product/apps/web"),
		env,
		stdio: ["ignore", log, log],
	},
);

const stop = (signal) => {
	if (child.exitCode === null) child.kill(signal);
};

process.once("SIGINT", () => stop("SIGINT"));
process.once("SIGTERM", () => stop("SIGTERM"));
child.once("error", (error) => {
	console.error(error);
	process.exitCode = 1;
});
child.once("exit", (code, signal) => {
	process.exitCode = code ?? (signal ? 1 : 0);
});
