# Basalto

Player web personale che ascolta in streaming FLAC e altri formati audio dalla **cartella dell'app** su Dropbox.

## Privacy
- Accesso Dropbox di tipo *App folder* (solo la cartella dell'app), in lettura (`files.metadata.read`, `files.content.read`).
- Facoltativo: `files.content.write`, solo per salvare preferiti, playlist e ascolti nel file
  `/_player/dati.json`; se nel Remix si usa la batteria vera, i suoni e i ritmi in `/_batteria/`; i remix salvati, come file nuovi, in `/Remix/`. Sempre nella cartella dell'app.
  Il player non scrive né cancella nient'altro: la musica non viene toccata.
  Senza questo permesso i dati restano solo sul dispositivo.
- Login OAuth PKCE senza server: il permesso resta nel browser del dispositivo, nel codice non c'è nessun segreto.
- La pagina può comunicare solo con Dropbox e con il proprio sito, per `version.json` (Content-Security-Policy). Nessun font, script o servizio esterno. L'unica altra sorgente audio ammessa è `blob:`, cioè i brani precaricati in memoria.
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

## Funzioni (v1.17)

Nome dell'app: Basalto. All'apertura una schermata nera con il solo logo per 1 secondo (v1.18).


v1.36: **la batteria parte prima e si carica subito**.
- Analisi del ritmo mentre il brano si scarica: il file in arrivo si legge a pezzi (solo la parte già arrivata); dopo i primi 25-30 s analizzati ci sono battiti provvisori e la batteria parte, poi l'analisi definitiva li sostituisce. La batteria non va oltre la parte analizzata.
- Alla prima partenza della batteria l'ascolto già fatto per l'aggancio non si butta più (prima ripartiva da zero): con la posizione stimata si aggancia in pochi secondi anche durante lo scaricamento.
- Suoni veri e ritmi dei batteristi tenuti anche sul telefono (Cache API): dalla seconda volta pronti in meno di mezzo secondo, senza riscaricarli da Dropbox.
- Corretto: «null is not an object (evaluating 'ctx.decodeAudioData')» se si spegneva la batteria mentre si caricavano i suoni veri.
- Le scelte della batteria (suoni, ritmo, volumi, griglia) restano anche se l'app si riapre; l'accensione resta per sessione.
- «Dal brano»: in un brano regolare senza colpi medi netti, rullante sul 2 e sul 4 (e lì niente cassa).
- Nel pannello: quanto è scaricato il brano e a che punto è l'analisi.

v1.35: **batteria a tempo e che si adatta alla canzone**.
- Corretto: il «ritardo tipico» del dispositivo (tra contatore del lettore e suono, 15 ms su iPhone) veniva misurato anche dopo uno spostamento stimato da Safari, dove l'errore è della posizione (fino a mezzo secondo) e non del dispositivo; salvato (569 ms) spostava la batteria in tutti i brani non ancora agganciati. Ora si misura solo con la posizione esatta, valori oltre 250 ms si ignorano (anche quello già salvato).
- Posizione stimata da Safari (streaming): appena il brano è in memoria la rendo esatta (spostamento preciso), e finché non è esatta né agganciata la batteria aspetta invece di suonare fuori tempo.
- Aggancio con posizione esatta: solo tra i ritardi possibili (da −80 a +350 ms), preferendo quello tipico; niente più agganci a un battito di distanza. Se per un po' non lo trova, prova lontano con criteri più severi.
- Ritmo **«Dal brano»** (predefinito): dagli accenti dell'analisi (bassi, medi, acuti) su un giro di una o due battute: cassa e basso dove il brano batte sui bassi, rullante sui colpi medi-acuti netti, charleston a ottavi o sedicesimi; volume che segue il brano (più piano nelle parti calme). Funziona anche con ritmi irregolari (prova: 3+3+4+3+3 ottavi, 5 accenti su 5).

v1.34: **salva il remix su Dropbox** (Remix › Salva il remix › «Salva su Dropbox»).
- Crea un FLAC nuovo nella cartella `Remix` (album «Remix», artista dell'album «Artisti vari»; titolo «… (Remix)», poi «(Remix 2)»…), alla frequenza del brano originale, 24 bit, con copertina, tag e una descrizione delle modifiche. Il brano originale non cambia.
- Contiene quello che si sente: velocità, tonalità, effetti, equalizzatore, batteria e basso. La velocità senza cambio di tono usa un vocoder di fase con fasi agganciate ai picchi e riallineate sugli attacchi; il cambio di tono un ricampionamento sinc (Kaiser). Eco e riverbero continuano senza giunture tra i pezzi e finiscono con la loro coda.
- Limitatore (−0,1 dB, 5 ms di anticipo) solo dove batteria ed effetti farebbero distorcere. Volume uniforme: il guadagno ReplayGain dell'originale corretto di quanto il remix è più forte o più piano.
- Tutto a pezzi da 20 s (poca memoria anche su iPhone), poi caricamento con una sessione di Dropbox a pezzi da 8 MB. Codificatore FLAC scritto per Basalto (LPC fino all'ordine 12/16, stereo con canale di differenza, Rice a partizioni), verificato bit per bit con ffmpeg.

v1.33: la nota sul salvataggio in Impostazioni dice anche della cartella `_batteria` (prima diceva «un solo file»).

v1.32: **batteria vera e ritmi di batteristi** nel Remix.
- «Suoni: Batteria vera»: MuldjordKit (Tama Superstar, CC BY 4.0), 19 colpi con 2–3 intensità (mix stereo dei microfoni fatto per Basalto).
- «Ritmi suonati da batteristi»: 30 ritmi da 2–4 battute del Groove MIDI Dataset di Google Magenta (CC BY 4.0) — punk, rock, pop, funk, hip hop, disco, reggae, soul, jazz, samba, country… — con le imprecisioni umane, adattati battito per battito al brano. Il basso resta sulla griglia e segue gli accordi.
- I file stanno nella cartella `_batteria` di Dropbox (la libreria la ignora). Se mancano, l'app usa la copia pubblica in `batteria/` del sito e, con il salvataggio attivo, la copia su Dropbox; si possono aggiungere altri kit o ritmi nello stesso formato. Crediti in `batteria/LEGGIMI.md`.

v1.31: **batteria del Remix sui brani veri** (provata su tre brani di 39/Smooth, confrontati con madmom).
- Scelta del livello del tempo: se a un altro livello (doppio, metà, altri picchi) cassa e rullante si alternano battito per battito molto più chiaramente, è quello giusto. Nel punk veloce prima l'app sceglieva 101 o 133 BPM invece di 200: ora 202, 200 e 185 BPM, con il 95–97% dei battiti uguali a madmom.
- **Basso che segue gli accordi**: per ogni battito l'app riconosce la fondamentale dell'accordo (basso del brano + note dell'accordo, sequenza scelta con Viterbi) e il basso la suona, intonato con il brano. Nel pannello: «accordi Si, La, Fa♯».
- Le scelte di tempo fatte con la v1.30 vengono rifatte (formato dei dati v3).

v1.30: **batteria del Remix rifatta**.
- L'analisi legge tutto il brano e trova ogni singolo battito (programmazione dinamica, con il tempo locale), quindi la batteria segue anche i brani suonati senza metronomo che accelerano o rallentano. Tarata su brani veri (confronto con madmom) e su brani sintetici a tempo variabile: battiti trovati tutti, scarto medio 2 ms.
- **Aggancio al suono**: un piccolo modulo (`rx-ascolto.js`, AudioWorklet) ascolta la musica dentro il motore audio e la confronta con il file; la batteria si aggancia a quello che si sente davvero, non al contatore del lettore (su iPhone i due possono differire di decimi di secondo). Non registra niente: calcola solo l'inviluppo in 4 bande. Per caricarlo la CSP permette gli script dello stesso sito (`script-src 'self'`).
- Tonalità e accordatura (anche brani accordati mezzo tono sotto): il basso suona intonato con il brano.
- «× 2» e «÷ 2» raddoppiano o dimezzano i colpi; tempi alternativi proposti e «Tocca a tempo» rifanno i battiti con un altro tempo.
- Corretto anche il contatore in Chrome dopo uno spostamento preciso di meno di 2 secondi.

v1.29: toccando il brano già in memoria mentre è in pausa riparte dall'inizio e suona (prima restava fermo); nel registro anche le regolazioni della batteria del Remix (× 2, ÷ 2, ± 10 ms, battuta, tocco).

v1.28: **Remix** (pulsante «Remix» nel lettore). Tutto avviene sul telefono mentre il brano suona; il file su Dropbox non cambia e per ora le impostazioni non vengono salvate.
- **Velocità e tono**: velocità da 0,5× a 1,5× mantenendo il tono, oppure «come un disco» (cambia anche il tono); tonalità ±6 semitoni a velocità invariata.
- **Effetti**: riverbero, eco a tempo con il brano, filtro (sott'acqua / radio / telefono), distorsione, flanger, audio 8D; preset Slowed + riverbero, Nightcore, Lo-fi, Sott'acqua, Radio, Stadio, 8D.
- **Batteria a tempo**: analisi del ritmo (BPM, primo battito della battuta, tonalità) sui FLAC in memoria; sequencer a 16 passi con cassa, rullante, charleston, mani, tom e un basso sulla nota della tonalità; ritmi pronti, «× 2» / «÷ 2», «± 10 ms», «Sposta la battuta», «Tocca a tempo». I suoni della batteria sono generati dall'app: nessun campione scaricato.

v1.27: nella pagina dell'artista «Notizie e altri siti» viene prima di «Album che non hai».

v1.26:
- **Pagina dell'artista**: «Simili nella tua libreria» (calcolato sul telefono: ascoltati insieme, genere, anni); «Notizie e altri siti» con Google News, Wikipedia, artisti simili su Last.fm, discografia su Discogs, concerti su Songkick, scalette su setlist.fm, video su YouTube (solo link, senza referrer).
- **Album che non hai**: solo quando tocchi «Cerca gli album che mancano» il player manda a MusicBrainz il nome dell'artista e riceve la discografia (titoli, anni, tipo); confronto con gli album su Dropbox, filtri In studio / EP / Dal vivo / Raccolte / Tutto, scelta dell'artista giusto se il nome è ambiguo. Risultati salvati sul telefono per 30 giorni (`mx_mb_v1`, al massimo 120 artisti). Al massimo una richiesta al secondo. La CSP ora permette anche `https://musicbrainz.org`.
- **La coda continua da sola** (interruttore in Riproduzione): quando parte l'ultimo brano aggiunge fino a 25 brani simili della libreria; non con la ripetizione attiva.
- **Temi**: Scuro, Chiaro, Sabbia, Automatico (segue l'iPhone). Il tema si applica prima di disegnare la pagina; la barra dell'ora resta nera (stile «black» delle app sulla schermata Home); la schermata di apertura resta nera.
- Logo dell'app anche in Home.

v1.25: niente ingrandimento della pagina con il doppio tocco (`touch-action: manipulation`), per esempio sulla barra in basso; lo zoom con due dita resta.

v1.24: il brano partito in streaming si scarica in memoria subito (a schermo acceso, con il precarico attivo), prima del successivo; se l'album aveva già cominciato a scaricarlo, quel download continua invece di essere buttato. Uno spostamento chiesto mentre il download sta finendo (meno di ~6 s stimati) aspetta e poi va nel punto esatto; altrimenti resta quello stimato da Safari.

v1.23: **spostamento preciso nei FLAC**. Dal registro (v1.22): dopo uno spostamento dentro il brano Safari dichiarava il secondo richiesto ma l'audio era qualche secondo indietro («finito a 2:32,0, durata del file 2:27,2»): contatore che finiva prima della musica, senza pause che tagliava la fine. Ora, con il file in memoria, il player trova il blocco audio esatto (ogni blocco FLAC porta il suo numero; tabella di ricerca se c'è, altrimenti stima e verifica) e dà a Safari una «fetta» del file (intestazione minima + audio da quel blocco, senza copiare dati): la posizione è sempre esatta. Il brano in corso, se è in streaming, viene scaricato in memoria anche lui a schermo acceso (dopo il successivo); alla ripresa all'apertura il brano si scarica subito e «▶» parte dal punto esatto. In streaming o a schermo spento resta lo spostamento di Safari: il brano viene segnato come «tempo stimato» e per lui il passaggio senza pause non viene usato. Se Safari non accetta la «fetta», si torna da soli al metodo di Safari.

v1.22: il lettore si chiude anche trascinandolo verso il basso da qualunque punto (non dalla barra del tempo, dalla coda o dall'equalizzatore). Fine del brano calcolata con la durata esatta del FLAC (campioni ÷ frequenza) invece che con quella di Safari, che può essere una stima più corta: il contatore finiva prima della musica e il passaggio senza pause tagliava gli ultimi secondi. Senza pause solo per FLAC con durata nota; nel registro le differenze di durata e dove finisce davvero il brano.

v1.21: nella pagina dell'artista, sotto «Notizie», il link alla voce di Wikipedia in italiano (nuova scheda, senza referrer; il player non contatta Wikipedia).

v1.20: barra in basso (lettore ridotto e schede) e menu dal basso semitrasparenti con sfocatura; logo dell'app accanto al titolo «Impostazioni»; corretto il riquadro delle stelle nel menu ⋯ (era enorme).

Novità della v1.19:
- **Interruttori** come quelli di iOS nelle Impostazioni, raccolti nel riquadro «Riproduzione».
- **Volume uniforme** (ReplayGain): legge `REPLAYGAIN_ALBUM_GAIN/PEAK` e `REPLAYGAIN_TRACK_GAIN/PEAK` dai FLAC e applica
  un guadagno fisso per album (o per brano) nel motore Web Audio, in virgola mobile: nessuna compressione, la dinamica
  non cambia, non alza mai oltre il picco del file (al massimo +6 dB). Album senza dati: il valore mediano della libreria.
  I tag si aggiungono per esempio con foobar2000 (ReplayGain › Scan as albums): l'audio non viene modificato.
- **Senza pause tra i brani**: tra brani consecutivi dello stesso album il successivo, già in memoria nel secondo lettore,
  parte qualche millesimo di secondo prima della fine (anticipo misurato e corretto a ogni passaggio). Se non parte in
  tempo o iOS lo rifiuta resta il passaggio normale; dopo due rifiuti a schermo spento lo fa solo a schermo acceso.
- **Valutazioni da 1 a 5 stelle** nel lettore e nel menu ⋯ del brano; si salvano in `dati.json` tra i preferiti
  (chiave `s:`, così le versioni precedenti le conservano). Playlist automatiche «5 stelle» e «4 stelle e più»;
  le stelle pesano nei mix.
- **Booklet e immagini**: nella pagina dell'album, se la cartella contiene immagini, PDF, TIFF o BMP. Le immagini si
  vedono nell'app (anteprime Dropbox da 2048 px, liberate alla chiusura; scorri, pizzica, doppio tocco); i PDF e
  l'originale si aprono in una nuova scheda. L'indice (v2) comprende ora anche pdf/tif/bmp: alla prima apertura
  la libreria viene riletta per intero una volta.
- **Controllo libreria** (Impostazioni › Libreria): copertine mancanti, tag mancanti o diversi nello stesso album,
  numerazione, album e brani doppi, qualità miste, album senza ReplayGain, copertine incorporate pesanti, file non
  letti, formati, anno e genere. «Analizza tutti i brani» legge l'inizio di ogni FLAC (16–64 KB).
- **Statistiche** (Home › I tuoi ascolti): 7 giorni, 30 giorni, 12 mesi, sempre; ascolti, tempo, artisti, album,
  ascolti per giorno/mese e per ora, classifiche, dati della libreria. Oltre i 3000 ascolti i più vecchi restano come
  riepilogo mensile in `dati.json` (`agg`), unito tra dispositivi senza contare due volte lo stesso ascolto.
- I tag letti dai FLAC stanno ora in IndexedDB («mx_meta») invece che in localStorage (spostati alla prima apertura).


Aggiornamenti: all'avvio e quando l'app torna in primo piano (al massimo ogni 10 minuti) la pagina legge
`version.json` dal proprio sito; se c'è una versione nuova mostra «Aggiorna». `version.json` va tenuto
allineato a `VERSION` in index.html a ogni rilascio. In Impostazioni: «Controlla aggiornamenti».


Copertine salvate sul dispositivo (IndexedDB «mx_covers»): miniature fino a 256 px e copertine incorporate
ridotte a 800 px, legate alla revisione del file su Dropbox. All'apertura si vedono subito; dopo l'avvio il
player scarica in sottofondo quelle mancanti. Si cancellano in Impostazioni. Nessun file musicale viene salvato.


Mix da un brano, un album o un artista («Avvia un mix da qui»): stesso artista (al massimo 40%), artisti ascoltati
negli stessi momenti, stesso genere, preferiti. Playlist automatiche: I più ascoltati del mese, Mai ascoltati,
Riscoperte, Hi-res, Ultimi arrivati. La coda si può salvare come playlist. Lo sfondo del lettore prende il colore
della copertina. Icona per la schermata Home (manifest e apple-touch-icon): su iPhone l'app installata ha dati
separati da Safari, quindi chiede di nuovo la chiave e il collegamento a Dropbox.


AirPlay dal lettore (Safari). Coda modificabile: trascina dalla maniglia, togli un brano, svuota.
Home: «Aggiunti di recente» (data di caricamento su Dropbox). Libreria: ordina per nome, artista,
titolo, anno, aggiunti di recente, più ascoltati; filtra per qualità (hi-res / CD) e genere (dal tag GENRE).


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
