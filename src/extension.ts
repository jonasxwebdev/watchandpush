import * as chokidar from "chokidar";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { execBuildCommand, getPathAfterLastOccurrence, getProjectRoot, uploadFile } from "./helper";

interface FTPSettings {
	host: string;
	user: string;
	password: string;
	remotePath: string;
}

interface Config {
	fileExtension: string;
	buildType: string;
	templateFolderName: string;
	ftp: FTPSettings;
}
let watcher: chokidar.FSWatcher | null = null;
let cssWatcher: chokidar.FSWatcher | null = null;

function readConfig(folderPath: string): Config | null {
	const configPath = path.join(folderPath, ".vscode/wnb.json");
	if (fs.existsSync(configPath)) {
		const configContent = fs.readFileSync(configPath, "utf-8");
		return JSON.parse(configContent) as Config;
	} else {
		vscode.window.showErrorMessage("Konfigurationsdatei wnb.json nicht gefunden!");
		return null;
	}
}

export function activate(context: vscode.ExtensionContext) {
	vscode.window.setStatusBarMessage("WnB");
	let watchAndBuildCommand = vscode.commands.registerCommand("extension.watchAndBuild", () => {
		vscode.window.setStatusBarMessage("Dateien werden überwacht...");

		const folderPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		if (!folderPath) {
			vscode.window.showErrorMessage("Kein Ordner gefunden!");
			return;
		}

		const config = readConfig(folderPath);
		if (!config) {
			return;
		}

		const { fileExtension, buildType, templateFolderName, ftp: ftpSettings } = config;

		// Something to use when events are received.
		const log = console.log.bind(console);

		watcher = chokidar.watch(`${folderPath}/**/*${fileExtension}`, {
			ignored: /node_modules/,
			persistent: true,
		});

		cssWatcher = chokidar.watch(`${folderPath}/**/*.css`, {
			persistent: true,
		});

		watcher.on("change", (filePath: string) => {
			// vscode.window.setStatusBarMessage(
			// 	`Änderung erkannt: ${filePath.substring(0, filePath.lastIndexOf("/"))}`,
			// 	5000
			// );
			log(getProjectRoot(filePath));

			var buildPath = getProjectRoot(filePath, templateFolderName);
			// korrekten Build command and der richtigen Stelle ausführen
			execBuildCommand(buildType, buildPath);
		});
		cssWatcher.on("change", async (cssPath) => {
			const parts = cssPath.split("/");
			vscode.window.setStatusBarMessage(`CSS-Datei geändert: ${parts[parts.length - 1]}`, 2000);
			log(parts);
			log(getPathAfterLastOccurrence(cssPath, templateFolderName));
			log(path.join(ftpSettings.remotePath, parts.slice(-3).join("/")));
			await uploadFile(
				ftpSettings,
				cssPath,
				path.join(ftpSettings.remotePath, getPathAfterLastOccurrence(cssPath, templateFolderName))
			);
			// log(cssPath);
			// log(path.join(ftpSettings.remotePath, parts.slice(-3).join("/")));
		});
	});

	let stopWatchingCommand = vscode.commands.registerCommand("extension.stopWatching", () => {
		if (watcher) {
			watcher.close();
			watcher = null;
			vscode.window.setStatusBarMessage("Überwachung gestoppt");
		} else {
			vscode.window.setStatusBarMessage("Keine Überwachung aktiv", 5000);
		}

		if (cssWatcher) {
			cssWatcher.close();
			cssWatcher = null;
		}
	});

	context.subscriptions.push(watchAndBuildCommand);
	context.subscriptions.push(stopWatchingCommand);
}

export function deactivate() {
	if (watcher) {
		watcher.close();
	}
	if (cssWatcher) {
		cssWatcher.close();
	}
}
