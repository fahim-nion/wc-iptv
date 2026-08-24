import { inspectSocolive } from '../sources/socolive.js';
import { validateStream } from '../validation/validateStream.js';
import chalk from 'chalk';

async function runInspection(sourceName, url) {
    console.log(chalk.blue(`\n[PHASE 1] INSPECTING: ${sourceName}`));
    
    try {
        let result;
        if (sourceName === 'Socolive') result = await inspectSocolive(url);
        
        if (!result || !result.streamUrl) {
            console.log(chalk.red("RESULT: Failed to find stream URL."));
            return;
        }

        const validation = await validateStream(result.streamUrl);

        console.log(`MATCH: ${result.title}`);
        console.log(`STREAM: DETECTED`);
        console.log(`TYPE: ${result.type}`);
        console.log(`VALID: ${validation.isValid ? chalk.green('YES') : chalk.red('NO')}`);
    } catch (e) {
        console.log(chalk.red(`CRITICAL ERROR: ${e.message}`));
    }
}

const targetUrl = process.argv[2];
const targetSource = process.argv[3];
runInspection(targetSource, targetUrl);
