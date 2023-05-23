import { GitLab } from './gitlab';
import { OpenAI } from './openai';
import { Command } from 'commander';

const program = new Command();

program
    .option('-g, --gitlab-api-url <url>', 'GitLab API URL')
    .option('-t, --gitlab-access-token <token>', 'GitLab Access Token')
    .option('-o, --openai-api-url <url>', 'OpenAI API URL')
    .option('-a, --openai-access-token <token>', 'OpenAI Access Token')
    .option('-p, --project-id <id>', 'GitLab Project ID')
    .option('-m, --merge-request-id <id>', 'GitLab Merge Request ID')
    .parse(process.argv);

async function run() {
    const gitlabApiUrl = program.opts().gitlabApiUrl;
    const gitlabAccessToken = program.opts().gitlabAccessToken;
    const openaiApiUrl = program.opts().openaiApiUrl;
    const openaiAccessToken = program.opts().openaiAccessToken;
    const projectId = program.opts().projectId;
    const mrId = program.opts().mergeRequestId;
    console.log(program.opts(), 'opts');
    const gitlab = new GitLab({gitlabApiUrl, gitlabAccessToken, projectId, mrId});
    const openai = new OpenAI(openaiApiUrl, openaiAccessToken);
    const {changes, diff_refs} = await gitlab.getMergeRequestChanges();
    console.log(changes, 'changes');
    const results = [];
    for (const change of changes) {
        if (change.renamed_file || change.deleted_file) {
            continue;
        }
        if(!/\.((j|t)sx?|css|less|scss)$/.test(change.new_path)) {
            continue;
        }
        const suggestion = await openai.reviewCodeChange(change.diff);
        const result = await gitlab.addReviewComment(  change, suggestion, diff_refs);
        results.push(result);
    }
    console.log(results);
}

run().catch(error => {
    console.error(error);
    process.exit(1);
});
