const core = require('@actions/core');
const { exec } = require('../util');

module.exports = async (majorVersion) => {
    core.info('Downloading dependencies');
    await exec('mkdir ./.setup-erlang');
    await exec('wget https://packages.erlang-solutions.com/erlang-solutions_2.0_all.deb -P ./.setup-erlang');
    await exec('sudo dpkg -i ./.setup-erlang/erlang-solutions_2.0_all.deb');
    await exec('wget https://s3.amazonaws.com/rebar3/rebar3 -P ./.setup-erlang');
    await exec('chmod a+x ./.setup-erlang/rebar3');

    await exec('sudo apt-get update');

    var { stdout } = await exec('sudo apt-cache show esl-erlang');
    const aptCache = stdout.match(RegExp(`Version:\\s(1:|)${majorVersion}.+`));
    if (!Array.isArray(aptCache)) throw new Error(`Erlang/OTP ${majorVersion} is not available for this distribution`);
    const fullVersion = aptCache[0].replace(/Version:\s/, '');

    core.info(`Setting up erlang@${fullVersion}`);
    await exec(`sudo apt-get install -y --allow-downgrades esl-erlang=${fullVersion}`);

    core.info('Setting up rebar3');
    await exec(`./.setup-erlang/rebar3 local install`);
    await core.addPath('~/.cache/rebar3/bin');

    core.info('Cleaning up the mess');
    await exec('rm -rf ./.setup-erlang');
}
