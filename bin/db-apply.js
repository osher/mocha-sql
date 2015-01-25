var args  = require('../lib/args')
  , fs    = require('fs')
  , path  = require('path')
  , cmd   = path.join( args.base, "dist" , args.cmd + ".js")
  , spawn = require('child_process').spawn
  , conf_path = "./db-apply.config.json"
  ;

start();

function start() {
    assure_cmd()
}

function assure_cmd() {
    fs.stat( cmd , function(e) {
        if (e) return console.log("command not supported: %s\n\n", args.cmd) && process.exit(1);

        console.log("applying command : ", args.cmd );
        run_mocha()
    })
}

function run_mocha(e) {
    if (e) return console.log(e) && process.exit(1);
    var switches = (
          [ cmd
          , "--ui"       , "mocha-ui-exports"
          , "--reporter" , "spec"
          , "--slow"     , 3000
          , "--timeout"  , 6000
          , "--bail"     , ""

          , "--base"     , args.b
          , "--host"     , args.h
          , "--port"     , args.p 
          ]
        )
      , mocha = 
        process.platform[0] == "w" //win32|win64|win...
        ? ".\\node_modules\\.bin\\mocha.cmd"
        : "mocha"
      , f
      ;
    if (args.U) switches.push("--user", args.U);
    if (args.W) switches.push("--password", args.W);
    if (args.d) switches.push("--database", args.d);

    console.log("executing...\n=========================================");
    console.log("%s %s", mocha, switches[0], switches.slice(1).map(function(w) { return (w + "                  ").substr(0,18) }).join("").replace(/--/g, "\\\n\t--"));
    console.log("=========================================");

    f = spawn(mocha, switches, { customFds: [0,1,2],  });
    //f.stdout.on('data', echo);
    //f.stderr.on('data', echo);
    f.on('close', end );
}

function echo(buf) {
    buf = buf+"";
    buf = buf.replace(/\n$/,"");//mocha uses console log, and that adds new line
    buf = buf.replace(/\r/g,"");//god knows where that comes from, but it fucks output
    if (!buf.length) return;
    console.log(buf);
}

function end(code) {
    console.log("\n=========================================\n", code ? "FAILURE" : "SUCCESS!" );
    process.exit(code);
}