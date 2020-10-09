const os = require('os');
const core = require('@actions/core');
const platform = os.platform();

module.exports.run = async () => {
    try {
        const version = core.getInput('otp-version');

        let install;
        if (platform.startsWith('win')) {
            install = require('./installer/windows');
        } else if (platform.startsWith('darwin')) {
            install = require('./installer/darwin');
        } else {
            install = require('./installer/linux');
        }

        await install(version);
    } catch (error) {
        core.error(error.stack)
        core.setFailed(error.message)
    }
};
