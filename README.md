# watchandpush

## Vorwort

Diese Erweiterung ist nur für Mitarbeiter der Ulmer WSE gedacht und funktioniert auch nur in dieser Entwicklungsumgebung.

## Befehle

mit cmd + shift + P kann das VS Code command Fesnter aufgerufen werden. Hier sind nach aktiverung nun folgende Befehle hinterlegt:

-   Watch and Build
-   Stop Watching

## Features

"Watch and Push": Nach aktivierung überwacht sie die festgelegte Dateinendung im aktuellen Workspace Ordner und führt nach einer Änderung dieser den vorher festgelegten build aus. Gleichzeitig werden alle css Dateien überwacht und bei einer Änderung auf den hinterlegten FTP Server geladen.

"Stop Watching": alle aktiven Datei Watcher werden inaktiv gestellt.

## Voraussetzungen

Vorraussetzung ist ein .vscode Ordner auf /templates Ebene.
In diesem muss sich eine wnb.json befinden.

```
├── /
│   ├── .vscode/
│   │   ├── wnb.json
├── ├── templates/
│   │   ├── **/ alle Projekte
```

### Wichtig! "\/" ist dabei der Workspace Ordner in VSCode

Aufbau der wnb.json:

```json
{
	"fileExtension": ".htm",
	"buildType": "prod",
	"templateFolderName": "templates",
	"ftp": {
		"host": "ulmer Webserver Name",
		"user": "Benutzername",
		"password": "********",
		"remotePath": "/templates"
	}
}
```

der buildType, entweder _"prod"_ oder _"dev"_ entscheidet welcher build command aus der Package.json des jeweiligen Projekts ausgelesen und ausgeführt wird.

_templatesFolderName_ ist der OrdnerName in dem sich die lokale Projektstruktur befindet. Im Beispiel oben also "templates".

_fileExtension_ und _remotePath_ sollten so belassen werden.
_RemotePath_ muss angepasst werden, wenn der FTP Benutzer an einer früheren Stelle des FTP Servers einsteigt. hier muss der Pfad bis inkl. zum "templates/" Ordner angegeben werden.

## Bekannte Fehler

-   wenn "dev" als build Type gewählt wird, kann es bis zu 10 Sekunden dauern, je nach Leistung des Clients, bis der build ausgeführt wird und die CSS Datei hochgeladen wird.

## Release Notes

## 0.1 beta

Der erste Beta Release. Logo und Banner sind nun im Marketplace zu sehen.

## 0.0.4

Der Code wurde nun soweit verallgemeinert, dass auch Zeitschriften Objekte, welche mit Tailwind aufgsetzt sind, korrekt erfasst werden und das CSS generiert wird.

## 0.0.3

Neuer Befehl zur Pausierung der Watcher

## 0.0.2

Template Folder Name ausgelagert

### 0.0.1

errster MVP release

---
