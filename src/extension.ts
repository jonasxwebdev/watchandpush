import * as chokidar from "chokidar";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import Client from "ftp-ts";
import { exec } from "child_process";

interface FTPSettings {
	host: string;
	user: string;
	password: string;
	remotePath: string;
}

interface Config {
	fileExtension: string;
	buildCommand: string;
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
		vscode.window.showInformationMessage("Dateien werden überwacht...");

		const folderPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
		if (!folderPath) {
			vscode.window.showErrorMessage("Kein Ordner gefunden!");
			return;
		}

		const config = readConfig(folderPath);
		if (!config) {
			return;
		}

		const { fileExtension, buildCommand, ftp: ftpSettings } = config;

		// Something to use when events are received.
		const log = console.log.bind(console);

		const watcher = chokidar.watch(`${folderPath}/**/*${fileExtension}`, {
			ignored: /node_modules/,
			persistent: true,
		});

		const cssWatcher = chokidar.watch(`${folderPath}/**/*.css`, {
			persistent: true,
		});

		watcher.on("change", (filePath) => {
			vscode.window.showInformationMessage(
				`Änderung erkannt: ${filePath}, ${filePath.substring(0, filePath.lastIndexOf("/"))}`
			);

			var buildPath = filePath.substring(0, filePath.lastIndexOf("/"));
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
					vscode.window.showInformationMessage("Build erfolgreich abgeschlossen");
				}
			);
			// vscode.window.showInformationMessage(
			// 	`Css Watcher gestartet für:${path.join(
			// 		folderPath,
			// 		"/templates/ulmer-akademie-2024/",
			// 		cssFileName
			// 	)}`
			// );
		});
		cssWatcher.on("change", async (cssPath) => {
			vscode.window.showInformationMessage(`CSS-Datei geändert: ${cssPath}`);
			// cssWatcher.close();
			const parts = cssPath.split("/");
			log(cssPath);
			log(path.join(ftpSettings.remotePath, parts.slice(-3).join("/")));
			await Client.connect({
				host: ftpSettings.host,
				user: ftpSettings.user,
				password: ftpSettings.password,
				secure: "true",
				secureOptions: {
					rejectUnauthorized: false,
				},
			})
				.then((c) => {
					log(c);
					c.put(`${cssPath}1`, path.join(ftpSettings.remotePath, parts.slice(-3).join("/")))
						.then(() => {
							vscode.window.showInformationMessage("CSS-Datei erfolgreich hochgeladen");
						})
						.catch((err) => {
							vscode.window.showErrorMessage(`Fehler beim Hochladen: ${err.message}`);
						});
					c.end();
				})
				.catch((err) => {
					vscode.window.showErrorMessage(`Fehler bei der Kommunikation mit dem FTP Server: ${err.message}`);
				});
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
