import * as chokidar from "chokidar";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { getBuildCommand, getBuildPath, uploadFile } from "./helper";

import { exec } from "child_process";

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
	let disposable = vscode.commands.registerCommand("extension.watchAndBuild", () => {
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

		const watcher = chokidar.watch(`${folderPath}/**/*${fileExtension}`, {
			ignored: /node_modules/,
			persistent: true,
		});

		const cssWatcher = chokidar.watch(`${folderPath}/**/*.css`, {
			persistent: true,
		});

		watcher.on("change", (filePath: string) => {
			vscode.window.setStatusBarMessage(
				`Änderung erkannt: ${filePath.substring(0, filePath.lastIndexOf("/"))}`,
				5000
			);
			log(getBuildPath(filePath));

			var buildPath = getBuildPath(filePath, templateFolderName);
			var buildCommand = getBuildCommand(buildType, buildPath);
			if (!buildCommand) {
				return;
			}
			exec(
				buildCommand,
				{
					cwd: buildPath,
				},
				(error, stdout, stderr) => {
					if (error) {
						vscode.window.showErrorMessage(`Fehler beim Build: ${stderr}`);
						return;
					}
					vscode.window.setStatusBarMessage("Build erfolgreich abgeschlossen", 5000);
				}
			);
		});
		cssWatcher.on("change", async (cssPath) => {
			vscode.window.setStatusBarMessage(
				`CSS-Datei geändert: ${cssPath.substring(0, cssPath.lastIndexOf("/"))}`,
				5000
			);
			const parts = cssPath.split("/");
			await uploadFile(ftpSettings, cssPath, path.join(ftpSettings.remotePath, parts.slice(-3).join("/")));
			// log(cssPath);
			// log(path.join(ftpSettings.remotePath, parts.slice(-3).join("/")));
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
