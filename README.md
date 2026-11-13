# Musica

Player web personale che ascolta in streaming FLAC e altri formati audio dalla **cartella dell'app** su Dropbox.

## Privacy
- Accesso Dropbox di tipo *App folder* e in sola lettura (`files.metadata.read`, `files.content.read`).
- Login OAuth PKCE senza server: il permesso resta nel browser del dispositivo, nel codice non c'è nessun segreto.
- La pagina può comunicare solo con Dropbox (Content-Security-Policy). Nessun font, script o servizio esterno.
- I brani non vengono salvati: vengono letti in streaming tramite link temporanei di Dropbox.

## Organizzazione delle cartelle
Basta copiare le cartelle degli album così come sono dentro `Applicazioni/<nome app>/`.
L'app ricava artista, album e anno dal nome della cartella e poi li corregge con i tag dei FLAC o con il file `.cue`:
```
Adele - 21 (2011) [FLAC 16-44]/01. Adele - Rolling in the Deep.flac
1983 - Pantera - Metal Magic (LP, …, 24-48)/01 - Ride My Rocket.m4a
Black Sabbath 1970 - Paranoid [SACD] (2010 SHM-SACD ISO) flac 24-48/Paranoid (1) War Pigs.flac
Nirvana - In Utero (…) (2023) [16Bit-44.1kHz] FLAC/Disc 1/01. ….flac
1956. Harry Belafonte - Calypso {AFZ 138}/… .flac + … .cue   (album in un file unico)
Artista/Album/01 Brano.flac                                      (struttura classica)
```
- Copertina: scelta tra le immagini dell'album (cover/folder/front, anche in Artwork, Covers, Scans), scartando retro, disco, booklet; in mancanza, quella incorporata nel FLAC.
- Album in un file unico con `.cue`: i brani vengono ricavati dal `.cue` e la riproduzione passa da uno all'altro senza interruzioni.

## Funzioni (v1.4)
Libreria per artisti e album, ricerca, coda con riproduzione casuale e ripetizione, ±10 secondi,
comandi sulla schermata di blocco (brano precedente/successivo), ripresa dal punto interrotto,
aggiornamento incrementale della libreria, diagnostica in Impostazioni.

Equalizzatore sperimentale (spento di default): 10 bande da 31 Hz a 16 kHz e preset
(Piatto, Mega Bass, Bassi, Rock, Pop, Voce, Classica, Acuti, Loudness). Usa Web Audio e
imposta la sessione audio di iOS su "playback", così Safari lo tratta come musica e non
come suono di sottofondo. Spegnendolo il lettore torna subito normale, senza ricaricare la
pagina. Se Dropbox non consente l'accesso richiesto, l'equalizzatore si spegne da solo.
