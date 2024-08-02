# watchandpush README

This is the README for your extension "watchandpush". After writing up a brief description, we recommend including the following sections.

## Features

Diese Erweiterung führt den Befehl "Watch and Push" ein. Nach aktivierung überwacht sie die festgelegte Dateinendung im aktuellen Workspace Ordner und führt nach einer Änderung dieser den vorher festgelegten build aus. Gleichzeitig werden alle css Dateien überwacht und bei einer Änderung auf den hinterlegten FTP Server geladen.

Diese Erweiterung ist nur für Mitarbeiter der Ulmer WSE gedacht und funktioniert auch nur in dieser Entwicklungsumgebung.

## Requirements

Vorraussetzung ist ein .vscode Ordner auf /templates Ebene.
In diesem muss sich eine wnb.json befinden.

```
├── /
│   ├── .vscode/
│   │   ├── wnb.json
├── ├── templates/
│   │   ├── **/ alle Projekte
```

Mit folgendem inhaltlichen Aufbau:

```json
{
	"fileExtension": ".htm",
	"buildType": "prod",
	"ftp": {
		"host": "ulmer Webserver Name",
		"user": "Benutzername",
		"password": "********",
		"remotePath": "/templates"
	}
}
```

der buildType, entweder "prod" oder "dev" entscheidet welcher build command aus der Package.json des jeweiligen Projekts ausgelesen und ausgeführt wird.

fileExtension und remotePath sollten so belassen werden. RemotePath muss angepasst werden, wenn der FTP Benutzer an einer anderen Stelle des FTP Servers einsteigt. hier muss der Pfad bis zum "templates/" Ordner angegeben werden.

## Extension Settings

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

errster MVP release

---
