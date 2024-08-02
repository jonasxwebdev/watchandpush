import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import { Client } from "basic-ftp";

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

export function getBuildPath(path: String, templateFolderName: string = "templates"): string {
	// Split the path by '/'
	const parts = path.split("/");

	// Find the index of the last 'templates' occurrence
	let lastIndex = -1;
	for (let i = 0; i < parts.length; i++) {
		if (parts[i] === templateFolderName) {
			lastIndex = i;
		}
	}

	// If no 'templates' folder is found or it's the last part of the path, return an empty string
	if (lastIndex === -1 || lastIndex === parts.length - 1) {
		return "";
	}

	// Reconstruct the path after the last 'templates' folder
	const pathAfterTemplates = parts.slice(0, lastIndex + 2).join("/");

	return pathAfterTemplates;
}

// async function readPackageJson(folderPath: string): Promise<object> {
// 	const packageJsonPath = path.join(folderPath, "/package.json");

// 	try {
// 		// Read the contents of the package.json file asynchronously
// 		const data = await fs.readFile(packageJsonPath, "utf-8");

// 		// Parse the JSON content
// 		const packageJson = JSON.parse(data);

// 		// Return the "scripts" object
// 		return packageJson.scripts;
// 	} catch (error) {
// 		console.error("Error reading or parsing package.json:", error);
// 		return {};
// 	}
// }

// function compareBuildPreferences(obj: { [key: string]: any }, buildPreferences: string) {
// 	for (const key of Object.keys(obj)) {
// 		if (key.includes(buildPreferences)) {
// 			return key;
// 		}
// 	}
// 	return undefined;
// }

// export function craftBuildCommand(folderPath: string, buildPreferences: string): string {
// 	readPackageJson(folderPath).then((scripts) => {
// 		return `npm run ${compareBuildPreferences(scripts, buildPreferences)}`;
// 	});
// 	return "";
// }

export function getBuildCommand(buildType: string, folderPath: string): string | null {
	const packageJsonPath = path.join(folderPath, "/package.json");
	if (fs.existsSync(packageJsonPath)) {
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
		const scripts = packageJson.scripts;
		for (const scriptName in scripts) {
			if (scripts.hasOwnProperty(scriptName)) {
				if (scriptName.includes(buildType)) {
					return `npm run ${scriptName}`;
				}
			}
		}
		vscode.window.setStatusBarMessage(`Kein Build-Skript für ${buildType} gefunden!`, 5000);
		return null;
	} else {
		vscode.window.setStatusBarMessage("package.json nicht gefunden!", 5000);
		return null;
	}
}
