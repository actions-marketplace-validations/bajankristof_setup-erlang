const core = require('@actions/core');
const cache = require('@actions/cache');
const { exec } = require('../util');

module.exports = async (majorVersion) => {
    core.info('Downloading dependencies');
    await exec('mkdir ./.setup-erlang');
    await exec('wget https://s3.amazonaws.com/rebar3/rebar3 -P ./.setup-erlang');
    await exec('chmod a+x ./.setup-erlang/rebar3');

    core.info(`Setting up erlang@${majorVersion}`);
    await exec(`brew install erlang@${majorVersion}`);
    await exec(`brew link --force erlang@${majorVersion}`);

    core.info('Setting up rebar3');
    await exec('./.setup-erlang/rebar3 local install');
    await core.addPath('~/.cache/rebar3/bin');

    core.info('Cleaning up the mess');
    await exec('rm -rf ./.setup-erlang');
};
