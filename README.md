# Musica

Player web personale che ascolta in streaming FLAC e altri formati audio dalla **cartella dell'app** su Dropbox.

## Privacy
- Accesso Dropbox di tipo *App folder* (solo la cartella dell'app), in lettura (`files.metadata.read`, `files.content.read`).
- Facoltativo: `files.content.write`, solo per salvare preferiti, playlist e ascolti in un unico file,
  `/_player/dati.json`, nella cartella dell'app. Il player non scrive né cancella nient'altro: la musica non viene toccata.
  Senza questo permesso i dati restano solo sul dispositivo.
- Login OAuth PKCE senza server: il permesso resta nel browser del dispositivo, nel codice non c'è nessun segreto.
- La pagina può comunicare solo con Dropbox (Content-Security-Policy). Nessun font, script o servizio esterno. L'unica altra sorgente audio ammessa è `blob:`, cioè i brani precaricati in memoria.
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

## Funzioni (v1.12)

Pagina dell'artista: «Notizie» apre Google News sull'artista in una nuova scheda (link diretto, senza referrer;
il player non contatta Google).


Home: «Il tuo mix» (rifatto a ogni apertura della Home, simile agli ultimi ascolti: artisti e album
ascoltati di recente, preferiti, brani mai sentiti, massimo 4 brani per album), album ascoltati di
recente, preferiti (brani, album, artisti) e playlist. Un ascolto conta dopo 30 secondi o metà brano.
Menu ⋯ su ogni brano: preferiti, aggiungi a playlist, riproduci dopo, vai all'album o all'artista.
Cuore nel lettore, nella pagina dell'album e dell'artista. Playlist: crea, rinomina, elimina, sposta
e togli brani; il mix si può salvare come playlist. Con il permesso di scrittura i dati sono uguali
su tutti i dispositivi (vince la modifica più recente, la cronologia si unisce).

Libreria per artisti e album, ricerca, coda con riproduzione casuale e ripetizione, ±10 secondi,
comandi sulla schermata di blocco (brano precedente/successivo), ripresa dal punto interrotto,
aggiornamento incrementale della libreria, diagnostica in Impostazioni.

Equalizzatore sperimentale (spento di default): 10 bande da 31 Hz a 16 kHz e preset
(Piatto, Mega Bass, Bassi, Rock, Pop, Voce, Classica, Acuti, Loudness). Usa Web Audio e
imposta la sessione audio di iOS su "playback", così Safari lo tratta come musica e non
come suono di sottofondo. Spegnendolo il lettore torna subito normale, senza ricaricare la
pagina. Se Dropbox non consente l'accesso richiesto, l'equalizzatore si spegne da solo.

Precarico (attivo di default, disattivabile in Impostazioni): aprendo un album con la musica ferma
il primo brano viene scaricato in memoria; mentre un brano suona, dopo 5 secondi viene scaricato
per intero il successivo (sempre uno avanti). I file sono identici agli originali, il passaggio non
aspetta la rete e il salto nel brano è istantaneo. La memoria si libera al cambio di brano; nulla
viene salvato sul dispositivo. Uscendo da un album il download non finito si interrompe. I file
oltre 150 MB restano in streaming. Il registro misura la partenza di ogni brano e la velocità dei
download.

Lettore di riserva: un secondo lettore tiene pronto il brano successivo (collegato e con l'inizio già
caricato) un secondo dopo l'avvio del brano attuale, e il primo brano quando apri un album. Con lo
schermo acceso ⏭ o un tocco su quel brano lo fanno solo partire. A schermo spento e a fine brano
resta il passaggio sullo stesso lettore (iOS non permette di cambiare lettore in sottofondo).

Ripartenza automatica (attiva di default, disattivabile in Impostazioni): se iOS ferma la musica
mentre è in sottofondo (microfono, Siri, chiamata), riparte quando l'interruzione finisce. Non
riparte dopo una pausa data da te, dopo più di 10 minuti o se il lettore è aperto. Il segnale di
fine interruzione arriva dal motore dell'equalizzatore oppure, se Safari lo fornisce, dalla
sessione audio.
