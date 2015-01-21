var args = 
    require('yargs')
    .usage(
      [ "SYNOPSIS:"
      , " $ db-apply <cmd> [options] "
      , ""
      , "Applies <cmd> to a provided db"
      ].join("\n")
    )
    .example('db-apply init', "applies 'init' with default settings")
    .example('db-apply migrate -h <host> -p <port> -u <usr>', "applies 'migrate' with provided host, port and user")
    .example('db-apply rollback', "applies 'rollback'")
    .options(
      { h :
        { alias   : 'host'
        , describe: 'db hostname to connect with'
        , default : process.env.PGHOST || 'localhost'
        }
      , p :
        { alias   : 'port'
        , describe: 'port to connect by'
        , type    : 'number'
        , default : process.env.PGPORT || 5432
        }
      , d : 
        { alias   : 'database'
        , describe: 'target database to run against'
        }
      , U: 
        { alias   : 'user'
        , describe: 'db username to authenticate with'
        }
      , W:
        { alias   : 'password'
        , describe: 'db password to authenticate with'
        }
      , help : 
        { describe : 'show this help message'
        }
      }
    ).argv
  , isDbApply = args.$0.indexOf("mocha") == -1
  ;

args.cmd = args._.shift();

/**
   TRICKY:
     when we `apply-db <cmd> [options]` - the command is obvious.
     when we `mocha test\*.js - the command is the pattern, but then, nobody uses that :)
 */
if (isDbApply && !args.cmd) {
    console.log("<cmd> is missing");
    args.help = true;    
    console.log(args)
}

if (args.help) {
    console.log(require('yargs').help());
    process.exit(1);
    return;
}

module.exports = args;