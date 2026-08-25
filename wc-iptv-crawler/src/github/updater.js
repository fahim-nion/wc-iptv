import { execSync } from 'child_process';
import chalk from 'chalk';

export async function pushToGitHub() {
    try {
        console.log(chalk.blue("[GitHub] Checking for changes..."));
        
        // Move to the root folder where .git is located
        process.chdir('..');

        const status = execSync('git status --porcelain src/data/channels.json').toString();
        
        if (!status) {
            console.log(chalk.gray("[GitHub] No changes in channels.json. Skipping push."));
            process.chdir('wc-iptv-crawler');
            return;
        }

        console.log(chalk.yellow("[GitHub] Updates found. Committing..."));
        
        execSync('git add src/data/channels.json');
        execSync('git commit -m "chore: auto-update live matches"');
        execSync('git push');

        console.log(chalk.green.bold("[GitHub] 🚀 Pushed successfully! Site is updating."));
        process.chdir('wc-iptv-crawler');
    } catch (error) {
        console.error(chalk.red("[GitHub] Error:"), error.message);
        process.chdir('wc-iptv-crawler');
    }
}
