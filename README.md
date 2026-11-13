# Musica · prototipo

Player web personale che ascolta in streaming FLAC e altri formati audio dalla **cartella dell'app** su Dropbox.

- Accesso Dropbox di tipo *App folder* e in sola lettura (`files.metadata.read`, `files.content.read`).
- Login OAuth PKCE senza server: il permesso resta nel browser del dispositivo, nel codice non c'è nessun segreto.
- La pagina può comunicare solo con Dropbox (Content-Security-Policy).
- I brani non vengono salvati: vengono letti in streaming tramite link temporanei di Dropbox.

## Test a schermo spento
Il riquadro «Test a schermo spento» registra se il brano successivo parte da solo con l'iPhone bloccato
(✅ TEST SUPERATO / ❌ TEST FALLITO). Ci sono due modalità di passaggio: *Standard* e *Anticipato (sperimentale)*.
