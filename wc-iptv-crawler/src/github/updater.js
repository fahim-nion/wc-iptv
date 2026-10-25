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
        
        const execOptions = { 
            cwd: REPO_ROOT, 
            env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
            stdio: 'pipe'
        };

        const status = execSync('git status --porcelain src/data/channels.json', execOptions).toString();
        
        if (!status) {
            console.log(chalk.gray("[GitHub] No changes in channels.json. Skipping push."));
            return;
        }

        console.log(chalk.yellow("[GitHub] Updates found. Committing..."));
        
        execSync('git add src/data/channels.json', execOptions);
        execSync('git commit -m "chore: auto-update live matches"', execOptions);
        try {
            execSync('git push origin main', execOptions);
        } catch (pushErr) {
            console.log(chalk.yellow("[GitHub] Push rejected, reconciling with origin/main..."));
            execSync('git pull --rebase -X ours origin main', execOptions);
            execSync('git push origin main', execOptions);
        }

        console.log(chalk.green.bold("[GitHub] 🚀 Pushed successfully! Site is updating."));
    } catch (error) {
        console.error(chalk.red("[GitHub] Error:"), error.message);
    }
}
