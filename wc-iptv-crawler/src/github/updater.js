import { execSync } from 'child_process';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../../');

export async function pushToGitHub(customMessage) {
    try {
        console.log(chalk.blue("[GitHub] Checking for changes..."));
        
        const execOptions = { 
            cwd: REPO_ROOT, 
            env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
            stdio: 'pipe'
        };

        const status = execSync('git status --porcelain src/data/channels.json src/config/permanentChannels.js', execOptions).toString();
        let unpushed = '';
        try {
            unpushed = execSync('git log origin/main..main --oneline', execOptions).toString().trim();
        } catch (e) {}

        if (!status && !unpushed) {
            console.log(chalk.gray("[GitHub] Everything is already up-to-date and pushed. Skipping push."));
            return;
        }

        if (status) {
            console.log(chalk.yellow("[GitHub] Updates found in channels. Committing..."));
            execSync('git add src/data/channels.json src/config/permanentChannels.js', execOptions);
            const commitMsg = customMessage || "chore: auto-update live streams & permanent channels";
            execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, execOptions);
        }

        console.log(chalk.yellow("[GitHub] Pushing updates to origin/main..."));
        try {
            execSync('git push origin main', execOptions);
            console.log(chalk.green.bold("[GitHub] 🚀 Pushed successfully! Site is updating."));
        } catch (pushErr) {
            try {
                execSync('git pull --rebase -X ours origin main', execOptions);
                execSync('git push origin main', execOptions);
                console.log(chalk.green.bold("[GitHub] 🚀 Pushed successfully! Site is updating."));
            } catch (retryErr) {
                console.log(chalk.cyan("\n💡 Notice: Git needs your terminal credentials to push to remote repository."));
                console.log(chalk.cyan("👉 Run: git push origin main\n"));
            }
        }
    } catch (error) {
        console.error(chalk.red("[GitHub] Error:"), error.message);
    }
}
