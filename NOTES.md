# Running the tests #

## Prerequsites ##

### Windmill ###

In order to run the tests make sure you have the latest [Windmill][1] 
(as of July 30th 2010 it means you'll have to build it from the [trunk][2] because
it contains a crutial fix)

You can obtain the latest copy of Windmill by running the following commands
from your shell:
    $ cd ~/bin
    $ git pull git://github.com/windmill/windmill
    $ python setup.py build
    $ sudo python setup.py install

### Working browser ###

You'll also need a working browser, the tests are intented to be ran in
Google Chrome (not Chromium) and/or Firefox.

By default Google Chrome will be used.

If you do not have Google Chrome installed on your computer, to use Firefox
you'll have to edit the src/allmydata/tests/test_musicplayer.py file.

## Building the project ##

Components needed by da.controller.Player and da.controller.CollectionScanner tests
are only available after we've built the from project. (Web workers and SoundManger's Flash files).

    $ cd <directory with this file>
    $ python manage.py roll

## Running the tests ##

To run the music player-specific tests simply:

    $ cd <Tahoe-LAFS source directory>
    $ python setup.py test -s allmydata.test.test_musicplayer

If you have any Google Chrome winows open, remember to close them before
running the tests, otherwise Windmill won't be able to work its magick.

### Problematic tests ##

* test_ProgressBar, test_SegmentedProgressBar: these might or might not fail,
  the reason is that browsers don't render the graphics precisely the same.
  They will probably (partially) fail in Firefox.
* test_ID3v1: This test usually fails on Linux version of Google Chrome.
  Reasons are still unknown.
 
### Debugging tips ##

* Chrome is definitely faster, but Firefox gives better error messages.
  To view more detailed messages than those presented by Windmill type
  following into Web Inspector's or Firebugs' console:
  
    `windmill.jsTests.testFailures`

## Documentation ##

Player's code is fully annotated with PDoc[2] syntax, which can then generate
lovely web site for easier navigation.

To generate the API documentation you'll need latest version of PDoc:

    $ sudo gem install pdoc

After you've installed PDoc just run:

    $ cd <directory with this file>
    $ python manage.py docs
    $ open-in-web-browser docs/index.html

Note: You will be probably greeted with few 'missing dependencies' errors
from PDoc, just install them manually and you're good to go.

[1]: http://getwindmill.com "Windmill"
[2]: http://github.com/windmill "Windmill's Github repository"
[3]: http://pdoc.org/ "PDoc's website"

