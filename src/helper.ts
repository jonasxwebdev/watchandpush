import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { Client } from "basic-ftp";
import { exec } from "child_process";

interface FTPSettings {
	host: string;
	user: string;
	password: string;
	remotePath: string;
}

export async function uploadFile(ftpSettings: FTPSettings, localPath: string, remotePath: string): Promise<void> {
	const client = new Client();

	client.ftp.verbose = true;

	try {
		await client.access({
			host: ftpSettings.host,
			user: ftpSettings.user,
			password: ftpSettings.password,
			secure: true,
			secureOptions: {
				rejectUnauthorized: false,
			},
		});
		await client.uploadFrom(localPath, remotePath);
		vscode.window.setStatusBarMessage("Build und Upload erfolgreich", 5000);
	} catch (err) {
		vscode.window.showErrorMessage(`Fehler beim Hochladen: ${err}`);
	} finally {
		client.close();
	}
}

export function getProjectRoot(path: String, templateFolderName: string = "templates"): string {
	// Split the path by '/'
	const parts = path.split("/");

	// Find the index of the last 'templates' occurrence
	let lastIndex = -1;
	for (let i = 0; i < parts.length; i++) {
		if (parts[i] === templateFolderName) {
			lastIndex = i;
		}
	}

	// If no 'templateFolderName' folder is found or it's the last part of the path, return an empty string
	if (lastIndex === -1 || lastIndex === parts.length - 1) {
		return "";
	}

	// Reconstruct the path after the last 'templateFolderName' folder
	const pathAfterTemplates = parts.slice(0, lastIndex + 2).join("/");

	return pathAfterTemplates;
}

export function getPathAfterLastOccurrence(filepath: string, searchString: string): string {
	const lastIndex = filepath.lastIndexOf(searchString);

	if (lastIndex !== -1) {
		// Adding the length of searchString to get the part after the searchString
		return filepath.substring(lastIndex + searchString.length);
	} else {
		return ""; // Return an empty string if searchString is not found
	}
}

function removeLastFolder(path: string): string {
	const segments = path.split("/");

	// Check if there are at least two segments (one folder and one file/last folder)
	if (segments.length > 1) {
		segments.pop(); // Remove the last segment
		return segments.join("/");
	}

	return path; // Return the original path if it doesn't have enough segments
}
function extractProjectName(path: string): string {
	const segments = path.split("/");
	// Check if there are at least two segments (one folder and one file/last folder)
	if (segments.length > 1) {
		return segments[segments.length - 1];
	}
	return path; // Return the original path if it doesn't have enough segments
}
function sanitizeUnderscores(input: string): string {
	return input.replace(/_/g, "-");
}

export function execBuildCommand(buildType: string, ProjectPath: string): void | null {
	const packageJsonPath = path.join(ProjectPath, "/package.json");
	const defaultProjectPath = path.join(
		removeLastFolder(ProjectPath),
		"/_default_tailwind3_zeitschriften/package.json"
	);
	if (fs.existsSync(packageJsonPath)) {
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
		const scripts = packageJson.scripts;
		for (const scriptName in scripts) {
			if (scripts.hasOwnProperty(scriptName)) {
				if (scriptName.includes(buildType)) {
					exec(
						`npm run ${scriptName}`,
						{
							cwd: ProjectPath,
						},
						(error, stdout, stderr) => {
							if (error) {
								vscode.window.showErrorMessage(`Fehler beim Build: ${stderr}`);
								return;
							}
							vscode.window.setStatusBarMessage("Build erfolgreich", 2000);
						}
					);
					return;
				}
			}
		}
		vscode.window.showErrorMessage(`Kein Build-Skript für ${buildType} gefunden!`);
		return null;
	} else if (fs.existsSync(defaultProjectPath)) {
		const defaultPackageJson = JSON.parse(fs.readFileSync(defaultProjectPath, "utf-8"));
		const defaultScripts = defaultPackageJson.scripts;
		for (const key of Object.keys(defaultScripts)) {
			if (key.includes(sanitizeUnderscores(extractProjectName(ProjectPath))) && key.includes(buildType)) {
				console.log(key);
				console.log(defaultProjectPath);
				exec(
					`npm run ${key}`,
					{
						cwd: removeLastFolder(defaultProjectPath),
					},
					(error, stdout, stderr) => {
						if (error) {
							vscode.window.showErrorMessage(`Fehler beim Build: ${stderr}`);
							return;
						}
						vscode.window.setStatusBarMessage("Build erfolgreich", 2000);
					}
				);
				return;
			}
		}
		vscode.window.showErrorMessage(
			`Kein default Build-Skript für ${sanitizeUnderscores(
				extractProjectName(ProjectPath)
			)} ${buildType} gefunden!`
		);
		return null;
	} else {
		vscode.window.showErrorMessage("package.json nicht gefunden!");
		return null;
	}
}
