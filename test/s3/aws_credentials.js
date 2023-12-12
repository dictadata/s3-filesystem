// test/s3/aws_credentials

// AWS SDK V3
const { fromNodeProviderChain, fromIni } = require("@aws-sdk/credential-providers");
const { loadSharedConfigFiles } = require('@aws-sdk/shared-ini-file-loader');
const { S3Client } = require('@aws-sdk/client-s3');

(async () => {

  console.log("from .aws config files:");
  {
    let config = await loadSharedConfigFiles();
    console.log(JSON.stringify(config.configFile[ "default" ], null, 2));

    let profile = "dictadata";
    let credentials = await fromNodeProviderChain({ profile: profile })();
    console.log(JSON.stringify(credentials, null, 2));
  }

  console.log("from S3 client connection:");
  {
    let client = new S3Client();

    let results = {
      region: await client.config.region()
    };
    console.log(JSON.stringify(results,null,2));

    let credentials = await client.config.credentials();
    results = JSON.stringify(await credentials, null, 2)
    console.log(results);
  }
})();
