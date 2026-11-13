# Musica

Player web personale che ascolta in streaming FLAC e altri formati audio dalla **cartella dell'app** su Dropbox.

## Privacy
- Accesso Dropbox di tipo *App folder* e in sola lettura (`files.metadata.read`, `files.content.read`).
- Login OAuth PKCE senza server: il permesso resta nel browser del dispositivo, nel codice non c'è nessun segreto.
- La pagina può comunicare solo con Dropbox (Content-Security-Policy). Nessun font, script o servizio esterno.
- I brani non vengono salvati: vengono letti in streaming tramite link temporanei di Dropbox.

## Organizzazione delle cartelle
```
Applicazioni/<nome app>/Artista/Album/01 Brano.flac
Applicazioni/<nome app>/Artista/2019 - Album/cover.jpg
Applicazioni/<nome app>/Artista/Album (CD doppio)/CD1/…
```
- Copertina: un'immagine nella cartella dell'album (preferibilmente `cover.jpg` o `folder.jpg`); in mancanza, quella incorporata nel FLAC.
- Titolo, artista, durata e qualità (es. FLAC 24/96) vengono letti dai tag dei FLAC (solo i primi 64 KB di ogni file).

## Funzioni (v1.0)
Libreria per artisti e album, ricerca, coda con riproduzione casuale e ripetizione, ±10 secondi,
comandi sulla schermata di blocco (brano precedente/successivo), ripresa dal punto interrotto,
aggiornamento incrementale della libreria, diagnostica in Impostazioni.
