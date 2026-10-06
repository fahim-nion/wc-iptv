import { execSync } from 'child_process';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../../');

export async function pushToGitHub() {
    try {
        console.log(chalk.blue("[GitHub] Checking for changes..."));
        
        const status = execSync('git status --porcelain src/data/channels.json', { cwd: REPO_ROOT }).toString();
        
        if (!status) {
            console.log(chalk.gray("[GitHub] No changes in channels.json. Skipping push."));
            return;
        }

        console.log(chalk.yellow("[GitHub] Updates found. Committing..."));
        
        execSync('git add src/data/channels.json', { cwd: REPO_ROOT });
        execSync('git commit -m "chore: auto-update live matches"', { cwd: REPO_ROOT });
        try {
            execSync('git push origin main', { cwd: REPO_ROOT });
        } catch (pushErr) {
            console.log(chalk.yellow("[GitHub] Push rejected, reconciling with origin/main..."));
            execSync('git pull --no-rebase -X ours origin main --no-edit', { cwd: REPO_ROOT });
            execSync('git push origin main', { cwd: REPO_ROOT });
        }

        console.log(chalk.green.bold("[GitHub] 🚀 Pushed successfully! Site is updating."));
    } catch (error) {
        console.error(chalk.red("[GitHub] Error:"), error.message);
    }
}
