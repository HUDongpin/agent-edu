# MCP Kurs 10 – Capstone Evidence Pack

> Diese Ausgabe ist vollständig aus der englischen Quelle übersetzt und hat automatisierte Struktur- und Fachterminologieprüfungen bestanden. Eine menschliche sprachliche Überprüfung wird nicht beansprucht.

Protokollbasislinie: MCP `2026-07-28`<br>
Kursbewertungsversion: `2026-07-28-v2`<br>
Schnappschuss der Kursnachweise: `2026-08-24`

Diese Vorlage unterstützt entweder den Builder-Track (Implementierung eines kleinen Servers und Clients) oder den Auditor-Track (Reproduzieren und Überprüfen eines öffentlichen Servers). Beim Ausfüllen handelt es sich um eine Selbstbescheinigung, nicht um ein unabhängig verifiziertes Zertifikat. Entfernen Sie alle Geheimnisse und privaten Daten, bevor Sie sie teilen.

## 1. Passende Entscheidung

- Benutzer und Job:
- Warum MCP statt einer direkten API oder gewöhnlichen Funktion:
- Mindestbelastbarkeitsfläche:
- Explizite Nichtziele:
- Behörde eingeführt:

## 2. Architektur und Datenfluss

Hängen Sie ein Diagramm an, das den Benutzer, das Modell, den Host, einen MCP-Client pro Server, Server, Upstream-Systeme, Transporte, Anmeldeinformationen, Protokolle und den gespeicherten Status zeigt. Geben Sie für jede Kante an, welche Daten sie überschreiten und wer sie beibehalten kann.

## 3. Versionsmanifest

| Artikel | Genaue Version oder unveränderliche Revision | Quelle | Verifiziertes Datum |
| --- | --- | --- | --- |
| MCP Protokoll | 2026-07-28 |  |  |
| SDK |  |  |  |
| Server |  |  |  |
| Gastgeber/Kunde |  |  |  |
| Laufzeit und Sperrdatei |  |  |  |

## 4. Fähigkeitsverträge

Notieren Sie für jedes Tool, jede Ressource, jede Eingabeaufforderung, jede Anfrage und jede ausgehandelte Erweiterung Folgendes:

- Name oder URI;
- Interaktionsbesitzer;
- Eingabe- und Ausgabeschema;
- Autorisierungs- und Genehmigungsregel;
- normales, leeres, ungültiges, nicht autorisiertes, Konflikt-, Timeout- und Upstream-Fehlerverhalten;
- Beweise zurückgegeben;
- Rollback oder Kompensation für Schreibvorgänge.

## 5. Direkter Protokollnachweis

- `server/discover` request/response mit aktuellen Metadaten pro Anfrage und `resultType`;
- primitive list/read/get/call Spuren;
- normale und erwartete Fehlerspuren;
- Redaktionsprotokoll;
- Hinweis für jede Legacy-Inspector-Benutzeroberfläche, die nur als historischer Beweis aufbewahrt wird.

## 6. Nachweis der Host-Integration

- Hostname und genaue Version;
- konfigurierte Transport- und Serveridentität;
- ausgehandeltes Protokoll und Fähigkeiten;
- effektive Tool-Zulassungsliste und Genehmigungsrichtlinie;
- ein erfolgreicher schreibgeschützter Workflow;
- ein verweigerter oder erwarteter Workflow.

## 7. Bedrohungsmodell und gegnerische Tests

Führen Sie alle 12 unten genannten Fälle aus. Wenn eine Zeile verwandte Varianten kombiniert, üben Sie jede Variante aus und behalten Sie separate Beobachtungen in dieser Zeile bei.

| Fall | Vermögenswert oder Grenze | Zwangskontrolle | Erwartetes Signal | Beobachtetes Ergebnis |
| --- | --- | --- | --- | --- |
| 1 | Prompt- oder Ergebnisinjektion | Bewahren Sie zurückgegebene Inhalte in einem nicht vertrauenswürdigen Datenkanal auf | Durch die Injektion kann die Richtlinie mit höherer Priorität nicht geändert werden |  |
| 2 | Feindliche Anmerkungen oder versteckte Anweisungen | Behandeln Sie Anmerkungen als Hinweise; Überprüfen Sie Inhaltsblöcke | Keine Befugnis- oder Richtlinienerweiterung |  |
| 3 | Pfaddurchquerung | Kanonisieren und beschränken Sie erlaubte Pfade | Pfad außerhalb des Gültigkeitsbereichs abgelehnt |  |
| 4 | Übergroßer Inhalt | Erzwingen Sie Byte-, Element- und Kontextbeschränkungen | Begrenztes Ablehnungs- oder sicheres Kürzungssignal |  |
| 5 | Schemaumgehung oder unbekannte Felder | Validieren Sie das JSON-Schema und lehnen Sie Extras ab | Deterministisches Ergebnis ungültiger Parameter |  |
| 6 | Falsche Zielgruppe oder falsches Token-Passthrough | Zielgruppe validieren; Leiten Sie niemals Client-Tokens stromaufwärts weiter | Anfrage ohne Token-Leak abgelehnt |  |
| 7 | Umleitung, SSRF oder DNS-Neubindung | Setzen Sie Ziele auf die Zulassungsliste und validieren Sie jeden Hop erneut | Internes oder unzulässiges Ziel blockiert |  |
| 8 | State-Handle-Wiedergabe | Verwenden Sie unvorhersehbare Handles und autorisieren Sie jede Anfrage erneut | Benutzerübergreifende oder abgelaufene Wiedergabe verweigert |  |
| 9 | Doppeltes Schreiben | Idempotenz oder exakter Revisionswächter | Höchstens eine beabsichtigte Änderung |  |
| 10 | Stornierungsrennen | Kooperative Stornierung plus Statusprüfung nach der Stornierung | Keine versteckten Spätnebenwirkungen |  |
| 11 | Paket- oder Endpunktkompromittierung | Pin unveränderlicher Herkunft und Übungsdeaktivierungspfad | Eine beeinträchtigte Integration kann isoliert werden |  |
| 12 | Upstream-Timeout | Frist, begrenzter Wiederholungsversuch und klare Fehlerzuordnung | Kein unendlicher Hang- oder Duplikateffekt |  |

## 8. Quellen und Zahlen

Für jede Sachbehauptung oder wiederverwendete Abbildung: Datensatztitel, Herausgeber, direkte URL, genaue Überarbeitung, sofern möglich, access/observation-Datum, Beweisstufe, Wiederverwendungsbasis und die begrenzte Behauptung, die sie unterstützt.

## 9. Bewertung und Einschränkungen

Melden Sie Verbindung, Entdeckung, Auswahl, Argumentgültigkeit, Ausführung, Autorisierung, Benutzerverweigerung, Abbruch und End-to-End-Aufgabenergebnisse separat. Zustandsprobe, Umgebung, fehlende Beweise und bekannte Einschränkungen.

## 10. Deaktivierungs- und Wiederherstellungsübung

- einen Server oder ein Tool deaktivieren;
- seine Berechtigung widerrufen;
- Identifizieren Sie die letzten Aktionen anhand geschwärzter Protokolle.
- Wiederherstellen einer bekanntermaßen guten Konfiguration;
- Stellen Sie sicher, dass der alte Server nicht agieren kann.
- Erfassen Sie Zeit, Eigentümer, Ausfälle und Folgearbeiten.

## Freigabe durch Gutachter (optional)

- Rezensent:
- Überprüfungsdatum:
- Geprüfte Beweismittel:
- Reproduzierter sicherer Pfad:
- Reproduzierte erwartete Fehler:
- Korrekturen erforderlich:
- Entscheidung und Geltungsbereich:
