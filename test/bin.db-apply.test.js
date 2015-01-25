var spawn = require('child_process').spawn
  ;

module.exports = 
{ "E2E - bin/db-apply" : 
  { "when provided options: base, database, user" : 
    { "should run the command from the base directory against the database with the provided user" : 
      function(done) {
          this.slow(2000);
          dbApply(
            "go -b test/fixtures/minimal -U postgres -d tmp"
          , function(result) {
                result.code.should.eql(0);
                result.output.trim().should.endWith("SUCCESS!")
            }
          , done);
      }
    }
  , "when not provided a database" : 
    { "should reject with message '--database <dbname> is not provided'" : 
      function(done) {
          this.slow(500);
          dbApply("go -b test/fixtures/minimal -U postgres"
          , function(result) {
                result.code.should.not.eql(0);
                result.output.trim().should.endWith("--database <dbname> is not provided")
            }
          , done);
      }    
    }
  }
}

function dbApply(args, cb, done) {
    var bin = spawn("node", ["./bin/db-apply"].concat(args.split(" ")))
      , d = [];

    bin.stderr.on('data', function(buf) {
        d.push(buf+"");
    });
 
    bin.stdout.on('data', function (buf) {
        d.push( buf +"" )
    });

    bin.on('close', function(code, signal) {
        cb( { code: code, signal : signal, output : d.join("") } );
        done()
    })
}