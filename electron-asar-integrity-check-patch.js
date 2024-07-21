const fs = require('fs');
const asar = require('@electron/asar');
const crypto = require('crypto');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Function to calculate the new hash from the ASAR header
function findNewHash(filePath) {
    console.info(`[+] Try to get ASAR hash from ${filePath}`);
    try {
        const rawHeader = asar.getRawHeader(filePath);
        const hash = crypto.createHash('sha256')
            .update(rawHeader.headerString)
            .digest('hex');
        console.info(`[+] Get ASAR hash ${hash}`);
        return hash;
    } catch (error) {
        console.error('Error processing ASAR file:', error.message);
        return null;
    }
}

// Function to patch the executable
function patchExecutable(exePath, newHash, outputPath) {
    console.info(`[+] Try to patch binary ${exePath}`);
    try {
        const binaryData = fs.readFileSync(exePath);
        const pattern = /(?<="value":")[a-f0-9]{64}(?=")/g;
        const newBinaryData = binaryData.toString().replace(pattern, newHash);
        fs.writeFileSync(outputPath, newBinaryData, 'binary');
        console.info('[+] File patched successfully.');
        console.log(`[+] Patched binary saved to ${outputPath}`)
    } catch (error) {
        console.error('Error patching the executable:', error.message);
    }
}

// Main execution
function main() {
    const argv = yargs(hideBin(process.argv))
        .usage('Usage: $0 <command> [options]')
        .command('patch', 'Patch the executable with a new hash', {
            exePath: {
                description: 'Path to the executable file',
                alias: 'e',
                type: 'string',
                demandOption: true
            },
            outputPath: {
                description: 'Path to output the patched executable file',
                alias: 'o',
                type:'string',
                demandOption: true
            },
            asarPath: {
                description: 'Path to the ASAR file',
                alias: 'a',
                type:'string',
                demandOption: true
            }
        })
        .help()
        .alias('help', 'h')
        .argv;

    const exePath = argv.exePath;
    const newHash = findNewHash(argv.asarPath);

    if (newHash) {
        patchExecutable(exePath, newHash, argv.outputPath);
    } else {
        console.error('[!] Failed to calculate new hash. Exiting.');
    }
}

// Run the main function
main();
