var fs    = require('fs')
  , path  = require('path')
  , spawn = require('child_process').spawn
  , code  = fs.readFileSync( path.join(__dirname, "..","lib","args.js"))
  ;

module.exports = 
{ "osg:lib/args" : 
  { ".cmd" : 
    { "should correspond to 1st non-switch argument" : 
      function(done) {
          loadWithArgs("init -d db", function(args) {
              args.should.have.property('cmd',"init");              
          }, done);
          this.slow(200)
      }
    , "when cmd is missing AND not in test context call process.exit" : 
      function(done) {
          loadWithArgs("", function(args) {
              args.should.have.property('str');              
          }, done);
          this.slow(200)
      }    
    }
  , ".database" : 
    { "should correspond to switch -d" : 
      function(done) {
          var value = "TEST" + Math.random()
          loadWithArgs("init -d " + value, function(args) {
              args.should.have.property('database',value);              
              args.should.have.property('d',value);              
          }, done);
          this.slow(200)
      }
    , "should correspond to switch --database" : 
      function(done) {
          var value = "TEST" + Math.random()
          loadWithArgs("init --database " + value, function(args) {
              args.should.have.property('database',value);              
              args.should.have.property('d',value);              
          }, done);
          this.slow(200)
      }
    , "should demmand thie swith or call process.exit" :
      function(done) {
          loadWithArgs("init -U user", function(args) {
              args.should.have.property('str');              
          }, done);
          this.slow(200)
      }
    }
  , ".user" : 
    { "should correspond to switch -U" :
      function(done) {
          var value = "TEST" + Math.random()
          loadWithArgs("init -d db -U " + value, function(args) {
              args.should.have.property('user',value);              
              args.should.have.property('U',value);              
          }, done);
          this.slow(200)
      }
    , "should correspond to switch --user" :
      function(done) {
          var value = "TEST" + Math.random()
          loadWithArgs("init -d db --user " + value, function(args) {
              args.should.have.property('user',value);              
              args.should.have.property('U',value);              
          }, done);
          this.slow(200)
      }
    }
  , ".password" : 
    { "should correspond to switch -W" :
      function(done) {
          var value = "TEST" + Math.random()
          loadWithArgs("init -d db -W " + value, function(args) {
              args.should.have.property('password',value);              
              args.should.have.property('W',value);              
          }, done);
          this.slow(200)
      }
    , "should correspond to switch --password" :
      function(done) {
          var value = "TEST" + Math.random()
          loadWithArgs("init -d db --password " + value, function(args) {
              args.should.have.property('password',value);              
              args.should.have.property('W',value);              
          }, done);
          this.slow(200)
      }
    }
  , ".host" : 
    { "should correspond to swith -h":
      function(done) {
          var value = "TEST" + Math.random()
          loadWithArgs("init -d db -h " + value, function(args) {
              args.should.have.property('host',value);              
              args.should.have.property('h',value);              
          }, done);
          this.slow(200)          
      }
    , "should correspond to swith --host":
      function(done) {
          var value = "TEST" + Math.random()
          loadWithArgs("init -d db --host " + value, function(args) {
              args.should.have.property('host',value);              
              args.should.have.property('h',value);              
          }, done);
          this.slow(200)          
      }    
    }
  , ".port" : 
    { "should correspond to swith -p":
      function(done) {
          var value = "TEST" + Math.random()
          loadWithArgs("init -d db -p " + value, function(args) {
              args.should.have.property('port',value);              
              args.should.have.property('p',value);              
          }, done);
          this.slow(200)          
      }
    , "should correspond to swith --port":
      function(done) {
          var value = "TEST" + Math.random()
          loadWithArgs("init -d db --port " + value, function(args) {
              args.should.have.property('port',value);              
              args.should.have.property('p',value);              
          }, done);
          this.slow(200)          
      }    
    }
  , ".help" : 
    { "should correspond to swith -h":
      function(done) {
          loadWithArgs("-d db -h", function(args) {
              args.should.have.property('str');              
          }, done);
          this.slow(200)
      }
    , "should correspond to switch --help": 
      function(done) {
          loadWithArgs("-d db --help", function(args) {
              args.should.have.property('str');              
          }, done);
          this.slow(200);
      }  
    }
  }
}

function loadWithArgs(args, cb, done) {

    var bin = spawn("node", ["./test/cli-context/args.js"].concat(args.split(" ")));

    bin.stderr.on('data', function(buf) {
        cb( { err: buf+""} )
        done()
    });
 
    bin.stdout.on('data', function (buf) {
        try {
            buf = JSON.parse(buf.toString());
        } catch (ex) {
            buf = { str: ex }
        }
        cb(buf);
        done();
    })
}