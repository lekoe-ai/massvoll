# maßvoll.

Eine responsive, statische Web-App mit einer groben Blutalkohol-Schätzung und einem privaten Getränke-Sammelalbum.

## Lokal ansehen

1. Öffne `index.html` direkt im Browser. Falls der Browser lokalen Speicher dabei einschränkt, starte einen einfachen lokalen Webserver im Projektordner, zum Beispiel mit der Erweiterung **Live Server** in Visual Studio Code.
2. Öffne die lokale Adresse, die der Server anzeigt.
3. Gib für den Rechner Gewicht, grobe Körperwasser-Annahme, Trinkdauer, Zeit seit dem letzten Getränk sowie Menge und Alkoholgehalt der Getränke ein. Bestätige den Hinweis und wähle **Wert schätzen**.
4. Im Album kannst du einen Eintrag öffnen, ein Foto und eine Notiz ergänzen und lokal speichern.

Die App speichert Fotos und Notizen mit IndexedDB im Browser. Das ist kein Konto und synchronisiert nicht zwischen Geräten. Löschen der Browserdaten kann auch das Album löschen. Es werden keine Bilder hochgeladen.

## GitHub Pages

1. Lege diese Dateien in ein GitHub-Repository.
2. Öffne im Repository **Settings → Pages**.
3. Wähle bei **Build and deployment** die Bereitstellung aus einem Branch, wähle den Branch (zum Beispiel `main`) und als Ordner `/ (root)`.
4. Speichere. GitHub zeigt nach der Veröffentlichung die Seitenadresse in diesem Bereich an.

## Dateien

- `index.html` – Seitenstruktur und Texte
- `styles.css` – Gestaltung und responsive Layouts
- `app.js` – Rechner, Sammelalbum, Bildverarbeitung und lokale Speicherung

## Grenzen der Schätzung

Das Ergebnis verwendet eine vereinfachte Widmark-Näherung mit pauschalem Abbauwert von 0,15 ‰ pro Stunde und ist keine medizinische Messung. Die angezeigte Spanne rechnet unten mit 30 % Resorptionsdefizit und 0,2 ‰ Abbau pro Stunde, oben mit 15 % Zuschlag und 0,1 ‰ Abbau pro Stunde. Geschlecht/Körperwasser-Faktor und Trinkmengen sind nur grobe Eingaben. Individuelle Körperzusammensetzung, Aufnahmeverlauf, Essen, Medikamente, Gesundheit und weitere Faktoren lassen sich damit nicht verlässlich berücksichtigen. Die App kann weder Fahrtüchtigkeit noch einen sicheren Alkoholkonsum bestimmen. Nach Alkoholkonsum nicht fahren.

## Anpassungen

Texte stehen in `index.html`. Getränke, Kategorien, Ergebnistexte und Rechenwerte stehen oben in `app.js`. Die Sammlung enthält unter anderem Augustiner, Tegernseer, Paulaner, Hofbräu, Löwenbräu, Erdinger, Franziskaner, Schneider Weisse, Schlenkerla, Weltenburger und Ayinger. Farben, Abstände und Darstellung sind in `styles.css` definiert. Nach Änderungen die Seite neu laden.
