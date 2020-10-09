const core = require('@actions/core');
const { exec } = require('@actions/exec');

module.exports = {
    async exec(command, opts = {}) {
        var stdout = '';
        var stderr = '';

        const silent = !core.isDebug();
        const listeners = Object.assign({
            stdout: (data) => stdout += data.toString(),
            stderr: (data) => stderr += data.toString()
        }, opts.listeners || {});
        delete opts.listeners;

        await exec(command, [], {
            silent,
            listeners,
            ...opts
        });

        return { stdout, stderr };
    }
};
