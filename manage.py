#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, shutil, sys, subprocess, re
from time import sleep
import tempfile
from tempfile import mkstemp
from setuptools import setup
from setuptools import Command

CLOSURE_COMPILER_PATH = 'tools/closure-compiler-20100514/compiler.jar'

class ClosureCompiler:
  def __init__(self, input_files, output, warnings = 'QUIET'):
    self.input = input_files
    self.output = output
    self.warnings = warnings

  def compile(self, compression = 'WHITESPACE'):
    print 'Compressing %s...' % self.output
    
    if compression == 'NONE':
      output_file = open(self.output, 'a')
      for filename in self.input:
        f = open(filename)
        output_file.write(f.read())
        output_file.write('\n')
        f.close()

      output_file.close()
    else:
      args = [
        'java',
        '-jar',                 CLOSURE_COMPILER_PATH,
        '--warning_level',      self.warnings,
        '--compilation_level',  compression,
        '--js_output_file',     self.output]
      
      for filename in self.input:
        args.append('--js')
        args.append(filename)
      
      subprocess.call(args)
  
  def syntax_check(self):
    args = [
      'java',
      '-jar',             CLOSURE_COMPILER_PATH,
      '--js_output_file', '_tmp.out',
      '--dev_mode',       'START_AND_END']
    
    for filename in self.input:
      args.append('--js')
      args.append(filename)
    
    r = subprocess.call(args)
    os.remove('_tmp.out')
    return r == 0

class JSDepsBuilder:
  """
  Looks for
    //#require "file.js"
  and
    //#require <file.js>
  lines in JavaScript files and creates a file with all the required files.
  """
  requires_re = re.compile('^//#require ["|\<](.+)["|\>]$', re.M)
  
  def __init__(self, root_directory, syntax_check = False):
    self.files        = {}
    self.included     = []
    self.root         = root_directory
    self.syntax_check = syntax_check
    
    self.scan()
  
  def scan(self):
    for (dirname, dirs, files) in os.walk(self.root):
      for filename in files:
        if filename.endswith('.js'):
           self.detect_requires(os.path.join(dirname, filename))
  
  def detect_requires(self, path):
    reqs = []
    script_file = open(path, 'r')
    script = script_file.read()
    script_file.close()
    
    reqs = re.findall(JSDepsBuilder.requires_re, script)
    for i in range(len(reqs)):
      req_path = os.path.join(self.root, reqs[i])
      reqs[i] = req_path
      if not os.path.isdir(req_path) and not req_path.endswith('.js'):        
        reqs[i] += '.js'
    
    self.files[path] = reqs

  def parse(self, path):
    if path in self.included:
      return ''
    if not path.endswith('.js'):
      # TODO: If path points to a directory, require all the files within that directory.
      return '' 
    
    if self.syntax_check:
      compiler = ClosureCompiler([path], None)
      if not compiler.syntax_check():
        raise Exception('There seems to be a syntax problem. Fix it.')
    
    def insert_code(match):
      req_path = os.path.join(self.root, match.group(1))
      if not req_path in self.included:
        if not os.path.isfile(req_path):
          raise Exception('%s requires non existing file: %s' % (path, req_path))
          
        return self.parse(req_path)
     
    script_file = open(path, 'r')
    script = script_file.read()
    script_file.close()
    script = re.sub(JSDepsBuilder.requires_re, insert_code, script)
    self.included.append(path)

    return script
  
  def write_to_file(self, filename, root_file = 'Application.js'):
    output = open(filename, 'w+')
    self.included = []
    output.write(self.parse(os.path.join(self.root, root_file)))
    output.close()
    
  def print_script_tags(self, root_file = 'Application.js'):
    self.included = []
    self.parse(os.path.join(self.root, root_file))
    
    for filename in self.included:
      print '<script src="%s" type="text/javascript" charset="utf-8"></script>' % filename
    
class Build(Command):
  description = 'builds whole application into build directory'
  user_options = [
    ('compilation-level=', 'c', 'compilation level for Google\'s Closure compiler.'),
    ('syntax-check', 's', 'run syntax check on every individal file')
  ]
  
  def initialize_options(self):
    self.compilation_level = 'SIMPLE_OPTIMIZATIONS'
    self.syntax_check = False
    
  def finalize_options(self):
    compilation_levels = [
      'SIMPLE_OPTIMIZATIONS', 'WHITESPACE_ONLY', 'ADVANCED_OPTIMIZATIONS', 'NONE'
    ]
    
    self.compilation_level = self.compilation_level.upper()
    if not self.compilation_level in compilation_levels:
      self.compilation_level = compilation_levels[0]
  
  def run(self):
    if os.path.isdir('build'):
      shutil.rmtree('build')
    
    # See http://tahoe-lafs.org/trac/tahoe-lafs/ticket/1023#comment:16
    # Python versions prior to 2.5 required destination directory to be present
    if sys.version_info[:2] < (2, 5):
      os.makedirs('build')
    
    shutil.copytree('src/resources', 'build/resources')
    
    shutil.copy('src/config.example.json', 'build/')
    shutil.copy('src/index.html', 'build/')
    shutil.copy('src/playlist_download.html', 'build/')
    shutil.copy('src/about.html', 'build/')
    
    # 'HTML5 offline application cache' very useful for now
    #shutil.copy('src/cache.manifest', 'build/')
    
    shutil.copytree('src/libs/vendor/soundmanager/swf', 'build/resources/flash')
    shutil.copy('src/libs/vendor/persist-js/persist.swf', 'build/resources/flash')
    
    os.makedirs('build/js/workers')
    shutil.copy('src/libs/vendor/browser-couch/js/worker-map-reducer.js', 'build/js/workers/map-reducer.js')
    
    print 'Calculating dependencies...'
    self.deps = JSDepsBuilder('src/', syntax_check = self.syntax_check)
    
    self._make_js('Application.js', 'build/js/app.js')
    
    for worker in os.listdir('src/workers'):
      if worker.endswith('.js'):
        self._make_js('workers/' + worker, 'build/js/workers/' + worker)
    
    print 'You\'re ready to rock \'n\' roll!'
  
  def _make_js(self, root, output):
    fd = mkstemp()
    os.close(fd[0])
    tmp_file = fd[1]
    self.deps.write_to_file(tmp_file, root_file = root)
    compiler = ClosureCompiler([tmp_file], output)
    compiler.compile(self.compilation_level)
    os.remove(tmp_file)

class Watch(Build):
  description = 'watches src directory for changes and runs build command when they occur'
  
  def run(self):
    self.dirs = {}
    
    while True:
      if self._watch_dir():
        print 'Watching for changes...'
      sleep(5)
  
  def _watch_dir(self):
    should_build = False
    for (root, dirs, files) in os.walk('src'):
      for file in files:
        path = root + '/' + file
        mtime = os.stat(path).st_mtime
        
        if not path in self.dirs:
          self.dirs[path] = 0
        
        if self.dirs[path] != mtime:
          should_build = True
          self.dirs[path] = mtime
          print '\t* ' + path
    
    if should_build:
      Build.run(self)
      return True
    else:
      return False


class Package(Build):
  description = 'builds application and creates a .tar.gz archive'
  user_options = []
  
  def initalize_options(self):
    pass
  def finalize_options(self):
    pass

  def run(self):
    Build.run(self)
    

class Install(Command):
  description = 'copies application to storage node\'s public_html and writes configuration files'
  user_options = []
  
  def initalize_options(self):
    pass
  def finalize_options(self):
    pass
  def run(self):
    pass

class Docs(Command):
  description = 'generate documentation'
  user_options = []
  
  def initialize_options(self):
    pass
  def finalize_options(self):
    pass
  
  def run(self):
    if os.path.isdir('docs'):
      shutil.rmtree('docs')
    
    args = ['pdoc', '-o', 'docs']
    
    root_dirs = [
      'src/', 'src/libs', 'src/libs/ui', 'src/libs/db',
      'src/libs/util', 'src/controllers', 'src/doctemplates',
      'src/services'
    ]
    for root_dir in root_dirs:
      for filename in os.listdir(root_dir):
        if filename.endswith('.js'):
          args.append(os.path.join(root_dir, filename))
    
    subprocess.call(args)

class VerifyTests(Command):
  description = 'runs syntax checks on tests'
  user_options = []
  
  def initialize_options(self):
    pass
  def finalize_options(self):
    pass
    
  def run(self):
    test_files = []
    for filename in os.listdir('tests'):
      if filename.endswith('.js'):
        test_files.append('tests/' + filename)
    
    compiler = ClosureCompiler(test_files, None)
    if compiler.syntax_check():
      print 'Everything seems okay. Yay!'

setup(
  name = 'tahoe-music-player',
  cmdclass = {
    'roll':     Build,
    'install':  Install,
    'watch':    Watch,
    'tests':    VerifyTests,
    'docs':     Docs
  }
)
