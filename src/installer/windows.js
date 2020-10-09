const core = require('@actions/core');
const cache = require('@actions/cache');
const fetch = require('node-fetch');
const semver = require('semver');
const { exec } = require('../util');
const fs = require('fs');

const PROGRAM_FILES = 'C:\\Program Files';
const DOWNLOAD_URL = 'https://erlang.org/download';

/**
 * Get the full Erlang/OTP version from the major version
 * @param  {string} majorVersion The major version
 * @return {string|undefined}    The full version if any
 */
async function getVersion(majorVersion) {
    const responseBody = await (await fetch(DOWNLOAD_URL)).text();
    const versionMatch = responseBody.match(/"otp_win64_.+?\.exe"/g)
        .map((fileMatch) => fileMatch.replace(/(^"otp_win64_|\.exe"$)/g, ''))
        .map((versionMatch) => [versionMatch, semver.coerce(versionMatch)])
        .sort(([_, a], [$, b]) => -1 * semver.compare(a, b))
        .find(([_, versionMatch]) => `${versionMatch.major}` === `${majorVersion}`);
    return Array.isArray(versionMatch) ? versionMatch[0] : undefined;
}

/**
 * Download the Erlang/OTP installer of the given version (Downloads to
 * .\.setup-erlang and fails if the directory does not exist)
 * @param  {string}  fullVersion The version to download
 * @param  {boolean} allowCache  Whether content caching is allowed for this run
 * @return {string}              The path to the downloaded installer
 */
async function downloadVersion(fullVersion, allowCache) {
    const setupUrl = `${DOWNLOAD_URL}/otp_win64_${fullVersion}.exe`;
    const setupPath = '.\\.setup-erlang\\otp_setup.exe';
    const cacheKey = `windows/exe/erlang@${fullVersion}`;

    const isRestored = allowCache
        ? await cache.restoreCache([setupPath], cacheKey)
        : false;

    if (!isRestored) {
        await exec(`powershell -command "invoke-webrequest -uri ${setupUrl} -outfile ${setupPath}"`);
        if (allowCache) await cache.saveCache([setupPath], cacheKey);
    }

    return setupPath;
}

/**
 * Install the given version of Erlang/OTP
 * @param  {string} fullVersion The version to install
 * @return {string}             The path to the installation
 */
async function installVersion(fullVersion) {
    const allowCache = core.getInput('allow-cache').toLowerCase() !== 'false';
    const setupPath = await downloadVersion(fullVersion, allowCache);
    await exec(`powershell -command "& ${setupPath} /S | out-null"`);
    return fs.readdirSync((PROGRAM_FILES))
        .map((entry) => `${PROGRAM_FILES}\\${entry}`)
        .find((entry) => fs.existsSync(`${entry}\\bin\\erl.exe`));
}

module.exports = async (majorVersion) => {
    core.info('Getting available version');
    const fullVersion = await getVersion(majorVersion);
    if (!fullVersion) throw new Error(`Erlang/OTP ${majorVersion} is not available for this distribution`);
    await exec('mkdir .\\.setup-erlang');

    core.info(`Setting up erlang@${fullVersion}`);
    const rootDirectory = await installVersion(fullVersion);
    core.addPath(`${rootDirectory}\\bin`);

    core.info('Setting up rebar3');
    await exec('git clone https://github.com/erlang/rebar3.git .\\.setup-erlang\\rebar3');
    await exec('.\\bootstrap.bat', { cwd: '.\\.setup-erlang\\rebar3' });
    await exec(`cp .\\.setup-erlang\\rebar3\\rebar3 "${rootDirectory}\\bin"`);
    await exec(`cp .\\.setup-erlang\\rebar3\\rebar3.cmd "${rootDirectory}\\bin"`);
    await exec(`cp .\\.setup-erlang\\rebar3\\rebar3.ps1 "${rootDirectory}\\bin"`);

    core.info('Cleaning up the mess');
    await exec('rm -rf .\\.setup-erlang');
};
