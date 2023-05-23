import axios, { AxiosInstance } from 'axios';


export interface  IGitLabConfig{
    gitlabApiUrl: string;
    gitlabAccessToken: string;
    projectId: string;
    mrId: string;
}
const parseLastDiff = (gitDiff: string) => {
    const diffList = gitDiff.split('\n').reverse();
    const lastLineFirstChar = diffList?.[1]?.[0];
    const lastDiff =
        diffList.find((item) => {
            return /^@@ \-\d+,\d+ \+\d+,\d+ @@/g.test(item);
        }) || '';

    const [lastOldLineCount, lastNewLineCount] = lastDiff
        .replace(/@@ \-(\d+),(\d+) \+(\d+),(\d+) @@.*/g, ($0, $1, $2, $3, $4) => {
            return `${+$1 + +$2},${+$3 + +$4}`;
        })
        .split(',');

    if (!/^\d+$/.test(lastOldLineCount) || !/^\d+$/.test(lastNewLineCount)) {
        return {
            old_line: -1,
            new_line: -1,
        };
    }

    const old_line = lastLineFirstChar === '+' ? -1 : (parseInt(lastOldLineCount) || 0) - 1;
    const new_line = lastLineFirstChar === '-' ? -1 : (parseInt(lastNewLineCount) || 0) - 1;

    return {
        old_line,
        new_line,
    };
};

export class GitLab {
    private apiClient: AxiosInstance;
    private projectId: string;
    private mrId: string;

    constructor({gitlabApiUrl, gitlabAccessToken, projectId, mrId}:IGitLabConfig) {
        this.projectId = projectId;
        this.mrId = mrId;
        this.apiClient = axios.create({
            baseURL: gitlabApiUrl,
            headers: {
                'Private-Token': gitlabAccessToken,
            },
        });
    }


    async getMergeRequestChanges() {
        const response = await this.apiClient.get(`/projects/${this.projectId}/merge_requests/${this.mrId}/changes`);
        const changes = response.data?.changes?.map((item:Record<string, any>) => {
            const { old_line, new_line } = parseLastDiff(item.diff);
            return { ...item, old_line, new_line };
        });
        return {...response.data, changes};
    }

    async addReviewComment(change: any, suggestion: string, diff_refs: {}) {
        const params: { new_line?: number; new_path?: string; old_line?: number; old_path?: string} = {};
        if(change.new_line === -1 && change.old_line === -1){
            return '@@##@@';
        }
        if(change.new_line !== -1){
            params.new_line = change.new_line;
            params.new_path = change.new_path;
        }
        if(change.old_line !== -1){
            params.old_line = change.old_line;
            params.old_path = change.old_path;
        }
        const response = await this.apiClient.post(`/projects/${this.projectId}/merge_requests/${this.mrId}/discussions`, {
            body: suggestion,
            position: {
                position_type: 'text',
                ...params,
                ...diff_refs,
            },
        });
        return response.data;
    }
}
