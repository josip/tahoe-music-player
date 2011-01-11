# Installing Music Player for Tahoe (codename 'Daaw') #

## Maths and Systems Theory quiz ##

If you already have a `build` directory or you've downloaded the package from GitHub, feel free to skip this step.

To build player's code you'll have to do a not-so-simple
operation of computing file dependencies, compressing variable names in JavaScript
code and stitching them all into one file.

I strongly hope that you took advanced Maths, Systems Theory
and computing related courses.

Just in case you haven't, you can type in next line into your shell:
    $ python manage.py roll
    running roll
    Calculating dependencies...
    Compressing <something>...
    ...
    You're ready to rock 'n' roll!

Bravo, you're done! (just make sure you have a `build` directory)

(And if you're one of those who prefer to do it by-hand (and keyboard),
this file isn't a place for you.)

## Battle for the Configuration File ##

Player's configuration file is a real beast on its own,
and in order to edit it we must prepare ourselves really good,
otherwise, we're doomed (actually, only you are)!

Read next few steps carefully, the beast is just around the corner!

1. Create two dirnodes on your Tahoe-LAFS server, one which will be used for storing
   all your music files and the other one for syncing settings between multiple
   computers.
  
   Just in case you've forgotten how to create Tahoe dirnodes, run this from your
   shell:
    $ tahoe mkdir music
    <top secret no.1>
    $ tahoe mkdir settings
    <top secret no.2>
  
   (make sure Tahoe-LAFS is running on your computer before issuing those commands)
   Pro tip: create a (S)FTP account with your music directory as it's home directory
   and upload your music files in batches without a sweat.

2. Take a big breath, as we're about to open example configuration file!

3. Yep, now open the `config.example.json` file in your favourite text editor.
   Now quickly, we have to replace her evil genes with a good ones,
   find following line in her DNA sequence:
  
       "music_cap":    "<bad gene no.1>",
       "settings_cap": "<bad gene no.2>"
  
  and quickly replace <bad gene no.1> with <top secret no.1> as well as <bad gene no.2>
  with <top secret no.2>.
  
  If you're still here, congrats!
  
  (The truth about <top secret>s is that your Tahoe-LAFS installation actually
  knows how to re-sequence DNA of living beings, and we don't want others to
  find out about that and use it in evil purposes, don't we?)
  
  Now save the new genes under the name of `config.json`.
  
  Note: If you'll have to change the CAPs after the 'first run', change them
  in both config.json file and the applications' interface (Gear menu > Settings > Caps).

## The Critical Step ##
After we've conquered the beast of configuration file we're ready to
upload the player to the Tahoe-LAFS!

To do that, just copy the `build` directory to `public_html` directory of your
Tahoe storage node (usually `~/.tahoe`).
Note that `public_html` directory is probably missing, so you'll have to create it on your own.

If you are on a UNIX-like operating system, you can do it with following command:
    $ mkdir -p ~/.tahoe/public_html/musicplayer
    $ cp -r build/ ~/.tahoe/public_html/musicplayer/
  
  Pro tip: instead of copying whole `build` directory, make a symbolic link
  so that `installing` a new version will be a breeze.

or if you're using a Windows machine with Command prompt

    $ mkdir %HOMEDRIVE%%HOMEPATH%\.tahoe\public_html\musicplayer
    $ xcopy /S build\ %HOMEDRIVE%%HOMEPATH%\.tahoe\public_html\musicplayer\
  
(drag and drop also works)

WARNING: If you don't perform next step exactly as
you're instructed, the whole process could fail and you'll
have to start all over!

Now, stand up, and with evident excitement on your face,
say the following phrase:
> "Yay! It's working!"

## Fin ##
You can now upload your music to the <top secret no.1> dirnode and
launch music player by typing this URI into your web browser:

    http://localhost:3456/static/musicplayer

If it appears that something isn't working, it probably means
that you haven't read 'The Critical Step' carefully enough, but
if you're sure you did it as instructed, please report all bugs you encounter
on the following address:

    https://github.com/josip/tahoe-music-player/issues

or look for the older ones:

    http://tahoe-lafs.org/trac/tahoe-lafs/ticket/1023

or ask around for josipl on tahoe-lafs IRC channel (irc.freenode.net).

We hope you're going to enjoy your music even more with Music Player for Tahoe-LAFS!

Note: During the initial collection scan (or any other), it's suggested to
turn off Firebug or Web Inspector's XMLHttpRequest logging feature, for sake of performance.

